import type { PublicPage, PublicProfile } from '@parichay/shared';
import { Breadcrumbs, projectTrail, type Crumb } from '@/components/portfolio/page-leads';
import { SITE_URL } from '@/lib/config';
import { safeHttpUrl } from '@/lib/format';
import { pagePath, uiFor } from '@/lib/i18n';
import { findPage, pageHref, pageLabel } from '@/lib/pages';
import {
  buildBlocks,
  buildContactForm,
  buildHeader,
  type Block,
  type ContactFormModel,
  type HeaderModel,
  type ProjectEntry,
  type WorkModel,
} from '../blocks';
import type { ContactPageState } from '../ContactForm';

// The pages of a multi-page portfolio, as plain data. Each theme draws them in its own templates (a Home,
// a Work page, a project, About, Contact and a page the owner made are laid out differently in each
// theme), but the choices of WHAT is on them are made here once: what Home leads with, which project
// comes first, what the facts of the About page are. A template never looks at the raw profile for these;
// it takes the model, and draws sections that have no template of their own (jobs, education, a custom
// section) through the theme's own block renderer, which `blocks` carries.

export { Breadcrumbs };
export type { Crumb };

// ---- Home: a short, confident page

export interface HomeModel {
  kind: 'home';
  header: HeaderModel; // the introduction: name, line, photo, availability, links, working-together card
  featured: ProjectEntry[]; // the owner's featured projects (3 to 4), or the first few
  projectTotal: number;
  work: { href: string; label: string } | null; // the Work page, when it has more than is shown here
  aboutTitle: string;
  about: { text: string; href: string | null; label: string } | null; // the short About, and the way to the rest
  skills: string[]; // the first ten
  skillsTotal: number;
  now: { role: string; company: string; since: string; open: boolean } | null; // the latest job
  testimonial: { message: string; name: string; detail: string | null } | null; // one pull quote
  writing: Extract<Block, { kind: 'writing' }> | null; // only when Writing has no page of its own
  cta: { title: string; text: string; href: string; label: string } | null; // the Contact page, when there is one
  contact: Extract<Block, { kind: 'contact' }> | null; // the form itself, when there is no Contact page
}

// Home is a short page: an introduction, a few projects, a line about the person and a way to get in
// touch. The rest (skills, the latest job, quotes, posts) lives on the pages that have room for it, so
// those parts of the model are left empty here. A template draws only what it is given.
const HOME_PROJECTS = 3;
const HOME_ABOUT = 260;

// The start of a text, up to a sentence end (or a word) near `max` characters.
function excerpt(text: string, max: number): string {
  const flat = text.split(/\s+/).join(' ').trim();
  if (flat.length <= max) return flat;
  const window = flat.slice(0, max);
  const sentence = Math.max(
    window.lastIndexOf('. '),
    window.lastIndexOf('! '),
    window.lastIndexOf('? '),
  );
  return sentence > max / 2
    ? window.slice(0, sentence + 1)
    : `${window.slice(0, window.lastIndexOf(' '))}…`;
}

function homeModel(profile: PublicProfile, page: PublicPage): HomeModel {
  const blocks = buildBlocks(profile, '', page);
  const find = <K extends Block['kind']>(kind: K) =>
    blocks.find((block): block is Extract<Block, { kind: K }> => block.kind === kind) ?? null;
  const ui = uiFor(profile.locale);
  const projects = find('projects');
  const about = find('about');
  const cta = find('cta');
  const workPage = findPage(profile, 'work');
  const aboutPage = findPage(profile, 'about');

  // The current job (or the latest), one line: the rest of the experience is on the Work page.
  const job =
    profile.experience.find((item) => !item.endDate) ??
    [...profile.experience].sort((a, b) => b.startDate.localeCompare(a.startDate))[0];
  return {
    kind: 'home',
    header: buildHeader(profile),
    featured: (projects?.projects ?? []).slice(0, HOME_PROJECTS),
    projectTotal: projects?.total ?? 0,
    work:
      workPage && projects && projects.total > projects.projects.length
        ? { href: pageHref(profile, workPage), label: pageLabel(profile, workPage) }
        : null,
    aboutTitle: about?.title ?? ui.sections.about,
    about: about
      ? {
          text: excerpt(about.text, HOME_ABOUT),
          href: aboutPage ? pageHref(profile, aboutPage) : null,
          label: ui.density.moreAbout,
        }
      : null,
    skills: [],
    skillsTotal: profile.skills.length,
    now: job
      ? { role: job.title, company: job.company, since: job.startDate, open: !job.endDate }
      : null,
    testimonial: null,
    writing: null,
    cta: cta ? { title: cta.title, text: cta.text, href: cta.href, label: cta.label } : null,
    contact: find('contact'),
  };
}

// ---- Work: every project

export interface WorkPageModel {
  kind: 'work';
  title: string;
  header: HeaderModel;
  intro: string | null; // the owner's line
  projects: ProjectEntry[]; // all of them, the owner's order; the first leads
  // The other sections on the Work page, after the projects: normally the jobs (experience), drawn by the
  // theme's own block renderer (`renderBlock`, inside its `Section`).
  blocks: Block[];
  // The sections the owner put BEFORE the projects on this page (Pages screen order); drawn above them.
  before: Block[];
  tags: { name: string; count: number }[]; // the technologies across the projects, most used first
}

function workModel(profile: PublicProfile, page: PublicPage): WorkPageModel {
  const all = buildBlocks(profile, '', page);
  const projects =
    all.find((block): block is Extract<Block, { kind: 'projects' }> => block.kind === 'projects')
      ?.projects ?? [];
  const counts = new Map<string, number>();
  for (const project of projects) {
    for (const tag of project.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1);
  }
  return {
    kind: 'work',
    title: pageLabel(profile, page),
    header: buildHeader(profile),
    intro: null,
    projects,
    blocks: all.slice(all.findIndex((block) => block.kind === 'projects') + 1),
    before: all.slice(
      0,
      Math.max(
        0,
        all.findIndex((block) => block.kind === 'projects'),
      ),
    ),
    tags: [...counts]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
      .slice(0, 0),
  };
}

// ---- a project (a page of its own, in either mode)

export interface ProjectImageModel {
  id: string;
  src: string;
  alt: string;
  width: number;
  height: number;
}

export interface ProjectNeighbour {
  name: string;
  href: string;
  cover: ProjectEntry['cover'];
}

export interface ProjectPageModel {
  kind: 'project';
  id: string;
  name: string;
  description: string;
  tags: string[];
  external: string | null; // the project elsewhere (checked to be http(s))
  cover: ProjectEntry['cover'];
  gallery: ProjectImageModel[];
  previous: ProjectNeighbour | null;
  next: ProjectNeighbour | null;
  position: number; // 1-based, among all the projects
  total: number;
  crumbs: Crumb[];
  back: { label: string; href: string };
  share: { url: string; title: string; message: string | null; subject: string };
  header: HeaderModel;
}

type Project = PublicProfile['projects'][number];

function projectModel(profile: PublicProfile, project: Project): ProjectPageModel {
  const ui = uiFor(profile.locale);
  const { home, back, crumbs } = projectTrail(profile, project);
  const header = buildHeader(profile);
  const at = profile.projects.findIndex((item) => item.id === project.id);
  const cover = (item: Project): ProjectEntry['cover'] =>
    item.coverUrl && item.coverWidth && item.coverHeight
      ? {
          src: item.coverUrl,
          alt: item.coverAlt ?? '',
          width: item.coverWidth,
          height: item.coverHeight,
        }
      : null;
  const neighbour = (item: Project | undefined): ProjectNeighbour | null =>
    item ? { name: item.name, href: `${home}/work/${item.slug}`, cover: cover(item) } : null;
  return {
    kind: 'project',
    id: project.id,
    name: project.name,
    description: project.description,
    tags: project.techTags,
    external: safeHttpUrl(project.url),
    cover: cover(project),
    gallery: project.images.flatMap((image, index) =>
      safeHttpUrl(image.url)
        ? [
            {
              id: image.id,
              src: image.url,
              alt:
                image.alt ||
                ui.pages.galleryImage
                  .replace('{name}', project.name)
                  .replace('{n}', String(index + 1)),
              width: image.width,
              height: image.height,
            },
          ]
        : [],
    ),
    previous: neighbour(profile.projects[at - 1]),
    next: neighbour(profile.projects[at + 1]),
    position: at + 1,
    total: profile.projects.length,
    crumbs,
    back,
    share: {
      url: `${SITE_URL}${home}/work/${project.slug}`,
      title: project.name,
      message: header.share.message,
      subject: `${project.name} - ${profile.fullName}`,
    },
    header,
  };
}

// ---- About

export interface AboutPageModel {
  kind: 'about';
  title: string;
  header: HeaderModel;
  text: string | null; // the owner's About text
  facts: { label: string; value: string }[]; // location, total experience, availability, languages
  resume: HeaderModel['resume'];
  // The other sections on this page (jobs, education, skills, testimonials, custom sections), drawn by
  // the theme's own block renderer.
  blocks: Block[];
}

function aboutModel(profile: PublicProfile, page: PublicPage): AboutPageModel {
  const ui = uiFor(profile.locale);
  const header = buildHeader(profile);
  const blocks = buildBlocks(profile, '', page);
  const experience = blocks.find(
    (block): block is Extract<Block, { kind: 'entries' }> =>
      block.kind === 'entries' && block.variant === 'experience',
  );
  const facts: { label: string; value: string }[] = [];
  if (header.location) facts.push({ label: ui.pages.factLocation, value: header.location });
  if (experience?.total) facts.push({ label: ui.pages.factExperience, value: experience.total });
  return {
    kind: 'about',
    title: pageLabel(profile, page),
    header,
    text:
      blocks.find((block): block is Extract<Block, { kind: 'about' }> => block.kind === 'about')
        ?.text ?? null,
    facts,
    resume: header.resume,
    blocks: blocks.filter((block) => block.kind !== 'about'),
  };
}

// ---- Contact

export interface ContactPageModel {
  kind: 'contact';
  title: string;
  header: HeaderModel; // links, availability (its own "get in touch" link removed), resume
  work: WorkModel | null;
  form: ContactFormModel | null;
  state: ContactPageState | null; // the live form: its signed time stamp and the outcome of a post
  intro: string; // the owner's line above the form
}

function contactModel(
  profile: PublicProfile,
  page: PublicPage,
  state: ContactPageState | null,
): ContactPageModel {
  const header = buildHeader(profile);
  const form = profile.contactForm
    ? buildContactForm(profile, profile.contactForm.intro, profile.contactForm.retentionDays)
    : null;
  return {
    kind: 'contact',
    title: pageLabel(profile, page),
    // The badge's "Get in touch" would link to this very page.
    header: {
      ...header,
      availability: header.availability && { ...header.availability, contact: null },
    },
    work: null,
    form,
    state,
    intro: form?.intro ?? '',
  };
}

// ---- a page the owner made

export interface CustomPageModel {
  kind: 'custom';
  title: string;
  body: string | null; // plain text or limited Markdown (components/Markdown.tsx)
  header: HeaderModel;
  blocks: Block[]; // the sections the owner put on it
}

function customModel(profile: PublicProfile, page: PublicPage): CustomPageModel {
  return {
    kind: 'custom',
    title: pageLabel(profile, page),
    body: page.body ?? null,
    header: buildHeader(profile),
    blocks: buildBlocks(profile, '', page),
  };
}

export type PageView =
  | HomeModel
  | WorkPageModel
  | ProjectPageModel
  | AboutPageModel
  | ContactPageModel
  | CustomPageModel;

// What a multi-page theme draws for the props it was given, or null when it draws the single page as it
// always did (single mode without a project, and the Writing pages, which have their own frame).
export function pageView(
  profile: PublicProfile,
  options: { page?: PublicPage; project?: Project; contact?: ContactPageState | null },
): PageView | null {
  if (options.project) return projectModel(profile, options.project);
  const { page } = options;
  if (!page || profile.layoutMode !== 'multi') return null;
  if (page.key === 'home') return homeModel(profile, page);
  if (page.key === 'work') return workModel(profile, page);
  if (page.key === 'about') return aboutModel(profile, page);
  if (page.key === 'contact') return contactModel(profile, page, options.contact ?? null);
  if (page.key.startsWith('page:')) return customModel(profile, page);
  return null;
}

export const rootOf = (profile: PublicProfile) =>
  pagePath(profile.slug, profile.locale, profile.defaultLocale);
