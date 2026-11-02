import { cache } from 'react';
import { z } from 'zod';
import {
  publicLinkCardSchema,
  publicPostSchema,
  publicPostSummarySchema,
  publicProfileSchema,
  type PublicLinkCard,
  type PublicPost,
  type PublicPostSummary,
  type PublicProfile,
} from '@parichay/shared';
import { API_URL } from './config';

// Edits made in the dashboard drop the cached copies at once (the /api proxy calls
// revalidateTag with this tag). The time-based expiry is only a safety net.
export const PUBLIC_PROFILES_TAG = 'public-profiles';
const REVALIDATE_SECONDS = 60;

const langQuery = (lang?: string) => (lang ? `?lang=${encodeURIComponent(lang)}` : '');

// The published profile for a slug, or null when there is none (missing or unpublished: the
// API gives the same 404 for both). Any other failure throws, so the error page shows
// instead of a misleading "not found". The response is validated against the shared schema.
// cache() means the page, generateMetadata and the OG image share one fetch per request.
// `lang` is one of the profile's extra languages: null then also means "not offered (yet)".
export const getPublicProfile = cache(
  async (slug: string, lang?: string): Promise<PublicProfile | null> => {
    const res = await fetch(`${API_URL}/public/${encodeURIComponent(slug)}${langQuery(lang)}`, {
      next: { revalidate: REVALIDATE_SECONDS, tags: [PUBLIC_PROFILES_TAG] },
    });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`Public profile API responded with ${res.status}`);
    return publicProfileSchema.parse(await res.json());
  },
);

// The link-in-bio card of a profile, or null when there is none (missing, unpublished, or the card is
// off: the API gives the same 404 for all of those). Dropped with the profile cache.
export const getLinkCard = cache(
  async (slug: string, lang?: string): Promise<PublicLinkCard | null> => {
    const res = await fetch(
      `${API_URL}/public/${encodeURIComponent(slug)}/links${langQuery(lang)}`,
      {
        next: { revalidate: REVALIDATE_SECONDS, tags: [PUBLIC_PROFILES_TAG] },
      },
    );
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`Link card API responded with ${res.status}`);
    return publicLinkCardSchema.parse(await res.json());
  },
);

// The published posts of a profile, newest first, or null when the profile or its Writing section is
// not public (the API gives one 404 for all of those). Dropped with the profile cache.
export const getPublicPosts = cache(
  async (slug: string, lang?: string): Promise<PublicPostSummary[] | null> => {
    const res = await fetch(
      `${API_URL}/public/${encodeURIComponent(slug)}/posts${langQuery(lang)}`,
      {
        next: { revalidate: REVALIDATE_SECONDS, tags: [PUBLIC_PROFILES_TAG] },
      },
    );
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`Public posts API responded with ${res.status}`);
    return z.array(publicPostSummarySchema).parse(await res.json());
  },
);

// One published post, or null when there is none (or it is a draft: the API does not say which).
export const getPublicPost = cache(
  async (slug: string, postSlug: string, lang?: string): Promise<PublicPost | null> => {
    const res = await fetch(
      `${API_URL}/public/${encodeURIComponent(slug)}/posts/${encodeURIComponent(postSlug)}${langQuery(lang)}`,
      { next: { revalidate: REVALIDATE_SECONDS, tags: [PUBLIC_PROFILES_TAG] } },
    );
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`Public post API responded with ${res.status}`);
    return publicPostSchema.parse(await res.json());
  },
);

// Every published post that has a page, for the sitemap. A failure gives an empty list: the sitemap
// then lists only the site's own pages instead of failing.
export async function getSitemapPosts(): Promise<
  { username: string; postSlug: string; updatedAt: string }[]
> {
  try {
    const res = await fetch(`${API_URL}/public/_posts`, {
      next: { revalidate: 3600, tags: [PUBLIC_PROFILES_TAG] },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return [];
    return z
      .array(z.object({ username: z.string(), postSlug: z.string(), updatedAt: z.string() }))
      .parse(await res.json());
  } catch {
    return [];
  }
}

// Which published profiles offer other languages, and which ones are ready, for the sitemap.
export async function getSitemapLocales(): Promise<{ username: string; locales: string[] }[]> {
  try {
    const res = await fetch(`${API_URL}/public/_locales`, {
      next: { revalidate: 3600, tags: [PUBLIC_PROFILES_TAG] },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return [];
    return z
      .array(z.object({ username: z.string(), locales: z.array(z.string()) }))
      .parse(await res.json());
  } catch {
    return [];
  }
}
