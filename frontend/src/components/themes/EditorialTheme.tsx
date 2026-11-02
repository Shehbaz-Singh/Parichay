import type { ReactNode } from 'react';
import { Hanken_Grotesk, Newsreader } from 'next/font/google';
import { MapPin } from 'lucide-react';
import { ShareButton } from '../ShareButton';
import {
  buildBlocks,
  buildFooter,
  buildHeader,
  type Block,
  type FooterModel,
  type HeaderModel,
} from './blocks';
import { uiFor } from '@/lib/i18n';
import { ContactForm } from './ContactForm';
import { LeaveTestimonial } from './LeaveTestimonial';
import { WorkCard } from './WorkCard';
import {
  Avatar,
  DateRange,
  EmptyPage,
  AvailabilityBadge,
  HeaderLink,
  ContactLink,
  ResumeLink,
  WritingList,
  NewTabLink,
  RoleList,
  TotalExperience,
} from './parts';
import { Reveal } from './Reveal';
import { ThemeWrapper } from './ThemeWrapper';
import type { ThemeProps } from './types';

// A quiet magazine page on warm paper (.theme-editorial). A narrow reading column; a masthead with a
// large serif name between two rules; the About text opens with a drop cap; section labels are small
// capitals on a thin rule; jobs hang their dates in a left column; projects are text, not cards;
// skills run on as a sentence; testimonials are pull quotes. The accent is used sparingly: links,
// the short rule before a label, the drop cap and the quotation marks.
// Newsreader for display, Hanken Grotesk for text.

// preload is off: every theme's fonts are known to the page bundle, and preloading would fetch all
// of them. Only the faces a page draws are downloaded, when it draws them.
const sans = Hanken_Grotesk({
  subsets: ['latin'],
  display: 'swap',
  fallback: ['var(--font-script, sans-serif)'],
  preload: false,
});
const serif = Newsreader({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  variable: '--font-theme-display',
  display: 'swap',
  fallback: ['var(--font-script, sans-serif)'],
  preload: false,
});

// The class that sets this theme's fonts; the Writing pages use it too.
export const fontClass = `${sans.className} ${serif.variable}`;

const display = 'font-(family-name:--font-theme-display)';
const caps = 'text-xs font-semibold tracking-[0.18em] uppercase';
const focusRing =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-fg';
const link = `ed-underline text-accent-fg ${focusRing}`;

function Section({
  block,
  animate,
  children,
}: {
  block: Block;
  animate: boolean;
  children: ReactNode;
}) {
  // On a wide screen the label sits in a left rail (and stays in view while you read the section)
  // and the content takes the rest, so the page uses the width instead of one narrow column.
  return (
    <Reveal enabled={animate}>
      <section
        aria-labelledby={block.id}
        className="mt-16 sm:mt-24 lg:grid lg:grid-cols-[12rem_minmax(0,1fr)] lg:gap-x-12 xl:grid-cols-[16rem_minmax(0,1fr)] xl:gap-x-20"
      >
        <h2
          id={block.id}
          className={`${caps} mb-8 flex items-center gap-4 lg:sticky lg:top-8 lg:mb-0 lg:flex-col lg:items-start lg:gap-3 lg:self-start`}
        >
          <span aria-hidden="true" className="h-px w-8 shrink-0 bg-accent" />
          <span className="min-w-0">{block.title}</span>
          <span aria-hidden="true" className="h-px min-w-6 flex-1 bg-line lg:hidden" />
        </h2>
        <div className="min-w-0">{children}</div>
      </section>
    </Reveal>
  );
}

function Masthead({ header }: { header: HeaderModel }) {
  return (
    <header className="rise-in text-center lg:text-start">
      <div className="border-y border-ink py-3">
        <p
          className={`${caps} flex items-center justify-center gap-1.5 text-muted lg:justify-start`}
        >
          {header.location ? (
            <>
              <MapPin aria-hidden="true" className="size-3.5 shrink-0" />
              <span>{header.location}</span>
            </>
          ) : (
            <span>{header.ui.portfolio}</span>
          )}
        </p>
      </div>
      <div className="lg:mt-14 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(20rem,28rem)] lg:items-end lg:gap-x-20">
        <div className="min-w-0">
          <Avatar
            avatar={header.avatar}
            className="mx-auto mt-10 size-24 rounded-full lg:mx-0 lg:mt-0 lg:size-28"
            placeholderClassName={`${display} border border-ink text-3xl text-ink`}
          />
          <h1
            className={`${display} mt-8 text-[clamp(2.75rem,10vw,5.5rem)] leading-[1.02] lg:text-[clamp(4rem,7.5vw,11rem)] lg:leading-[0.95] font-medium tracking-tight text-balance`}
          >
            {header.name}
          </h1>
          {header.tagline && (
            <p
              className={`${display} mx-auto mt-5 max-w-xl text-xl leading-snug text-pretty text-muted italic sm:text-2xl lg:mx-0 lg:max-w-3xl lg:text-3xl`}
            >
              {header.tagline}
            </p>
          )}
        </div>
        <div className="min-w-0">
          <AvailabilityBadge
            availability={header.availability}
            ui={header.ui}
            className="mx-auto mt-6 w-fit lg:mx-0 justify-center border border-line px-4 py-2.5 text-start text-sm text-ink"
            dotClassName="bg-accent-fg"
            linkClassName={`text-accent-fg underline underline-offset-2 hover:no-underline ${focusRing}`}
          />
          {header.work && (
            <WorkCard
              work={header.work}
              className="mx-auto mt-4 w-full max-w-sm border border-line px-4 py-3 text-start text-ink lg:mx-0"
              linkClassName={`text-accent-fg underline underline-offset-2 hover:no-underline ${focusRing}`}
              buttonClassName={`text-sm font-medium text-accent-fg underline underline-offset-2 hover:no-underline ${focusRing}`}
            />
          )}
          <ul className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 border-y border-line py-4 text-sm lg:justify-start">
            {header.links.map((item) => (
              <li key={item.id} className="max-w-full">
                <HeaderLink link={item} className={`inline-flex items-center gap-2 ${link}`} />
              </li>
            ))}
            {header.contact && (
              <li className="print:hidden">
                <ContactLink
                  contact={header.contact}
                  className={`inline-flex items-center gap-2 ${link}`}
                />
              </li>
            )}
            {header.resume && (
              <li>
                <ResumeLink
                  resume={header.resume}
                  className={`inline-flex items-center gap-2 ${link}`}
                />
              </li>
            )}
            <li>
              <ShareButton {...header.share} ui={header.ui.share} variant="outline" />
            </li>
          </ul>
        </div>
      </div>
    </header>
  );
}

function BlockView({ block }: { block: Block }) {
  switch (block.kind) {
    case 'about':
      return (
        <p
          className={`${display} max-w-3xl text-xl leading-relaxed whitespace-pre-line xl:max-w-none xl:columns-2 xl:gap-16 first-letter:float-start first-letter:me-3 first-letter:mt-1 first-letter:text-[4.5rem] first-letter:leading-[0.8] first-letter:font-medium first-letter:text-accent-fg sm:text-[1.35rem] sm:leading-[1.7]`}
        >
          {block.text}
        </p>
      );
    case 'skills':
      // Reads as one sentence: the items are inline.
      return (
        <ul className={`${display} max-w-5xl text-xl leading-9`}>
          {block.skills.map((skill) => (
            <li key={skill.id} className="inline after:content-[',_'] last:after:content-['.']">
              {skill.name}
            </li>
          ))}
        </ul>
      );
    case 'projects':
      return (
        <ul className="grid gap-y-12 xl:grid-cols-2 xl:gap-x-14 2xl:grid-cols-3">
          {block.projects.map((project) => (
            <li key={project.id} className="ed-hover group relative min-w-0">
              <h3 className={`${display} text-2xl leading-tight font-medium sm:text-3xl`}>
                {project.href ? (
                  <NewTabLink
                    href={project.href}
                    className={`after:absolute after:inset-0 ${focusRing}`}
                  >
                    <span className="ed-underline">{project.name}</span>
                  </NewTabLink>
                ) : (
                  project.name
                )}
              </h3>
              {project.description && (
                <p className="mt-3 leading-relaxed whitespace-pre-line">{project.description}</p>
              )}
              {project.tags.length > 0 && (
                <p className={`${display} mt-3 text-muted italic`}>{project.tags.join(' · ')}</p>
              )}
            </li>
          ))}
        </ul>
      );
    case 'writing':
      return (
        <WritingList
          block={block}
          className="space-y-12"
          itemClassName="ed-hover group relative min-w-0"
          coverClassName="mb-4 aspect-[40/21] w-full object-cover"
          titleClassName={`${display} text-2xl leading-tight font-medium sm:text-3xl`}
          linkClassName={`after:absolute after:inset-0 ${focusRing}`}
          metaClassName={`${display} mt-2 text-muted italic`}
          excerptClassName="mt-3 leading-relaxed"
          moreClassName={`mt-10 inline-block text-accent-fg underline underline-offset-2 hover:no-underline ${focusRing}`}
        />
      );
    case 'testimonials':
      return (
        <>
          {block.testimonials.length > 0 ? (
            <ul className="grid gap-16 xl:grid-cols-2 xl:gap-x-20">
              {block.testimonials.map((item) => (
                <li key={item.id} className="min-w-0">
                  <figure>
                    <span
                      aria-hidden="true"
                      className={`${display} block h-12 text-8xl leading-[0.9] text-accent-fg`}
                    >
                      “
                    </span>
                    <blockquote
                      className={`${display} text-2xl leading-snug whitespace-pre-line italic sm:text-[1.7rem]`}
                    >
                      {item.message}
                    </blockquote>
                    <figcaption className={`${caps} mt-6 text-muted`}>
                      <span className="text-ink">{item.name}</span>
                      {item.detail && <span>, {item.detail}</span>}
                    </figcaption>
                  </figure>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted">{block.ui.noTestimonials}</p>
          )}
          {block.submitTo && (
            <LeaveTestimonial
              slug={block.submitTo}
              ui={block.ui.leave}
              buttonClassName={`mt-10 inline-flex items-center text-sm font-medium ${link}`}
            />
          )}
        </>
      );
    case 'contact':
      return (
        <div className="max-w-xl print:hidden">
          <ContactForm
            form={block.form}
            buttonClassName={`inline-flex items-center text-sm font-medium ${link}`}
          />
        </div>
      );
    case 'entries':
      return (
        <>
          <TotalExperience
            total={block.total}
            label={block.ui.totalExperience}
            className="mb-5 text-sm text-muted"
          />
          <ol className="divide-y divide-line border-y border-line 2xl:grid 2xl:grid-cols-2 2xl:gap-x-16 2xl:divide-y-0 2xl:border-y-0">
            {block.entries.map((entry) => (
              <li
                key={entry.id}
                className={`min-w-0 py-7 2xl:border-t 2xl:border-line ${entry.start ? 'md:grid md:grid-cols-[8.5rem_minmax(0,1fr)] md:gap-8' : ''}`}
              >
                {entry.start && (
                  <p className="mb-2 text-sm text-muted tabular-nums md:mt-1.5 md:mb-0">
                    <DateRange
                      start={entry.start}
                      end={entry.end}
                      openEnded={block.variant !== 'custom'}
                      duration={entry.duration}
                      fmt={entry.fmt}
                    />
                  </p>
                )}
                <div className="min-w-0">
                  <h3 className={`${display} text-xl leading-snug font-medium sm:text-2xl`}>
                    {entry.title}
                  </h3>
                  {entry.subtitle && (
                    <p className={`${display} text-lg text-muted italic`}>{entry.subtitle}</p>
                  )}
                  {entry.roles && (
                    <RoleList
                      roles={entry.roles}
                      className="mt-4 space-y-6 border-s border-line ps-5"
                      titleClassName={`${display} text-lg font-medium`}
                      datesClassName="text-sm text-muted tabular-nums"
                      descriptionClassName="mt-2 leading-relaxed"
                    />
                  )}
                  {entry.description && (
                    <p className="mt-3 leading-relaxed whitespace-pre-line">{entry.description}</p>
                  )}
                  {entry.href && (
                    <p className="mt-3 text-sm">
                      <NewTabLink href={entry.href} context={entry.title} className={link}>
                        View
                      </NewTabLink>
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </>
      );
  }
}

function Footer({ footer }: { footer: FooterModel }) {
  return (
    <footer className="mx-auto max-w-[110rem] px-5 sm:px-8 lg:px-[clamp(3rem,6vw,8rem)] pb-12">
      <div
        className={`${display} mt-24 border-t border-ink pt-6 text-center text-sm text-muted italic`}
      >
        <p>
          © {footer.year} {footer.name}
        </p>
        <p className="mt-1">
          Made {footer.message}{' '}
          <a href={footer.cta.href} className={link}>
            {footer.cta.label}
          </a>
        </p>
      </div>
    </footer>
  );
}

export default function EditorialTheme({ profile, idPrefix = '' }: ThemeProps) {
  const blocks = buildBlocks(profile, idPrefix);
  return (
    <ThemeWrapper theme="editorial" profile={profile} className={fontClass}>
      <main
        id={`${idPrefix}main`}
        className="mx-auto max-w-[110rem] px-5 sm:px-8 lg:px-[clamp(3rem,6vw,8rem)] py-10 sm:py-16"
      >
        <Masthead header={buildHeader(profile)} />
        {blocks.map((block) => (
          <Section key={block.id} block={block} animate={!idPrefix}>
            <BlockView block={block} />
          </Section>
        ))}
        {blocks.length === 0 && (
          <EmptyPage
            text={uiFor(profile.locale).emptyPage}
            className={`${display} mt-16 text-center text-muted italic`}
          />
        )}
      </main>
      <Footer footer={buildFooter(profile)} />
    </ThemeWrapper>
  );
}
