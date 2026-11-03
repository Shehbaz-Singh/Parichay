import { MAX_PROJECT_IMAGES, type ProjectImageInput } from '@parichay/shared';
import { AppError } from '../lib/errors';
import { projectImagePublicId, uploadProjectCover, uploadProjectImage } from '../lib/cloudinary';
import { deleteImageQuietly, replaceImage } from '../lib/image-lifecycle';
import { WAIT, lockProfile } from '../lib/locks';
import { prisma } from '../lib/prisma';
import { orNotFound } from '../lib/prisma-errors';
import { assertExactIds } from '../lib/reorder';
import { ERRORS } from '../lib/messages';
import { deleteTranslationsFor } from './translation.service';

// A project's cover image and gallery. A project is always looked up by (id, profileId), so someone
// else's looks exactly like one that does not exist (404). The files are in Cloudinary and the rows are
// only ever made here; a file is deleted after the row that pointed at it is gone, so a failure can
// leave an unused image behind but never a broken one.

const projectNotFound = () => AppError.notFound(ERRORS.itemNotFound);
const imageNotFound = () => AppError.notFound(ERRORS.projectImageNotFound);
const full = () => AppError.conflict('LIMIT_REACHED', ERRORS.maxProjectImages(MAX_PROJECT_IMAGES));

const imageSelect = {
  id: true,
  url: true,
  alt: true,
  width: true,
  height: true,
  order: true,
} as const;

async function ownProject(profileId: string, id: string) {
  const project = await prisma.project.findFirst({
    where: { id, profileId },
    select: { id: true, coverUrl: true },
  });
  if (!project) throw projectNotFound();
  return project;
}

async function deleteFileQuietly(url: string | null, profileId: string) {
  const publicId = url && projectImagePublicId(url, profileId);
  if (publicId) await deleteImageQuietly(publicId, 'a project image');
}

// The files of a project that is being deleted. Call it before the row goes.
export async function projectFileUrls(profileId: string, projectId: string) {
  const project = await prisma.project.findFirst({
    where: { id: projectId, profileId },
    select: { coverUrl: true, images: { select: { url: true } } },
  });
  return project ? [project.coverUrl, ...project.images.map((image) => image.url)] : [];
}

export async function deleteFiles(profileId: string, urls: (string | null)[]) {
  for (const url of urls) await deleteFileQuietly(url, profileId);
}

// ---- the cover

export async function replaceCover(profileId: string, id: string, file: Buffer) {
  const uploaded = await replaceImage({
    file,
    load: () => ownProject(profileId, id),
    upload: () => uploadProjectCover(file, profileId, id),
    save: (image) =>
      prisma.project.update({
        where: { id, profileId },
        data: { coverUrl: image.url, coverWidth: image.width, coverHeight: image.height },
      }),
    discardNew: (image) => deleteFileQuietly(image.url, profileId),
    discardOld: (project) => deleteFileQuietly(project.coverUrl, profileId),
  });
  return { coverUrl: uploaded.url, coverWidth: uploaded.width, coverHeight: uploaded.height };
}

// Safe to repeat. The project is cleared first, so a failed Cloudinary delete can only leave an unused
// image behind, never a broken cover.
export async function removeCover(profileId: string, id: string) {
  const project = await ownProject(profileId, id);
  if (!project.coverUrl) return;
  await prisma.$transaction(async (tx) => {
    await tx.project.update({
      where: { id, profileId },
      data: { coverUrl: null, coverAlt: null, coverWidth: null, coverHeight: null },
    });
    await tx.translation.deleteMany({
      where: { profileId, entityType: 'project', entityId: id, field: 'coverAlt' },
    });
  });
  await deleteFileQuietly(project.coverUrl, profileId);
}

// ---- the gallery

export async function addImage(profileId: string, projectId: string, file: Buffer) {
  const project = await ownProject(profileId, projectId);
  if (
    (await prisma.projectImage.count({ where: { projectId: project.id } })) >= MAX_PROJECT_IMAGES
  ) {
    throw full();
  }
  // The limit is checked again under the profile lock when the row is made, so two uploads at once
  // cannot both fit; the one that does not has its file taken down again.
  const uploaded = await replaceImage({
    file,
    load: async () => null,
    upload: () => uploadProjectImage(file, profileId, projectId),
    save: (image) =>
      prisma.$transaction(async (tx) => {
        await lockProfile(tx, profileId);
        if ((await tx.projectImage.count({ where: { projectId } })) >= MAX_PROJECT_IMAGES) {
          throw full();
        }
        const { _max } = await tx.projectImage.aggregate({
          where: { projectId },
          _max: { order: true },
        });
        return tx.projectImage.create({
          data: {
            projectId,
            url: image.url,
            width: image.width,
            height: image.height,
            order: (_max.order ?? -1) + 1,
          },
        });
      }, WAIT),
    discardNew: (image) => deleteFileQuietly(image.url, profileId),
    discardOld: async () => {},
  });
  return prisma.projectImage.findFirstOrThrow({
    where: { projectId, url: uploaded.url },
    select: imageSelect,
  });
}

async function ownImage(profileId: string, projectId: string, id: string) {
  const image = await prisma.projectImage.findFirst({
    where: { id, projectId, project: { profileId } },
    select: { id: true, url: true },
  });
  if (!image) throw imageNotFound();
  return image;
}

export async function updateImage(
  profileId: string,
  projectId: string,
  id: string,
  input: ProjectImageInput,
) {
  await ownImage(profileId, projectId, id);
  return orNotFound(
    prisma.projectImage.update({ where: { id }, data: { alt: input.alt }, select: imageSelect }),
    imageNotFound,
  );
}

export async function removeImage(profileId: string, projectId: string, id: string) {
  const image = await ownImage(profileId, projectId, id);
  await prisma.$transaction(async (tx) => {
    await tx.projectImage.delete({ where: { id } });
    await deleteTranslationsFor(tx, profileId, 'projectImage', [id]);
  });
  await deleteFileQuietly(image.url, profileId);
}

export async function reorderImages(profileId: string, projectId: string, ids: string[]) {
  await ownProject(profileId, projectId);
  const current = await prisma.projectImage.findMany({
    where: { projectId },
    select: { id: true },
  });
  assertExactIds(ids, current, ERRORS.reorderSection('the gallery'));
  await prisma.$transaction(
    ids.map((id, order) =>
      prisma.projectImage.update({ where: { id }, data: { order }, select: { id: true } }),
    ),
  );
  return prisma.projectImage.findMany({
    where: { projectId },
    select: imageSelect,
    orderBy: [{ order: 'asc' }, { id: 'asc' }],
  });
}
