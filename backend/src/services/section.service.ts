import { FEATURED_PROJECTS_MAX, SECTION_LIMITS, type Section } from '@parichay/shared';
import type { Prisma } from '../generated/prisma/client';
import { AppError } from '../lib/errors';
import { prisma } from '../lib/prisma';
import { assertExactIds } from '../lib/reorder';
import { orNotFound } from '../lib/prisma-errors';
import { deleteTranslationsFor } from './translation.service';
import { ERRORS } from '../lib/messages';

// experience, education, projects, skills and links all follow the same rules, so one
// service handles them. This is the minimal slice of a Prisma model delegate it relies on.
type Row = Record<string, unknown>;
interface Delegate {
  findMany(args: object): Promise<Row[]>;
  findFirst(args: object): Promise<Row | null>;
  count(args: object): Promise<number>;
  aggregate(args: object): Promise<{ _max: { order: number | null } }>;
  create(args: object): Promise<Row>;
  update(args: object): Promise<Row>;
  delete(args: object): Promise<Row>;
}

const delegatesOf = (db: Prisma.TransactionClient | typeof prisma) =>
  ({
    experience: db.experience,
    education: db.education,
    projects: db.project,
    skills: db.skill,
    links: db.link,
  }) as unknown as Record<Section, Delegate>;
const delegates = delegatesOf(prisma);

const omit = { profileId: true };
const notFound = () => AppError.notFound(ERRORS.itemNotFound);

// Every query below filters by profileId. A record id that belongs to someone else simply
// does not match, so it looks exactly like a record that does not exist (404).

export function listItems(section: Section, profileId: string) {
  return delegates[section].findMany({
    where: { profileId },
    orderBy: [{ order: 'asc' }, { id: 'asc' }],
    omit,
  });
}

export async function getItem(section: Section, profileId: string, id: string) {
  const item = await delegates[section].findFirst({ where: { id, profileId }, omit });
  if (!item) throw notFound();
  return item;
}

// At most FEATURED_PROJECTS_MAX projects lead the page; `except` is the project being saved.
async function assertFeaturedRoom(section: Section, profileId: string, input: Row, except?: string) {
  if (section !== 'projects' || input.featured !== true) return;
  const others = await delegates.projects.count({
    where: { profileId, featured: true, ...(except && { id: { not: except } }) },
  });
  if (others >= FEATURED_PROJECTS_MAX) {
    throw AppError.conflict('LIMIT_REACHED', ERRORS.maxFeatured(FEATURED_PROJECTS_MAX));
  }
}

export async function createItem(section: Section, profileId: string, input: Row) {
  const delegate = delegates[section];
  await assertFeaturedRoom(section, profileId, input);

  const count = await delegate.count({ where: { profileId } });
  if (count >= SECTION_LIMITS[section]) {
    throw AppError.conflict(
      'LIMIT_REACHED',
      ERRORS.maxSectionItems(SECTION_LIMITS[section], section),
    );
  }

  // New items go to the end unless the client picked a position.
  let order: number | undefined;
  if (input.order === undefined) {
    const { _max } = await delegate.aggregate({ where: { profileId }, _max: { order: true } });
    order = (_max.order ?? -1) + 1;
  }

  return delegate.create({
    data: { ...input, ...(order !== undefined && { order }), profileId },
    omit,
  });
}

export async function updateItem(section: Section, profileId: string, id: string, input: Row) {
  await assertFeaturedRoom(section, profileId, input, id);
  return orNotFound(
    delegates[section].update({ where: { id, profileId }, data: input, omit }),
    notFound,
  );
}

// The entity types that have translations, by the section they are in (links have none).
const translated = {
  experience: 'experience',
  education: 'education',
  projects: 'project',
  skills: 'skill',
} as const;

export async function deleteItem(section: Section, profileId: string, id: string) {
  // One transaction, so a translation never outlives its text, nor the text its translations.
  await prisma.$transaction(async (tx) => {
    await orNotFound(delegatesOf(tx)[section].delete({ where: { id, profileId } }), notFound);
    if (section !== 'links') await deleteTranslationsFor(tx, profileId, translated[section], [id]);
  });
}

// `ids` is the new order. It must list every item in the section exactly once, which also
// guarantees it can only contain the caller's own records.
export async function reorderItems(section: Section, profileId: string, ids: string[]) {
  const delegate = delegates[section];

  const current = await delegate.findMany({ where: { profileId }, select: { id: true } });
  assertExactIds(ids, current as { id: string }[], ERRORS.reorderSection(section));

  // One transaction, so a failure part-way cannot leave a half-reordered list.
  await prisma.$transaction(
    ids.map(
      (id, order) =>
        delegate.update({
          where: { id, profileId },
          data: { order },
          select: { id: true },
        }) as unknown as Prisma.PrismaPromise<unknown>,
    ),
  );

  return listItems(section, profileId);
}
