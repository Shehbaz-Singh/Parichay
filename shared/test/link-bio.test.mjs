// Run with: npm test -w @parichay/shared (builds first, then tests the compiled code).
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  LINK_BIO_MAX_BUTTONS,
  isReservedSlug,
  linkBioButtonInputSchema,
  linkBioUrlSchema,
  linkCardFeatures,
  profileUpdateSchema,
} from '../dist/index.js';

const url = (value) => linkBioUrlSchema.safeParse(value);

test('http and https addresses are accepted and normalised', () => {
  assert.equal(url('https://Example.com').data, 'https://example.com/');
  assert.equal(url('  http://example.com/a b?x=1#top ').data, 'http://example.com/a%20b?x=1#top');
  assert.equal(url('https://例え.jp/').data, 'https://xn--r8jz45g.jp/');
});

test('every other kind of address is refused', () => {
  for (const bad of [
    'javascript:alert(1)',
    'JaVaScRiPt:alert(1)',
    'data:text/html,<script>alert(1)</script>',
    'vbscript:msgbox(1)',
    'file:///etc/passwd',
    'mailto:me@example.com',
    'tel:+911234567890',
    'ftp://example.com',
    '//example.com',
    'example.com',
    'https://',
    '',
    '   ',
  ]) {
    assert.equal(url(bad).success, false, bad);
  }
});

test('control characters cannot hide a scheme', () => {
  assert.equal(url('java\nscript:alert(1)').success, false);
  assert.equal(url('java\tscript:alert(1)').success, false);
  assert.equal(url('\u0000javascript:alert(1)').success, false);
  assert.equal(url('https://exa\u0000mple.com/').data, 'https://example.com/');
});

test('an address with a password in it is refused, and so is a very long one', () => {
  assert.equal(url('https://user:secret@example.com/').success, false);
  assert.equal(url(`https://example.com/${'a'.repeat(2100)}`).success, false);
});

test('a button has a plain-text label of at most 40 characters', () => {
  const ok = linkBioButtonInputSchema.safeParse({ label: ' Book  a call ', url: 'https://x.com' });
  assert.equal(ok.data.label, 'Book a call');
  const bad = (label) =>
    linkBioButtonInputSchema.safeParse({ label, url: 'https://x.com' }).success;
  assert.equal(bad(''), false);
  assert.equal(bad('x'.repeat(41)), false);
  assert.equal(bad('x'.repeat(40)), true);
  assert.equal(bad('<b>Shop</b>'), false);
  assert.equal(bad('<img src=x onerror=alert(1)>'), false);
  const cleaned = linkBioButtonInputSchema.parse({
    label: 'Sh\u0000op\u0007',
    url: 'https://x.com',
  });
  assert.equal(cleaned.label, 'Shop');
});

test('the limit is 8 and "links" is reserved', () => {
  assert.equal(LINK_BIO_MAX_BUTTONS, 8);
  assert.equal(isReservedSlug('links'), true);
});

test('a profile update cannot switch the card on or change its buttons', () => {
  for (const key of ['linkBioEnabled', 'linkBioStyle', 'linkBioShowContact', 'linkBioShowWork']) {
    assert.equal(key in profileUpdateSchema.shape, false, key);
  }
});

const profile = {
  isSample: false,
  contactFormEnabled: true,
  contactCardEnabled: true,
  resumeEnabled: true,
  workCardEnabled: true,
  timezone: 'Asia/Kolkata',
  linkBioShowContact: true,
  linkBioShowVcard: true,
  linkBioShowResume: true,
  linkBioShowShare: true,
  linkBioShowWork: true,
  visibleLinks: 2,
};

test('optional buttons need their feature and the owner’s switch', () => {
  assert.deepEqual(linkCardFeatures(profile), {
    contact: true,
    vcard: true,
    resume: true,
    share: true,
    work: true,
  });
  assert.equal(linkCardFeatures({ ...profile, contactFormEnabled: false }).contact, false);
  assert.equal(linkCardFeatures({ ...profile, linkBioShowContact: false }).contact, false);
  assert.equal(linkCardFeatures({ ...profile, contactCardEnabled: false }).vcard, false);
  assert.equal(linkCardFeatures({ ...profile, visibleLinks: 0 }).vcard, false);
  assert.equal(linkCardFeatures({ ...profile, resumeEnabled: false }).resume, false);
  assert.equal(linkCardFeatures({ ...profile, linkBioShowShare: false }).share, false);
  assert.equal(linkCardFeatures({ ...profile, workCardEnabled: false }).work, false);
  assert.equal(linkCardFeatures({ ...profile, timezone: null }).work, false);
});

test('a sample profile has no contact form and no contact card', () => {
  const sample = linkCardFeatures({ ...profile, isSample: true });
  assert.equal(sample.contact, false);
  assert.equal(sample.vcard, false);
  assert.equal(sample.resume, true);
});
