import {
  BookOpen,
  Briefcase,
  Copy,
  Download,
  ExternalLink,
  Eye,
  EyeOff,
  FileDown,
  FolderKanban,
  GraduationCap,
  Inbox,
  Keyboard,
  Languages,
  LayoutList,
  Link2,
  LayoutPanelTop,
  Mail,
  MessageSquareQuote,
  PenLine,
  Palette,
  QrCode,
  Settings,
  UserRound,
  Wrench,
  FileUp,
  UserPlus,
  type LucideIcon,
} from 'lucide-react';
import type { MyProfile, ProfileUpdateInput } from '@parichay/shared';
import { ACCENT_PRESETS } from '@/lib/color';
import { SITE_URL } from '@/lib/config';
import { downloadMyData } from '@/lib/download-export';
import { THEME_LIST, getTheme } from '@/lib/themes';
import type { DashboardActions } from './actions';
import { NOTICES, PROBLEMS } from '@/lib/messages';

// Every command of the palette is an entry in a list below. To add one: add an object to the list
// that fits (GO_TO for a page or tab, or a function in ACTIONS / ITEMS), and it shows up, is
// searchable by its title and keywords, and is remembered as a recent command. Nothing destructive
// belongs here (no deleting an account or an item): this palette only moves you around and does
// things that can be undone.

export const GROUPS = ['Recent', 'Go to', 'Actions', 'Jump to', 'Help'] as const;
export type Group = (typeof GROUPS)[number];

export interface Command {
  id: string; // stable: recent commands are remembered by it
  group: Exclude<Group, 'Recent'>;
  title: string;
  subtitle?: string;
  keywords?: string[]; // synonyms: "colour" finds Accent color
  icon?: LucideIcon;
  swatch?: string; // a color dot in place of an icon (accent colors)
  // Set when the command cannot be used right now. It is shown, dimmed, with this reason, and does
  // nothing: better than a command that vanishes without saying why.
  disabled?: string;
  // Only listed once something is typed (the lists of the person's own items would bury the rest).
  searchOnly?: boolean;
  keepOpen?: boolean; // the palette stays open after it runs (it changes what the palette shows)
  run: () => void | Promise<void>;
}

export interface PaletteContext {
  profile: MyProfile;
  // Goes to a dashboard page (and a Profile tab), after the unsaved-changes check.
  go: (href: string, tab?: string) => Promise<void>;
  requestJump: (kind: string, id: string) => void;
  saveFields: (changes: Partial<ProfileUpdateInput>) => Promise<unknown>;
  notify: (kind: 'success' | 'error', text: string) => void;
  actions: () => DashboardActions;
  showShortcuts: () => void; // switches the palette to the list of shortcuts, and stays open
}

type Source = (ctx: PaletteContext) => Command[];

// ---- Go to

const GO_TO: {
  id: string;
  title: string;
  href: string;
  tab?: string;
  icon: LucideIcon;
  keywords: string[];
}[] = [
  {
    id: 'basics',
    title: 'Basics',
    href: '/dashboard',
    tab: 'basics',
    icon: UserRound,
    keywords: [
      'name',
      'photo',
      'avatar',
      'picture',
      'tagline',
      'location',
      'links',
      'contact',
      'availability',
      'resume download',
    ],
  },
  {
    id: 'about',
    title: 'About',
    href: '/dashboard',
    tab: 'about',
    icon: PenLine,
    keywords: ['bio', 'summary', 'intro', 'story'],
  },
  {
    id: 'skills',
    title: 'Skills',
    href: '/dashboard',
    tab: 'skills',
    icon: Wrench,
    keywords: ['tools', 'technologies', 'abilities'],
  },
  {
    id: 'experience',
    title: 'Experience',
    href: '/dashboard',
    tab: 'experience',
    icon: Briefcase,
    keywords: ['jobs', 'work', 'career', 'employment', 'roles'],
  },
  {
    id: 'projects',
    title: 'Projects',
    href: '/dashboard',
    tab: 'projects',
    icon: FolderKanban,
    keywords: ['portfolio', 'work samples', 'apps'],
  },
  {
    id: 'education',
    title: 'Education',
    href: '/dashboard',
    tab: 'education',
    icon: GraduationCap,
    keywords: ['degree', 'school', 'university', 'college', 'study'],
  },
  {
    id: 'writing',
    title: 'Writing',
    href: '/dashboard',
    tab: 'writing',
    icon: BookOpen,
    keywords: ['posts', 'blog', 'articles', 'markdown'],
  },
  {
    id: 'custom',
    title: 'Custom sections',
    href: '/dashboard',
    tab: 'custom',
    icon: LayoutPanelTop,
    keywords: ['certifications', 'awards', 'open source', 'extra'],
  },
  {
    id: 'import',
    title: 'Import resume',
    href: '/dashboard',
    tab: 'import',
    icon: FileUp,
    keywords: ['upload', 'pdf', 'cv', 'parse'],
  },
  {
    id: 'sections',
    title: 'Sections',
    href: '/dashboard/sections',
    icon: LayoutList,
    keywords: ['order', 'reorder', 'hide', 'show', 'rename', 'layout', 'headings'],
  },
  {
    id: 'languages',
    title: 'Languages',
    href: '/dashboard/languages',
    icon: Languages,
    keywords: ['translate', 'translation', 'hindi', 'spanish', 'multilingual', 'locale'],
  },
  {
    id: 'themes',
    title: 'Themes',
    href: '/dashboard/themes',
    icon: Palette,
    keywords: ['look', 'design', 'style', 'appearance', 'colour', 'color', 'accent'],
  },
  {
    id: 'testimonials',
    title: 'Testimonials',
    href: '/dashboard/testimonials',
    icon: MessageSquareQuote,
    keywords: ['reviews', 'quotes', 'recommendations', 'approve', 'feedback'],
  },
  {
    id: 'messages',
    title: 'Messages',
    href: '/dashboard/messages',
    icon: Inbox,
    keywords: ['inbox', 'contact form', 'contact', 'mail', 'unread', 'replies', 'enquiries'],
  },
  {
    id: 'link-bio',
    title: 'Link-in-bio card',
    href: '/dashboard/link-bio',
    icon: Link2,
    keywords: [
      'instagram',
      'whatsapp',
      'bio',
      'links',
      'linktree',
      'card',
      'buttons',
      'short link',
    ],
  },
  {
    id: 'signature',
    title: 'Email signature',
    href: '/dashboard/signature',
    icon: Mail,
    keywords: ['email', 'mail', 'gmail', 'outlook', 'footer', 'badge', 'html', 'copy'],
  },
  {
    id: 'settings',
    title: 'Settings',
    href: '/dashboard/settings',
    icon: Settings,
    keywords: ['account', 'password', 'email', 'privacy', 'data', 'sign out', 'log out'],
  },
];

const goTo: Source = ({ go }) =>
  GO_TO.map((page) => ({
    id: `go:${page.id}`,
    group: 'Go to',
    title: page.title,
    keywords: ['go to', 'open', ...page.keywords],
    icon: page.icon,
    run: () => go(page.href, page.tab),
  }));

// ---- Actions

const needsPublished = (profile: MyProfile) =>
  profile.published ? undefined : 'Publish your page first';

const actions: Source = ({ profile, actions: getActions, notify }) => {
  const url = `${SITE_URL}/${profile.slug}`;
  return [
    {
      id: 'action:publish',
      group: 'Actions',
      title: profile.published ? 'Unpublish my page' : 'Publish my page',
      subtitle: profile.published ? 'Hide it from visitors' : 'Make it visible to everyone',
      keywords: ['publish', 'unpublish', 'live', 'draft', 'hide', 'go live', 'visibility'],
      icon: profile.published ? EyeOff : Eye,
      run: () => getActions().togglePublish(),
    },
    {
      id: 'action:copy-url',
      group: 'Actions',
      title: 'Copy public URL',
      subtitle: url.replace(/^https?:\/\//, ''),
      keywords: ['link', 'share', 'address', 'clipboard'],
      icon: Copy,
      disabled: needsPublished(profile),
      run: () => getActions().copyUrl(),
    },
    {
      id: 'action:open-page',
      group: 'Actions',
      title: 'Open my public page in a new tab',
      keywords: ['view', 'visit', 'see', 'preview', 'live page'],
      icon: ExternalLink,
      disabled: needsPublished(profile),
      run: () => void window.open(`/${profile.slug}`, '_blank', 'noopener,noreferrer'),
    },
    {
      id: 'action:qr',
      group: 'Actions',
      title: 'Open QR code',
      keywords: ['qr', 'scan', 'print', 'share', 'code'],
      icon: QrCode,
      run: () => getActions().openQr(),
    },
    {
      id: 'action:resume-pdf',
      group: 'Actions',
      title: 'Download resume PDF',
      keywords: ['cv', 'pdf', 'resume', 'download', 'print'],
      icon: FileDown,
      disabled: !profile.published
        ? 'Publish your page first'
        : !profile.resumeEnabled
          ? 'Switch on the resume download in Basics'
          : undefined,
      run: () => {
        const a = document.createElement('a');
        a.href = `/${profile.slug}/resume.pdf`;
        a.download = '';
        a.click();
      },
    },
    {
      id: 'action:contact-card',
      group: 'Actions',
      title: 'Download my contact card',
      subtitle: 'The .vcf file visitors get from “Add to contacts”',
      keywords: ['vcard', 'vcf', 'contact', 'contacts', 'address book', 'download'],
      icon: UserPlus,
      disabled: !profile.published
        ? 'Publish your page first'
        : !profile.contactCardEnabled
          ? 'Switch on the contact card in Basics'
          : undefined,
      run: () => {
        const a = document.createElement('a');
        a.href = `/${profile.slug}/contact.vcf`;
        a.download = '';
        a.click();
      },
    },
    {
      id: 'action:export',
      group: 'Actions',
      title: 'Export my data',
      subtitle: 'A file with everything stored about you',
      keywords: ['download', 'backup', 'json', 'gdpr', 'copy of my data'],
      icon: Download,
      run: async () => {
        try {
          await downloadMyData();
          notify('success', NOTICES.dataDownloading);
        } catch {
          notify('error', PROBLEMS.dataFile);
        }
      },
    },
  ];
};

const themes: Source = ({ profile, saveFields, notify }) =>
  THEME_LIST.map((theme) => ({
    id: `theme:${theme.key}`,
    group: 'Actions',
    title: `Change theme to ${theme.name}`,
    subtitle: getTheme(profile.theme).key === theme.key ? 'Your current theme' : theme.description,
    keywords: ['theme', 'look', 'design', 'style', 'template', 'appearance', theme.name],
    icon: Palette,
    run: async () => {
      try {
        await saveFields({ theme: theme.key });
        notify('success', NOTICES.themeChanged(theme.name));
      } catch {
        notify('error', PROBLEMS.themeNotChanged);
      }
    },
  }));

const accents: Source = ({ profile, saveFields, notify }) =>
  ACCENT_PRESETS.map((preset) => ({
    id: `accent:${preset.hex}`,
    group: 'Actions',
    title: `Change accent color to ${preset.name}`,
    subtitle: profile.accentColor.toLowerCase() === preset.hex ? 'Your current color' : undefined,
    keywords: ['accent', 'color', 'colour', 'hue', 'brand', 'tint', 'swatch', preset.name],
    swatch: preset.hex,
    run: async () => {
      try {
        await saveFields({ accentColor: preset.hex });
        notify('success', NOTICES.accentChanged(preset.name));
      } catch {
        notify('error', PROBLEMS.colorNotChanged);
      }
    },
  }));

// ---- Jump to one of your own items

const snippet = (text: string, max = 60) =>
  text.length > max ? `${text.slice(0, max - 1)}…` : text;

const items: Source = ({ profile, go, requestJump }) => {
  const jump = (tab: string, kind: string, id: string) => async () => {
    await go('/dashboard', tab);
    requestJump(kind, id);
  };
  return [
    ...profile.projects.map((p): Command => ({
      id: `item:project:${p.id}`,
      group: 'Jump to',
      title: p.name,
      subtitle: 'Project',
      keywords: ['project', ...p.techTags],
      icon: FolderKanban,
      searchOnly: true,
      run: jump('projects', 'projects', p.id),
    })),
    ...profile.experience.map((e): Command => ({
      id: `item:experience:${e.id}`,
      group: 'Jump to',
      title: e.title,
      subtitle: `Experience · ${e.company}`,
      keywords: ['experience', 'job', e.company],
      icon: Briefcase,
      searchOnly: true,
      run: jump('experience', 'experience', e.id),
    })),
    ...profile.education.map((e): Command => ({
      id: `item:education:${e.id}`,
      group: 'Jump to',
      title: e.degree,
      subtitle: `Education · ${e.institution}`,
      keywords: ['education', 'degree', e.institution],
      icon: GraduationCap,
      searchOnly: true,
      run: jump('education', 'education', e.id),
    })),
    ...(profile.posts ?? []).map((p): Command => ({
      id: `item:post:${p.id}`,
      group: 'Jump to',
      title: p.title,
      subtitle: p.status === 'published' ? 'Post' : 'Post · draft',
      keywords: ['post', 'writing', 'article', 'blog'],
      icon: BookOpen,
      searchOnly: true,
      run: jump('writing', 'post', p.id),
    })),
    ...profile.testimonials.map((t): Command => ({
      id: `item:testimonial:${t.id}`,
      group: 'Jump to',
      title: t.authorName,
      subtitle: `Testimonial · ${snippet(t.message)}`,
      keywords: ['testimonial', 'review', 'quote', t.message],
      icon: MessageSquareQuote,
      searchOnly: true,
      run: async () => {
        await go('/dashboard/testimonials');
        // Only an approved one has an editor of its own; the others are cards on the same page.
        if (t.status === 'approved') requestJump('testimonial', t.id);
      },
    })),
  ];
};

// ---- Help

const help: Source = ({ showShortcuts }) => [
  {
    id: 'help:shortcuts',
    group: 'Help',
    title: 'Show keyboard shortcuts',
    keywords: ['keys', 'hotkeys', 'help', 'shortcuts', 'keyboard'],
    icon: Keyboard,
    keepOpen: true,
    run: showShortcuts,
  },
];

// The order here is the order within a group.
const SOURCES: Source[] = [goTo, actions, themes, accents, items, help];

export const buildCommands = (ctx: PaletteContext): Command[] =>
  SOURCES.flatMap((source) => source(ctx));
