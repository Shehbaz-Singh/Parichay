import type { Metadata, Viewport } from 'next';
import { localeParams } from '@/lib/route-locale';
import { ProfileView, profileMetadata, profileViewport } from '@/components/portfolio/profile-page';

type Props = { params: Promise<{ username: string; locale: string }> };

// A portfolio in one of its other languages.
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username, locale } = await localeParams(params);
  return profileMetadata(username, locale);
}

export async function generateViewport({ params }: Props): Promise<Viewport> {
  const { username, locale } = await localeParams(params);
  return profileViewport(username, locale);
}

export default async function LocaleProfilePage({ params }: Props) {
  const { username, locale } = await localeParams(params);
  return <ProfileView username={username} locale={locale} />;
}
