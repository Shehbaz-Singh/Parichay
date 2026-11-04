import { languageOf } from '@parichay/shared';
import { ImageResponse } from 'next/og';
import { getPublicProfile } from '@/lib/api';
import { SITE_URL } from '@/lib/config';
import { initials, truncate } from '@/lib/format';
import { pagePath } from '@/lib/i18n';

const size = { width: 1200, height: 630 };

const AVATAR_PX = 240;

// avatarUrl can be any URL the user typed, so fetching it from our server would let someone
// aim the server at internal addresses (SSRF). Only our own Cloudinary uploads are fetched;
// anything else gets the initials circle instead. Satori cannot decode WebP, so Cloudinary is
// asked to deliver a PNG. Any failure also falls back to initials: the card must always render.
async function loadAvatar(avatarUrl: string | null): Promise<string | null> {
  if (!avatarUrl) return null;
  try {
    const url = new URL(avatarUrl);
    if (url.protocol !== 'https:' || url.hostname !== 'res.cloudinary.com') return null;

    const png = avatarUrl.replace(
      '/image/upload/',
      `/image/upload/f_png,w_${AVATAR_PX * 2},h_${AVATAR_PX * 2},c_fill/`,
    );
    const res = await fetch(png, {
      signal: AbortSignal.timeout(4000),
      next: { revalidate: 3600 },
    });
    if (!res.ok || !res.headers.get('content-type')?.startsWith('image/png')) return null;

    const bytes = Buffer.from(await res.arrayBuffer());
    if (bytes.length > 1_000_000) return null;
    return `data:image/png;base64,${bytes.toString('base64')}`;
  } catch {
    return null;
  }
}

// Scripts the share-card renderer (satori) draws correctly without shaping support: Latin. For the
// others the card shows the name and address only, never a mis-shaped tagline.
const drawsText = (locale: string) => languageOf(locale).script === 'latin';

export async function profileCard(username: string, locale?: string) {
  const profile = await getPublicProfile(username, locale);
  if (!profile) return new Response('Not found', { status: 404 });
  const showText = drawsText(profile.locale);
  // The current job (or the latest one): most people are judged on their work history.
  const job =
    profile.experience.find((item) => !item.endDate) ??
    [...profile.experience].sort((a, b) => b.startDate.localeCompare(a.startDate))[0];

  const avatar = await loadAvatar(profile.avatarUrl);
  const name = truncate(profile.fullName, 48);
  const host = new URL(SITE_URL).host;

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: 72,
        color: 'white',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 55%, #312e81 100%)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
        {avatar ? (
          <img
            alt=""
            src={avatar}
            width={AVATAR_PX}
            height={AVATAR_PX}
            style={{ borderRadius: AVATAR_PX / 2, objectFit: 'cover', border: '6px solid #ffffff' }}
          />
        ) : (
          <div
            style={{
              width: AVATAR_PX,
              height: AVATAR_PX,
              borderRadius: AVATAR_PX / 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#6366f1',
              fontSize: 96,
              fontWeight: 700,
            }}
          >
            {initials(profile.fullName)}
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', marginLeft: 56, flex: 1 }}>
          <div
            style={{
              fontSize: name.length > 28 ? 60 : 76,
              fontWeight: 700,
              lineHeight: 1.1,
              letterSpacing: -1,
            }}
          >
            {name}
          </div>
          {showText && profile.tagline && (
            <div style={{ fontSize: 38, marginTop: 20, color: '#cbd5e1', lineHeight: 1.25 }}>
              {truncate(profile.tagline, 90)}
            </div>
          )}
          {showText && job && (
            <div style={{ fontSize: 30, marginTop: 20, color: '#e2e8f0', fontWeight: 600 }}>
              {truncate(`${job.title} · ${job.company}`, 70)}
            </div>
          )}
          {profile.location && (
            <div style={{ fontSize: 28, marginTop: 20, color: '#94a3b8' }}>
              {truncate(profile.location, 60)}
            </div>
          )}
        </div>
      </div>
      <div style={{ display: 'flex', fontSize: 30, color: '#a5b4fc' }}>
        {`${host}${pagePath(profile.slug, profile.locale, profile.defaultLocale)}`}
      </div>
    </div>,
    { ...size },
  );
}
