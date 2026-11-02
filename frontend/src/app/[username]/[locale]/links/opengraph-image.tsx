import { isLocaleCode } from '@parichay/shared';
import { profileCard } from '@/components/portfolio/profile-card';

export const alt = 'Portfolio preview';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image({
  params,
}: {
  params: Promise<{ username: string; locale: string }>;
}) {
  const { username, locale } = await params;
  if (!isLocaleCode(locale)) return new Response('Not found', { status: 404 });
  return profileCard(username, locale);
}
