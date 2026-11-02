import {
  SECTION_LABELS,
  closedWeek,
  customIdOf,
  isCustomKey,
  type PublicLink,
  type PublicPostSummary,
  type PublicProfile,
  type SectionKey,
  type WorkingHours,
} from '@parichay/shared';
import { SITE_URL } from '@/lib/config';
import { contactTarget, initials, linkTarget, safeHttpUrl } from '@/lib/format';
import { fill, pagePath, translatorFor, uiFor, type Ui } from '@/lib/i18n';

// Everything a theme needs from a profile, worked out in one place. A theme never looks at the
// raw section list, the custom sections, empty content or URL safety: it draws the header and
// the blocks it is given, with its own layout and styling. So the rules (order, hidden sections,
// custom sections, empty sections skipped, only http(s) links) are the same in every theme.

// One entry of a dated list: a job, a degree, or an item of a custom section.
// One position within a company the person stayed at (see groupJobs).
// How a date is written: the language, and the word for an open end date.
export interface DateFmt {
  locale: string;
  present: string;
}

export interface Role {
  id: string;
  fmt: DateFmt;
  title: string;
  start: string | null;
  end: string | null;
  description: string | null;
}

export interface Entry {
  id: string;
  fmt: DateFmt;
  // Set when several jobs in a row were at the same company. The entry is then the company (title),
  // with the whole stay as its dates, and the jobs listed here. Subtitle and description are empty.
  roles?: Role[];
  duration?: string; // the whole stay, "6 years 9 months", for every company
  title: string;
  subtitle: string | null;
  start: string | null; // ISO date
  end: string | null;
  href: string | null; // checked to be http(s)
  description: string | null;
}

interface ProjectEntry {
  id: string;
  name: string;
  href: string | null;
  description: string;
  tags: string[];
}

interface TestimonialEntry {
  id: string;
  name: string;
  detail: string | null; // "Engineering Manager, Acme": whichever of role and company there is
  message: string;
}

// One post or article in the Writing section. A post written here opens its own page; a link to an
// article elsewhere goes straight to it.
export interface WritingEntry {
  id: string;
  title: string;
  excerpt: string | null;
  date: string; // ISO
  href: string;
  external: boolean;
  cover: string | null; // checked to be http(s)
}

interface BlockBase {
  locale: string; // the language of the page
  ui: Ui; // the interface text in that language
  id: string; // unique on the page, for aria-labelledby and anchors
  title: string; // the owner's heading, or the default one
}

export type Block =
  | (BlockBase & { kind: 'about'; text: string })
  | (BlockBase & { kind: 'skills'; skills: { id: string; name: string }[] })
  | (BlockBase & {
      kind: 'writing';
      posts: WritingEntry[]; // the latest few
      more: boolean; // there are more than these, so link to all of them
      allHref: string; // the page with every post
    })
  | (BlockBase & { kind: 'projects'; projects: ProjectEntry[] })
  | (BlockBase & {
      kind: 'testimonials';
      testimonials: TestimonialEntry[];
      // Set when visitors may leave one: the slug the form posts to.
      submitTo: string | null;
    })
  | (BlockBase & {
      kind: 'entries';
      // experience and education show "Present" for an open end date; custom items show nothing
      variant: 'experience' | 'education' | 'custom';
      entries: Entry[];
      // experience only: all the jobs together, "6 years 2 months" (set from two jobs on)
      total?: string;
    });

// Whole months from start to end (or to now, for an open job), counting both months, the way
// LinkedIn does: Jan 2020 to Dec 2020 is 12 months.
function stay(start: string | null, end: string | null, t: Translator): string | undefined {
  if (!start) return undefined;
  const from = new Date(start);
  const to = end ? new Date(end) : new Date();
  return formatMonths(monthIndex(to) - monthIndex(from) + 1, t);
}

const monthIndex = (date: Date) => date.getUTCFullYear() * 12 + date.getUTCMonth();

type Translator = ReturnType<typeof translatorFor>;

function formatMonths(months: number, t: Translator): string | undefined {
  if (!(months > 0)) return undefined;
  const years = Math.floor(months / 12);
  const rest = months % 12;
  return [years > 0 && t('years', { count: years }), rest > 0 && t('months', { count: rest })]
    .filter(Boolean)
    .join(' ');
}

// All the jobs together. Months worked at two jobs at once count once, so overlapping or back-to-back
// jobs add up to the time actually spent working.
function totalExperience(jobs: PublicProfile['experience'], t: Translator): string | undefined {
  const now = monthIndex(new Date());
  const spans = jobs
    .filter((job) => job.startDate)
    .map((job) => [
      monthIndex(new Date(job.startDate as string)),
      job.endDate ? monthIndex(new Date(job.endDate)) : now,
    ])
    .sort((a, b) => a[0] - b[0]);
  let months = 0;
  let reached = -Infinity; // the last month already counted
  for (const [from, to] of spans) {
    const begin = Math.max(from, reached + 1);
    if (to >= begin) months += to - begin + 1;
    reached = Math.max(reached, to);
  }
  return formatMonths(months, t);
}

const sameCompany = (a: string, b: string) =>
  a.trim().replace(/\s+/g, ' ').toLowerCase() === b.trim().replace(/\s+/g, ' ').toLowerCase();

// Jobs in a row at the same company become one entry, the way LinkedIn shows a career at one
// employer: the company once, then each position under it. Only neighbours are joined, so the
// owner's order is kept (a return to a company later stays a separate entry). A stay is open-ended
// if any of its jobs is; otherwise it ends with the latest end.
function groupJobs(jobs: PublicProfile['experience'], fmt: DateFmt, t: Translator): Entry[] {
  const groups: PublicProfile['experience'][] = [];
  for (const job of jobs) {
    const last = groups.at(-1);
    if (last && sameCompany(last[0].company, job.company)) last.push(job);
    else groups.push([job]);
  }
  return groups.map((group): Entry => {
    if (group.length === 1) {
      const [job] = group;
      return {
        id: job.id,
        fmt,
        title: job.title,
        subtitle: job.company,
        start: job.startDate,
        end: job.endDate,
        duration: stay(job.startDate, job.endDate, t),
        href: null,
        description: job.description || null,
      };
    }
    const starts = group.map((job) => job.startDate).filter((d): d is string => !!d);
    const ends = group.map((job) => job.endDate).filter((d): d is string => !!d);
    const start = starts.length > 0 ? starts.reduce((a, b) => (a < b ? a : b)) : null;
    const end = ends.length < group.length ? null : ends.reduce((a, b) => (a > b ? a : b));
    return {
      id: group[0].id,
      fmt,
      duration: stay(start, end, t),
      title: group[0].company,
      subtitle: null,
      start,
      end,
      href: null,
      description: null,
      roles: group.map((job) => ({
        id: job.id,
        fmt,
        title: job.title,
        start: job.startDate,
        end: job.endDate,
        description: job.description || null,
      })),
    };
  });
}

// Published posts as entries to draw. A link to an article that cannot be shown safely (not http or
// https) is left out. Used by the page's Writing section and by the Writing list page.
export function writingEntries(
  slug: string,
  posts: PublicPostSummary[],
  base = `/${slug}`,
): WritingEntry[] {
  return posts.flatMap((post): WritingEntry[] => {
    const href =
      post.type === 'link' ? safeHttpUrl(post.externalUrl) : `${base}/writing/${post.slug}`;
    if (!href) return [];
    return [
      {
        id: post.id,
        title: post.title,
        excerpt: post.excerpt,
        date: post.publishedAt,
        href,
        external: post.type === 'link',
        cover: safeHttpUrl(post.coverImageUrl),
      },
    ];
  });
}

const isBuiltIn = (key: string): key is SectionKey => Object.hasOwn(SECTION_LABELS, key);

// The sections to draw, in the configured order. Hidden sections are not in profile.sections, and
// a section with no content is left out here even when it is switched on. A key this code does not
// know (a section added later) is skipped, so an older page never breaks.
// `idPrefix` keeps ids unique when a page draws the same profile more than once (the editor's
// theme picker shows each theme in a small card next to the live preview).
export function buildBlocks(profile: PublicProfile, idPrefix = ''): Block[] {
  const blocks: Block[] = [];
  const { locale } = profile;
  const ui = uiFor(locale);
  const t = translatorFor(locale);
  const fmt: DateFmt = { locale, present: ui.present };

  for (const { key, title } of profile.sections) {
    if (isCustomKey(key)) {
      const section = profile.customSections.find((s) => s.id === customIdOf(key));
      if (!section || section.items.length === 0) continue;
      blocks.push({
        kind: 'entries',
        variant: 'custom',
        id: `${idPrefix}custom-${section.id}`,
        locale,
        ui,
        title: section.title,
        entries: section.items.map((item) => ({
          id: item.id,
          fmt,
          title: item.title,
          subtitle: item.subtitle,
          start: item.startDate,
          end: item.endDate,
          href: safeHttpUrl(item.url),
          description: item.description,
        })),
      });
      continue;
    }
    if (!isBuiltIn(key)) continue;

    const base = { id: idPrefix + key, locale, ui, title: title ?? ui.sections[key] };
    switch (key) {
      case 'about':
        if (profile.about) blocks.push({ kind: 'about', ...base, text: profile.about });
        break;
      case 'skills':
        if (profile.skills.length > 0) {
          blocks.push({
            kind: 'skills',
            ...base,
            skills: profile.skills.map(({ id, name }) => ({ id, name })),
          });
        }
        break;
      case 'experience':
        if (profile.experience.length > 0) {
          blocks.push({
            kind: 'entries',
            variant: 'experience',
            ...base,
            entries: groupJobs(profile.experience, fmt, t),
            total:
              profile.experience.length > 1 ? totalExperience(profile.experience, t) : undefined,
          });
        }
        break;
      case 'projects':
        if (profile.projects.length > 0) {
          blocks.push({
            kind: 'projects',
            ...base,
            projects: profile.projects.map((project) => ({
              id: project.id,
              name: project.name,
              href: safeHttpUrl(project.url),
              description: project.description,
              tags: project.techTags,
            })),
          });
        }
        break;
      case 'testimonials':
        // Shown when there is something to read, or when it invites visitors to write one.
        if (profile.testimonials.length > 0 || profile.acceptTestimonials) {
          blocks.push({
            kind: 'testimonials',
            ...base,
            testimonials: profile.testimonials.map((item) => ({
              id: item.id,
              name: item.authorName,
              detail: [item.authorRole, item.authorCompany].filter(Boolean).join(', ') || null,
              message: item.message,
            })),
            submitTo: profile.acceptTestimonials ? profile.slug : null,
          });
        }
        break;
      case 'writing': {
        const root = pagePath(profile.slug, locale, profile.defaultLocale);
        const posts = writingEntries(profile.slug, profile.writing, root);
        if (posts.length > 0) {
          blocks.push({
            kind: 'writing',
            ...base,
            posts,
            more: profile.writingMore,
            allHref: `${root}/writing`,
          });
        }
        break;
      }
      case 'education':
        if (profile.education.length > 0) {
          blocks.push({
            kind: 'entries',
            variant: 'education',
            ...base,
            entries: profile.education.map((item) => ({
              id: item.id,
              fmt,
              title: item.degree,
              subtitle: item.institution,
              start: item.startDate,
              end: item.endDate,
              href: null,
              description: null,
            })),
          });
        }
        break;
    }
  }
  return blocks;
}

// The "Working together" card, ready to draw. null while it is switched off (or has no time zone).
export interface WorkModel {
  locale: string;
  ui: Ui;
  name: string; // the owner's first name, for "It's 3:42 pm for Ayush"
  timezone: string;
  hours: WorkingHours;
  serverNow: string; // the moment this was built: what the server draws, so the browser matches it
  reply: string | null;
  contact: { href: string; label: string; external: boolean } | null;
  note: string | null;
}

// The link the owner prefers to be reached by, among the ones they show.
function workContact(profile: PublicProfile) {
  const targets = profile.links.flatMap((link) => {
    const target = linkTarget(link);
    return target ? [{ type: link.type, target }] : [];
  });
  const wanted = profile.preferredContact;
  if (!wanted) return null;
  if (wanted === 'any_visible_link')
    return contactTarget(profile.links) ?? targets[0]?.target ?? null;
  return targets.find((entry) => entry.type === wanted)?.target ?? null;
}

export function buildWork(profile: PublicProfile): WorkModel | null {
  if (!profile.workCardEnabled || !profile.timezone) return null;
  const ui = uiFor(profile.locale);
  return {
    locale: profile.locale,
    ui,
    name: profile.fullName.trim().split(/\s+/)[0] ?? profile.fullName,
    timezone: profile.timezone,
    hours: profile.workingHours ?? closedWeek(),
    serverNow: new Date().toISOString(),
    reply: profile.replyTime ? ui.work.reply[profile.replyTime] : null,
    contact: workContact(profile),
    note: profile.workNote ?? null,
  };
}

export interface HeaderModel {
  work: WorkModel | null;
  locale: string;
  ui: Ui;
  name: string;
  tagline: string | null;
  location: string | null;
  avatar: { src: string | null; alt: string; initials: string };
  links: { id: string; type: PublicLink['type']; href: string; label: string; external: boolean }[];
  // What the Share menu needs (the message is the owner's own, when they wrote one).
  share: { url: string; title: string; message: string | null; subject: string };
  // The "Add to contacts" vCard link: while the owner has it on and shows at least one link.
  contact: { href: string; label: string; hint: string; help: string } | null;
  // The "Download resume" link, while the owner has it switched on.
  resume: { href: string; label: string } | null;
  // The "open to work" badge: what it says, and the contact option the owner has made visible (an
  // email first, then phone, LinkedIn or website) for its link. null while it is switched off.
  availability: {
    label: string;
    detail: string | null;
    contact: { href: string; label: string; external: boolean } | null;
  } | null;
}

// The top of the page. Links that cannot be shown (an unsafe address) are dropped here.
export function buildHeader(profile: PublicProfile): HeaderModel {
  const ui = uiFor(profile.locale);
  const status = profile.availabilityStatus ?? 'open_to_work';
  const note = profile.availabilityMessage?.trim() || null;
  return {
    work: buildWork(profile),
    locale: profile.locale,
    ui,
    name: profile.fullName,
    tagline: profile.tagline,
    location: profile.location,
    avatar: {
      src: safeHttpUrl(profile.avatarUrl),
      alt: fill(ui.photoOf, { name: profile.fullName }),
      initials: initials(profile.fullName),
    },
    links: profile.links.flatMap((link) => {
      const target = linkTarget(link);
      return target ? [{ id: link.id, type: link.type, ...target }] : [];
    }),
    share: {
      url: `${SITE_URL}${pagePath(profile.slug, profile.locale, profile.defaultLocale)}`,
      title: fill(ui.shareTitle, { name: profile.fullName }),
      message: profile.shareMessage ?? null,
      subject: profile.tagline ? `${profile.fullName} - ${profile.tagline}` : profile.fullName,
    },
    contact:
      profile.contactCardEnabled && !profile.isSample && profile.links.length > 0
        ? {
            href: `/${profile.slug}/contact.vcf${profile.locale === profile.defaultLocale ? '' : `?lang=${profile.locale}`}`,
            label: ui.contact.button,
            hint: ui.contact.hint,
            help: ui.contact.help,
          }
        : null,
    resume: profile.resumeEnabled
      ? { href: `/${profile.slug}/resume.pdf`, label: ui.downloadResume }
      : null,
    availability: profile.availabilityEnabled
      ? {
          ...(status === 'custom'
            ? { label: note ?? ui.availabilityStatus.custom, detail: null }
            : { label: ui.availabilityStatus[status], detail: note }),
          contact: contactTarget(profile.links),
        }
      : null,
  };
}

// The bottom of the page: the owner's name and a line about where the page came from.
export interface FooterModel {
  locale: string;
  ui: Ui;
  name: string;
  year: number;
  message: string;
  cta: { href: string; label: string };
}

export function buildFooter(profile: PublicProfile): FooterModel {
  const ui = uiFor(profile.locale);
  return {
    locale: profile.locale,
    ui,
    name: profile.fullName,
    year: new Date().getFullYear(),
    message: 'with Parichay.',
    cta: { href: '/', label: ui.footerCta },
  };
}
