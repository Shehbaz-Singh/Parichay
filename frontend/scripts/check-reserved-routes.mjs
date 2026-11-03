// Checks that the names under /<username>/ cannot collide: no language code may equal a page name or a
// file route (/<username>/<locale> and /<username>/work would be the same address), and no page name may
// be a language code. The names are read from the shared source files, so a new language or page that
// clashes fails here.
/* global console, process, URL */
// Run with: npm run check:reserved-routes -w @parichay/frontend
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const shared = fileURLToPath(new URL('../../shared/src/', import.meta.url));
const read = (file) => readFileSync(join(shared, file), 'utf8');

// Language codes: the `code: '..'` entries of languages.ts.
const locales = [...read('languages.ts').matchAll(/code:\s*'([^']+)'/g)].map((m) => m[1]);
// Page names: PAGE_KEYS and the reserved custom page words.
const pageKeys = [
  ...(read('pages.ts').match(/PAGE_KEYS = \[([^\]]+)\]/)?.[1] ?? '').matchAll(/'([^']+)'/g),
].map((m) => m[1]);
const reserved = [
  ...(read('pages.ts').match(/RESERVED_PAGE_SLUGS = \[([^\]]+)\]/)?.[1] ?? '').matchAll(
    /'([^']+)'/g,
  ),
].map((m) => m[1]);
// What lives next to the pages under /<username>/ (route folders and files).
const routes = [
  'work',
  'about',
  'contact',
  'writing',
  'links',
  'p',
  'resume.pdf',
  'contact.vcf',
  'opengraph-image',
];

const problems = [];
if (locales.length === 0) problems.push('found no language codes in shared/src/languages.ts');
if (pageKeys.length === 0) problems.push('found no PAGE_KEYS in shared/src/pages.ts');
for (const name of new Set([...pageKeys, ...reserved, ...routes])) {
  if (locales.includes(name))
    problems.push(`"${name}" is both a language code and a page or route name`);
}
if (!/RESERVED_PAGE_SLUGS = \[\s*\.\.\.PAGE_KEYS/.test(read('pages.ts'))) {
  problems.push('RESERVED_PAGE_SLUGS must start with ...PAGE_KEYS');
}

if (problems.length > 0) {
  console.error(problems.join('\n'));
  process.exit(1);
}
console.log(`ok: ${locales.length} language codes, ${pageKeys.length} pages, no collisions`);
