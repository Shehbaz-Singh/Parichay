// Run with: npm test -w @parichay/shared (builds first, then tests the compiled code).
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  announcementChanged,
  announcementSettingsSchema,
  announcementState,
  profileUpdateSchema,
  publicAnnouncement,
} from '../dist/index.js';

const base = {
  announcementEnabled: true,
  announcementText: 'Speaking at DevFest on Dec 5',
  announcementLinkUrl: null,
  announcementLinkLabel: null,
  announcementStyle: 'info',
  announcementStartsAt: null,
  announcementEndsAt: null,
  announcementDismissible: true,
  announcementScroll: false,
};
const parse = (over) => announcementSettingsSchema.safeParse({ ...base, ...over });
const issue = (over) => {
  const result = parse(over);
  return result.success ? null : result.error.issues[0];
};
const days = (n) => new Date(Date.now() + n * 86400000).toISOString();

test('a plain announcement is accepted and cleaned', () => {
  const result = parse({ announcementText: '  Open\u0000 to work\n from  January ' });
  assert.ok(result.success);
  assert.equal(result.data.announcementText, 'Open to work from January');
});

test('the text is at most 140 characters', () => {
  assert.equal(issue({ announcementText: 'a'.repeat(141) })?.path[0], 'announcementText');
  assert.ok(parse({ announcementText: 'a'.repeat(140) }).success);
});

test('switching on needs text, and a link needs text', () => {
  assert.equal(issue({ announcementText: '  ' })?.path[0], 'announcementText');
  const off = parse({ announcementEnabled: false, announcementText: null });
  assert.ok(off.success);
  assert.equal(
    issue({
      announcementEnabled: false,
      announcementText: null,
      announcementLinkUrl: 'https://a.dev',
    })?.path[0],
    'announcementLinkUrl',
  );
});

test('links are http or https only', () => {
  for (const url of [
    'javascript:alert(1)',
    'JaVaScRiPt:alert(1)',
    'java\tscript:alert(1)',
    'data:text/html,<b>x</b>',
    'vbscript:x',
    'ftp://example.com',
    '//example.com',
    'example.com',
    'https://user:pw@example.com',
    'https://exa mple.com',
  ]) {
    assert.equal(issue({ announcementLinkUrl: url })?.path[0], 'announcementLinkUrl', url);
  }
  const ok = parse({ announcementLinkUrl: ' https://devfest.example/talks?id=1#x ' });
  assert.ok(ok.success);
  assert.equal(ok.data.announcementLinkUrl, 'https://devfest.example/talks?id=1#x');
});

test('the label is at most 30 characters and means nothing without a link', () => {
  assert.equal(
    issue({ announcementLinkUrl: 'https://a.dev', announcementLinkLabel: 'x'.repeat(31) })?.path[0],
    'announcementLinkLabel',
  );
  const noLink = parse({ announcementLinkLabel: 'Read more' });
  assert.ok(noLink.success);
  assert.equal(noLink.data.announcementLinkLabel, null);
});

const same = days(5);
test('the end must be after the start and at most 12 months away', () => {
  assert.equal(
    issue({ announcementStartsAt: same, announcementEndsAt: same })?.path[0],
    'announcementEndsAt',
  );
  assert.equal(
    issue({ announcementStartsAt: days(5), announcementEndsAt: days(2) })?.path[0],
    'announcementEndsAt',
  );
  assert.ok(parse({ announcementStartsAt: days(1), announcementEndsAt: days(30) }).success);
  assert.equal(issue({ announcementEndsAt: days(400) })?.path[0], 'announcementEndsAt');
  assert.ok(parse({ announcementEndsAt: days(360) }).success);
  // An end in the past is allowed: it is how an announcement is ended early.
  assert.ok(parse({ announcementEndsAt: days(-3) }).success);
  assert.equal(issue({ announcementEndsAt: 'not a date' })?.path[0], 'announcementEndsAt');
});

test('the profile form cannot set an announcement', () => {
  const parsed = profileUpdateSchema.parse({ fullName: 'A', announcementText: 'sneaky' });
  assert.equal('announcementText' in parsed, false);
});

const now = new Date('2026-12-10T12:00:00Z');
const stored = (over) => ({
  ...base,
  announcementVersion: 3,
  announcementStartsAt: null,
  announcementEndsAt: null,
  ...over,
});

test('the state follows the window', () => {
  assert.equal(announcementState(stored({ announcementEnabled: false }), now), 'off');
  assert.equal(announcementState(stored({ announcementText: null }), now), 'off');
  assert.equal(announcementState(stored({}), now), 'live');
  assert.equal(
    announcementState(stored({ announcementStartsAt: new Date('2026-12-11T00:00:00Z') }), now),
    'scheduled',
  );
  assert.equal(
    announcementState(stored({ announcementEndsAt: new Date('2026-12-10T12:00:00Z') }), now),
    'ended',
  );
  assert.equal(
    announcementState(
      stored({
        announcementStartsAt: new Date('2026-12-01T00:00:00Z'),
        announcementEndsAt: new Date('2026-12-20T00:00:00Z'),
      }),
      now,
    ),
    'live',
  );
});

test('only a live announcement is public, and the link label follows the link', () => {
  const words = { text: (t) => t, label: (l) => l };
  assert.equal(publicAnnouncement(stored({ announcementEnabled: false }), now, words), null);
  assert.equal(
    publicAnnouncement(
      stored({ announcementEndsAt: new Date('2026-12-09T00:00:00Z') }),
      now,
      words,
    ),
    null,
  );
  const live = publicAnnouncement(
    stored({ announcementLinkUrl: 'https://a.dev', announcementLinkLabel: null }),
    now,
    words,
  );
  assert.equal(live.version, 3);
  assert.equal(live.linkUrl, 'https://a.dev');
  assert.equal(live.endsAt, null);
  assert.equal(
    publicAnnouncement(stored({ announcementLinkLabel: 'Hidden' }), now, words).linkLabel,
    null,
  );
});

test('a new version is for new words, a new link or new dates only', () => {
  const before = stored({});
  assert.equal(announcementChanged(before, { ...before, announcementStyle: 'notice' }), false);
  assert.equal(announcementChanged(before, { ...before, announcementDismissible: false }), false);
  assert.equal(announcementChanged(before, { ...before, announcementScroll: true }), false);
  assert.equal(announcementChanged(before, { ...before, announcementText: 'Changed' }), true);
  assert.equal(
    announcementChanged(before, { ...before, announcementLinkUrl: 'https://a.dev' }),
    true,
  );
  assert.equal(
    announcementChanged(before, {
      ...before,
      announcementEndsAt: new Date('2026-12-31T00:00:00Z'),
    }),
    true,
  );
  assert.equal(
    announcementChanged(
      stored({ announcementEndsAt: new Date('2026-12-31T00:00:00Z') }),
      stored({ announcementEndsAt: '2026-12-31T00:00:00.000Z' }),
    ),
    false,
  );
});
