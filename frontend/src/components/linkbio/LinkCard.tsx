import { ExternalLink, Globe, MapPin, MessageSquare, UserPlus, FileDown } from 'lucide-react';
import { ShareButton } from '@/components/ShareButton';
import type { LinkCardItem, LinkCardModel } from '@/lib/link-card';
import { ContactForm } from '../themes/ContactForm';
import { LINK_ICONS } from '../themes/parts';
import { AnnouncementPreview } from '../announcement/AnnouncementBanner';
import { ThemeWrapper } from '../themes/ThemeWrapper';
import { LinkWorkLine } from './LinkWorkLine';

// The link-in-bio card: one centered column, at most 480 px wide even on a desktop, drawn on the
// server with next to no JavaScript (only the contact form, the Share menu and the clock are client
// components). It is not a theme: it brings no fonts of its own, so the page stays small on a slow
// connection, and the script of the page's language gets its font from the surrounding LocaleScope.

const base =
  'flex min-h-12 w-full items-center justify-center gap-3 px-5 py-3 text-center text-base font-semibold [overflow-wrap:anywhere] transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-fg';

const looks = {
  light: {
    button: `${base} rounded-xl border border-line bg-white text-ink hover:border-accent-fg hover:bg-surface`,
    primary: `${base} rounded-xl border-2 border-accent-fg bg-accent text-on-accent hover:opacity-90`,
    badge: 'rounded-xl border border-line bg-white',
  },
  soft: {
    button: `${base} rounded-full border border-accent-fg/30 bg-accent-soft text-ink shadow-sm hover:border-accent-fg hover:shadow`,
    primary: `${base} rounded-full border-2 border-accent-fg bg-accent text-on-accent shadow-sm hover:opacity-90`,
    badge: 'rounded-full bg-accent-soft',
  },
} as const;

const icon = 'size-5 shrink-0';

function ItemIcon({ item }: { item: LinkCardItem }) {
  switch (item.kind) {
    case 'social': {
      const Icon = LINK_ICONS[item.type];
      return <Icon className={icon} />;
    }
    case 'custom':
      return <ExternalLink className={icon} />;
    case 'contact':
      return <MessageSquare className={icon} />;
    case 'vcard':
      return <UserPlus className={icon} />;
    case 'resume':
      return <FileDown className={icon} />;
    case 'portfolio':
      return <Globe className={icon} />;
  }
}

function Item({ item, model }: { item: LinkCardItem; model: LinkCardModel }) {
  const look = looks[model.style];
  const decor = (
    <span aria-hidden="true" className="inline-flex">
      <ItemIcon item={item} />
    </span>
  );

  if (item.kind === 'contact') {
    // The existing contact form: a link that opens it right here (and goes to its own page without
    // JavaScript). Its closed look is the card's own button.
    return (
      <ContactForm
        form={item.form}
        hideIntro
        buttonClassName={look.button}
        label={model.ui.linkCard.contactMe}
      />
    );
  }

  if (item.kind === 'vcard') {
    return (
      <>
        <a
          href={item.href}
          download
          title={item.hint}
          aria-describedby="link-card-vcard-hint"
          className={look.button}
        >
          {decor}
          {item.label}
        </a>
        <span id="link-card-vcard-hint" className="sr-only">
          {item.hint}. {item.help}
        </span>
      </>
    );
  }

  if (item.kind === 'resume') {
    return (
      <a href={item.href} download className={look.button}>
        {decor}
        {item.label}
        <span className="rounded-sm border border-current px-1 text-[0.65rem] leading-4 font-semibold">
          PDF
        </span>
      </a>
    );
  }

  // Custom buttons, social links and the portfolio are plain links in the same tab. An address
  // that leaves the site says nothing more than its label; "noopener noreferrer" keeps the other
  // page from reaching back.
  return (
    <a
      href={item.href}
      rel={item.kind === 'portfolio' ? undefined : 'noopener noreferrer'}
      className={item.kind === 'portfolio' ? look.primary : look.button}
    >
      {decor}
      {item.label}
    </a>
  );
}

// `preview` is for the dashboard: the card is drawn at its natural height instead of filling the window.
export function LinkCard({ model, preview = false }: { model: LinkCardModel; preview?: boolean }) {
  const { ui } = model;
  const look = looks[model.style];
  const soft = model.style === 'soft';
  return (
    <AnnouncementPreview value={preview}>
      <ThemeWrapper
        theme={soft ? 'soft' : 'editorial'}
        profile={{
          accentColor: model.accentColor,
          announcement: model.announcement ?? undefined,
          slug: model.slug,
          locale: model.locale,
        }}
        className="text-ink"
        vars={{
          ...(preview && { minHeight: '0' }),
          ...(soft && {
            backgroundImage:
              'linear-gradient(180deg, color-mix(in srgb, var(--accent) 16%, var(--bg)) 0%, var(--bg) 70%)',
          }),
        }}
      >
        <div className="mx-auto flex w-full max-w-[30rem] flex-col items-center px-5 pt-10 pb-8 sm:pt-14">
          <header className="flex w-full flex-col items-center text-center">
            {model.avatar.src ? (
              // A plain <img>, like the portfolio: the picture comes from Cloudinary (already 400 px)
              // or the host the owner chose. It is small, so it is fetched at once.
              <img
                src={model.avatar.src}
                alt={model.avatar.alt}
                width={112}
                height={112}
                referrerPolicy="no-referrer"
                decoding="async"
                className="size-28 rounded-full border-2 border-accent-fg object-cover"
              />
            ) : (
              <div
                aria-hidden="true"
                className="flex size-28 items-center justify-center rounded-full border-2 border-accent-fg bg-accent-soft text-3xl font-bold text-ink select-none"
              >
                {model.avatar.initials}
              </div>
            )}
            <h1 className="mt-4 text-2xl leading-tight font-bold [overflow-wrap:anywhere]">
              {model.name}
            </h1>
            {model.tagline && (
              <p className="mt-1 text-base text-muted [overflow-wrap:anywhere]">{model.tagline}</p>
            )}
            {model.location && (
              <p className="mt-2 flex items-center justify-center gap-1.5 text-sm text-muted">
                <MapPin aria-hidden="true" className="size-4 shrink-0" />
                <span className="[overflow-wrap:anywhere]">{model.location}</span>
              </p>
            )}
            {model.availability && (
              <div
                role="group"
                aria-label={ui.availability}
                className={`mt-4 flex max-w-full items-start gap-2.5 px-4 py-2 text-start text-sm ${look.badge}`}
              >
                <span
                  aria-hidden="true"
                  className="mt-[0.4em] size-2.5 shrink-0 rounded-full bg-accent-fg"
                />
                <span className="min-w-0 [overflow-wrap:anywhere]">
                  <span className="font-semibold">{model.availability.label}</span>
                  {model.availability.detail && (
                    <span className="block text-muted">{model.availability.detail}</span>
                  )}
                </span>
              </div>
            )}
          </header>

          <nav aria-label={ui.linkCard.linksLabel} className="mt-8 w-full">
            <ul className="space-y-3">
              {model.items.map((item, index) => (
                <li key={`${item.kind}-${'id' in item ? item.id : index}`}>
                  <Item item={item} model={model} />
                </li>
              ))}
            </ul>
          </nav>

          {model.share && (
            <div className="mt-6">
              <ShareButton
                url={model.share.url}
                title={model.share.title}
                message={model.share.message}
                subject={model.share.subject}
                ui={ui.share}
                newTab={ui.newTab}
                className="min-h-11"
              />
            </div>
          )}

          {model.work && (
            <div className="mt-6 w-full text-center">
              <LinkWorkLine
                work={{ ...model.work, hours: model.work.hours }}
                ui={ui}
                locale={model.locale}
              />
            </div>
          )}

          <footer className="mt-10 text-center text-sm text-muted">
            <a
              href="/"
              className="inline-flex min-h-11 items-center underline underline-offset-4 hover:no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-fg"
            >
              {ui.linkCard.madeWith}
            </a>
          </footer>
        </div>
      </ThemeWrapper>
    </AnnouncementPreview>
  );
}
