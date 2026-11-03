import { SITE_URL } from '@/lib/config';

// JSON-LD for a page. The text comes from the owner, so "<" is escaped: nothing in it can end the
// script element.
export function JsonLd({ data }: { data: object | object[] }) {
  const json = JSON.stringify(data).replace(/</g, '\u003c');
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}

export const absolute = (path: string) => `${SITE_URL}${path}`;

// A trail of pages, as schema.org wants it: the position of each, and the address of each (the last is
// the page itself).
export function breadcrumbList(items: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absolute(item.path),
    })),
  };
}

// A person's page (Home and About): the owner as a schema.org Person, in the page's language. `path` is
// the address of the page itself.
export function personData(
  profile: {
    fullName: string;
    tagline: string | null;
    about: string | null;
    locale: string;
    links: { type: string; url: string }[];
  },
  path: string,
) {
  const sameAs = profile.links
    .filter((link) => /^https?:\/\//i.test(link.url) && link.type !== 'other')
    .map((link) => link.url);
  return {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    inLanguage: profile.locale,
    url: absolute(path),
    mainEntity: {
      '@type': 'Person',
      name: profile.fullName,
      jobTitle: profile.tagline ?? undefined,
      description: profile.about ? profile.about.slice(0, 300) : undefined,
      url: absolute(path),
      sameAs: sameAs.length > 0 ? sameAs : undefined,
    },
  };
}
