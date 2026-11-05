import type { PublicProfile } from '@parichay/shared';
import { uiFor } from '@/lib/i18n';
import { LanguageSwitcher, type LanguageLink } from '../../portfolio/LanguageSwitcher';
import { ReadingPreferences } from '../../portfolio/ReadingPreferences';
import { SidebarRail, type RailItem } from '../../portfolio/nav/SidebarRail';
import { buildFooter, buildHeader } from '../blocks';
import { LINK_ICONS, NewTabLink } from '../parts';
import { focusRing } from '@/components/themes/tokens';

// The Sidebar theme's rail, for both modes: the single page (links to its sections) and a multi-page
// portfolio (links to its pages, with the language links and reading preferences, which the theme's
// nav carries there). The interactive part is SidebarRail; this draws what goes in it.
export function Rail({
  profile,
  items,
  mode,
  current,
  languages = [],
  idPrefix = '',
}: {
  profile: PublicProfile;
  items: RailItem[];
  mode: 'pages' | 'sections';
  current?: string;
  languages?: LanguageLink[];
  idPrefix?: string;
}) {
  const header = buildHeader(profile);
  const footer = buildFooter(profile);
  const ui = uiFor(profile.locale);
  // Email and phone are set big in the page; the rail holds the profiles elsewhere.
  const socials = header.links.filter((link) => link.type !== 'email' && link.type !== 'phone');
  const button = `inline-flex min-h-8 items-center gap-1.5 border border-line px-3 pt-small font-bold hover:bg-surface ${focusRing}`;
  const iconClass = `inline-flex size-10 items-center justify-center border border-line hover:bg-surface ${focusRing}`;
  return (
    <SidebarRail
      logo={profile.fullName}
      homeHref={mode === 'pages' ? (items[0]?.href ?? '/') : `#${idPrefix}intro`}
      items={items}
      mode={mode}
      current={current}
      mainId={`${idPrefix}main`}
      text={{
        nav: ui.pages.nav,
        menu: ui.sidebar.menu,
        close: ui.sidebar.closeMenu,
        skip: ui.sidebar.skip,
      }}
      footer={
        <p className="pt-fine text-muted [overflow-wrap:anywhere]">
          © {footer.year} {footer.name}
        </p>
      }
    >
      {socials.length > 0 && (
        <ul aria-label={ui.sidebar.social} className="flex flex-wrap gap-2">
          {socials.map((link) => {
            const Icon = LINK_ICONS[link.type];
            const content = (
              <>
                <span aria-hidden="true" className="inline-flex">
                  <Icon className="size-[1.1rem]" />
                </span>
                <span className="sr-only">{link.label}</span>
              </>
            );
            return (
              <li key={link.id}>
                {link.external ? (
                  <NewTabLink href={link.href} className={iconClass}>
                    {content}
                  </NewTabLink>
                ) : (
                  <a href={link.href} className={iconClass}>
                    {content}
                  </a>
                )}
              </li>
            );
          })}
        </ul>
      )}
      {mode === 'pages' && (
        <div className="flex flex-col items-start gap-3 pt-small">
          {languages.length > 1 && (
            <LanguageSwitcher
              links={languages}
              current={profile.locale}
              label={ui.switcher.label}
              inNav
            />
          )}
          <ReadingPreferences ui={ui.reading} triggerClassName={button} />
        </div>
      )}
    </SidebarRail>
  );
}
