import type { MetadataRoute } from 'next';
import { getSitemapLocales, getSitemapPages, getSitemapPosts } from '@/lib/api';
import { SITE_URL } from '@/lib/config';

// The pages that belong to the site itself, the published posts that have a page of their own, and the
// pages of the portfolios whose owners chose to be listed. Portfolio pages are public but personal, so
// a profile is only listed when its owner opted in (Pages in the dashboard); a post is listed because
// someone chose to publish it as something to read and find. Links to articles elsewhere have no page.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const site = [SITE_URL, `${SITE_URL}/register`, `${SITE_URL}/login`].map((url) => ({ url }));
  const [rows, offered, listed] = await Promise.all([
    getSitemapPosts(),
    getSitemapLocales(),
    getSitemapPages(),
  ]);
  const locales = new Map(offered.map((row) => [row.username, row.locales]));

  // A page has an address in the default language and one in each language its owner offers; every
  // entry lists the others as alternates (hreflang), so search engines pair them.
  const versions = (username: string, rest: string) => {
    const extra = locales.get(username) ?? [];
    const paths = [`/${username}${rest}`, ...extra.map((code) => `/${username}/${code}${rest}`)];
    return {
      paths,
      alternates:
        extra.length > 0
          ? {
              languages: Object.fromEntries(
                extra.map((code, i) => [code, `${SITE_URL}${paths[i + 1]}`]),
              ),
            }
          : undefined,
    };
  };

  const pages = listed.flatMap(({ username, paths, projects }) =>
    [...paths, ...projects.map((slug) => `/work/${slug}`)].flatMap((rest) => {
      const { paths: urls, alternates } = versions(username, rest);
      return urls.map((path) => ({ url: `${SITE_URL}${path}`, ...(alternates && { alternates }) }));
    }),
  );

  const posts = rows.flatMap(({ username, postSlug, updatedAt }) => {
    const { paths, alternates } = versions(username, `/writing/${postSlug}`);
    return paths.map((path) => ({
      url: `${SITE_URL}${path}`,
      lastModified: new Date(updatedAt),
      ...(path === paths[0] && alternates && { alternates }),
    }));
  });
  return [...site, ...pages, ...posts];
}
