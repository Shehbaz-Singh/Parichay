'use client';

import { useEffect, useRef, useState } from 'react';
import { Monitor, Smartphone, Tablet } from 'lucide-react';
import { languageOf } from '@parichay/shared';
import { pageLabel } from '@/lib/pages';
import { Select, Skeleton } from '../ui';
import { cx } from '../ui/cx';
import { useEditor } from './editor-context';

const DEVICES = [
  { id: 'phone', label: 'Phone', width: 390, Icon: Smartphone },
  { id: 'tablet', label: 'Tablet', width: 820, Icon: Tablet },
  { id: 'desktop', label: 'Desktop', width: 1280, Icon: Monitor },
] as const;
type DeviceId = (typeof DEVICES)[number]['id'];

// How much window height the preview leaves for the bar above it and the controls on top.
const STAGE_HEIGHT = '(100vh - 12rem)';

// The portfolio as a visitor sees it, drawn by the real theme in a frame of the chosen device width.
// It is a real frame (the /dashboard/preview-frame page) so the theme's own responsive layout
// reacts to that width. The profile being edited, unsaved typing included, is sent to it as a
// message each time it changes. The frame is shrunk to fit the column and cannot be clicked into.
export function Preview() {
  const {
    localizedPreview: preview,
    profile,
    previewLocale,
    setPreviewLocale,
    previewPageKey,
    setPreviewPageKey,
  } = useEditor();
  // A multi-page portfolio is previewed one page at a time; a page that no longer exists is Home.
  const multi = preview.layoutMode === 'multi' && preview.pages.length > 1;
  const pageKey = preview.pages.some((page) => page.key === previewPageKey)
    ? previewPageKey
    : 'home';
  const [deviceId, setDeviceId] = useState<DeviceId>(() =>
    window.innerWidth >= 1280 ? 'desktop' : 'phone',
  );
  const device = DEVICES.find((d) => d.id === deviceId) ?? DEVICES[2];
  const frame = useRef<HTMLIFrameElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [available, setAvailable] = useState(0);

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (
        e.origin === window.location.origin &&
        e.source === frame.current?.contentWindow &&
        e.data?.type === 'preview-ready'
      ) {
        setReady(true);
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  useEffect(() => {
    if (!ready) return;
    frame.current?.contentWindow?.postMessage(
      { type: 'preview-profile', profile: preview, pageKey },
      window.location.origin,
    );
  }, [ready, preview, pageKey]);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setAvailable(entry.contentRect.width));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const scale = available > 0 ? Math.min(1, available / device.width) : 1;

  return (
    <section aria-label="Live preview" className="overflow-hidden rounded-card border border-line">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-surface px-3 py-2">
        <div>
          <p className="text-sm font-semibold">Your page, live</p>
          <p className="text-xs text-muted">
            {previewLocale === profile.defaultLocale
              ? 'Updates as you type'
              : `Showing ${languageOf(previewLocale).name}. Texts not translated yet appear in ${languageOf(profile.defaultLocale).name}.`}
          </p>
        </div>
        {profile.locales.length > 0 && (
          <div className="flex items-center gap-2">
            <label htmlFor="preview-language" className="text-xs font-medium text-muted">
              Language
            </label>
            <div className="min-w-36">
              <Select
                id="preview-language"
                value={previewLocale}
                onChange={setPreviewLocale}
                options={[profile.defaultLocale, ...profile.locales].map((code) => ({
                  value: code,
                  label: languageOf(code).name,
                }))}
              />
            </div>
          </div>
        )}
        {multi && (
          <div className="flex items-center gap-2">
            <label htmlFor="preview-page" className="text-xs font-medium text-muted">
              Page
            </label>
            <div className="min-w-36">
              <Select
                id="preview-page"
                value={pageKey}
                onChange={setPreviewPageKey}
                options={preview.pages.map((page) => ({
                  value: page.key,
                  label: pageLabel(preview, page),
                }))}
              />
            </div>
          </div>
        )}
        <div role="group" aria-label="Preview width" className="flex gap-1">
          {DEVICES.map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              aria-pressed={id === deviceId}
              onClick={() => setDeviceId(id)}
              className={cx(
                'inline-flex items-center gap-1.5 rounded-control px-2 py-1 text-xs font-medium',
                id === deviceId ? 'bg-accent text-on-accent' : 'hover:bg-page active:bg-line',
              )}
            >
              <Icon aria-hidden="true" className="size-4" />
              <span className="max-sm:sr-only">{label}</span>
              <span className="sr-only"> width</span>
            </button>
          ))}
        </div>
      </div>

      <div ref={box} className="bg-surface/60 p-3">
        <div
          className="relative mx-auto overflow-hidden rounded-box border border-line bg-page"
          style={{ width: device.width * scale, height: `calc(${STAGE_HEIGHT})` }}
        >
          <iframe
            ref={frame}
            src="/dashboard/preview-frame"
            title="Preview of your portfolio"
            tabIndex={-1}
            style={{
              width: device.width,
              height: `calc(${STAGE_HEIGHT} / ${scale})`,
              transform: `scale(${scale})`,
              transformOrigin: 'top left',
              border: 0,
            }}
          />
          {!ready && (
            <div aria-hidden="true" className="absolute inset-0 space-y-3 bg-page p-6">
              <Skeleton className="mx-auto size-20 rounded-full" />
              <Skeleton className="mx-auto h-5 w-2/3" />
              <Skeleton className="mx-auto h-3 w-1/2" />
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
