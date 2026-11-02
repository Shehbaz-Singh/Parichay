import type { Metadata, Viewport } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import { SampleBanner } from '@/components/SampleBanner';
import { getLinkCard } from '@/lib/api';
import { buildLinkCard } from '@/lib/link-card';
import { fill, pagePath, uiFor } from '@/lib/i18n';
import { truncate } from '@/lib/format';
import { PALETTES } from '@/lib/palettes';
import { LocaleScope } from '../portfolio/LocaleScope';
import { LinkCard } from './LinkCard';

// The link-in-bio card, in the profile's default language (/<slug>/links) or another one
// (/<slug>/<locale>/links). The route files only pass the language, like the portfolio's.

// The card page is a short copy of the portfolio, so it is kept out of search results and points at
// the real page:
//  - noindex (with follow, so a crawler still follows the link to the portfolio): the card has nothing
//    the portfolio does not say better, and two pages competing for the same name in the results
//    would only split them.
//  - the canonical URL is the portfolio in the same language, for the crawlers and the tools that
//    read it but do not honour noindex, so they credit the portfolio.
// Neither affects people: a pasted link still opens the card, and the preview image (the same card of
// name and photo as the portfolio's, from the opengraph-image next to each route) shows in WhatsApp,
// Instagram and the rest, because those read Open Graph tags, not robots rules.
export async function linkCardMetadata(username: string, locale?: string): Promise<Metadata> {
  const card = await getLinkCard(username, locale);
  if (!card) notFound();
  const ui = uiFor(card.locale);
  const home = pagePath(card.slug, card.locale, card.defaultLocale);
  const title = fill(ui.linkCard.title, { name: card.fullName });
  const about = fill(ui.linkCard.description, { name: card.fullName });
  const description = truncate(card.tagline ? `${card.tagline}. ${about}` : about, 160);
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: home },
    robots: { index: false, follow: true },
    openGraph: { type: 'profile', title, description, url: `${home}/links`, locale: card.locale },
    twitter: { card: 'summary_large_image', title, description },
  };
}

// The browser's chrome takes the card's own page color.
export async function linkCardViewport(username: string, locale?: string): Promise<Viewport> {
  const card = await getLinkCard(username, locale);
  if (!card) return {};
  const { background } = PALETTES[card.style === 'soft' ? 'soft' : 'editorial'];
  return { colorScheme: 'light', themeColor: background };
}

export async function LinkCardView({ username, locale }: { username: string; locale?: string }) {
  const card = await getLinkCard(username, locale);
  if (!card) notFound();

  // /AYUSH-GILL/links and /ayush-gill/links are the same card, and the default language has one
  // address (/slug/links, not /slug/en/links): keep one canonical URL.
  const path = `${pagePath(card.slug, card.locale, card.defaultLocale)}/links`;
  const asked = locale ? `/${username}/${locale}/links` : `/${username}/links`;
  if (asked !== path) permanentRedirect(path);

  const ui = uiFor(card.locale);
  const codes = [card.defaultLocale, ...card.locales];
  return (
    <LocaleScope
      locale={card.locale}
      links={codes.map((code) => ({
        code,
        href: `${pagePath(card.slug, code, card.defaultLocale)}/links`,
      }))}
      label={ui.switcher.label}
    >
      {card.isSample && <SampleBanner ui={ui.sample} />}
      <main id="main">
        <LinkCard model={buildLinkCard(card)} />
      </main>
    </LocaleScope>
  );
}
