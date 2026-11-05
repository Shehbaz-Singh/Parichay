import type { PublicProfile } from '@parichay/shared';
import { uiFor } from '@/lib/i18n';
import { LanguageSwitcher, type LanguageLink } from '../../portfolio/LanguageSwitcher';
import { ReadingPreferences } from '../../portfolio/ReadingPreferences';
import { IndexRailMenu } from '../../portfolio/nav/IndexRailMenu';
import { buildHeader } from '../blocks';
import { pad } from './model';

const focusRing =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-fg';
const secondaryLink = `inline-flex min-h-9 items-center py-1 text-ink underline decoration-1 underline-offset-4 hover:decoration-2 ${focusRing}`;

// The Index theme's rail for both modes: the single page (links to its sections) and a multi-page
// portfolio (links to its pages). The interactive part is IndexRailMenu; this draws what goes in it.
export function IndexRail({
  profile,
  items,
  mode,
  current,
  languages = [],
  contactHref,
  idPrefix = '',
}: {
  profile: PublicProfile;
  items: { key: string; href: string; label: string }[];
  mode: 'pages' | 'sections';
  current?: string;
  languages?: LanguageLink[];
  // Where "Contact" leads. Left out in the pages mode: the Contact page, when there is one.
  contactHref?: string | null;
  idPrefix?: string;
}) {
  const header = buildHeader(profile);
  const ui = uiFor(profile.locale);
  const contact =
    contactHref !== undefined
      ? contactHref
      : (items.find((item) => item.key === 'contact')?.href ?? null);
  return (
    <IndexRailMenu
      name={profile.fullName}
      homeHref={mode === 'pages' ? (items[0]?.href ?? '/') : `#${idPrefix}intro`}
      items={items.map((item, index) => ({ ...item, number: pad(index + 1) }))}
      mode={mode}
      current={current}
      mainId={`${idPrefix}main`}
      text={{
        nav: ui.pages.nav,
        menu: ui.sidebar.menu,
        close: ui.sidebar.closeMenu,
        skip: ui.sidebar.skip,
      }}
      secondary={
        header.resume || contact ? (
          <>
            {header.resume && (
              <a href={header.resume.href} download className={secondaryLink}>
                {header.resume.label}
              </a>
            )}
            {contact && (
              <a href={contact} className={secondaryLink}>
                {ui.sections.contact}
              </a>
            )}
          </>
        ) : null
      }
    >
      {languages.length > 1 && (
        <LanguageSwitcher
          links={languages}
          current={profile.locale}
          label={ui.switcher.label}
          inNav
        />
      )}
      <ReadingPreferences
        ui={ui.reading}
        triggerClassName={`inline-flex min-h-9 items-center gap-1.5 text-ink underline underline-offset-4 hover:no-underline ${focusRing}`}
      />
    </IndexRailMenu>
  );
}
