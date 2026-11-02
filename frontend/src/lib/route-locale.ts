import { notFound } from 'next/navigation';
import { isLocaleCode } from '@parichay/shared';

// The route params of a /<slug>/<locale>/... page. A code that is not a language is a 404; a language
// the owner has not added, or whose translation is not ready, is a 404 too (the API decides).
export async function localeParams<T extends { locale: string }>(params: Promise<T>): Promise<T> {
  const resolved = await params;
  if (!isLocaleCode(resolved.locale)) notFound();
  return resolved;
}
