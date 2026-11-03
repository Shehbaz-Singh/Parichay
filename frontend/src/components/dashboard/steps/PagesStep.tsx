'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Eye, Plus, Scissors, Trash2 } from 'lucide-react';
import {
  MAX_CUSTOM_PAGES,
  PAGE_LABELS,
  PAGE_TITLE_MAX,
  THIN_PAGE_AT,
  isCustomPageKey,
  normalizePageConfig,
  normalizeSectionConfig,
  type AnyPageKey,
  type ConfigKey,
  type LayoutMode,
  type PageConfig,
} from '@parichay/shared';
import { api } from '@/lib/client-api';
import { CONFIRMS, NOTICES } from '@/lib/messages';
import { Badge, Button, Card, Input, Switch, useConfirm } from '../../ui';
import { useAutosave } from '../autosave';
import { useCustomPages, useEditor } from '../editor-context';
import { InfoToggle, SectionCard, SettingRow } from '../layout';
import {
  allSectionKeys,
  pageConfigOf,
  previewPages,
  sectionCount,
  sectionHasContent,
} from '../page-content';
import { pageName, sectionName, toConfig, toRows, type Row } from '../pages/arrangement';
import { CustomPageForm } from '../pages/CustomPageForm';
import { LayoutChoice } from '../pages/LayoutChoice';
import { SectionList } from '../pages/SectionList';
import { SplitDialog } from '../pages/SplitDialog';
import { SortableList } from '../SortableList';

// The nouns of what a page holds, for "Work has only one project".
const NOUNS: Partial<Record<AnyPageKey, [string, string]>> = {
  work: ['project', 'projects'],
  writing: ['post', 'posts'],
};

// Choose between one page and a site of pages, and shape the pages: which are shown, what they are
// called, their order, and which sections each holds. The layout, the page list and the search-engine
// choice are saved together by themselves a moment after a change (PUT /profile/me/pages), and show in
// the preview at once. The pages the owner made are saved with their own button.
export function PagesStep() {
  const { profile, update, setDraft, notify, attempt, setPreviewPageKey, jump, clearJump } =
    useEditor();
  const confirm = useConfirm();
  const custom = useCustomPages();
  const [mode, setMode] = useState<LayoutMode>(profile.layoutMode);
  const [rows, setRows] = useState<Row[]>(() => toRows(pageConfigOf(profile)));
  const [listed, setListed] = useState(profile.sitemapListed);
  const [editing, setEditing] = useState<string | null>(null); // a custom page key, or "new"
  const [splitting, setSplitting] = useState(false);

  // A page added or deleted, or a section made or deleted, changes what the list must contain.
  useEffect(() => {
    setRows((current) =>
      toRows(
        normalizePageConfig(
          toConfig(current),
          profile.customPages.map((page) => page.id),
          allSectionKeys(profile),
        ),
      ),
    );
  }, [profile]);

  const config = useMemo<PageConfig>(() => toConfig(rows), [rows]);

  // The preview shows the unsaved layout too.
  useEffect(() => {
    setDraft({ layoutMode: mode, pageConfig: config }, 'pages');
    return () => setDraft(null, 'pages');
  }, [mode, config, setDraft]);

  // The rows are not replaced by the server's answer: that would undo typing done while the request
  // was on its way.
  useAutosave({
    key: JSON.stringify({ mode, config, listed }),
    run: async () => {
      const saved = await api<{
        layoutMode: LayoutMode;
        sitemapListed: boolean;
        pages: PageConfig;
      }>('/profile/me/pages', {
        method: 'PUT',
        body: { layoutMode: mode, pages: config, sitemapListed: listed },
      });
      update((p) => ({
        ...p,
        layoutMode: saved.layoutMode,
        sitemapListed: saved.sitemapListed,
        pageConfig: saved.pages,
      }));
      return 'saved';
    },
  });

  // ---- what is on the pages
  const visibleSections = new Set(
    normalizeSectionConfig(
      profile.sectionConfig,
      profile.customSections.map((section) => section.id),
    )
      .filter((item) => item.visible)
      .map((item) => item.key),
  );
  const sectionNote = (key: ConfigKey) =>
    !visibleSections.has(key)
      ? 'hidden under Sections'
      : sectionHasContent(profile, key)
        ? null
        : 'nothing here yet';
  // The pages that exist for a visitor, with this arrangement.
  const existing = new Set(
    previewPages({ ...profile, layoutMode: 'multi', pageConfig: config }).map((page) => page.key),
  );

  const patch = (key: AnyPageKey, change: Partial<Row>) =>
    setRows((current) => current.map((row) => (row.key === key ? { ...row, ...change } : row)));
  const reorder = (ids: string[]) =>
    setRows((current) => [
      ...current.filter((row) => row.key === 'home'),
      ...ids.flatMap((id) => current.find((row) => row.key === id) ?? []),
    ]);

  // ---- switching layouts
  const choose = useCallback(
    async (target: LayoutMode) => {
      if (target === mode) return;
      const ok = await confirm({
        title: target === 'multi' ? 'Switch to pages?' : 'Switch to one page?',
        message: target === 'multi' ? CONFIRMS.switchToMulti : CONFIRMS.switchToSingle,
        confirmLabel: 'Switch',
      });
      if (!ok) return;
      setMode(target);
      notify('success', target === 'multi' ? NOTICES.layoutMulti : NOTICES.layoutSingle);
    },
    [mode, confirm, notify],
  );
  // The command palette asked for a switch ("Switch to multi-page layout").
  const chooseRef = useRef(choose);
  useEffect(() => {
    chooseRef.current = choose;
  });
  useEffect(() => {
    if (jump?.kind !== 'layout') return;
    clearJump();
    void chooseRef.current(jump.id === 'multi' ? 'multi' : 'single');
  }, [jump, clearJump]);

  async function deleteCustom(row: Row) {
    const title = pageName(profile, row);
    const ok = await confirm({
      title: 'Delete this page?',
      message: CONFIRMS.deleteCustomPage(title),
      confirmLabel: 'Delete page',
      danger: true,
    });
    if (!ok) return;
    const id = row.key.slice('page:'.length);
    await attempt(() => custom.remove(id), NOTICES.pageDeleted);
  }

  // ---- one page
  const movable = rows.filter((row) => row.key !== 'home');
  const targets = movable.map((row) => ({ value: row.key, label: pageName(profile, row) }));

  function thinHint(row: Row): string | null {
    if (!row.visible || !existing.has(row.key) || row.key === 'contact') return null;
    const page = isCustomPageKey(row.key)
      ? profile.customPages.find((own) => `page:${own.id}` === row.key)
      : undefined;
    if (page?.body?.trim()) return null;
    const count = row.sections
      .filter((key) => visibleSections.has(key))
      .reduce((total, key) => total + sectionCount(profile, key), 0);
    if (count === 0 || count > THIN_PAGE_AT) return null;
    const [one, many] = NOUNS[row.key] ?? ['item', 'items'];
    return `${pageName(profile, row)} has only ${count} ${count === 1 ? one : many}. Consider the one-page layout, or put more on it.`;
  }

  function status(row: Row) {
    if (row.key === 'home') return null;
    if (!row.visible) return <Badge>Hidden</Badge>;
    if (!existing.has(row.key)) {
      return <Badge tone="warning">Left out: nothing on it yet</Badge>;
    }
    return <Badge tone="accent">Shown</Badge>;
  }

  function renderPage(row: Row, handle?: React.ReactNode) {
    const name = pageName(profile, row);
    const home = row.key === 'home';
    const own = isCustomPageKey(row.key)
      ? profile.customPages.find((page) => `page:${page.id}` === row.key)
      : undefined;
    const hint = thinHint(row);
    const inputId = `page-name-${row.key}`;
    return (
      <Card padding="sm" className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          {handle}
          <span className={`font-medium ${row.visible ? '' : 'text-muted'}`}>{name}</span>
          {status(row)}
          <span className="ms-auto flex items-center gap-2">
            {mode === 'multi' && (
              <Button
                size="sm"
                disabled={!home && !existing.has(row.key)}
                onClick={() => setPreviewPageKey(row.key)}
                aria-label={`Show ${name} in the preview`}
              >
                <Eye aria-hidden="true" className="size-4" />
                Preview
              </Button>
            )}
            {home ? (
              <span className="text-sm text-muted">Always on</span>
            ) : (
              <Switch
                checked={row.visible}
                label={`Show ${name}`}
                onClick={() => patch(row.key, { visible: !row.visible })}
              />
            )}
          </span>
        </div>

        {own ? (
          editing === row.key ? (
            <CustomPageForm
              page={own}
              onSave={async (input) => {
                await custom.save(own.id, input);
                setEditing(null);
                notify('success', NOTICES.pageSaved);
              }}
              onCancel={() => setEditing(null)}
            />
          ) : (
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted">
              <span className="me-auto">Address: /p/{own.slug}</span>
              <Button size="sm" onClick={() => setEditing(row.key)} aria-label={`Edit ${name}`}>
                Edit page
              </Button>
              <Button
                size="sm"
                variant="danger"
                onClick={() => void deleteCustom(row)}
                aria-label={`Delete ${name}`}
              >
                <Trash2 aria-hidden="true" className="size-4" />
                Delete
              </Button>
            </div>
          )
        ) : (
          <div>
            <label htmlFor={inputId} className="mb-1 block text-xs font-medium text-muted">
              Name in your navigation
            </label>
            <Input
              id={inputId}
              value={row.title}
              maxLength={PAGE_TITLE_MAX}
              placeholder={PAGE_LABELS[row.key as keyof typeof PAGE_LABELS]}
              onChange={(e) => patch(row.key, { title: e.target.value })}
            />
          </div>
        )}

        {home ? (
          <p className="text-sm text-muted">
            Home is a short page, not a list of sections: your introduction, your featured projects,
            a short About with a link to the About page, and a way to get in touch.
          </p>
        ) : (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted">Sections on this page</p>
            <SectionList
              page={row.key}
              rows={rows}
              names={targets}
              nameOf={(key) => sectionName(profile, key)}
              notes={sectionNote}
              onChange={setRows}
            />
          </div>
        )}
        {hint && (
          <p className="rounded-control bg-warning-bg px-3 py-2 text-sm text-warning-fg">{hint}</p>
        )}
      </Card>
    );
  }

  const home = rows.find((row) => row.key === 'home');
  const atLimit = profile.customPages.length >= MAX_CUSTOM_PAGES;

  return (
    <div className="space-y-6">
      <SectionCard
        title="Layout"
        description="Choose how your portfolio is laid out. You can switch back at any time: nothing you wrote is deleted, and your page settings are kept."
      >
        <LayoutChoice mode={mode} onChoose={(target) => void choose(target)} />
        <InfoToggle label="What happens to my links?">
          Links keep working when you switch. With pages, an old link to a section such as
          yourname#projects takes visitors to the right page. With one page, the page addresses
          (yourname/work, yourname/about) send visitors to the matching section. Project pages work
          in both layouts.
        </InfoToggle>
      </SectionCard>

      {mode === 'multi' ? (
        <SectionCard
          title="Your pages"
          description="The pages in your navigation, in this order. Hide a page or rename it, drag to reorder, and choose which sections each one holds."
          actions={
            <Button onClick={() => setSplitting(true)}>
              <Scissors aria-hidden="true" className="size-4" />
              Split my portfolio into pages
            </Button>
          }
        >
          <InfoToggle label="How to reorder with the keyboard">
            Focus a grip, press Space, move with the arrow keys, then press Space again. Or use the
            up and down buttons next to it.
          </InfoToggle>
          {home && renderPage(home)}
          <SortableList
            items={movable.map((row) => ({ ...row, id: row.key }))}
            onReorder={reorder}
            label={(row) => pageName(profile, row)}
            renderItem={(row, handle) => renderPage(row, handle)}
          />

          {editing === 'new' ? (
            <Card tone="accent">
              <h3 className="type-section mb-3">New page</h3>
              <CustomPageForm
                onSave={async (input) => {
                  const page = await custom.create(input);
                  setEditing(null);
                  setPreviewPageKey(`page:${page.id}`);
                  notify('success', NOTICES.pageAdded);
                }}
                onCancel={() => setEditing(null)}
              />
            </Card>
          ) : atLimit ? (
            <p className="text-sm text-muted">
              That’s the most extra pages you can have ({MAX_CUSTOM_PAGES}). Delete one to add
              another.
            </p>
          ) : (
            <Button variant="primary" disabled={editing !== null} onClick={() => setEditing('new')}>
              <Plus aria-hidden="true" className="size-4" />
              Add a page
            </Button>
          )}
        </SectionCard>
      ) : (
        <SectionCard
          title="Pages"
          description="Pages are off. Choose the pages layout above to give each part of your portfolio its own page."
          actions={
            <Button onClick={() => setSplitting(true)}>
              <Scissors aria-hidden="true" className="size-4" />
              Split my portfolio into pages
            </Button>
          }
        >
          <p className="text-sm text-muted">
            Your portfolio is one page, so the pages you’ve set up are kept for later and not shown.
            The split helper proposes an arrangement you can adjust, and switches you to pages when
            you apply it.
          </p>
        </SectionCard>
      )}

      <SectionCard title="Search engines">
        <SettingRow
          label="Let search engines find my pages"
          helper="Lists your pages and projects in this site’s sitemap, so search engines can find them. Off by default: a portfolio is personal. Anyone with a link can open it either way."
        >
          <Switch
            checked={listed}
            label="List my pages in the sitemap"
            onClick={() => setListed((on) => !on)}
          />
        </SettingRow>
      </SectionCard>

      {splitting && (
        <SplitDialog
          profile={profile}
          rows={rows}
          willSwitch={mode === 'single'}
          notes={sectionNote}
          onClose={() => setSplitting(false)}
          onApply={(proposal) => {
            setRows(proposal);
            if (mode === 'single') setMode('multi');
            setSplitting(false);
            notify('success', NOTICES.splitApplied);
          }}
        />
      )}
    </div>
  );
}
