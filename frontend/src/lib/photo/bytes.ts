// What a photo's bytes say about it, read without decoding it. Pure functions on a Uint8Array, so
// they run the same in the browser and under `npm run test:photo`. (No imports and only syntax Node
// can strip, on purpose: the test loads this file directly.)

export type PhotoKind = 'jpeg' | 'png' | 'webp' | 'heic';

const ascii = (b: Uint8Array, at: number, text: string) =>
  at + text.length <= b.length && [...text].every((c, i) => b[at + i] === c.charCodeAt(0));

const HEIC_BRANDS = ['heic', 'heix', 'heim', 'heis', 'hevc', 'hevx', 'mif1', 'msf1', 'heif'];

// The type of the file by its first bytes, never by its name or its declared type. Null for
// anything else, GIF and AVIF included.
export function sniffPhoto(b: Uint8Array): PhotoKind | null {
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'jpeg';
  if (b.length >= 8 && b[0] === 0x89 && ascii(b, 1, 'PNG') && b[4] === 0x0d && b[5] === 0x0a) {
    return 'png';
  }
  if (ascii(b, 0, 'RIFF') && ascii(b, 8, 'WEBP')) return 'webp';
  if (ascii(b, 4, 'ftyp') && HEIC_BRANDS.some((brand) => ascii(b, 8, brand))) return 'heic';
  return null;
}

const u16 = (b: Uint8Array, at: number, little = false) =>
  little ? b[at] | (b[at + 1] << 8) : (b[at] << 8) | b[at + 1];
const u32 = (b: Uint8Array, at: number, little = false) =>
  (little
    ? b[at] | (b[at + 1] << 8) | (b[at + 2] << 16) | (b[at + 3] << 24)
    : (b[at] << 24) | (b[at + 1] << 16) | (b[at + 2] << 8) | b[at + 3]) >>> 0;

// The segments of a JPEG up to the image data: [marker, start of payload, payload length].
function* jpegSegments(b: Uint8Array): Generator<[number, number, number]> {
  let at = 2;
  while (at + 4 <= b.length) {
    if (b[at] !== 0xff) return;
    const marker = b[at + 1];
    if (marker === 0xff) {
      at += 1; // fill byte
      continue;
    }
    if (marker === 0xd8 || (marker >= 0xd0 && marker <= 0xd7) || marker === 0x01) {
      at += 2; // markers without a payload
      continue;
    }
    if (marker === 0xd9) return;
    const length = u16(b, at + 2);
    if (length < 2) return;
    yield [marker, at + 4, length - 2];
    if (marker === 0xda) return; // the image data follows
    at += 2 + length;
  }
}

// The EXIF orientation of a JPEG, 1 to 8 (1 = as shot). Anything unreadable counts as 1.
//   1 normal  2 mirrored  3 rotated 180  4 flipped vertically
//   5 transposed  6 rotated 90 clockwise  7 transverse  8 rotated 90 counter-clockwise
export function jpegOrientation(b: Uint8Array): number {
  if (sniffPhoto(b) !== 'jpeg') return 1;
  for (const [marker, start, length] of jpegSegments(b)) {
    if (marker !== 0xe1 || !ascii(b, start, 'Exif\0\0') || length < 14) continue;
    const tiff = start + 6;
    const little = ascii(b, tiff, 'II');
    if (!little && !ascii(b, tiff, 'MM')) return 1;
    const ifd = tiff + u32(b, tiff + 4, little);
    if (ifd + 2 > b.length) return 1;
    const entries = u16(b, ifd, little);
    for (let i = 0; i < entries; i++) {
      const entry = ifd + 2 + i * 12;
      if (entry + 12 > b.length) return 1;
      if (u16(b, entry, little) === 0x0112) {
        const value = u16(b, entry + 8, little);
        return value >= 1 && value <= 8 ? value : 1;
      }
    }
    return 1;
  }
  return 1;
}

// The stored size of an image, before any EXIF rotation. Null when the header cannot be read.
export function readDimensions(b: Uint8Array): { width: number; height: number } | null {
  const kind = sniffPhoto(b);
  if (kind === 'png' && b.length >= 24) return { width: u32(b, 16), height: u32(b, 20) };
  if (kind === 'jpeg') {
    for (const [marker, start] of jpegSegments(b)) {
      const isFrame = marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker);
      if (isFrame) return { width: u16(b, start + 3), height: u16(b, start + 1) };
    }
    return null;
  }
  if (kind === 'webp' && b.length >= 30) {
    if (ascii(b, 12, 'VP8X')) {
      return {
        width: 1 + (b[24] | (b[25] << 8) | (b[26] << 16)),
        height: 1 + (b[27] | (b[28] << 8) | (b[29] << 16)),
      };
    }
    if (ascii(b, 12, 'VP8L') && b[20] === 0x2f) {
      const bits = u32(b, 21, true);
      return { width: 1 + (bits & 0x3fff), height: 1 + ((bits >>> 14) & 0x3fff) };
    }
    if (ascii(b, 12, 'VP8 ')) {
      return { width: u16(b, 26, true) & 0x3fff, height: u16(b, 28, true) & 0x3fff };
    }
  }
  return null;
}

// Whether the file carries EXIF or XMP, which is where a phone puts the GPS position, the camera
// and the time. A cropped photo is drawn on a canvas and encoded again, so none of it comes through;
// this is the check that says so, run on what is about to be uploaded.
export function hasEmbeddedMetadata(b: Uint8Array): boolean {
  const kind = sniffPhoto(b);
  if (kind === 'jpeg') {
    for (const [marker, start, length] of jpegSegments(b)) {
      if (marker === 0xe1 && (ascii(b, start, 'Exif') || ascii(b, start, 'http://ns.adobe.com'))) {
        return true;
      }
      if (marker === 0xed && length > 0) return true; // Photoshop / IPTC
    }
    return false;
  }
  if (kind === 'png') {
    let at = 8;
    while (at + 8 <= b.length) {
      const length = u32(b, at);
      if (ascii(b, at + 4, 'eXIf') || ascii(b, at + 4, 'iTXt') || ascii(b, at + 4, 'zTXt')) {
        return true;
      }
      if (ascii(b, at + 4, 'IEND')) break;
      at += 12 + length;
    }
    return false;
  }
  if (kind === 'webp') {
    let at = 12;
    while (at + 8 <= b.length) {
      const length = u32(b, at + 4, true);
      if (ascii(b, at, 'EXIF') || ascii(b, at, 'XMP ')) return true;
      at += 8 + length + (length % 2);
    }
    return false;
  }
  return false;
}
