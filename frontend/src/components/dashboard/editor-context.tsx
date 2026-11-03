'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  CONTACT_DEFAULT_RETENTION_DAYS,
  LINK_BIO_SETTING_KEYS,
  publicLayout,
  type LinkBioSettings,
  type MyCustomPage,
  type MyCustomSection,
  type PageConfig,
  type MyLinkBioButton,
  type MyProfile,
  type MyTestimonial,
  type ParsedResume,
  type ProfileUpdateInput,
  type PublicProfile,
  type Section,
  type SectionConfig,
  type StoredTranslation,
} from '@parichay/shared';
import { ApiError, api } from '@/lib/client-api';
import { applyTranslations } from '@/lib/translate-preview';
import { ToastRegion, type ToastData } from '../ui';
import { previewPages } from './page-content';
import { saveProfile } from './save-profile';
import { PROBLEMS } from '@/lib/messages';

// Fields the live preview shows while they are still being typed (not yet saved).
export type Draft = Partial<
  Pick<
    MyProfile,
    | 'fullName'
    | 'tagline'
    | 'location'
    | 'about'
    | 'theme'
    | 'accentColor'
    | 'sectionConfig'
    | 'layoutMode'
    | 'pageConfig'
    | 'availabilityEnabled'
    | 'availabilityStatus'
    | 'availabilityMessage'
    | 'workCardEnabled'
    | 'timezone'
    | 'workingHours'
    | 'replyTime'
    | 'preferredContact'
    | 'workNote'
    | 'shareMessage'
  >
>;

// What an autosaving form or list is doing, and how the top bar tells the person.
//   pending: edited, waiting a moment for more typing    saving: the request is on its way
//   invalid: edited, but not valid yet, so not saved      error:  the request failed
export type SaveState = 'pending' | 'saving' | 'invalid' | 'error';
export type SaveStatus = SaveState | 'saved';
type Saves = Record<string, { state: SaveState; retry?: () => void }>;
// The most urgent state wins when several things are saving at once.
const SAVE_ORDER: SaveState[] = ['error', 'invalid', 'saving', 'pending'];

// ---- Resume import. Nothing from a resume is saved until the person saves it. The profile
// fields are put into the Basics and About forms (unsaved); each list entry becomes a
// suggestion they can edit and add, or skip.
export interface SuggestionMap {
  links: ParsedResume['links'][number];
  skills: string;
  experience: ParsedResume['experience'][number];
  projects: ParsedResume['projects'][number];
  education: ParsedResume['education'][number];
}
export type SuggestionSection = keyof SuggestionMap;
export type Suggestion<K extends SuggestionSection> = { key: string; data: SuggestionMap[K] };
type Suggestions = { [K in SuggestionSection]: Suggestion<K>[] };
// Only the fields the resume actually had (never null), so each is a plain string.
export type ImportedFields = Partial<Record<'fullName' | 'tagline' | 'location' | 'about', string>>;
interface Imported {
  fields: ImportedFields; // waiting to be put into a form (taken once)
  suggestions: Suggestions;
  skipped: number; // entries the server could not read
}

const SUGGESTION_SECTIONS: SuggestionSection[] = [
  'links',
  'skills',
  'experience',
  'projects',
  'education',
];
const pendingCount = (imported: Imported | null) =>
  imported
    ? Object.keys(imported.fields).length +
      SUGGESTION_SECTIONS.reduce((n, k) => n + imported.suggestions[k].length, 0)
    : 0;

interface EditorContextValue {
  profile: MyProfile; // what is saved on the server
  preview: PublicProfile; // saved profile + draft, minus hidden links
  // The same in the language chosen for the preview (the default language, or an extra one with its
  // translations merged in, unsaved typing included).
  localizedPreview: PublicProfile;
  previewLocale: string; // always the default language or one of the profile's extra ones
  setPreviewLocale: (locale: string) => void;
  // The page of a multi-page portfolio the preview shows (a page key; Home when it no longer exists).
  previewPageKey: string;
  setPreviewPageKey: (key: string) => void;
  // The translation editor hands in the texts of one language as they are being typed, for the
  // preview; dropTranslations forgets a language that was removed.
  setTranslations: (locale: string, entries: StoredTranslation[]) => void;
  dropTranslations: (locale: string) => void;
  update: (change: (profile: MyProfile) => MyProfile) => void;
  // Saves profile fields (PUT /profile/me), one request at a time and always on top of the latest
  // saved profile, so two autosaves can never overwrite each other's fields.
  saveFields: (changes: Partial<ProfileUpdateInput>) => Promise<MyProfile>;
  // Each form hands in its own draft under its own `source`, so two forms on one screen (Details and
  // Availability) do not wipe each other's. null clears that source's draft.
  setDraft: (draft: Draft | null, source?: string) => void;
  notify: (kind: ToastData['kind'], text: string) => void;
  // Runs `action`, shows `success` if it worked and the error as a toast if it did not. Never
  // throws; says whether it worked.
  attempt: (action: () => Promise<unknown>, success?: string) => Promise<boolean>;
  markDirty: () => () => void;
  hasUnsaved: () => boolean; // edits that would be lost by leaving (not an autosave still waiting)
  saveStatus: SaveStatus;
  retrySave: (() => void) | undefined;
  reportSave: (id: string, state: SaveState | null, retry?: () => void) => void;
  // Edits not yet safe on the server, for the "unsaved changes" mark and the tab-close warning.
  unsaved: boolean;
  // The tab open on the Profile page; kept here so other pages can send you to one.
  tab: string;
  setTab: (tab: string) => void;
  // A request (from the command palette) to open one item's editor: the list that owns it picks it
  // up when it appears and clears it. `kind` is a list name ("projects", "post", "testimonial"...).
  jump: { kind: string; id: string } | null;
  requestJump: (kind: string, id: string) => void;
  clearJump: () => void;
  imported: Imported | null;
  hasPendingImport: boolean;
  applyImport: (resume: ParsedResume, skipped: number) => void;
  // Hands the imported values for these fields to a form, once.
  takeFields: (keys: (keyof ImportedFields)[]) => ImportedFields;
  dismissSuggestions: (section: SuggestionSection, keys: string[]) => void;
  discardImport: () => void;
}

const EditorContext = createContext<EditorContextValue | null>(null);

export function useEditor(): EditorContextValue {
  const value = useContext(EditorContext);
  if (!value) throw new Error('useEditor must be used inside <EditorProvider>');
  return value;
}

export const errorText = (err: unknown) =>
  err instanceof ApiError ? err.message : PROBLEMS.notSaved;

// A brand-new profile has only a name. Those people start on the resume import.
export const isBlank = (p: MyProfile) =>
  !p.about &&
  !p.tagline &&
  !p.location &&
  !p.avatarUrl &&
  [p.links, p.skills, p.experience, p.projects, p.education].every((list) => list.length === 0);

export function EditorProvider({ initial, children }: { initial: MyProfile; children: ReactNode }) {
  const [profile, setProfile] = useState(initial);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const setDraft = useCallback((next: Draft | null, source = 'form') => {
    setDrafts((all) => {
      if (next) return { ...all, [source]: next };
      const rest = { ...all };
      delete rest[source];
      return rest;
    });
  }, []);
  const draft = useMemo<Draft | null>(
    () => (Object.keys(drafts).length > 0 ? Object.assign({}, ...Object.values(drafts)) : null),
    [drafts],
  );
  const [wantedLocale, setPreviewLocale] = useState(initial.defaultLocale);
  const [previewPageKey, setPreviewPageKey] = useState('home');
  const [translations, setTranslationsState] = useState<Record<string, StoredTranslation[]>>({});
  const setTranslations = useCallback(
    (locale: string, entries: StoredTranslation[]) =>
      setTranslationsState((all) => ({ ...all, [locale]: entries })),
    [],
  );
  const dropTranslations = useCallback(
    (locale: string) =>
      setTranslationsState((all) => {
        const rest = { ...all };
        delete rest[locale];
        return rest;
      }),
    [],
  );
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const nextToast = useRef(0);
  const [tab, setTab] = useState(() => (isBlank(initial) ? 'import' : 'basics'));
  const [jump, setJump] = useState<{ kind: string; id: string } | null>(null);
  const requestJump = useCallback((kind: string, id: string) => setJump({ kind, id }), []);
  const clearJump = useCallback(() => setJump(null), []);
  const dirtyForms = useRef(0);
  const [dirtyCount, setDirtyCount] = useState(0);
  const [saves, setSaves] = useState<Saves>({});
  const savesRef = useRef<Saves>({});
  // The newest saved profile, for the save queue below (state would be a render behind).
  const latest = useRef(initial);
  const queue = useRef<Promise<unknown>>(Promise.resolve());
  // The ref is read synchronously (a form takes its fields on mount); the state drives rendering.
  const [imported, setImportedState] = useState<Imported | null>(null);
  const importedRef = useRef<Imported | null>(null);
  const setImported = useCallback((next: Imported | null) => {
    importedRef.current = next;
    setImportedState(next);
  }, []);

  const dismissToast = useCallback(
    (id: number) => setToasts((list) => list.filter((toast) => toast.id !== id)),
    [],
  );
  const notify = useCallback(
    (kind: ToastData['kind'], text: string) => {
      const id = ++nextToast.current;
      setToasts((list) => [...list.slice(-2), { id, kind, text }]);
      setTimeout(() => dismissToast(id), kind === 'error' ? 8000 : 5000);
    },
    [dismissToast],
  );

  const attempt = useCallback(
    async (action: () => Promise<unknown>, success?: string) => {
      try {
        await action();
        if (success) notify('success', success);
        return true;
      } catch (err) {
        notify('error', errorText(err));
        return false;
      }
    },
    [notify],
  );

  // Forms that hold unsaved edits (the add/edit forms, which save with a button) register here;
  // leaving the page or a tab asks first.
  const markDirty = useCallback(() => {
    dirtyForms.current += 1;
    setDirtyCount(dirtyForms.current);
    return () => {
      dirtyForms.current -= 1;
      setDirtyCount(dirtyForms.current);
    };
  }, []);

  // Autosaving forms report what they are doing here (see autosave.ts).
  const reportSave = useCallback((id: string, state: SaveState | null, retry?: () => void) => {
    const before = savesRef.current[id];
    if (state ? before?.state === state && before.retry === retry : !before) return;
    const next = { ...savesRef.current };
    if (state) next[id] = { state, retry };
    else delete next[id];
    savesRef.current = next;
    setSaves(next);
  }, []);
  const hasUnsaved = useCallback(
    () =>
      dirtyForms.current > 0 ||
      Object.values(savesRef.current).some((s) => s.state === 'error' || s.state === 'invalid'),
    [],
  );

  const saveFields = useCallback((changes: Partial<ProfileUpdateInput>) => {
    const run = queue.current.then(async () => {
      const saved = await saveProfile(latest.current, changes);
      latest.current = saved;
      setProfile(saved);
      return saved;
    });
    queue.current = run.catch(() => {});
    return run;
  }, []);
  const update = useCallback((change: (profile: MyProfile) => MyProfile) => {
    latest.current = change(latest.current);
    setProfile(latest.current);
  }, []);

  const applyImport = useCallback(
    (resume: ParsedResume, skipped: number) => {
      const fields: ImportedFields = {
        ...(resume.fullName && { fullName: resume.fullName }),
        ...(resume.tagline && { tagline: resume.tagline }),
        ...(resume.location && { location: resume.location }),
        ...(resume.about && { about: resume.about }),
      };
      const wrap = <K extends SuggestionSection>(list: SuggestionMap[K][]): Suggestion<K>[] =>
        list.map((data) => ({ key: crypto.randomUUID(), data }));
      setImported({
        fields,
        skipped,
        suggestions: {
          links: wrap<'links'>(resume.links),
          skills: wrap<'skills'>(resume.skills),
          experience: wrap<'experience'>(resume.experience),
          projects: wrap<'projects'>(resume.projects),
          education: wrap<'education'>(resume.education),
        },
      });
    },
    [setImported],
  );

  const takeFields = useCallback(
    (keys: (keyof ImportedFields)[]) => {
      const current = importedRef.current;
      const taken: ImportedFields = {};
      if (!current) return taken;
      const rest = { ...current.fields };
      for (const key of keys) {
        if (rest[key] !== undefined) {
          taken[key] = rest[key];
          delete rest[key];
        }
      }
      if (Object.keys(taken).length > 0) setImported({ ...current, fields: rest });
      return taken;
    },
    [setImported],
  );

  const dismissSuggestions = useCallback(
    (section: SuggestionSection, keys: string[]) => {
      const current = importedRef.current;
      if (!current) return;
      const remaining = (current.suggestions[section] as { key: string }[]).filter(
        (item) => !keys.includes(item.key),
      );
      setImported({ ...current, suggestions: { ...current.suggestions, [section]: remaining } });
    },
    [setImported],
  );

  const discardImport = useCallback(() => setImported(null), [setImported]);

  // The most urgent thing the autosavers are doing, and the retry of the one that failed.
  const savingStates = Object.values(saves);
  const saveStatus: SaveStatus =
    SAVE_ORDER.find((state) => savingStates.some((s) => s.state === state)) ?? 'saved';
  const retrySave = savingStates.find((s) => s.state === 'error')?.retry;
  const unsaved = dirtyCount > 0 || saveStatus !== 'saved';

  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      // Also guards a parsed resume that has not been reviewed yet: it is not stored anywhere, and
      // an autosave that has not gone out yet (closing the tab cannot wait for it).
      if (
        dirtyForms.current > 0 ||
        Object.keys(savesRef.current).length > 0 ||
        pendingCount(importedRef.current) > 0
      ) {
        e.preventDefault();
      }
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, []);

  const preview = useMemo<PublicProfile>(() => {
    // `?? []`: an API that predates posts must not blank the dashboard.
    const published = (profile.posts ?? [])
      .flatMap((post) => (post.status === 'published' && post.publishedAt ? [post] : []))
      .sort((a, b) => (b.publishedAt ?? '').localeCompare(a.publishedAt ?? ''));
    // The pages of multi mode, from the unsaved layout too (the Pages screen drafts it).
    const pages = previewPages({ ...profile, ...draft });
    return {
      ...profile,
      ...draft,
      locale: profile.defaultLocale,
      pages,
      // Like the public API, the badge is only there while it is switched on.
      ...((draft?.availabilityEnabled ?? profile.availabilityEnabled)
        ? { availabilityEnabled: true as const }
        : {
            availabilityEnabled: undefined,
            availabilityStatus: undefined,
            availabilityMessage: undefined,
          }),
      // The same for the "Working together" card: nothing of it is public while it is switched off.
      ...((draft?.workCardEnabled ?? profile.workCardEnabled)
        ? { workCardEnabled: true as const }
        : {
            workCardEnabled: undefined,
            timezone: undefined,
            workingHours: undefined,
            replyTime: undefined,
            preferredContact: undefined,
            workNote: undefined,
          }),
      // The contact form, as the API gives it: only while it is switched on.
      ...(profile.contactFormEnabled && !profile.isSample
        ? {
            contactForm: {
              intro: profile.contactFormIntro,
              retentionDays: CONTACT_DEFAULT_RETENTION_DAYS,
            },
          }
        : { contactForm: undefined }),
      links: profile.links.filter((link) => link.visible),
      // The same layout the public API returns (visible sections in order, custom sections with
      // items), worked out from the unsaved config too.
      ...publicLayout(draft?.sectionConfig ?? profile.sectionConfig, profile.customSections),
      // The latest published posts, the way the API gives them to visitors.
      writing: published.slice(0, 3).map((post) => ({
        id: post.id,
        title: post.title,
        slug: post.slug,
        type: post.type,
        excerpt: post.excerpt,
        externalUrl: post.externalUrl,
        coverImageUrl: post.coverImageUrl,
        publishedAt: post.publishedAt as string,
      })),
      writingMore: published.length > 3,
      // Visitors see approved testimonials only, and never the email.
      testimonials: profile.testimonials
        .filter((item) => item.status === 'approved')
        .map(({ id, authorName, authorRole, authorCompany, message, order }) => ({
          id,
          authorName,
          authorRole,
          authorCompany,
          message,
          order,
        })),
    };
  }, [profile, draft]);

  // A language that was removed (or never added) falls back to the default one.
  const previewLocale =
    wantedLocale === profile.defaultLocale || profile.locales.includes(wantedLocale)
      ? wantedLocale
      : profile.defaultLocale;
  const isExtra = previewLocale !== profile.defaultLocale;
  const loaded = translations[previewLocale] !== undefined;
  // The preview needs the saved texts of the language it shows, also when the translation editor is
  // not open. What the editor has already put in is kept.
  useEffect(() => {
    if (!isExtra || loaded) return;
    const controller = new AbortController();
    api<{ entries: StoredTranslation[] }>(`/profile/me/translations/${previewLocale}`, {
      signal: controller.signal,
    }).then(
      ({ entries }) =>
        setTranslationsState((all) =>
          all[previewLocale] ? all : { ...all, [previewLocale]: entries },
        ),
      () => {}, // the preview then shows the default-language text
    );
    return () => controller.abort();
  }, [isExtra, loaded, previewLocale]);

  const localizedPreview = useMemo(
    () =>
      isExtra
        ? applyTranslations(preview, translations[previewLocale] ?? [], previewLocale)
        : preview,
    [isExtra, preview, translations, previewLocale],
  );

  const value = useMemo(
    () => ({
      profile,
      preview,
      localizedPreview,
      previewLocale,
      setPreviewLocale,
      previewPageKey,
      setPreviewPageKey,
      setTranslations,
      dropTranslations,
      update,
      saveFields,
      setDraft,
      notify,
      attempt,
      markDirty,
      hasUnsaved,
      saveStatus,
      retrySave,
      reportSave,
      unsaved,
      tab,
      setTab,
      jump,
      requestJump,
      clearJump,
      imported,
      hasPendingImport: pendingCount(imported) > 0,
      applyImport,
      takeFields,
      dismissSuggestions,
      discardImport,
    }),
    [
      profile,
      preview,
      localizedPreview,
      previewLocale,
      previewPageKey,
      setTranslations,
      dropTranslations,
      update,
      saveFields,
      notify,
      attempt,
      markDirty,
      hasUnsaved,
      saveStatus,
      retrySave,
      reportSave,
      unsaved,
      tab,
      jump,
      requestJump,
      clearJump,
      imported,
      applyImport,
      takeFields,
      dismissSuggestions,
      discardImport,
    ],
  );

  return (
    <EditorContext value={value}>
      {children}
      <ToastRegion toasts={toasts} onDismiss={dismissToast} />
    </EditorContext>
  );
}

// Call from any form: while `isDirty` is true, leaving the step or page asks for confirmation.
export function useReportDirty(isDirty: boolean) {
  const { markDirty } = useEditor();
  useEffect(() => (isDirty ? markDirty() : undefined), [isDirty, markDirty]);
}

export type SectionItem<S extends Section> = MyProfile[S][number];
export type CustomItem = MyCustomSection['items'][number];

// Create, update, delete and reorder for one list of items stored under `base`. Each call hits
// the API first and only then changes the screen; reorder is optimistic (see below) because it
// follows a drag. `replaceList` says where in the profile that list lives.
function useListApi<T extends { id: string }>(
  base: string,
  items: T[],
  replaceList: (change: (list: T[]) => T[]) => void,
) {
  const { notify } = useEditor();

  const create = useCallback(
    async (input: unknown) => {
      const item = await api<T>(base, { method: 'POST', body: input });
      replaceList((list) => [...list, item]);
    },
    [base, replaceList],
  );

  const updateItem = useCallback(
    async (id: string, input: unknown) => {
      const item = await api<T>(`${base}/${id}`, { method: 'PUT', body: input });
      replaceList((list) => list.map((it) => (it.id === id ? item : it)));
    },
    [base, replaceList],
  );

  const remove = useCallback(
    async (id: string) => {
      await api(`${base}/${id}`, { method: 'DELETE' });
      replaceList((list) => list.filter((it) => it.id !== id));
    },
    [base, replaceList],
  );

  // Shows the new order at once and tells the server; if that fails, puts the old order back.
  // `ids` may be only some of the items (the approved testimonials): the rest follow them.
  const reorder = useCallback(
    async (ids: string[]) => {
      const before = items;
      replaceList((list) => [
        ...ids.flatMap((id) => list.find((it) => it.id === id) ?? []),
        ...list.filter((it) => !ids.includes(it.id)),
      ]);
      try {
        await api(`${base}/reorder`, { method: 'PATCH', body: { ids } });
      } catch (err) {
        replaceList(() => before);
        notify('error', PROBLEMS.orderNotSaved(errorText(err)));
      }
    },
    [base, items, notify, replaceList],
  );

  return { items, create, updateItem, remove, reorder };
}

// One of the five built-in lists (experience, education, projects, skills, links).
export function useSection<S extends Section>(section: S) {
  const { profile, update } = useEditor();
  const replaceList = useCallback(
    (change: (list: SectionItem<S>[]) => SectionItem<S>[]) =>
      update((p) => ({ ...p, [section]: change(p[section] as SectionItem<S>[]) }) as MyProfile),
    [section, update],
  );
  return useListApi(`/profile/me/${section}`, profile[section] as SectionItem<S>[], replaceList);
}

// The items of one custom section.
export function useCustomItems(sectionId: string) {
  const { profile, update } = useEditor();
  const items = profile.customSections.find((s) => s.id === sectionId)?.items ?? [];
  const replaceList = useCallback(
    (change: (list: CustomItem[]) => CustomItem[]) =>
      update((p) => ({
        ...p,
        customSections: p.customSections.map((s) =>
          s.id === sectionId ? { ...s, items: change(s.items) } : s,
        ),
      })),
    [sectionId, update],
  );
  return useListApi(`/profile/me/custom-sections/${sectionId}/items`, items, replaceList);
}

// Creating and deleting a custom section also changes the page layout (it is added at the end /
// removed), so the server sends the new layout back and it is stored with the profile.
export function useCustomSections() {
  const { profile, update } = useEditor();
  const base = '/profile/me/custom-sections';

  const create = useCallback(
    async (title: string) => {
      const { section, sections } = await api<{
        section: MyCustomSection;
        sections: SectionConfig;
      }>(base, { method: 'POST', body: { title } });
      update((p) => ({
        ...p,
        customSections: [...p.customSections, section],
        sectionConfig: sections,
      }));
      return section;
    },
    [update],
  );

  const rename = useCallback(
    async (id: string, title: string) => {
      const saved = await api<MyCustomSection>(`${base}/${id}`, { method: 'PUT', body: { title } });
      update((p) => ({
        ...p,
        customSections: p.customSections.map((s) =>
          s.id === id ? { ...s, title: saved.title } : s,
        ),
      }));
    },
    [update],
  );

  const remove = useCallback(
    async (id: string) => {
      const { sections } = await api<{ sections: SectionConfig }>(`${base}/${id}`, {
        method: 'DELETE',
      });
      update((p) => ({
        ...p,
        customSections: p.customSections.filter((s) => s.id !== id),
        sectionConfig: sections,
      }));
    },
    [update],
  );

  return { sections: profile.customSections, create, rename, remove };
}

// The pages the owner made (/<slug>/p/<page>). The API sends the page list back after a change that
// adds or removes one (a deleted page's sections go back to their standard pages), and it is stored
// with the profile.
export function useCustomPages() {
  const { profile, update } = useEditor();
  const base = '/profile/me/custom-pages';

  const create = useCallback(
    async (input: { title: string; slug?: string; body?: string }) => {
      const { page, pages } = await api<{ page: MyCustomPage; pages: PageConfig }>(base, {
        method: 'POST',
        body: input,
      });
      update((p) => ({ ...p, customPages: [...p.customPages, page], pageConfig: pages }));
      return page;
    },
    [update],
  );

  const save = useCallback(
    async (id: string, input: { title: string; slug?: string; body?: string }) => {
      const page = await api<MyCustomPage>(`${base}/${id}`, { method: 'PUT', body: input });
      update((p) => ({
        ...p,
        customPages: p.customPages.map((own) => (own.id === id ? page : own)),
      }));
      return page;
    },
    [update],
  );

  const remove = useCallback(
    async (id: string) => {
      const { pages } = await api<{ pages: PageConfig }>(`${base}/${id}`, { method: 'DELETE' });
      update((p) => ({
        ...p,
        customPages: p.customPages.filter((own) => own.id !== id),
        pageConfig: pages,
      }));
    },
    [update],
  );

  return { pages: profile.customPages, create, save, remove };
}

// Testimonials: all of them, whatever their status. Adding one here makes it approved at once.
// Approving, rejecting and the accept switch also change the saved profile.
export function useTestimonials() {
  const { profile, update } = useEditor();
  const base = '/profile/me/testimonials';
  const replaceList = useCallback(
    (change: (list: MyTestimonial[]) => MyTestimonial[]) =>
      update((p) => ({ ...p, testimonials: change(p.testimonials) })),
    [update],
  );
  const list = useListApi(base, profile.testimonials, replaceList);

  const setStatus = useCallback(
    async (id: string, action: 'approve' | 'reject') => {
      const saved = await api<MyTestimonial>(`${base}/${id}/${action}`, { method: 'POST' });
      // Approving moves it to the end of the approved ones: take the new order from the server.
      replaceList((items) =>
        action === 'approve'
          ? [...items.filter((it) => it.id !== id), saved]
          : items.map((it) => (it.id === id ? saved : it)),
      );
    },
    [replaceList],
  );

  const setAccepting = useCallback(
    async (acceptTestimonials: boolean) => {
      const saved = await api<{ acceptTestimonials: boolean }>(`${base}/settings`, {
        method: 'PUT',
        body: { acceptTestimonials },
      });
      update((p) => ({ ...p, acceptTestimonials: saved.acceptTestimonials }));
    },
    [update],
  );

  const approved = profile.testimonials.filter((item) => item.status === 'approved');
  const pending = profile.testimonials.filter((item) => item.status === 'pending');
  const rejected = profile.testimonials.filter((item) => item.status === 'rejected');
  return {
    ...list,
    approved,
    pending,
    rejected,
    accepting: profile.acceptTestimonials,
    approve: (id: string) => setStatus(id, 'approve'),
    reject: (id: string) => setStatus(id, 'reject'),
    setAccepting,
  };
}

// The link-in-bio card: its custom buttons (a list like the others) and its settings. The settings
// are sent whole, because the endpoint replaces them all, so a change is merged into what is saved.
export function useLinkBio() {
  const { profile, update } = useEditor();
  const replaceList = useCallback(
    (change: (list: MyLinkBioButton[]) => MyLinkBioButton[]) =>
      update((p) => ({ ...p, linkBioLinks: change(p.linkBioLinks) })),
    [update],
  );
  const list = useListApi('/profile/me/link-bio/links', profile.linkBioLinks, replaceList);

  const saveSettings = useCallback(
    async (changes: Partial<LinkBioSettings>) => {
      const current = Object.fromEntries(
        LINK_BIO_SETTING_KEYS.map((key) => [key, profile[key]]),
      ) as LinkBioSettings;
      const saved = await api<LinkBioSettings>('/profile/me/link-bio', {
        method: 'PUT',
        body: { ...current, ...changes },
      });
      update((p) => ({ ...p, ...saved }));
    },
    [profile, update],
  );

  return { ...list, saveSettings };
}

// The suggestions waiting for one list, with ways to clear them.
export function useSuggestions<K extends SuggestionSection>(section: K) {
  const { imported, dismissSuggestions } = useEditor();
  const suggestions = (imported?.suggestions[section] ?? []) as Suggestion<K>[];
  return {
    suggestions,
    dismiss: (key: string) => dismissSuggestions(section, [key]),
    dismissAll: () =>
      dismissSuggestions(
        section,
        suggestions.map((x) => x.key),
      ),
  };
}
