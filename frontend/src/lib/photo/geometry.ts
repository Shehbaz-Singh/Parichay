// The numbers behind the photo cropper: limits, sizes and the hints. Pure, no imports (see bytes.ts).

export const PHOTO_LIMITS = {
  maxInputBytes: 10 * 1024 * 1024, // before cropping; the cropped file has to fit the API's 2 MB
  minSide: 200, // the shorter side of what is chosen, in pixels
  maxPixels: 40_000_000, // above this the photo is decoded at a smaller size
  workSide: 2400, // the longest side of the copy the cropper works on
  softBelow: 400, // a crop with fewer pixels than this across may look soft
  avatarSide: 800,
} as const;

// The cropper's own numbers: the zoom range, what a key press moves, how the file is encoded.
export const CROPPER = {
  zoomMin: 1,
  zoomMax: 3,
  zoomStep: 0.01,
  keyZoomStep: 0.1, // + and −
  keyMovePx: 10, // an arrow key
  announceDelayMs: 500, // a screen reader hears a zoom or a move once it settles
  faceShownMin: 0.8, // less of the face than this inside the crop: "your face looks cut off"
  previewAvatar: [96, 56, 32], // large, card and small, in CSS pixels
  previewCover: [176, 112, 64],
  displayQuality: 0.92, // the copy the cropper shows
  encodeQuality: 0.85, // the file that is uploaded
  minQuality: 0.6, // below this the file is made smaller instead
  qualityStep: 0.1,
  shrink: 0.85,
  thumbSide: 32, // the thumbnail the brightness is read from
  // The answers of a server that is still waking up (0: no answer at all).
  wakingStatuses: [0, 502, 503, 504],
} as const;

// A photo larger than the pixel limit is decoded at this scale. EXIF orientations 5 to 8 turn the
// picture a quarter, so its decoded width is the stored height.
export function decodeSize(
  stored: { width: number; height: number },
  orientation: number,
  maxPixels: number = PHOTO_LIMITS.maxPixels,
): { width: number; height: number; scale: number } {
  const turned = orientation >= 5;
  const width = turned ? stored.height : stored.width;
  const height = turned ? stored.width : stored.height;
  const pixels = width * height;
  if (pixels <= maxPixels) return { width, height, scale: 1 };
  const scale = Math.sqrt(maxPixels / pixels);
  return { width: Math.round(width * scale), height: Math.round(height * scale), scale };
}

// The size of the file to upload: the crop's own size in the original photo, at most `maxWidth`
// across, so a small photo is never made bigger. `aspect` is width / height.
export function outputSize(
  cropNaturalWidth: number,
  aspect: number,
  maxWidth: number,
): { width: number; height: number } {
  const width = Math.max(1, Math.min(maxWidth, Math.floor(cropNaturalWidth)));
  return { width, height: Math.max(1, Math.round(width / aspect)) };
}

// The crop's width in the original photo, when the cropper worked on a copy `workWidth` wide of a
// photo that is `naturalWidth` wide.
export const cropNaturalWidth = (cropWorkWidth: number, workWidth: number, naturalWidth: number) =>
  cropWorkWidth * (naturalWidth / workWidth);

// The mean brightness of RGBA pixels, 0 (black) to 255 (white).
export function averageLuma(rgba: ArrayLike<number>): number {
  let total = 0;
  let count = 0;
  for (let i = 0; i + 3 < rgba.length; i += 4) {
    if (rgba[i + 3] < 16) continue; // see-through pixels say nothing about the photo
    total += 0.2126 * rgba[i] + 0.7152 * rgba[i + 1] + 0.0722 * rgba[i + 2];
    count++;
  }
  return count === 0 ? 255 : total / count;
}

export const isDark = (luma: number) => luma < 55;

export interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

// How much of `face` lies inside `area`, 0 to 1.
export function shareInside(face: Box, area: Box): number {
  const w = Math.min(face.x + face.width, area.x + area.width) - Math.max(face.x, area.x);
  const h = Math.min(face.y + face.height, area.y + area.height) - Math.max(face.y, area.y);
  if (w <= 0 || h <= 0) return 0;
  return (w * h) / (face.width * face.height);
}

// The offset (in the cropper's own units: pixels from the middle) that puts the middle of `box` in
// the middle of the crop, kept inside what the picture can cover. `shown` is the picture's size on
// screen at zoom 1, `frame` the crop frame's size on screen.
export function centerOn(
  box: Box,
  imageSize: { width: number; height: number },
  shown: { width: number; height: number },
  frame: { width: number; height: number },
  zoom: number,
): { x: number; y: number } {
  const toShown = shown.width / imageSize.width;
  const dx = (box.x + box.width / 2) * toShown - shown.width / 2;
  const dy = (box.y + box.height / 2) * toShown - shown.height / 2;
  const limit = (size: number, f: number) => Math.max(0, (size * zoom - f) / 2);
  const clamp = (value: number, max: number) => Math.max(-max, Math.min(max, value)) + 0; // + 0: never -0
  return {
    x: clamp(-dx * zoom, limit(shown.width, frame.width)),
    y: clamp(-dy * zoom, limit(shown.height, frame.height)),
  };
}
