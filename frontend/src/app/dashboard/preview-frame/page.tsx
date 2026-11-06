'use client';

import { useEffect, useState } from 'react';
import { languageOf, type PublicProfile } from '@parichay/shared';
import { AnnouncementPreview } from '@/components/announcement/AnnouncementBanner';
import { HtmlLang } from '@/components/portfolio/HtmlLang';
import { SiteNav } from '@/components/portfolio/SiteNav';
import { findPage, isMulti, pageLabel } from '@/lib/pages';
import { THEME_COMPONENTS } from '@/lib/theme-components';
import { getTheme } from '@/lib/themes';

// The inside of the dashboard's preview frame (components/dashboard/Preview.tsx). It shows
// nothing of its own: the dashboard sends the profile being edited as a message, from the same
// origin only, and this page draws it with the real theme. Like the old inline preview, its content
// cannot be clicked or focused. The route is guarded like the rest of /dashboard by src/proxy.ts.
export default function PreviewFramePage() {
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [pageKey, setPageKey] = useState('home');

  useEffect(() => {
    // The frame is drawn shrunk, so a scrollbar in it would look like a stray hairline. It still
    // scrolls with the wheel and touch.
    document.documentElement.style.scrollbarWidth = 'none';
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin || e.source !== window.parent) return;
      if (e.data?.type === 'preview-profile') {
        setProfile(e.data.profile as PublicProfile);
        setPageKey(typeof e.data.pageKey === 'string' ? e.data.pageKey : 'home');
      }
    };
    window.addEventListener('message', onMessage);
    window.parent.postMessage({ type: 'preview-ready' }, window.location.origin);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  if (!profile) return null;
  const Theme = THEME_COMPONENTS[getTheme(profile.theme).key];
  // The language and direction of the page being previewed, so an RTL language mirrors.
  const language = languageOf(profile.locale);
  // A multi-page portfolio shows the chosen page with its navigation; a single page as it is.
  const page = isMulti(profile)
    ? (findPage(profile, pageKey) ?? findPage(profile, 'home'))
    : undefined;
  return (
    <div inert lang={language.code} dir={language.dir} data-script={language.script}>
      <HtmlLang lang={language.code} dir={language.dir} />
      <AnnouncementPreview value>
        <Theme
          profile={profile}
          idPrefix="preview-"
          page={page}
          heading={
            page && page.key !== 'home'
              ? `${pageLabel(profile, page)} | ${profile.fullName}`
              : undefined
          }
          nav={page ? <SiteNav profile={profile} current={page.key} /> : undefined}
        />
      </AnnouncementPreview>
    </div>
  );
}
