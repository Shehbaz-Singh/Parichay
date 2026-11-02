import { cache } from 'react';
import { z } from 'zod';
import {
  publicLinkCardSchema,
  publicPostSchema,
  publicPostSummarySchema,
  publicProfileSchema,
} from '@parichay/shared';
import { API_URL } from './config';

// Edits made in the dashboard drop the cached copies at once (the /api proxy calls
// revalidateTag with this tag). The time-based expiry is only a safety net.
export const PUBLIC_PROFILES_TAG = 'public-profiles';
const REVALIDATE_SECONDS = 60;

const langQuery = (lang?: string) => (lang ? `?lang=${encodeURIComponent(lang)}` : '');

const publicUrl = (slug: string, rest = '', lang?: string) =>
  `${API_URL}/public/${encodeURIComponent(slug)}${rest}${langQuery(lang)}`;

// One public API read: the parsed body, or null on a 404. Any other failure throws, so the error page
// shows instead of a misleading "not found". Cached with the profile tag, so a dashboard edit drops it.
async function fetchPublic<T>(
  url: string,
  schema: z.ZodType<T, z.ZodTypeDef, unknown>,
  what: string,
): Promise<T | null> {
  const res = await fetch(url, {
    next: { revalidate: REVALIDATE_SECONDS, tags: [PUBLIC_PROFILES_TAG] },
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`${what} API responded with ${res.status}`);
  return schema.parse(await res.json());
}

// A list for the sitemap. A failure gives an empty list: the sitemap then lists only the site's own
// pages instead of failing.
async function fetchSitemapList<T>(
  path: string,
  schema: z.ZodType<T, z.ZodTypeDef, unknown>,
): Promise<T[]> {
  try {
    const res = await fetch(`${API_URL}/public/${path}`, {
      next: { revalidate: 3600, tags: [PUBLIC_PROFILES_TAG] },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return [];
    return z.array(schema).parse(await res.json());
  } catch {
    return [];
  }
}

// The published profile for a slug, or null when there is none (missing or unpublished: the
// API gives the same 404 for both). The response is validated against the shared schema.
// cache() means the page, generateMetadata and the OG image share one fetch per request.
// `lang` is one of the profile's extra languages: null then also means "not offered (yet)".
export const getPublicProfile = cache((slug: string, lang?: string) =>
  fetchPublic(publicUrl(slug, '', lang), publicProfileSchema, 'Public profile'),
);

// The link-in-bio card of a profile, or null when there is none (missing, unpublished, or the card is
// off: the API gives the same 404 for all of those).
export const getLinkCard = cache((slug: string, lang?: string) =>
  fetchPublic(publicUrl(slug, '/links', lang), publicLinkCardSchema, 'Link card'),
);

// The published posts of a profile, newest first, or null when the profile or its Writing section is
// not public (the API gives one 404 for all of those).
export const getPublicPosts = cache((slug: string, lang?: string) =>
  fetchPublic(publicUrl(slug, '/posts', lang), z.array(publicPostSummarySchema), 'Public posts'),
);

// One published post, or null when there is none (or it is a draft: the API does not say which).
export const getPublicPost = cache((slug: string, postSlug: string, lang?: string) =>
  fetchPublic(
    publicUrl(slug, `/posts/${encodeURIComponent(postSlug)}`, lang),
    publicPostSchema,
    'Public post',
  ),
);

// Every published post that has a page, for the sitemap.
export const getSitemapPosts = () =>
  fetchSitemapList(
    '_posts',
    z.object({ username: z.string(), postSlug: z.string(), updatedAt: z.string() }),
  );

// Which published profiles offer other languages, and which ones are ready, for the sitemap.
export const getSitemapLocales = () =>
  fetchSitemapList('_locales', z.object({ username: z.string(), locales: z.array(z.string()) }));
