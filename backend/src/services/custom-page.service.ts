import { MAX_CUSTOM_PAGES, isReservedPageSlug, type CustomPageInput } from '@parichay/shared';
import { AppError } from '../lib/errors';
import { WAIT, lockProfile } from '../lib/locks';
import { prisma } from '../lib/prisma';
import { isUniqueViolation, orNotFound } from '../lib/prisma-errors';
import { slugifyTitle } from '../lib/slug';
import { ERRORS } from '../lib/messages';
import { savePageConfig } from './page-layout.service';
import { deleteTranslationsFor } from './translation.service';

// The extra pages of a multi-page portfolio (/<slug>/p/<page>). Always looked up by (id, profileId), so
// someone else's page looks exactly like one that does not exist (404). Their place in the navigation
// and the sections on them are in Profile.pageConfig, which is kept in step here.

const select = { id: true, slug: true, title: true, body: true } as const;
const notFound = () => AppError.notFound(ERRORS.customPageNotFound);
const slugTaken = () => AppError.conflict('SLUG_TAKEN', ERRORS.pageSlugTaken);

export const listPages = (profileId: string) =>
  prisma.customPage.findMany({
    where: { profileId },
    select,
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
  });

// "Speaking engagements" -> "speaking-engagements", a counter when the profile has one like it, and a
// word added when the title is a name the site uses itself (a page called "Work").
async function pageSlug(profileId: string, title: string) {
  let base = slugifyTitle(title).slice(0, 26);
  if (base === 'post' || base.length < 2) base = 'page';
  if (isReservedPageSlug(base)) base = `${base}-page`;
  const taken = new Set(
    (
      await prisma.customPage.findMany({
        where: { profileId, slug: { startsWith: base } },
        select: { slug: true },
      })
    ).map((row) => row.slug),
  );
  let slug = base;
  for (let n = 2; taken.has(slug); n++) slug = `${base}-${n}`;
  return slug;
}

export function createPage(profileId: string, input: CustomPageInput) {
  return prisma.$transaction(async (tx) => {
    await lockProfile(tx, profileId);
    if ((await tx.customPage.count({ where: { profileId } })) >= MAX_CUSTOM_PAGES) {
      throw AppError.conflict('LIMIT_REACHED', ERRORS.maxCustomPages(MAX_CUSTOM_PAGES));
    }
    let page;
    try {
      page = await tx.customPage.create({
        data: {
          profileId,
          title: input.title,
          body: input.body,
          slug: input.slug ?? (await pageSlug(profileId, input.title)),
        },
        select,
      });
    } catch (err) {
      if (isUniqueViolation(err)) throw slugTaken();
      throw err;
    }
    const pages = await savePageConfig(tx, profileId);
    return { page, pages };
  }, WAIT);
}

export async function updatePage(profileId: string, id: string, input: CustomPageInput) {
  try {
    return await orNotFound(
      prisma.customPage.update({
        where: { id, profileId },
        data: { title: input.title, body: input.body, ...(input.slug && { slug: input.slug }) },
        select,
      }),
      notFound,
    );
  } catch (err) {
    if (isUniqueViolation(err)) throw slugTaken();
    throw err;
  }
}

// Deletes the page and its translations. The sections that were on it go back to their default pages.
export function deletePage(profileId: string, id: string) {
  return prisma.$transaction(async (tx) => {
    const { count } = await tx.customPage.deleteMany({ where: { id, profileId } });
    if (count === 0) throw notFound();
    await deleteTranslationsFor(tx, profileId, 'customPage', [id]);
    return { pages: await savePageConfig(tx, profileId) };
  }, WAIT);
}
