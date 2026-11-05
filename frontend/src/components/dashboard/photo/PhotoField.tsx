'use client';

import { lazy, Suspense, useEffect, useRef, useState, type ReactNode } from 'react';
import { Camera, ImagePlus } from 'lucide-react';
import { IMAGE_TYPES } from '@parichay/shared';
import { cx } from '@/components/ui/cx';
import { PHOTO_LIMITS } from '@/lib/photo/geometry';
import { PhotoError, inspectFile } from '@/lib/photo/process';
import { Button } from '../../ui';
import { useEditor } from '../editor-context';
import { PHOTO, PHOTO_PROBLEMS } from './messages';
import type { PhotoCropDialogProps } from './PhotoCropDialog';

// Loaded only when a photo has been chosen: this is what keeps react-easy-crop out of the
// dashboard's main bundle.
const PhotoCropDialog = lazy(() => import('./PhotoCropDialog'));

type Passed = Pick<PhotoCropDialogProps, 'aspect' | 'maxWidth' | 'round' | 'shape' | 'onSave' | 'onRemove'>;

interface Props extends Passed {
  current: ReactNode; // the picture now, or the initials: what sits beside the buttons
  hasCurrent: boolean;
  busy: boolean;
  chooseLabel?: string; // the button's name when there is no photo yet
  changeLabel?: string;
  // Set by the command palette's "Change photo": the button takes the focus.
  focusRequest?: number;
  children?: ReactNode; // notes under the buttons
}

// Picking a photo: a button, a drop target and, on a phone, "Take a photo". The chosen file is not
// uploaded; it opens the cropper, and only what the cropper makes is sent.
export function PhotoField({
  current,
  hasCurrent,
  busy,
  chooseLabel = PHOTO.choose,
  changeLabel = PHOTO.change,
  focusRequest,
  children,
  ...dialog
}: Props) {
  const { notify } = useEditor();
  const [file, setFile] = useState<File | null>(null);
  const [over, setOver] = useState(false);
  const [touch, setTouch] = useState(false);
  const pick = useRef<HTMLInputElement>(null);
  const camera = useRef<HTMLInputElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);

  // "Take a photo" is only offered where there is a camera to ask for: a touch screen.
  useEffect(() => {
    setTouch(window.matchMedia('(pointer: coarse)').matches);
  }, []);

  useEffect(() => {
    if (focusRequest) trigger.current?.focus();
  }, [focusRequest]);

  async function choose(chosen: File | undefined) {
    if (!chosen || busy) return;
    try {
      await inspectFile(chosen); // the real type, from its bytes, and its size, before anything opens
      setFile(chosen);
    } catch (err) {
      notify('error', PHOTO_PROBLEMS[err instanceof PhotoError ? err.problem : 'unreadable']);
    }
  }

  const input = (ref: typeof pick, capture?: 'user') => (
    <input
      ref={ref}
      type="file"
      accept={IMAGE_TYPES.join(',')}
      capture={capture}
      className="sr-only"
      tabIndex={-1}
      aria-hidden="true"
      onChange={(e) => {
        void choose(e.target.files?.[0]);
        e.target.value = ''; // choosing the same file again should still open the cropper
      }}
    />
  );

  return (
    // Dropping is a mouse shortcut: the buttons below are how a keyboard gets the same thing.
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        void choose(e.dataTransfer.files[0]);
      }}
      className={cx(
        'flex flex-wrap items-center gap-4 rounded-card border border-dashed p-3',
        over ? 'border-accent bg-accent-soft' : 'border-line',
      )}
    >
      {current}
      <div className="space-y-2">
        {input(pick)}
        {input(camera, 'user')}
        <p className="text-sm">
          {PHOTO.drop}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button ref={trigger} disabled={busy} onClick={() => pick.current?.click()}>
            <ImagePlus aria-hidden="true" className="size-4" />
            {busy ? 'Working…' : hasCurrent ? changeLabel : chooseLabel}
          </Button>
          {touch && (
            <Button disabled={busy} onClick={() => camera.current?.click()}>
              <Camera aria-hidden="true" className="size-4" />
              {PHOTO.take}
            </Button>
          )}
        </div>
        <p className="text-xs text-muted">{PHOTO.limits}</p>
        {children}
      </div>

      {file && (
        <Suspense fallback={<p role="status" className="sr-only">{PHOTO.opening}</p>}>
          <PhotoCropDialog
            file={file}
            hasCurrent={hasCurrent}
            restoreFocus={trigger}
            onClose={() => setFile(null)}
            {...dialog}
            maxWidth={dialog.maxWidth ?? PHOTO_LIMITS.avatarSide}
          />
        </Suspense>
      )}
    </div>
  );
}
