# Contact form and inbox

A published portfolio can offer a contact form. Visitors write a message; the owner reads it in the dashboard (**Messages**). **Nothing is emailed**: there is no email provider, no SMTP and no notification email. The owner's address is never sent to visitors (the form posts to the API, and the page data carries only the intro line and the retention period). The owner replies from their own email app through a `mailto:` link.

## Pieces

- `shared/src/contact.ts`: limits, Zod schemas (name 2-80, email normalised and at most 254, subject at most 120, message 20-2000, plain text, control characters stripped, tag-like text and more than 2 links refused).
- `Profile.contactFormEnabled` / `contactFormIntro` (140 characters, translatable) and `ContactMessage` (migration `20261102130000_contact_form`). A new `contact` section key, hidden until the owner switches the form on.
- `GET /public/:slug/contact`: the signed time stamp (and the Turnstile site key, if any). `POST /public/:slug/contact`: the message. Both are 404 unless the profile is published, not a sample and has the form on.
- Owner routes under `/profile/me/messages`: list (status filter, pages of 20), `unread-count`, `settings`, one message, status change, delete.
- Public UI: `components/themes/ContactForm.tsx`, drawn by every theme for the `contact` block. Without JavaScript the link goes to `/<slug>/contact` (a never-cached page) and the form posts to `/<slug>/contact/send`, which forwards to the API and redirects back with the result.

## Spam and abuse, in the order they run

1. Honeypot field `website`: if filled, the normal success answer and the message is dropped.
2. Zod validation (the only rejection a visitor sees with detail).
3. Signed time stamp (`lib/form-token.ts`, HMAC with a key derived from `JWT_SECRET`, bound to the slug): under 3 seconds is dropped with the normal success answer; missing, forged, foreign or older than an hour gives a generic "form timed out".
4. Turnstile, only when both `TURNSTILE_SITE_KEY` and `TURNSTILE_SECRET_KEY` are set (script loaded only when the form is opened; the privacy policy names it when on).
5. Per-visitor limit, 3 an hour and 10 a day (`lib/visitor-limit.ts`): in memory, keyed by an HMAC of the address under a random secret that is replaced every UTC day. Nothing is written to the database or logs.
6. The same sender and the same text to the same profile within 24 hours: the normal success answer, nothing stored.
7. Per-profile cap, 20 messages in 24 hours, counted in the database (under the profile lock).

Dropped messages and kept ones get the same `201 { received: true }`. Over a limit gives one generic 429 that does not say which limit.

**Free tier:** the in-memory counters (5) reset whenever the server restarts or sleeps, so they only slow a single script. The per-profile cap (7), duplicate check (6) and the retention sweep use the database and hold across restarts.

## Retention

`CONTACT_RETENTION_DAYS` (default 90). `services/contact-retention.ts` deletes older messages 30 seconds after the server starts and every 6 hours. Every read also skips expired rows, so a late sweep never shows one. Messages are in the account export and are deleted with the account (cascade). The privacy page, the form and the dashboard read the number from the API.

## Dashboard

The unread count is fetched when the dashboard loads and every minute while the tab is visible (plain polling, no WebSockets). It shows in the menu and as "(2) ..." in the tab title, and a polite live region announces only an increase. There is no analytics system, so the form's opens and sends are not counted.
