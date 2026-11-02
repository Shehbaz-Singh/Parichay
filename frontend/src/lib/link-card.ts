import {
  CONTACT_DEFAULT_RETENTION_DAYS,
  closedWeek,
  linkCardFeatures,
  type MyProfile,
  type PublicLink,
  type PublicLinkCard,
  type PublicProfile,
} from '@parichay/shared';
import { SITE_URL } from '@/lib/config';
import { initials, linkTarget, safeHttpUrl } from '@/lib/format';
import { fill, pagePath, uiFor, type Ui } from '@/lib/i18n';
import { buildContactForm, type ContactFormModel } from '@/components/themes/blocks';

// Everything the link-in-bio card draws, worked out in one place from what the API gives (or, in the
// dashboard, from what the owner has not saved yet). The card component only draws this list, so the
// order is the same everywhere: the owner's own buttons, their links, then the buttons of the features
// that are on, and the full portfolio last.

export type LinkCardItem =
  | { kind: 'custom'; id: string; label: string; href: string }
  | {
      kind: 'social';
      id: string;
      type: PublicLink['type'];
      label: string;
      href: string;
    }
  | { kind: 'contact'; form: ContactFormModel }
  | { kind: 'vcard'; href: string; label: string; hint: string; help: string }
  | { kind: 'resume'; href: string; label: string }
  | { kind: 'portfolio'; href: string; label: string };

export interface LinkCardModel {
  slug: string;
  locale: string;
  ui: Ui;
  style: PublicLinkCard['style'];
  accentColor: string;
  name: string;
  tagline: string | null;
  location: string | null;
  avatar: { src: string | null; alt: string; initials: string };
  availability: { label: string; detail: string | null } | null;
  items: LinkCardItem[];
  // The Share menu: of the portfolio, with the owner's message.
  share: { url: string; title: string; message: string | null; subject: string } | null;
  // The working-together status line.
  work: {
    timezone: string;
    hours: NonNullable<PublicLinkCard['work']>['workingHours'];
    name: string;
    serverNow: string;
  } | null;
  portfolioHref: string;
}

export function buildLinkCard(card: PublicLinkCard): LinkCardModel {
  const ui = uiFor(card.locale);
  const home = pagePath(card.slug, card.locale, card.defaultLocale);
  const query = card.locale === card.defaultLocale ? '' : `?lang=${card.locale}`;
  const status = card.availability?.status ?? 'open_to_work';
  const note = card.availability?.message?.trim() || null;
  const firstName = card.fullName.trim().split(/\s+/)[0] ?? card.fullName;

  const items: LinkCardItem[] = [];

  for (const button of card.buttons) {
    // The API only stores http(s) addresses; this is the last check before one becomes a link.
    const href = safeHttpUrl(button.url);
    if (href) items.push({ kind: 'custom', id: button.id, label: button.label, href });
  }
  for (const link of card.links) {
    const target = linkTarget(link);
    if (target) {
      items.push({
        kind: 'social',
        id: link.id,
        type: link.type,
        label: target.label,
        href: target.href,
      });
    }
  }
  if (card.contactForm) {
    items.push({
      kind: 'contact',
      form: buildContactForm(
        {
          slug: card.slug,
          locale: card.locale,
          defaultLocale: card.defaultLocale,
          fullName: card.fullName,
        },
        card.contactForm.intro,
        card.contactForm.retentionDays,
      ),
    });
  }
  if (card.vcard) {
    items.push({
      kind: 'vcard',
      href: `/${card.slug}/contact.vcf${query}`,
      label: ui.contact.button,
      hint: ui.contact.hint,
      help: ui.contact.help,
    });
  }
  if (card.resume) {
    items.push({ kind: 'resume', href: `/${card.slug}/resume.pdf`, label: ui.downloadResume });
  }
  items.push({ kind: 'portfolio', href: home, label: ui.linkCard.viewPortfolio });

  return {
    slug: card.slug,
    locale: card.locale,
    ui,
    style: card.style,
    accentColor: card.accentColor,
    name: card.fullName,
    tagline: card.tagline,
    location: card.location,
    avatar: {
      src: safeHttpUrl(card.avatarUrl),
      alt: fill(ui.photoOf, { name: card.fullName }),
      initials: initials(card.fullName),
    },
    availability: card.availability
      ? status === 'custom'
        ? { label: note ?? ui.availabilityStatus.custom, detail: null }
        : { label: ui.availabilityStatus[status], detail: note }
      : null,
    items,
    share: card.share
      ? {
          url: `${SITE_URL}${home}`,
          title: fill(ui.shareTitle, { name: card.fullName }),
          message: card.share.message,
          subject: card.tagline ? `${card.fullName} - ${card.tagline}` : card.fullName,
        }
      : null,
    work: card.work
      ? {
          timezone: card.work.timezone,
          hours: card.work.workingHours,
          name: firstName,
          serverNow: new Date().toISOString(),
        }
      : null,
    portfolioHref: home,
  };
}

// The card as the dashboard shows it, from the profile being edited (`preview` is the saved profile
// with the unsaved typing on top of it, as the portfolio preview uses). The optional buttons come from
// the same function as the API's, so the preview has exactly the buttons visitors will get.
export function linkCardFromEditor(profile: MyProfile, preview: PublicProfile): PublicLinkCard {
  const features = linkCardFeatures({
    ...profile,
    timezone: preview.timezone ?? null,
    workCardEnabled: Boolean(preview.workCardEnabled),
    visibleLinks: preview.links.length,
  });
  return {
    slug: profile.slug,
    fullName: preview.fullName,
    tagline: preview.tagline,
    location: preview.location,
    avatarUrl: preview.avatarUrl,
    accentColor: preview.accentColor,
    style: profile.linkBioStyle,
    isSample: profile.isSample,
    locale: profile.defaultLocale,
    defaultLocale: profile.defaultLocale,
    locales: [],
    ...(preview.availabilityEnabled && {
      availability: {
        status: preview.availabilityStatus ?? 'open_to_work',
        message: preview.availabilityMessage ?? null,
      },
    }),
    links: preview.links,
    buttons: profile.linkBioLinks,
    ...(features.contact && {
      contactForm: {
        intro: profile.contactFormIntro,
        retentionDays: CONTACT_DEFAULT_RETENTION_DAYS,
      },
    }),
    vcard: features.vcard,
    resume: features.resume,
    ...(features.share && { share: { message: preview.shareMessage ?? null } }),
    ...(features.work &&
      preview.timezone && {
        work: {
          timezone: preview.timezone,
          workingHours: preview.workingHours ?? closedWeek(),
          replyTime: preview.replyTime ?? null,
        },
      }),
  };
}
