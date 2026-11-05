import { megabytes } from '@parichay/shared';
import { PHOTO_LIMITS } from '@/lib/photo/geometry';
import type { PhotoProblem } from '@/lib/photo/process';

// Every word of the photo cropper. The dashboard is in English only (the translated files cover
// the public pages), so these live here, in one place, ready to move into a translation file the
// day the dashboard gets one.

export const PHOTO = {
  drop: 'Drop a photo here, or',
  choose: 'Choose a photo',
  take: 'Take a photo',
  change: 'Change photo',
  limits: `JPG, PNG or WebP, up to ${megabytes(PHOTO_LIMITS.maxInputBytes)}. You crop it on the next screen.`,
  opening: 'Opening your photo…',
  working: 'Working…',

  title: 'Position your photo',
  description: 'Drag the photo to move it. Only what is inside the frame is kept.',
  cropLabel: 'Crop area for your photo',
  keys: 'Keyboard: arrow keys move the photo (Shift for small steps), + and − zoom, R turns it a quarter.',
  privacy: 'Location and camera data are removed from your photo.',
  notUploaded: 'Only the cropped photo is uploaded, never the original.',

  zoom: 'Zoom',
  zoomValue: (z: number) => `${Math.round(z * 100)}%`,
  rotate: 'Rotate',
  rotated: (turns: number) => `Rotated to ${((turns % 4) + 4) % 4 * 90} degrees`,
  zoomed: (z: number) => `Zoom ${Math.round(z * 100)} percent`,
  moved: 'Photo moved',
  resetDone: 'Back to the start',
  centered: 'Centered on the face',
  centerFace: 'Center on face',
  centerFaceNone: 'No face found to center on.',

  shape: 'Photo shape',
  shapeNote: 'Used for your photo on your page, in every theme. “Theme’s own” lets each theme draw it its own way.',
  shapes: { theme: 'Theme’s own', round: 'Round', soft: 'Rounded square', square: 'Square' },
  shapeSaved: 'Photo shape saved.',
  previewHero: 'Large',
  previewCard: 'Card',
  previewNav: 'Small',

  save: 'Save photo',
  saving: 'Uploading…',
  retry: 'Try again',
  cancel: 'Cancel',
  reset: 'Reset',
  remove: 'Remove current photo',
  progress: 'Upload progress',

  discardTitle: 'Discard your changes?',
  discardMessage: 'The photo will not be saved.',
  discardConfirm: 'Discard',
  keepEditing: 'Keep editing',
  removeTitle: 'Remove your photo?',
  removeMessage: 'Your initials will show instead.',

  hintSmall: 'This photo is quite small, it may look soft on large screens.',
  hintDark: 'This photo looks dark. A brighter one may show you better.',
  hintFace: 'Your face looks cut off. Try moving the photo.',

  waking:
    'The server is waking up after a quiet spell, so that did not go through. Your crop is kept: try again in a moment.',
};

export const PHOTO_PROBLEMS: Record<PhotoProblem, string> = {
  type: 'That file is not a JPG, PNG or WebP photo. Choose one of those.',
  tooBig: `That photo is too large to open here (over ${megabytes(PHOTO_LIMITS.maxInputBytes)} or ${PHOTO_LIMITS.maxPixels / 1_000_000} megapixels). Choose a smaller one.`,
  heic: 'This looks like an iPhone HEIC photo, which this browser cannot open. Choose Most Compatible in your camera settings, or export the photo as JPEG, then choose it again.',
  unreadable: 'We could not read that photo. Try another one, or save it again as a JPG.',
  tooSmall: `That photo is too small. Choose one at least ${PHOTO_LIMITS.minSide} × ${PHOTO_LIMITS.minSide} pixels.`,
};
