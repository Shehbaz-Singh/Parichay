import type { ComponentType, ReactNode } from 'react';
import Link from 'next/link';
import { ArrowRight, FileDown, Globe, Link2, Mail, Phone, UserPlus } from 'lucide-react';
import type { PublicLink } from '@parichay/shared';
import { formatDate, formatMonthYear, initials } from '@/lib/format';
import { fill } from '@/lib/i18n';
import { ReadMore } from './ReadMore';
import type { Block, DateFmt, MoreLink, Entry, FooterModel, HeaderModel, Role } from './blocks';

// Small pieces every theme uses, so the markup that matters (dates as <time>, links that open in a
// new tab, the photo or the initials, the icon on a link) is the same everywhere. Layout and
// styling stay in the theme.

// "Apr 2023 – Apr 2026", "Mar 2022 – Present" (for open-ended jobs), or just "Mar 2022".
export function DateRange({
  start,
  end,
  openEnded = false,
  duration,
  fmt,
}: Pick<Entry, 'start' | 'end'> & { openEnded?: boolean; duration?: string; fmt: DateFmt }) {
  if (!start) return null;
  return (
    <>
      <time dateTime={start}>{formatMonthYear(start, fmt.locale)}</time>
      {end ? (
        <>
          {' – '}
          <time dateTime={end}>{formatMonthYear(end, fmt.locale)}</time>
        </>
      ) : (
        openEnded && ` – ${fmt.present}`
      )}
      {duration && ` · ${duration}`}
    </>
  );
}

// The positions held at one company (Entry.roles), under the company's heading. Each theme says how
// its parts look through the class names; the structure is the same everywhere: a list of roles,
// each with its title as a heading, its dates and what was done.
export function RoleList({
  roles,
  headingLevel = 'h4',
  className,
  roleClassName,
  titleClassName,
  datesClassName,
  descriptionClassName,
}: {
  roles: Role[];
  headingLevel?: 'h4';
  className?: string;
  roleClassName?: string;
  titleClassName?: string;
  datesClassName?: string;
  descriptionClassName?: string;
}) {
  const Heading = headingLevel;
  return (
    <ol className={className}>
      {roles.map((role) => (
        <li key={role.id} className={roleClassName}>
          <Heading className={titleClassName}>{role.title}</Heading>
          {role.start && (
            <p className={datesClassName}>
              <DateRange start={role.start} end={role.end} openEnded fmt={role.fmt} />
            </p>
          )}
          {role.description && (
            <ReadMore
              text={role.description}
              locale={role.fmt.locale}
              className={descriptionClassName}
            />
          )}
        </li>
      ))}
    </ol>
  );
}

// The title of an inner page, for screen readers: those pages have no big header, and a page needs
// its heading.
export function PageHeading({ heading }: { heading: string }) {
  return <h1 className="sr-only">{heading}</h1>;
}

// A way on to the rest of a heavy profile ("View all projects"), under the block it belongs to.
export function MoreLinkView({ more, className }: { more: MoreLink; className?: string }) {
  return (
    <p className={className ?? 'mt-6'}>
      <Link
        href={more.href}
        className="inline-flex min-h-6 items-center gap-1.5 text-sm font-semibold text-accent-fg underline underline-offset-2 hover:no-underline print:hidden"
      >
        {more.label}
        <ArrowRight aria-hidden="true" className="size-4 rtl:-scale-x-100" />
      </Link>
    </p>
  );
}

// "Total experience: 6 years 2 months", above the jobs. Nothing if the total is unknown.
export function TotalExperience({
  total,
  label,
  className,
}: {
  total?: string;
  label: string; // "Total experience"
  className?: string;
}) {
  if (!total) return null;
  return (
    <p className={className}>
      {label}: <strong className="font-semibold">{total}</strong>
    </p>
  );
}

// An address on another site: new tab, no opener, and the new tab announced to screen readers.
export function NewTabLink({
  href,
  className,
  context,
  children,
}: {
  href: string;
  className?: string;
  context?: string; // what the link is about, read out after the visible text
  children: ReactNode;
}) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
      {children}
      <span className="sr-only">{context ? ` ${context}` : ''} (opens in a new tab)</span>
    </a>
  );
}

// The photo, or the initials in a circle when there is none. The theme gives it its size and look.
export function Avatar({
  avatar,
  className,
  placeholderClassName,
}: {
  avatar: HeaderModel['avatar'];
  className: string; // applied to both
  placeholderClassName: string; // extra, for the initials circle
}) {
  if (avatar.src) {
    return (
      // A plain <img>: avatars come from Cloudinary (already 400px) or any host the user chose,
      // which next/image could not allow-list.
      <img
        src={avatar.src}
        alt={avatar.alt}
        width={160}
        height={160}
        referrerPolicy="no-referrer"
        decoding="async"
        className={`${className} object-cover`}
      />
    );
  }
  return (
    <div
      aria-hidden="true"
      className={`${className} flex items-center justify-center select-none ${placeholderClassName}`}
    >
      {avatar.initials}
    </div>
  );
}

// Initials in a small circle, for a person without a photo (the author of a testimonial).
export function InitialsBadge({ name, className }: { name: string; className: string }) {
  return (
    <span
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center rounded-full font-semibold select-none ${className}`}
    >
      {initials(name)}
    </span>
  );
}

// ---- Link icons. lucide-react has no brand logos, so GitHub and LinkedIn are drawn here (the
// official marks, as single paths); the rest are lucide icons.
type IconProps = { className?: string };

function GitHubLogo({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  );
}

function LinkedInLogo({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

export const LINK_ICONS: Record<PublicLink['type'], ComponentType<IconProps>> = {
  linkedin: LinkedInLogo,
  github: GitHubLogo,
  email: Mail,
  phone: Phone,
  website: Globe,
  other: Link2,
};

// A header link: its icon, then its label. The look (pill, plain text) comes from `className`.
// The icon is decoration; the label is what is read out.
// "Download resume (PDF)": a link to the generated resume, styled by the theme (`className` is the
// same string the theme gives its other header links). The file type is in the visible text, so
// it is read out as part of the name.
export function ResumeLink({
  resume,
  className,
}: {
  resume: NonNullable<HeaderModel['resume']>;
  className: string;
}) {
  return (
    <a href={resume.href} download className={className}>
      <span aria-hidden="true" className="inline-flex shrink-0">
        <FileDown className="size-4" />
      </span>
      {resume.label}
      <span className="rounded-sm border border-current px-1 text-[0.65rem] leading-4 font-semibold">
        PDF
      </span>
    </a>
  );
}

// "Add to contacts": a plain link to the vCard, with the download attribute, so it works without
// JavaScript. The visible text carries the name; the hint (what it downloads, and what happens on a
// phone and on a computer) is read out as its description and shown as a tooltip, not as page text.
export function ContactLink({
  contact,
  className,
}: {
  contact: NonNullable<HeaderModel['contact']>;
  className: string;
}) {
  return (
    <>
      <a
        href={contact.href}
        download
        title={contact.hint}
        aria-describedby="contact-card-hint"
        className={className}
      >
        <span aria-hidden="true" className="inline-flex shrink-0">
          <UserPlus className="size-4" />
        </span>
        {contact.label}
      </a>
      <span id="contact-card-hint" className="sr-only">
        {contact.hint}. {contact.help}
      </span>
    </>
  );
}

export function HeaderLink({
  link,
  className,
}: {
  link: HeaderModel['links'][number];
  className: string;
}) {
  const Icon = LINK_ICONS[link.type];
  const content = (
    <>
      <span aria-hidden="true" className="inline-flex shrink-0">
        <Icon className="size-4" />
      </span>
      {link.label}
    </>
  );
  return link.external ? (
    <NewTabLink href={link.href} className={className}>
      {content}
    </NewTabLink>
  ) : (
    <a href={link.href} className={className}>
      {content}
    </a>
  );
}

// A page with nothing in it yet (a new or emptied profile): say so instead of ending after the header.
export function EmptyPage({ text, className }: { text: string; className?: string }) {
  return <p className={className}>{text}</p>;
}

// "Open to new opportunities", with a dot and a link to the best way to get in touch. A plain group
// the screen reader announces as "Availability": the status is in the words, the dot only decorates
// them, so it does not rely on color. Long messages wrap instead of stretching the page. Each theme
// gives it its own look through the class names; `className` must set the text color the dot and
// the link inherit.
export function AvailabilityBadge({
  availability,
  ui,
  className,
  dotClassName,
  linkClassName,
}: {
  availability: HeaderModel['availability'];
  ui: HeaderModel['ui'];
  className: string;
  dotClassName: string;
  linkClassName: string;
}) {
  if (!availability) return null;
  const { label, detail, contact } = availability;
  return (
    <div
      role="group"
      aria-label={ui.availability}
      className={`flex max-w-full flex-wrap items-start gap-x-3 gap-y-1 ${className}`}
    >
      <span className="flex min-w-0 items-start gap-2.5">
        <span
          aria-hidden="true"
          className={`mt-[0.45em] size-2.5 shrink-0 rounded-full ${dotClassName}`}
        />
        <span className="min-w-0 [overflow-wrap:anywhere]">
          <span className="font-semibold">{label}</span>
          {detail && <span className="mt-0.5 block opacity-90">{detail}</span>}
        </span>
      </span>
      {contact &&
        (contact.external ? (
          <NewTabLink
            href={contact.href}
            className={linkClassName}
            context={fill(ui.via, { label: contact.label })}
          >
            {ui.getInTouch}
          </NewTabLink>
        ) : (
          <a href={contact.href} className={linkClassName}>
            {ui.getInTouch}
            <span className="sr-only"> {fill(ui.via, { label: contact.label })}</span>
          </a>
        ))}
    </div>
  );
}

// The Writing section: the latest posts, each with its date and excerpt (and a "Link" badge for an
// article elsewhere), and a "View all" link when there are more.
// A post written here is an internal link; a link to an article elsewhere opens in a new tab and says
// so. The title is the link (a theme can stretch it over the whole card with after:absolute), so there
// is one link per post. The cover is decorative (the title is right beside it), so it has no alt text.
export function WritingList({
  block,
  className,
  itemClassName,
  coverClassName,
  titleClassName,
  linkClassName,
  metaClassName,
  excerptClassName,
  moreClassName,
}: {
  block: Extract<Block, { kind: 'writing' }>;
  className?: string;
  itemClassName?: string;
  coverClassName?: string; // leave out to show no covers
  titleClassName?: string;
  linkClassName?: string;
  metaClassName?: string;
  excerptClassName?: string;
  moreClassName?: string; // leave out to show no "View all" link
}) {
  return (
    <>
      <ul className={className}>
        {block.posts.map((post) => (
          <li key={post.id} className={itemClassName}>
            {post.cover && coverClassName && (
              // A plain <img>, like the avatar: covers come from Cloudinary, already sized.
              <img
                src={post.cover}
                alt=""
                loading="lazy"
                decoding="async"
                width={1200}
                height={630}
                className={coverClassName}
              />
            )}
            <h3 className={titleClassName}>
              {post.external ? (
                <NewTabLink href={post.href} className={linkClassName}>
                  {post.title}
                </NewTabLink>
              ) : (
                <Link href={post.href} className={linkClassName}>
                  {post.title}
                </Link>
              )}
            </h3>
            <p className={metaClassName}>
              <time dateTime={post.date}>{formatDate(post.date, block.locale)}</time>
              {post.external && (
                <>
                  {' '}
                  <span className="ms-1 inline-flex items-center rounded-full bg-accent-soft px-2 py-0.5 text-xs font-semibold text-accent-fg not-italic">
                    {block.ui.linkBadge}
                    <span className="sr-only">{block.ui.linkBadgeNote}</span>
                  </span>
                </>
              )}
            </p>
            {post.excerpt && <p className={excerptClassName}>{post.excerpt}</p>}
          </li>
        ))}
      </ul>
      {moreClassName && block.more && (
        <Link href={block.allHref} className={moreClassName}>
          {block.ui.viewAll}
        </Link>
      )}
    </>
  );
}

// The two lines of a footer: the copyright and the "made with" credit. The theme supplies the
// <footer> around it and the classes.
export function FooterLines({
  footer,
  yearClassName,
  linkClassName,
}: {
  footer: FooterModel;
  yearClassName?: string;
  linkClassName: string;
}) {
  return (
    <>
      <p className={yearClassName}>
        © {footer.year} {footer.name}
      </p>
      <p className="mt-1">
        Made {footer.message}{' '}
        <a href={footer.cta.href} className={linkClassName}>
          {footer.cta.label}
        </a>
      </p>
    </>
  );
}
