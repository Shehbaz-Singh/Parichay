// Run with: npm test -w @parichay/shared (builds first, then tests the compiled code).
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  LOCALE_CODES,
  PAGE_KEYS,
  RESERVED_PAGE_SLUGS,
  customPageInputSchema,
  customPageKey,
  customPageSlugSchema,
  defaultPageConfig,
  normalizePageConfig,
  pageConfigSchema,
  pagePathOf,
  resolvePublicPages,
} from '../dist/index.js';

const SECTIONS = [
  'about',
  'skills',
  'experience',
  'projects',
  'education',
  'testimonials',
  'writing',
  'contact',
];
const ID = 'abcdefgh1234';

test('the default arrangement puts each section on its own kind of page, and Home takes none', () => {
  const config = defaultPageConfig([], SECTIONS);
  assert.deepEqual(
    config.map((p) => p.key),
    PAGE_KEYS,
  );
  const on = (key) => config.find((p) => p.key === key).sections;
  assert.deepEqual(on('home'), []);
  assert.deepEqual(on('work'), ['experience', 'projects']);
  assert.deepEqual(on('about'), ['about', 'skills', 'education', 'testimonials']);
  assert.deepEqual(on('writing'), ['writing']);
  assert.deepEqual(on('contact'), ['contact']);
  assert.equal(pageConfigSchema.safeParse(config).success, true);
});

test('damaged settings are repaired, and Home is always first and shown', () => {
  const config = normalizePageConfig(
    [
      { key: 'work', visible: false, sections: ['projects', 'projects', 'nope'] },
      { key: 'home', visible: false, sections: ['about'] },
      { key: 'page:zzzzzzzzzz', visible: true, sections: [] }, // not this profile's page
      'junk',
    ],
    [],
    SECTIONS,
  );
  assert.equal(config[0].key, 'home');
  assert.equal(config[0].visible, true);
  assert.deepEqual(config[0].sections, []);
  assert.equal(config.find((p) => p.key === 'work').visible, false);
  assert.deepEqual(config.find((p) => p.key === 'work').sections, ['projects', 'experience']);
  assert.equal(
    config.some((p) => p.key === 'page:zzzzzzzzzz'),
    false,
  );
  // every section is on exactly one page
  const all = config.flatMap((p) => p.sections);
  assert.equal(new Set(all).size, all.length);
  assert.deepEqual([...all].sort(), [...SECTIONS].sort());
});

test('a custom page is added, takes a section, and a deleted one gives it back', () => {
  const key = customPageKey(ID);
  const moved = normalizePageConfig([{ key, visible: true, sections: ['skills'] }], [ID], SECTIONS);
  assert.deepEqual(moved.find((p) => p.key === key).sections, ['skills']);
  assert.equal(moved.find((p) => p.key === 'about').sections.includes('skills'), false);
  const back = normalizePageConfig(moved, [], SECTIONS);
  assert.equal(
    back.some((p) => p.key === key),
    false,
  );
  assert.equal(back.find((p) => p.key === 'about').sections.includes('skills'), true);
});

test('hidden and empty pages do not exist for a visitor; Home always does', () => {
  const config = defaultPageConfig([ID], SECTIONS);
  config.find((p) => p.key === 'about').visible = false;
  const pages = resolvePublicPages({
    config,
    customPages: [{ id: ID, slug: 'speaking', title: 'Speaking', body: null }],
    visibleSections: ['about', 'projects', 'experience'],
    hasContent: (key) => key === 'projects',
    hasContactDetails: false,
  });
  assert.deepEqual(
    pages.map((p) => p.key),
    ['home', 'work'],
  ); // About hidden, Writing/Contact/Speaking empty
  const withBody = resolvePublicPages({
    config,
    customPages: [{ id: ID, slug: 'speaking', title: 'Speaking', body: 'Talks I gave' }],
    visibleSections: [],
    hasContent: () => false,
    hasContactDetails: true,
  });
  assert.deepEqual(
    withBody.map((p) => p.key),
    ['home', 'contact', customPageKey(ID)],
  );
  assert.equal(withBody.at(-1).title, 'Speaking');
});

test('page paths', () => {
  assert.equal(pagePathOf({ key: 'home' }), '');
  assert.equal(pagePathOf({ key: 'work' }), '/work');
  assert.equal(pagePathOf({ key: customPageKey(ID), slug: 'uses' }), '/p/uses');
});

test('a custom page address cannot be a page name or a language', () => {
  for (const word of [...RESERVED_PAGE_SLUGS, ...LOCALE_CODES]) {
    assert.equal(customPageSlugSchema.safeParse(word).success, false, word);
  }
  assert.equal(customPageSlugSchema.safeParse('Speaking').data, 'speaking');
  assert.equal(customPageSlugSchema.safeParse('a b').success, false);
});

test('a custom page title is at most 30 characters', () => {
  assert.equal(customPageInputSchema.safeParse({ title: 'x'.repeat(31) }).success, false);
  assert.equal(customPageInputSchema.safeParse({ title: 'Press', body: '**hi**' }).success, true);
});
