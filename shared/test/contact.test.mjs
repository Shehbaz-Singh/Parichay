// Run with: npm test -w @parichay/shared (builds first, then tests the compiled code).
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  CONTACT_MESSAGE_MAX,
  contactMessageInputSchema,
  contactSubmissionSchema,
  countLinks,
  defaultSectionConfig,
  profileUpdateSchema,
} from '../dist/index.js';

const good = {
  senderName: 'Priya Nair',
  senderEmail: 'Priya.Nair@Example.com',
  subject: 'Hello',
  message: 'I liked your portfolio and would like to talk about a project.',
};

const problem = (input) => {
  const result = contactMessageInputSchema.safeParse(input);
  return result.success ? null : result.error.issues[0];
};

test('a good message is accepted and its email normalised', () => {
  const parsed = contactMessageInputSchema.parse({
    ...good,
    senderEmail: '  Priya.Nair@Example.com ',
  });
  assert.equal(parsed.senderEmail, 'priya.nair@example.com');
  assert.equal(parsed.subject, 'Hello');
});

test('the subject is optional and a blank one becomes null', () => {
  assert.equal(contactMessageInputSchema.parse({ ...good, subject: '   ' }).subject, null);
  const { subject: _omitted, ...without } = good;
  assert.equal(contactMessageInputSchema.parse(without).subject, null);
});

test('the limits of each field', () => {
  assert.ok(problem({ ...good, senderName: 'P' }));
  assert.ok(problem({ ...good, senderName: 'x'.repeat(81) }));
  assert.ok(problem({ ...good, subject: 'x'.repeat(121) }));
  assert.ok(problem({ ...good, message: 'too short' }));
  assert.ok(problem({ ...good, message: 'x'.repeat(CONTACT_MESSAGE_MAX + 1) }));
  assert.equal(problem({ ...good, message: 'x'.repeat(CONTACT_MESSAGE_MAX) }), null);
  assert.equal(problem({ ...good, message: 'x'.repeat(20) }), null);
});

test('malformed and over-long addresses are refused', () => {
  for (const senderEmail of [
    'nope',
    'a@b',
    'a b@example.com',
    '',
    `${'a'.repeat(250)}@example.com`,
  ]) {
    assert.ok(problem({ ...good, senderEmail }), senderEmail);
  }
});

test('control characters are removed and the text is kept as text', () => {
  const parsed = contactMessageInputSchema.parse({
    ...good,
    senderName: 'Priya\u0000 Nair\u0007',
    message: `Line one is here.\r\nLine two\u0000 is here and long enough.`,
  });
  assert.equal(parsed.senderName, 'Priya Nair');
  assert.equal(parsed.message, 'Line one is here.\nLine two is here and long enough.');
});

test('text that looks like HTML is refused, not interpreted', () => {
  assert.ok(problem({ ...good, message: 'Please see <script>alert(1)</script> for the details.' }));
  assert.ok(problem({ ...good, senderName: '<b>Priya</b>' }));
  assert.ok(problem({ ...good, subject: '<img src=x>' }));
  // Angle brackets that are not a tag are fine.
  assert.equal(
    problem({ ...good, message: 'I can offer 5 < 10 days, and 10 > 5 pieces of work.' }),
    null,
  );
});

test('more than 2 links is refused, and an email address is not a link', () => {
  assert.equal(countLinks('see https://a.com and www.b.org'), 2);
  assert.equal(countLinks('a.com b.net c.org'), 3);
  assert.equal(countLinks('write to me at someone@example.com please'), 0);
  assert.equal(countLinks('no links here, just words.'), 0);
  const links =
    'Take a look at https://a.example/x, https://b.example/y and https://c.example/z today.';
  assert.ok(problem({ ...good, message: links }));
  const two = 'Take a look at https://a.example/x and https://b.example/y today please.';
  assert.equal(problem({ ...good, message: two }), null);
});

test('a submission also carries the token, and the honeypot and captcha are optional', () => {
  assert.ok(!contactSubmissionSchema.safeParse(good).success);
  const parsed = contactSubmissionSchema.parse({ ...good, formToken: '1.abc' });
  assert.equal(parsed.formToken, '1.abc');
  assert.equal(parsed.website, undefined);
});

test('the Contact section starts hidden and a profile update cannot switch the form on', () => {
  const contact = defaultSectionConfig().find((section) => section.key === 'contact');
  assert.deepEqual(contact, { key: 'contact', visible: false });
  assert.equal('contactFormEnabled' in profileUpdateSchema.shape, false);
  assert.equal('contactFormIntro' in profileUpdateSchema.shape, false);
});
