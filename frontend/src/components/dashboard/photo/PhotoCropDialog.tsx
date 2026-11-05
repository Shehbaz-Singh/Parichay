'use client';

import { useCallback, useEffect, useId, useMemo, useRef, useState, type RefObject } from 'react';
import Cropper, { type Area, type MediaSize, type Point, type Size } from 'react-easy-crop';
import { RotateCw, ScanFace } from 'lucide-react';
import type { AvatarShape } from '@parichay/shared';
import { AVATAR_SHAPE_CLASS } from '../../themes/avatar-shape';
import { ApiError } from '@/lib/client-api';
import { cx } from '@/components/ui/cx';
import { CROPPER, PHOTO_LIMITS, centerOn, cropNaturalWidth, isDark, shareInside, type Box } from '@/lib/photo/geometry';
import {
  PhotoError,
  brightness,
  displayUrl,
  drawCrop,
  encodeCrop,
  findFace,
  loadPhoto,
  rotated,
  type LoadedPhoto,
} from '@/lib/photo/process';
import { Button, Modal, SlowNotice, useConfirm } from '../../ui';
import { errorText } from '../editor-context';
import { PHOTO, PHOTO_PROBLEMS } from './messages';

// The cropper, in a dialog. It is loaded only when a photo has been chosen (see PhotoField), so
// react-easy-crop is not part of the dashboard's main bundle.

type Shape = AvatarShape | 'theme';

export interface PhotoCropDialogProps {
  file: File;
  aspect?: number; // width / height of the saved picture; 1 is a square avatar
  maxWidth?: number; // the widest the saved picture may be
  shape?: AvatarShape | null; // the shape now chosen for the photo (null: the theme's own)
  round?: boolean; // show the round guide and the avatar shapes; false for a plain rectangle (covers)
  hasCurrent: boolean;
  // Sends the cropped file. It throws when the upload fails, and the dialog shows why.
  // `shape` is set only when the owner changed it here; null means "the theme's own".
  onSave: (
    file: File,
    onProgress: (fraction: number) => void,
    shape?: AvatarShape | null,
  ) => Promise<void>;
  onRemove?: () => Promise<boolean>;
  onClose: () => void;
  restoreFocus: RefObject<HTMLElement | null>;
}

const clampZoom = (z: number) =>
  Math.min(CROPPER.zoomMax, Math.max(CROPPER.zoomMin, Math.round(z * 100) / 100));
const SHAPE_CLASS: Record<Shape, string> = { theme: 'rounded-full', ...AVATAR_SHAPE_CLASS };

function failureText(err: unknown) {
  if (err instanceof PhotoError) return PHOTO_PROBLEMS[err.problem];
  if (err instanceof ApiError && (CROPPER.wakingStatuses as readonly number[]).includes(err.status)) return PHOTO.waking;
  return errorText(err);
}

export default function PhotoCropDialog({
  file,
  aspect = 1,
  maxWidth = PHOTO_LIMITS.avatarSide,
  round = true,
  shape: currentShape = null,
  hasCurrent,
  onSave,
  onRemove,
  onClose,
  restoreFocus,
}: PhotoCropDialogProps) {
  const confirm = useConfirm();
  const helpId = useId();
  const zoomId = useId();

  const [loaded, setLoaded] = useState<LoadedPhoto | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [turns, setTurns] = useState(0);
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [shape, setShape] = useState<Shape>(currentShape ?? 'theme');
  const [url, setUrl] = useState<string | null>(null);
  const [area, setArea] = useState<Area | null>(null);
  const [dark, setDark] = useState(false);
  const [face, setFace] = useState<Box | null | undefined>(undefined); // undefined: no detector
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState(0);
  const [failure, setFailure] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState('');

  const areaRef = useRef<Area | null>(null);
  const media = useRef<MediaSize | null>(null);
  const frame = useRef<Size | null>(null);
  const previews = useRef<(HTMLCanvasElement | null)[]>([]);
  const paintFrame = useRef(0);
  const announceTimer = useRef(0);
  const announceFlip = useRef(false);

  // A message for screen readers, politely. Said again, it still counts as new.
  const say = useCallback((text: string) => {
    announceFlip.current = !announceFlip.current;
    setAnnouncement(announceFlip.current ? text : `${text}\u200b`);
  }, []);
  const sayLater = useCallback(
    (text: string) => {
      window.clearTimeout(announceTimer.current);
      announceTimer.current = window.setTimeout(() => say(text), CROPPER.announceDelayMs);
    },
    [say],
  );
  useEffect(() => () => window.clearTimeout(announceTimer.current), []);

  useEffect(() => {
    let cancelled = false;
    loadPhoto(file).then(
      (photo) => {
        if (cancelled) return;
        setLoaded(photo);
        setDark(isDark(brightness(photo.canvas)));
      },
      (err) => !cancelled && setProblem(failureText(err)),
    );
    return () => {
      cancelled = true;
    };
  }, [file]);

  // What the cropper shows: the photo with the quarter turns applied.
  const work = useMemo(() => (loaded ? rotated(loaded.canvas, turns) : null), [loaded, turns]);

  useEffect(() => {
    if (!work) return;
    let cancelled = false;
    let made: string | null = null;
    displayUrl(work).then(
      (next) => {
        made = next;
        if (cancelled) URL.revokeObjectURL(next);
        else setUrl(next);
      },
      (err) => !cancelled && setProblem(failureText(err)),
    );
    return () => {
      cancelled = true;
      if (made) URL.revokeObjectURL(made);
    };
  }, [work]);

  useEffect(() => {
    if (!work) return;
    let cancelled = false;
    void findFace(work).then((found) => !cancelled && setFace(found));
    return () => {
      cancelled = true;
    };
  }, [work]);

  // The previews are drawn straight from the working copy, so they follow every nudge.
  const paint = useCallback(() => {
    const crop = areaRef.current;
    if (!work || !crop) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    for (const canvas of previews.current) {
      if (!canvas) continue;
      const width = Math.round(canvas.clientWidth * dpr);
      const height = Math.round(canvas.clientHeight * dpr);
      if (width === 0 || height === 0) continue;
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
      const ctx = canvas.getContext('2d');
      if (!ctx) continue;
      ctx.imageSmoothingQuality = 'high';
      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(work, crop.x, crop.y, crop.width, crop.height, 0, 0, width, height);
    }
  }, [work]);
  const schedulePaint = useCallback(() => {
    cancelAnimationFrame(paintFrame.current);
    paintFrame.current = requestAnimationFrame(paint);
  }, [paint]);
  useEffect(() => {
    schedulePaint();
    return () => cancelAnimationFrame(paintFrame.current);
  }, [schedulePaint, shape, url]);

  const dirty =
    turns !== 0 || zoom !== 1 || crop.x !== 0 || crop.y !== 0 || shape !== (currentShape ?? 'theme');

  async function requestClose() {
    if (saving) return;
    if (dirty && !(await confirm({
      title: PHOTO.discardTitle,
      message: PHOTO.discardMessage,
      confirmLabel: PHOTO.discardConfirm,
      cancelLabel: PHOTO.keepEditing,
      danger: true,
    }))) {
      return;
    }
    onClose();
  }

  function rotate() {
    setTurns((t) => t + 1);
    setCrop({ x: 0, y: 0 });
    setArea(null);
    areaRef.current = null;
    setFace(undefined);
    say(PHOTO.rotated(turns + 1));
  }

  function changeZoom(next: number, announce = true) {
    const z = clampZoom(next);
    setZoom(z);
    if (announce) sayLater(PHOTO.zoomed(z));
  }

  function reset() {
    setTurns(0);
    setZoom(1);
    setCrop({ x: 0, y: 0 });
    setShape(currentShape ?? 'theme');
    say(PHOTO.resetDone);
  }

  function centerFace() {
    if (!work) return;
    if (!face) return say(PHOTO.centerFaceNone);
    if (!media.current || !frame.current) return;
    setCrop(centerOn(face, work, media.current, frame.current, zoom));
    say(PHOTO.centered);
  }

  async function save() {
    const current = areaRef.current;
    if (!work || !loaded || !current) return;
    setSaving(true);
    setFailure(null);
    setProgress(0);
    try {
      const out = drawCrop(work, {
        area: current,
        aspect,
        maxWidth,
        workWidth: loaded.canvas.width,
        naturalWidth: loaded.naturalWidth,
      });
      const picture = await encodeCrop(out);
      const changed = shape !== (currentShape ?? 'theme');
      await onSave(picture, setProgress, changed ? (shape === 'theme' ? null : shape) : undefined);
      onClose();
    } catch (err) {
      setFailure(failureText(err));
      setSaving(false);
    }
  }

  async function removeCurrent() {
    if (!onRemove || saving) return;
    const yes = await confirm({
      title: PHOTO.removeTitle,
      message: PHOTO.removeMessage,
      confirmLabel: PHOTO.remove,
      danger: true,
    });
    if (!yes) return;
    setSaving(true);
    if (await onRemove()) onClose();
    else setSaving(false);
  }

  // + and − zoom, R turns, from the crop frame. The arrow keys are the cropper's own.
  function onKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if ((e.target as HTMLElement).getAttribute('aria-label') !== PHOTO.cropLabel) return;
    if (e.key === '+' || e.key === '=') {
      e.preventDefault();
      changeZoom(zoom + CROPPER.keyZoomStep);
    } else if (e.key === '-' || e.key === '_') {
      e.preventDefault();
      changeZoom(zoom - CROPPER.keyZoomStep);
    } else if (e.key === 'r' || e.key === 'R') {
      e.preventDefault();
      rotate();
    }
  }

  const naturalCrop = area && loaded
    ? cropNaturalWidth(area.width, loaded.canvas.width, loaded.naturalWidth)
    : null;
  const hints = [
    naturalCrop !== null && naturalCrop < PHOTO_LIMITS.softBelow && PHOTO.hintSmall,
    dark && PHOTO.hintDark,
    face && area && shareInside(face, area) < CROPPER.faceShownMin && PHOTO.hintFace,
  ].filter(Boolean) as string[];

  const round_ = round && (shape === 'round' || shape === 'theme');
  const sizes = [PHOTO.previewHero, PHOTO.previewCard, PHOTO.previewNav].map(
    (label, i): [string, number] => [label, (round ? CROPPER.previewAvatar : CROPPER.previewCover)[i]],
  );
  const previewShape = round ? SHAPE_CLASS[shape] : 'rounded-md';
  const ready = loaded && url;

  return (
    <Modal
      open
      wide
      onClose={requestClose}
      restoreFocus={restoreFocus}
      title={PHOTO.title}
      description={PHOTO.description}
      footer={
        <>
          {hasCurrent && onRemove && (
            <Button variant="danger" disabled={saving} onClick={removeCurrent} className="me-auto">
              {PHOTO.remove}
            </Button>
          )}
          <Button variant="ghost" disabled={saving || !dirty} onClick={reset}>
            {PHOTO.reset}
          </Button>
          <Button disabled={saving} onClick={requestClose}>
            {PHOTO.cancel}
          </Button>
          <Button variant="primary" disabled={saving || !ready || !area} onClick={save}>
            {saving ? PHOTO.saving : failure ? PHOTO.retry : PHOTO.save}
          </Button>
        </>
      }
    >
      <p role="status" aria-live="polite" className="sr-only">
        {announcement}
      </p>

      {problem ? (
        <p role="alert" className="rounded-control border border-danger-border bg-danger-bg p-3 text-sm text-danger">
          {problem}
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_12rem]">
          <div className="space-y-3">
            {/* The keys are the crop frame's: the wrapper only hears them as they bubble up from it. */}
            {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions */}
            <div
              className="relative h-72 w-full touch-none overflow-hidden rounded-card bg-neutral-900 sm:h-80"
              onKeyDown={onKeyDown}
            >
              {ready && (
                <Cropper
                  image={url}
                  crop={crop}
                  zoom={zoom}
                  minZoom={CROPPER.zoomMin}
                  maxZoom={CROPPER.zoomMax}
                  aspect={aspect}
                  cropShape={round_ ? 'round' : 'rect'}
                  showGrid={!round_}
                  keyboardStep={CROPPER.keyMovePx}
                  onCropChange={setCrop}
                  onZoomChange={(z) => changeZoom(z, false)}
                  onMediaLoaded={(m) => (media.current = m)}
                  onCropSizeChange={(s) => (frame.current = s)}
                  onCropAreaChange={(_, px) => {
                    areaRef.current = px;
                    schedulePaint();
                  }}
                  onCropComplete={(_, px) => setArea(px)}
                  onInteractionEnd={({ source }) =>
                    sayLater(source === 'wheel' ? PHOTO.zoomed(zoom) : PHOTO.moved)
                  }
                  cropperProps={{
                    'aria-label': PHOTO.cropLabel,
                    'aria-describedby': helpId,
                    role: 'group',
                  }}
                  mediaProps={{ alt: '' }}
                />
              )}
              {!ready && (
                <p role="status" className="absolute inset-0 flex items-center justify-center text-sm text-white">
                  {PHOTO.opening}
                </p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <label htmlFor={zoomId} className="text-sm font-medium">
                {PHOTO.zoom}
              </label>
              <input
                id={zoomId}
                type="range"
                min={CROPPER.zoomMin}
                max={CROPPER.zoomMax}
                step={CROPPER.zoomStep}
                value={zoom}
                disabled={!ready || saving}
                aria-valuetext={PHOTO.zoomValue(zoom)}
                onChange={(e) => changeZoom(Number(e.target.value))}
                className="h-6 min-w-32 flex-1 accent-[var(--color-accent)]"
              />
              <output htmlFor={zoomId} className="w-12 text-sm text-muted tabular-nums">
                {PHOTO.zoomValue(zoom)}
              </output>
              <Button disabled={!ready || saving} onClick={rotate}>
                <RotateCw aria-hidden="true" className="size-4" />
                {PHOTO.rotate}
              </Button>
              {face !== undefined && (
                <Button disabled={!ready || saving} onClick={centerFace}>
                  <ScanFace aria-hidden="true" className="size-4" />
                  {PHOTO.centerFace}
                </Button>
              )}
            </div>

            <p id={helpId} className="text-xs text-muted">
              {PHOTO.keys}
            </p>
          </div>

          <div className="space-y-3">
            {round && (
              <fieldset className="space-y-1">
                <legend className="text-sm font-medium">{PHOTO.shape}</legend>
                {(Object.keys(PHOTO.shapes) as Shape[]).map((value) => (
                  <label key={value} className="flex min-h-6 items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="photo-shape"
                      checked={shape === value}
                      onChange={() => setShape(value)}
                    />
                    {PHOTO.shapes[value]}
                  </label>
                ))}
                <p className="text-xs text-muted">{PHOTO.shapeNote}</p>
              </fieldset>
            )}
            <div className="flex items-end gap-3 sm:flex-wrap">
              {sizes.map(([label, size], i) => (
                <figure key={label} className="space-y-1 text-center">
                  <canvas
                    ref={(el) => {
                      previews.current[i] = el;
                    }}
                    aria-hidden="true"
                    style={{ width: size, height: round ? size : size / aspect }}
                    className={cx('bg-surface', previewShape)}
                  />
                  <figcaption className="text-xs text-muted">{label}</figcaption>
                </figure>
              ))}
            </div>
            {hints.length > 0 && (
              <ul className="space-y-1 text-xs text-muted">
                {hints.map((hint) => (
                  <li key={hint}>{hint}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      <p className="text-xs text-muted">
        {PHOTO.privacy} {PHOTO.notUploaded}
      </p>
      <SlowNotice pending={saving} />
      {saving && progress > 0 && (
        <progress aria-label={PHOTO.progress} value={progress} max={1} className="h-2 w-full" />
      )}
      {failure && (
        <p role="alert" className="rounded-control border border-danger-border bg-danger-bg p-3 text-sm text-danger">
          {failure}
        </p>
      )}
    </Modal>
  );
}
