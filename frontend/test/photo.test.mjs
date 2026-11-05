// Tests for the photo cropper's pure helpers (src/lib/photo/bytes.ts and geometry.ts).
// Run with: npm run test:photo -w @parichay/frontend (Node reads the .ts files directly).
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  hasEmbeddedMetadata,
  jpegOrientation,
  readDimensions,
  sniffPhoto,
} from '../src/lib/photo/bytes.ts';
import {
  PHOTO_LIMITS,
  averageLuma,
  centerOn,
  cropNaturalWidth,
  decodeSize,
  isDark,
  outputSize,
  shareInside,
} from '../src/lib/photo/geometry.ts';

const be16 = (n) => [(n >> 8) & 255, n & 255];
const be32 = (n) => [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255];
const text = (s) => [...s].map((c) => c.charCodeAt(0));

// A JPEG header with the pieces the helpers read: optionally an EXIF block (with an orientation),
// then the frame header that holds the size, then the start of the image data.
function jpeg({ width = 640, height = 480, orientation = 0, gps = false } = {}) {
  const parts = [0xff, 0xd8];
  if (orientation || gps) {
    const ifdEntries = [
      ...be16(0x0112), ...be16(3), ...be32(1), ...be16(orientation || 1), 0, 0,
    ];
    const tiff = [...text('MM'), ...be16(0x2a), ...be32(8), ...be16(1), ...ifdEntries, ...be32(0)];
    const extra = gps ? text('GPSLatitude=52.52 GPSLongitude=13.40') : [];
    const payload = [...text('Exif'), 0, 0, ...tiff, ...extra];
    parts.push(0xff, 0xe1, ...be16(payload.length + 2), ...payload);
  }
  parts.push(0xff, 0xc0, ...be16(17), 8, ...be16(height), ...be16(width), 3, 1, 0x22, 0, 2, 0x11, 1, 3, 0x11, 1);
  parts.push(0xff, 0xda, ...be16(12), 3, 1, 0, 2, 0x11, 3, 0x11, 0, 63, 0, 1, 2, 3, 0xff, 0xd9);
  return Uint8Array.from(parts);
}

function png({ width = 300, height = 200, exif = false } = {}) {
  const chunk = (type, data) => [...be32(data.length), ...text(type), ...data, 0, 0, 0, 0];
  return Uint8Array.from([
    0x89, ...text('PNG'), 0x0d, 0x0a, 0x1a, 0x0a,
    ...chunk('IHDR', [...be32(width), ...be32(height), 8, 6, 0, 0, 0]),
    ...(exif ? chunk('eXIf', text('MM\0*GPS')) : []),
    ...chunk('IEND', []),
  ]);
}

function webp({ width = 500, height = 400, exif = false } = {}) {
  const le24 = (n) => [n & 255, (n >> 8) & 255, (n >> 16) & 255];
  const vp8x = [...text('VP8X'), 10, 0, 0, 0, 0, 0, 0, 0, ...le24(width - 1), ...le24(height - 1)];
  const exifChunk = exif ? [...text('EXIF'), 4, 0, 0, 0, 1, 2, 3, 4] : [];
  const body = [...text('WEBP'), ...vp8x, ...exifChunk];
  return Uint8Array.from([...text('RIFF'), body.length & 255, 0, 0, 0, ...body]);
}

test('type is read from the bytes, not from the name', () => {
  assert.equal(sniffPhoto(jpeg()), 'jpeg');
  assert.equal(sniffPhoto(png()), 'png');
  assert.equal(sniffPhoto(webp()), 'webp');
  assert.equal(sniffPhoto(Uint8Array.from([...be32(24), ...text('ftypheic'), 0, 0, 0, 0])), 'heic');
  assert.equal(sniffPhoto(Uint8Array.from([...be32(24), ...text('ftypmif1'), 0, 0, 0, 0])), 'heic');
  assert.equal(sniffPhoto(Uint8Array.from(text('GIF89a......'))), null);
  assert.equal(sniffPhoto(Uint8Array.from(text('<svg xmlns="http://www.w3.org/2000/svg"/>'))), null);
  assert.equal(sniffPhoto(new Uint8Array(0)), null);
});

test('all eight EXIF orientations are read', () => {
  for (let o = 1; o <= 8; o++) {
    assert.equal(jpegOrientation(jpeg({ orientation: o })), o, `orientation ${o}`);
  }
});

test('a JPEG without EXIF, a PNG and a broken orientation count as upright', () => {
  assert.equal(jpegOrientation(jpeg()), 1);
  assert.equal(jpegOrientation(png()), 1);
  assert.equal(jpegOrientation(jpeg({ orientation: 9 })), 1);
  assert.equal(jpegOrientation(Uint8Array.from([0xff, 0xd8, 0xff, 0xe1, 0, 4])), 1);
});

test('the stored size is read from the header', () => {
  assert.deepEqual(readDimensions(jpeg({ width: 4032, height: 3024 })), { width: 4032, height: 3024 });
  assert.deepEqual(readDimensions(jpeg({ width: 800, height: 600, orientation: 6 })), { width: 800, height: 600 });
  assert.deepEqual(readDimensions(png({ width: 1024, height: 768 })), { width: 1024, height: 768 });
  assert.deepEqual(readDimensions(webp({ width: 1920, height: 1080 })), { width: 1920, height: 1080 });
  assert.equal(readDimensions(Uint8Array.from(text('nothing here'))), null);
});

test('a photo over the pixel limit is decoded smaller, and orientations 5 to 8 swap its sides', () => {
  const small = decodeSize({ width: 4000, height: 3000 }, 1);
  assert.deepEqual(small, { width: 4000, height: 3000, scale: 1 });
  const turned = decodeSize({ width: 4000, height: 3000 }, 6);
  assert.deepEqual(turned, { width: 3000, height: 4000, scale: 1 });
  const huge = decodeSize({ width: 12000, height: 9000 }, 6);
  assert.ok(huge.scale < 1);
  assert.ok(huge.width * huge.height <= PHOTO_LIMITS.maxPixels * 1.001);
  assert.ok(huge.height > huge.width); // still portrait after the quarter turn
  assert.ok(Math.abs(huge.height / huge.width - 12000 / 9000) < 0.01); // and not squeezed
});

test('location and camera data are found in a photo, and are not in a re-encoded one', () => {
  // What a phone writes:
  assert.equal(hasEmbeddedMetadata(jpeg({ orientation: 6, gps: true })), true);
  assert.equal(hasEmbeddedMetadata(png({ exif: true })), true);
  assert.equal(hasEmbeddedMetadata(webp({ exif: true })), true);
  // What canvas.toBlob writes: pixels only, no APP1 block, no eXIf or EXIF chunk.
  assert.equal(hasEmbeddedMetadata(jpeg()), false);
  assert.equal(hasEmbeddedMetadata(png()), false);
  assert.equal(hasEmbeddedMetadata(webp()), false);
});

test('the picture is never made bigger than the original, nor wider than the limit', () => {
  assert.deepEqual(outputSize(3000, 1, 800), { width: 800, height: 800 });
  assert.deepEqual(outputSize(500, 1, 800), { width: 500, height: 500 });
  assert.deepEqual(outputSize(1500, 1200 / 630, 1200), { width: 1200, height: 630 });
  assert.deepEqual(outputSize(300.9, 1, 800), { width: 300, height: 300 });
  // A crop measured on a copy scaled down from the original counts in original pixels.
  assert.equal(cropNaturalWidth(1200, 2400, 4800), 2400);
});

test('brightness: black and white, and the dark warning', () => {
  const pixels = (r, g, b) => Uint8ClampedArray.from(Array(64).fill([r, g, b, 255]).flat());
  assert.equal(averageLuma(pixels(0, 0, 0)), 0);
  assert.ok(Math.abs(averageLuma(pixels(255, 255, 255)) - 255) < 0.01);
  assert.equal(isDark(averageLuma(pixels(20, 20, 20))), true);
  assert.equal(isDark(averageLuma(pixels(120, 110, 100))), false);
  assert.equal(averageLuma(Uint8ClampedArray.from([0, 0, 0, 0])), 255); // see-through counts as light
});

test('a face is "cut off" only when much of it is outside the crop', () => {
  const crop = { x: 100, y: 100, width: 400, height: 400 };
  assert.equal(shareInside({ x: 200, y: 200, width: 100, height: 100 }, crop), 1);
  assert.equal(shareInside({ x: 50, y: 200, width: 100, height: 100 }, crop), 0.5);
  assert.equal(shareInside({ x: 0, y: 0, width: 50, height: 50 }, crop), 0);
});

test('centering on a face stays inside what the picture covers', () => {
  const image = { width: 1000, height: 1000 };
  const shown = { width: 400, height: 400 };
  const frame = { width: 400, height: 400 };
  // At zoom 1 the square picture just fills the frame: nothing to move.
  assert.deepEqual(centerOn({ x: 800, y: 100, width: 100, height: 100 }, image, shown, frame, 1), { x: 0, y: 0 });
  // Zoomed in, a face on the right pulls the picture left, but not past its edge (200 px).
  const moved = centerOn({ x: 850, y: 450, width: 100, height: 100 }, image, shown, frame, 2);
  assert.ok(moved.x < 0 && moved.x >= -200);
  assert.equal(moved.y, 0);
});
