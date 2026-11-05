import { IMAGE_MAX_BYTES } from '@parichay/shared';
import { hasEmbeddedMetadata, jpegOrientation, readDimensions, sniffPhoto } from './bytes';
import {
  PHOTO_LIMITS,
  averageLuma,
  cropNaturalWidth,
  decodeSize,
  outputSize,
  type Box,
} from './geometry';

// Everything that touches the browser's image APIs. A chosen photo is decoded once (with its EXIF
// rotation applied), copied to a canvas no bigger than 2400 px, cropped there, and encoded again.
// The file the owner picked is read, never uploaded: what is uploaded is the new, smaller file.

export type PhotoProblem = 'type' | 'tooBig' | 'heic' | 'unreadable' | 'tooSmall';

export class PhotoError extends Error {
  constructor(readonly problem: PhotoProblem) {
    super(problem);
    this.name = 'PhotoError';
  }
}

// What can be said about a file before it is decoded: its real type, from its bytes, and its size.
export async function inspectFile(file: File): Promise<Uint8Array> {
  if (file.size > PHOTO_LIMITS.maxInputBytes) throw new PhotoError('tooBig');
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (sniffPhoto(bytes) === null) throw new PhotoError('type');
  return bytes;
}

export interface LoadedPhoto {
  canvas: HTMLCanvasElement; // oriented the right way up, at most 2400 px on a side
  naturalWidth: number; // the width of the photo as it was, for never making it bigger
}

function makeCanvas(width: number, height: number) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function context(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new PhotoError('unreadable');
  return ctx;
}

// Decodes with the EXIF orientation applied (the camera's "this side up"), so a photo taken
// holding the phone sideways does not arrive on its side.
async function decode(file: File, bytes: Uint8Array): Promise<{ source: CanvasImageSource; width: number; height: number; natural: number }> {
  const kind = sniffPhoto(bytes);
  const stored = readDimensions(bytes);
  const orientation = kind === 'jpeg' ? jpegOrientation(bytes) : 1;
  const sized = stored ? decodeSize(stored, orientation) : null;
  const options: ImageBitmapOptions = { imageOrientation: 'from-image' };
  if (sized && sized.scale < 1) {
    options.resizeWidth = sized.width;
    options.resizeHeight = sized.height;
    options.resizeQuality = 'high';
  }
  try {
    const bitmap = await createImageBitmap(file, options);
    const natural = sized && stored ? (orientation >= 5 ? stored.height : stored.width) : bitmap.width;
    return { source: bitmap, width: bitmap.width, height: bitmap.height, natural };
  } catch {
    // The rest of the browsers decode through an <img>, which also turns the picture the right way.
    // A photo too big for the pixel limit is not tried this way: it could crash a phone.
    if (sized && sized.scale < 1) throw new PhotoError('tooBig');
    const url = URL.createObjectURL(file);
    try {
      const img = new Image();
      img.src = url;
      await img.decode();
      return { source: img, width: img.naturalWidth, height: img.naturalHeight, natural: img.naturalWidth };
    } catch {
      throw new PhotoError(kind === 'heic' ? 'heic' : 'unreadable');
    } finally {
      URL.revokeObjectURL(url);
    }
  }
}

export async function loadPhoto(file: File): Promise<LoadedPhoto> {
  const bytes = await inspectFile(file);
  const { source, width, height, natural } = await decode(file, bytes);
  try {
    if (Math.min(width, height) < PHOTO_LIMITS.minSide) throw new PhotoError('tooSmall');
    const scale = Math.min(1, PHOTO_LIMITS.workSide / Math.max(width, height));
    const canvas = makeCanvas(Math.round(width * scale), Math.round(height * scale));
    const ctx = context(canvas);
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
    return { canvas, naturalWidth: Math.max(natural, canvas.width) };
  } finally {
    if ('close' in source) source.close();
  }
}

// The photo turned a quarter clockwise, `turns` times.
export function rotated(canvas: HTMLCanvasElement, turns: number): HTMLCanvasElement {
  const n = ((turns % 4) + 4) % 4;
  if (n === 0) return canvas;
  const swap = n % 2 === 1;
  const out = makeCanvas(swap ? canvas.height : canvas.width, swap ? canvas.width : canvas.height);
  const ctx = context(out);
  ctx.translate(out.width / 2, out.height / 2);
  ctx.rotate((n * Math.PI) / 2);
  ctx.drawImage(canvas, -canvas.width / 2, -canvas.height / 2);
  return out;
}

const toBlob = (canvas: HTMLCanvasElement, type: string, quality: number) =>
  new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));

// A picture for the cropper to show: the canvas as a short-lived file the browser can display.
export async function displayUrl(canvas: HTMLCanvasElement): Promise<string> {
  const blob = (await toBlob(canvas, 'image/webp', 0.92)) ?? (await toBlob(canvas, 'image/png', 1));
  if (!blob) throw new PhotoError('unreadable');
  return URL.createObjectURL(blob);
}

export interface CropSpec {
  area: Box; // in pixels of the canvas, from the cropper
  aspect: number; // width / height of the result
  maxWidth: number; // the widest the result may be
  workWidth: number;
  naturalWidth: number;
}

// The crop, drawn at its output size (never bigger than the original's own pixels).
export function drawCrop(canvas: HTMLCanvasElement, spec: CropSpec): HTMLCanvasElement {
  const natural = cropNaturalWidth(spec.area.width, spec.workWidth, spec.naturalWidth);
  const size = outputSize(natural, spec.aspect, spec.maxWidth);
  const out = makeCanvas(size.width, size.height);
  const ctx = context(out);
  ctx.imageSmoothingQuality = 'high';
  const { x, y, width, height } = spec.area;
  ctx.drawImage(canvas, x, y, width, height, 0, 0, out.width, out.height);
  return out;
}

// WebP at about 0.85, or JPEG where the browser cannot encode WebP (it answers with a PNG then,
// which this notices). If it is still over the API's limit it is encoded again, a step smaller.
export async function encodeCrop(
  canvas: HTMLCanvasElement,
  baseName = 'photo',
): Promise<File> {
  let current = canvas;
  let quality = 0.85;
  for (let attempt = 0; attempt < 6; attempt++) {
    let blob = await toBlob(current, 'image/webp', quality);
    if (blob?.type !== 'image/webp') {
      // JPEG has no see-through: a photo with transparent corners gets a white backdrop.
      const flat = makeCanvas(current.width, current.height);
      const ctx = context(flat);
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, flat.width, flat.height);
      ctx.drawImage(current, 0, 0);
      blob = await toBlob(flat, 'image/jpeg', quality);
    }
    if (!blob) throw new PhotoError('unreadable');
    if (blob.size <= IMAGE_MAX_BYTES) {
      // The promise made to the owner, checked on the very bytes that are sent.
      if (hasEmbeddedMetadata(new Uint8Array(await blob.arrayBuffer()))) {
        throw new PhotoError('unreadable');
      }
      const ext = blob.type === 'image/webp' ? 'webp' : 'jpg';
      return new File([blob], `${baseName}.${ext}`, { type: blob.type });
    }
    if (quality > 0.6) {
      quality -= 0.1;
    } else {
      const next = makeCanvas(Math.round(current.width * 0.85), Math.round(current.height * 0.85));
      context(next).drawImage(current, 0, 0, next.width, next.height);
      current = next;
    }
  }
  throw new PhotoError('tooBig');
}

// How bright the photo is, 0 to 255, from a thumbnail of it.
export function brightness(canvas: HTMLCanvasElement): number {
  const thumb = makeCanvas(32, 32);
  const ctx = context(thumb);
  ctx.drawImage(canvas, 0, 0, 32, 32);
  return averageLuma(ctx.getImageData(0, 0, 32, 32).data);
}

interface FaceDetectorLike {
  detect(image: CanvasImageSource): Promise<{ boundingBox: DOMRectReadOnly }[]>;
}
type FaceDetectorCtor = new (options?: { fastMode?: boolean; maxDetectedFaces?: number }) => FaceDetectorLike;

// The browser's own face detector, where it has one. The photo never leaves the device. Null means
// there is no detector, as opposed to an empty list, which means no face was found.
export const faceDetectionAvailable = () =>
  typeof window !== 'undefined' && 'FaceDetector' in window;

export async function findFace(canvas: HTMLCanvasElement): Promise<Box | null | undefined> {
  if (!faceDetectionAvailable()) return undefined;
  try {
    const Detector = (window as unknown as { FaceDetector: FaceDetectorCtor }).FaceDetector;
    const [face] = await new Detector({ fastMode: true, maxDetectedFaces: 1 }).detect(canvas);
    if (!face) return null;
    const { x, y, width, height } = face.boundingBox;
    return { x, y, width, height };
  } catch {
    return undefined; // the detector exists but would not run here
  }
}
