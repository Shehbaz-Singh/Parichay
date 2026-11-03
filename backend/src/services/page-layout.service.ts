import {
  normalizePageConfig,
  normalizeSectionConfig,
  type PagesUpdateInput,
} from '@parichay/shared';
import type { Prisma } from '../generated/prisma/client';
import { AppError } from '../lib/errors';
import { prisma } from '../lib/prisma';
import { ERRORS } from '../lib/messages';

// The pages of multi mode: Profile.layoutMode and Profile.pageConfig. Like the section layout, the
// stored JSON is trusted only after it has been through normalizePageConfig with what really exists
// (the profile's custom pages and its sections), so the client always gets a complete list.

type Db = Prisma.TransactionClient | typeof prisma;

const layoutSelect = {
  layoutMode: true,
  pageConfig: true,
  sitemapListed: true,
  sectionConfig: true,
  customSections: { select: { id: true } },
  customPages: {
    select: { id: true, slug: true, title: true, body: true },
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
  },
} satisfies Prisma.ProfileSelect;

type Layout = Prisma.ProfileGetPayload<{ select: typeof layoutSelect }>;

// The keys of every section the profile has, hidden ones included: any of them can be put on a page.
export const sectionKeysOf = (profile: Pick<Layout, 'sectionConfig' | 'customSections'>) =>
  normalizeSectionConfig(
    profile.sectionConfig,
    profile.customSections.map((section) => section.id),
  ).map((item) => item.key);

export const withPages = <
  T extends Pick<Layout, 'pageConfig' | 'sectionConfig' | 'customSections' | 'customPages'>,
>(
  profile: T,
) => ({
  ...profile,
  pageConfig: normalizePageConfig(
    profile.pageConfig,
    profile.customPages.map((page) => page.id),
    sectionKeysOf(profile),
  ),
});

export async function getPages(profileId: string) {
  const profile = await prisma.profile.findUnique({
    where: { id: profileId },
    select: layoutSelect,
  });
  if (!profile) throw AppError.notFound(ERRORS.profileNotFound);
  const { layoutMode, sitemapListed, pageConfig, customPages } = withPages(profile);
  return { layoutMode, sitemapListed, pages: pageConfig, customPages };
}

// Stores the mode and the complete page list (repaired against what exists). Run it inside the
// transaction of any change that adds or removes a page or a section, with no `requested`, to bring
// the stored list back in line.
export async function savePageConfig(db: Db, profileId: string, requested?: unknown) {
  const profile = await db.profile.findUnique({ where: { id: profileId }, select: layoutSelect });
  if (!profile) throw AppError.notFound(ERRORS.profileNotFound);
  const config = normalizePageConfig(
    requested ?? profile.pageConfig,
    profile.customPages.map((page) => page.id),
    sectionKeysOf(profile),
  );
  await db.profile.update({ where: { id: profileId }, data: { pageConfig: config } });
  return config;
}

export async function updatePages(profileId: string, input: PagesUpdateInput) {
  await prisma.$transaction(async (tx) => {
    await savePageConfig(tx, profileId, input.pages);
    await tx.profile.update({
      where: { id: profileId },
      data: {
        layoutMode: input.layoutMode,
        ...(input.sitemapListed !== undefined && { sitemapListed: input.sitemapListed }),
      },
    });
  });
  return getPages(profileId);
}
