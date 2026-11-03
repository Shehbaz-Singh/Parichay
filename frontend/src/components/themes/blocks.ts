import {
  FEATURED_PROJECTS_MAX,
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
  slug: string; // the project's own page (/work/<slug>)
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

// What the contact form needs. The owner's address is not part of it: a message goes to the API.
export interface ContactFormModel {
  slug: string;
  locale: string;
  ui: Ui['contactForm'];
  ownerName: string;
  intro: string; // the owner's line, or the default one
  days: number; // how long a message is kept
  pageHref: string; // the form on a page of its own, for visitors without JavaScript
  homeHref: string; // the portfolio page in this language
  privacyHref: string;
}

// Where a block leads on: "View all projects" on the short home page of a heavy profile.
export interface MoreLink {
  href: string;
  label: string;
}

interface BlockBase {
  moreLink?: MoreLink; // a way on to the rest, drawn under the block
  locale: string; // the language of the page
  ui: Ui; // the interface text in that language
  id: string; // unique on the page, for aria-labelledby and anchors
  title: string; // the owner's heading, or the default one
}

export type Block =
  | (BlockBase & { kind: 'about'; text: string })
  | (BlockBase & {
      kind: 'skills';
      skills: { id: string; name: string }[];
      rest: { id: string; name: string }[]; // behind "more"
    })
  | (BlockBase & {
      kind: 'writing';
      posts: WritingEntry[]; // the latest few
      more: boolean; // there are more than these, so link to all of them
      allHref: string; // the page with every post
    })
  | (BlockBase & {
      kind: 'projects';
      projects: ProjectEntry[]; // the lead: the featured ones, or the first few of a long list
      rest: ProjectEntry[]; // behind "more projects"
    })
  | (BlockBase & { kind: 'contact'; form: ContactFormModel })
  | (BlockBase & {
      kind: 'testimonials';
      testimonials: TestimonialEntry[];
      rest: TestimonialEntry[]; // behind "more"
      // Set when visitors may leave one: the slug the form posts to.
      submitTo: string | null;
    })
  | (BlockBase & {
      kind: 'entries';
      // experience and education show "Present" for an open end date; custom items show nothing
      variant: 'experience' | 'education' | 'custom';
      entries: Entry[];
      rest: Entry[]; // experience only: the earlier entries, behind "Earlier roles"
      // experience only: all the jobs together, "6 years 2 months" (set from two jobs on)
      total?: string;
    });

// How much of a long list a visitor is shown before the rest goes behind a button. Short lists are
// shown whole. The rest is still in the page (see Collapse.tsx), so nothing is lost.
export const SHOW = { projects: 4, jobs: 4, skills: 12, testimonials: 6 } as const;

// The first `count` items, and the others. A list only a little longer than `count` is not split:
// a button for one or two items is worse than showing them.
function curate<T>(items: T[], count: number): { shown: T[]; rest: T[] } {
  if (items.length <= count + 1) return { shown: items, rest: [] };
  return { shown: items.slice(0, count), rest: items.slice(count) };
}

// ---- one page, or several
// A profile with a lot on it is split: a short home page, and a page for the work and one for the rest
// of the story. A light one stays a single page, with nothing to click through. "A lot" is any of
// these, counted among the sections the owner shows.
export const SPLIT_AT = { projects: 6, jobs: 5, skills: 12 } as const;

// What a page of the portfolio shows. 'all' is the single page; the other three exist only when the
// profile is split.
export type ThemeView = 'all' | 'home' | 'work' | 'about';

export interface PageSplit {
  split: boolean;
  work: boolean; // there is a work page
  about: boolean; // there is an about page
  writing: boolean; // the Writing section is shown and has posts (it has had its own page all along)
}

export function pageSplit(profile: PublicProfile): PageSplit {
  const shows = (key: string) => profile.sections.some((section) => section.key === key);
  const split =
    (shows('projects') && profile.projects.length > SPLIT_AT.projects) ||
    (shows('experience') && profile.experience.length > SPLIT_AT.jobs) ||
    (shows('skills') && profile.skills.length > SPLIT_AT.skills);
  const hasAbout =
    (shows('about') && !!profile.about) ||
    (shows('experience') && profile.experience.length > 0) ||
    (shows('education') && profile.education.length > 0) ||
    (shows('skills') && profile.skills.length > 0) ||
    (shows('testimonials') && (profile.testimonials.length > 0 || profile.acceptTestimonials)) ||
    profile.sections.some(
      ({ key }) =>
        isCustomKey(key) &&
        profile.customSections.some(
          (custom) => custom.id === customIdOf(key) && custom.items.length > 0,
        ),
    );
  return {
    split,
    work: split && shows('projects') && profile.projects.length > 0,
    about: split && hasAbout,
    writing: shows('writing') && profile.writing.length > 0,
  };
}

// The short version of an About text for the home page: whole paragraphs up to about this long (a
// single long paragraph is cut at a sentence, or failing that a word).
const BRIEF = 480;
function brief(text: string): { text: string; cut: boolean } {
  if (text.length <= BRIEF) return { text, cut: false };
  const paragraphs = text.split(/\n\s*\n/);
  let out = paragraphs[0];
  for (const next of paragraphs.slice(1)) {
    if (out.length + next.length > BRIEF) break;
    out += `\n\n${next}`;
  }
  if (out.length > BRIEF) {
    const window = out.slice(0, BRIEF);
    const sentence = Math.max(
      window.lastIndexOf('. '),
      window.lastIndexOf('! '),
      window.lastIndexOf('? '),
    );
    out =
      sentence > BRIEF / 2
        ? window.slice(0, sentence + 1)
        : `${window.slice(0, window.lastIndexOf(' '))}…`;
  }
  return { text: out, cut: out.length < text.length };
}

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
// employer: the company once, then each position under it. A single job reads the same way: the
// company first, the position below it. Only neighbours are joined, so the
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
        title: job.company,
        subtitle: job.title,
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

// The projects at the top of the page. The owner's featured ones lead (their order kept); with none
// featured, a long list leads with its first few (projects have no date, so the owner's order is
// the "most recent" they chose). A list that is short anyway is shown whole.
function leadProjects(items: { featured: boolean; entry: ProjectEntry }[], all: boolean) {
  if (all) return { projects: items.map((item) => item.entry), rest: [] };
  const featured = items.filter((item) => item.featured).slice(0, FEATURED_PROJECTS_MAX);
  if (featured.length > 0) {
    const rest = items.filter((item) => !featured.includes(item)).map((item) => item.entry);
    return { projects: featured.map((item) => item.entry), rest };
  }
  const { shown, rest } = curate(
    items.map((item) => item.entry),
    SHOW.projects,
  );
  return { projects: shown, rest };
}

// Which sections a page of a split profile draws. The single page draws them all.
const ON_PAGE: Record<Exclude<ThemeView, 'all'>, readonly string[]> = {
  home: ['about', 'projects', 'writing', 'contact'],
  work: ['projects'],
  about: ['about', 'experience', 'education', 'skills', 'testimonials'],
};
function onPage(view: ThemeView | 'complete', key: string): boolean {
  if (view === 'all' || view === 'complete') return true;
  if (isCustomKey(key)) return view === 'about';
  return ON_PAGE[view].includes(key);
}

const isBuiltIn = (key: string): key is SectionKey => Object.hasOwn(SECTION_LABELS, key);

export function buildContactForm(
  profile: Pick<PublicProfile, 'slug' | 'locale' | 'defaultLocale' | 'fullName'>,
  intro: string | null,
  days: number,
): ContactFormModel {
  const ui = uiFor(profile.locale).contactForm;
  const name = profile.fullName;
  return {
    slug: profile.slug,
    locale: profile.locale,
    ui,
    ownerName: name,
    intro: intro?.trim() || fill(ui.intro, { name }),
    days,
    pageHref: `/${profile.slug}/contact${profile.locale === profile.defaultLocale ? '' : `?lang=${profile.locale}`}`,
    homeHref: pagePath(profile.slug, profile.locale, profile.defaultLocale),
    privacyHref: '/privacy',
  };
}

// The sections to draw, in the configured order. Hidden sections are not in profile.sections, and
// a section with no content is left out here even when it is switched on. A key this code does not
// know (a section added later) is skipped, so an older page never breaks.
// `idPrefix` keeps ids unique when a page draws the same profile more than once (the editor's
// theme picker shows each theme in a small card next to the live preview).
export function buildBlocks(
  profile: PublicProfile,
  idPrefix = '',
  requested: ThemeView | 'complete' = 'all', // 'complete': everything, uncut (the resume PDF)
  projectId?: string, // with 'work': just this project
): Block[] {
  const blocks: Block[] = [];
  const { locale } = profile;
  const pages = pageSplit(profile);
  // Only a split profile has more than one page.
  const view: ThemeView | 'complete' =
    requested === 'complete' ? 'complete' : pages.split || projectId ? requested : 'all';
  // The work and about pages show everything, uncut; the home page and the single page are curated.
  const full = view === 'work' || view === 'about' || view === 'complete';
  const cut: typeof curate = full ? (items) => ({ shown: items, rest: [] }) : curate;
  const root = pagePath(profile.slug, locale, profile.defaultLocale);
  const ui = uiFor(locale);
  const t = translatorFor(locale);
  const fmt: DateFmt = { locale, present: ui.present };

  for (const { key, title } of profile.sections) {
    if (!onPage(view, key)) continue;
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
        rest: [],
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
        if (profile.about) {
          if (view === 'home' && pages.about) {
            blocks.push({
              kind: 'about',
              ...base,
              text: brief(profile.about).text,
              moreLink: { href: `${root}/about`, label: ui.density.moreAbout },
            });
          } else blocks.push({ kind: 'about', ...base, text: profile.about });
        }
        break;
      case 'skills':
        if (profile.skills.length > 0) {
          blocks.push({
            kind: 'skills',
            ...base,
            ...(() => {
              const { shown, rest } = cut(
                profile.skills.map(({ id, name }) => ({ id, name })),
                SHOW.skills,
              );
              return { skills: shown, rest };
            })(),
          });
        }
        break;
      case 'experience':
        if (profile.experience.length > 0) {
          blocks.push({
            kind: 'entries',
            variant: 'experience',
            ...base,
            ...(() => {
              const { shown, rest } = cut(groupJobs(profile.experience, fmt, t), SHOW.jobs);
              return { entries: shown, rest };
            })(),
            total:
              profile.experience.length > 1 ? totalExperience(profile.experience, t) : undefined,
          });
        }
        break;
      case 'projects': {
        const projects = projectId
          ? profile.projects.filter((project) => project.id === projectId)
          : profile.projects;
        if (projects.length > 0) {
          blocks.push({
            kind: 'projects',
            ...base,
            ...leadProjects(
              projects.map((project) => ({
                featured: project.featured,
                entry: {
                  id: project.id,
                  slug: project.slug,
                  name: project.name,
                  href: safeHttpUrl(project.url),
                  description: project.description,
                  tags: project.techTags,
                },
              })),
              full,
            ),
            ...(view === 'home' && pages.work ? { rest: [] } : {}),
            ...(view === 'home' && pages.work && profile.projects.length > SHOW.projects
              ? { moreLink: { href: `${root}/work`, label: ui.density.viewAllProjects } }
              : {}),
          });
        }
        break;
      }
      case 'testimonials':
        // Shown when there is something to read, or when it invites visitors to write one.
        if (profile.testimonials.length > 0 || profile.acceptTestimonials) {
          blocks.push({
            kind: 'testimonials',
            ...base,
            ...(() => {
              const { shown, rest } = cut(
                profile.testimonials.map((item) => ({
                  id: item.id,
                  name: item.authorName,
                  detail: [item.authorRole, item.authorCompany].filter(Boolean).join(', ') || null,
                  message: item.message,
                })),
                SHOW.testimonials,
              );
              return { testimonials: shown, rest };
            })(),
            submitTo: profile.acceptTestimonials ? profile.slug : null,
          });
        }
        break;
      case 'contact':
        if (profile.contactForm) {
          blocks.push({
            kind: 'contact',
            ...base,
            form: buildContactForm(
              profile,
              profile.contactForm.intro,
              profile.contactForm.retentionDays,
            ),
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
            rest: [],
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
          // With the contact form on, "Get in touch" opens it (its own page, which also works
          // without JavaScript); otherwise it is the best link the owner shows.
          contact: profile.contactForm
            ? {
                href: buildContactForm(profile, null, 0).pageHref,
                label: ui.sections.contact,
                external: false,
              }
            : contactTarget(profile.links),
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
