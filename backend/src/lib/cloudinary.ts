import { v2 as cloudinary } from 'cloudinary';
import { config } from './config';

cloudinary.config({
  cloud_name: config.CLOUDINARY_CLOUD_NAME,
  api_key: config.CLOUDINARY_API_KEY,
  api_secret: config.CLOUDINARY_API_SECRET,
  secure: true,
});

const AVATAR_FOLDER = 'portfolio/avatars';
const AVATAR_SIZE = 400;

export interface UploadedImage {
  url: string;
  publicId: string;
  width: number;
  height: number;
}

// Square crop (centred on the most interesting part of the image) resized to 400x400.
// Every upload gets a fresh public id, so a replaced avatar also gets a fresh URL and no
// CDN or browser keeps showing the old picture. The profile id in the name is what lets
// avatarPublicId() later prove an image belongs to a given profile.
function uploadImage(
  buffer: Buffer,
  publicId: string,
  width: number,
  height: number,
  crop: 'fill' | 'limit' = 'fill',
): Promise<UploadedImage> {
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          public_id: publicId,
          resource_type: 'image',
          allowed_formats: ['jpg', 'png', 'webp'],
          transformation: [
            { width, height, crop, ...(crop === 'fill' && { gravity: 'auto' }), quality: 'auto' },
          ],
        },
        (err, result) => {
          if (err || !result) return reject(err ?? new Error('Cloudinary returned no result'));
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
            width: result.width,
            height: result.height,
          });
        },
      )
      .end(buffer);
  });
}

export const uploadAvatar = (buffer: Buffer, profileId: string) =>
  uploadImage(buffer, `${AVATAR_FOLDER}/${profileId}-${Date.now()}`, AVATAR_SIZE, AVATAR_SIZE);

// A post's cover: 1200 x 630 (the shape link previews use), under the profile's own folder so every
// image a profile has can be found, and removed, by that prefix. A fresh name per upload, like avatars.
const COVER_FOLDER = 'portfolio/covers';
export const uploadCover = (buffer: Buffer, profileId: string, postId: string) =>
  uploadImage(buffer, `${COVER_FOLDER}/${profileId}/${postId}-${Date.now()}`, 1200, 630);

// A project's cover: 1200 x 630, like a post's. A gallery image keeps its own shape, shrunk to fit
// 1600 x 1600 at most. Both are under the profile's own folder, for the same reason as covers.
const PROJECT_FOLDER = 'portfolio/projects';
export const uploadProjectCover = (buffer: Buffer, profileId: string, projectId: string) =>
  uploadImage(buffer, `${PROJECT_FOLDER}/${profileId}/${projectId}-cover-${Date.now()}`, 1200, 630);
export const uploadProjectImage = (buffer: Buffer, profileId: string, projectId: string) =>
  uploadImage(
    buffer,
    `${PROJECT_FOLDER}/${profileId}/${projectId}-${Date.now()}`,
    1600,
    1600,
    'limit',
  );

// Returns the Cloudinary public id of `url` only if it is one of this profile's own avatars.
// avatarUrl can also be set through PUT /profile/me, so it may point anywhere, including at
// another user's image. Anything that is not ours is never deleted.
export function avatarPublicId(url: string, profileId: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  if (parsed.hostname !== 'res.cloudinary.com') return null;

  // /<cloud name>/image/upload/v1700000000/portfolio/avatars/<profileId>-123.jpg
  const match = parsed.pathname.match(/^\/([^/]+)\/image\/upload\/v\d+\/(.+)\.[a-z0-9]+$/i);
  if (!match || match[1] !== config.CLOUDINARY_CLOUD_NAME) return null;

  const publicId = match[2];
  return publicId.startsWith(`${AVATAR_FOLDER}/${profileId}-`) ? publicId : null;
}

// The Cloudinary id of `url` only if it is one of this profile's own post covers (see avatarPublicId).
export function coverPublicId(url: string, profileId: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  if (parsed.hostname !== 'res.cloudinary.com') return null;
  const match = parsed.pathname.match(/^\/([^/]+)\/image\/upload\/v\d+\/(.+)\.[a-z0-9]+$/i);
  if (!match || match[1] !== config.CLOUDINARY_CLOUD_NAME) return null;
  return match[2].startsWith(`${COVER_FOLDER}/${profileId}/`) ? match[2] : null;
}

// The Cloudinary id of `url` only if it is one of this profile's own project images (see avatarPublicId).
export function projectImagePublicId(url: string, profileId: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  if (parsed.hostname !== 'res.cloudinary.com') return null;
  const match = parsed.pathname.match(/^\/([^/]+)\/image\/upload\/v\d+\/(.+)\.[a-z0-9]+$/i);
  if (!match || match[1] !== config.CLOUDINARY_CLOUD_NAME) return null;
  return match[2].startsWith(`${PROJECT_FOLDER}/${profileId}/`) ? match[2] : null;
}

export async function deleteImage(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId, { resource_type: 'image', invalidate: true });
}

// Removes every image stored under a profile, including any left behind by an earlier failed delete.
// Used when the account is deleted. Names carry the profile id (see uploadAvatar), so this cannot
// touch anyone else's images.
export async function deleteImagesOf(profileId: string): Promise<void> {
  for (const prefix of [
    `${AVATAR_FOLDER}/${profileId}-`,
    `${COVER_FOLDER}/${profileId}/`,
    `${PROJECT_FOLDER}/${profileId}/`,
  ]) {
    await cloudinary.api.delete_resources_by_prefix(prefix, {
      resource_type: 'image',
      invalidate: true,
    });
  }
}
