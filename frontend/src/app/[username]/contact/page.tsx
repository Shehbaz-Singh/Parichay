import type { Metadata, Viewport } from 'next';
import {
  ContactView,
  contactMetadata,
  pageViewport,
  type ContactQuery,
} from '@/components/portfolio/inner-pages';

// The contact form's own page, and in multi-page mode the Contact page. It is never cached: the form
// carries a signed time stamp that must be fresh, and a form post without JavaScript comes back here
// with the outcome in the query. The other pages stay cached.
export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ username: string }>; searchParams: Promise<ContactQuery> };

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const [{ username }, query] = await Promise.all([params, searchParams]);
  return contactMetadata(username, undefined, query);
}

export async function generateViewport({ params }: Props): Promise<Viewport> {
  return pageViewport((await params).username);
}

export default async function ContactPage({ params, searchParams }: Props) {
  const [{ username }, query] = await Promise.all([params, searchParams]);
  return <ContactView username={username} query={query} />;
}
