# Announcement bar

A slim bar above the top of the public page for news that has a date ("Speaking at DevFest on Dec 5", "Open to work from January"). Off by default. The owner sets it up in the dashboard under Share & extras → Announcement (also in the command palette as "Edit announcement").

## Data

On `Profile` (migration `20261106100000_announcement`): `announcementEnabled`, `announcementText` (140), `announcementLinkUrl` (http/https), `announcementLinkLabel` (30, defaults to the interface string "Learn more" in the visitor's language), `announcementStyle` (`info`, `highlight`, `notice`), `announcementStartsAt` / `announcementEndsAt` (UTC instants), `announcementDismissible`, `announcementScroll`, `announcementVersion` (migrations `20261106100000_announcement` and `20261106120000_announcement_scroll`).

- Rules are in `shared/src/announcement.ts` (`announcementSettingsSchema`): the text is one line of plain text with control characters removed; a link needs text; only `http:` and `https:` links with no login in them pass; the end must be after the start and at most 12 months from now. An end in the past is accepted (it is how an announcement is ended), and the dashboard warns about it.
- `PUT /profile/me/announcement` saves everything together. The version goes up when the text, link, label or either date changes (not for the look, scrolling or the close switch). In the same transaction the stored translations of the words that changed are deleted, so an old translation is never shown for new words.
- The announcement is not part of `PUT /profile/me`. It is in `GET /profile/me`, the session and the account export (dates in UTC).
- The owner's time zone is not stored for this: the dashboard types and shows the dates in the zone of the Working together card, else the browser's.

## What a visitor gets

`GET /public/:slug` and `GET /public/:slug/links` carry `announcement` only while it is enabled, now (server clock) is inside the window, and the profile is not a sample. The stored columns never go out as they are. It has `text`, `linkUrl`, `linkLabel`, `style`, `dismissible`, `version` and `endsAt`; the text and label are in the language asked for, falling back to the default language field by field, and the link is the same in every language. `endsAt` lets a page that was cached just before the end take the bar down by itself.

The public API is cached for about a minute, so a start or an end can be up to that late on a cached page.

## Page

`components/announcement/AnnouncementBanner.tsx`, drawn once by `ThemeWrapper`, so every theme, every page of a multi-page portfolio, the writing pages and the link-in-bio card get it. It is first in the page, or the first thing in the column beside a side rail (Sidebar, Index). It is not sticky. Motion: one 0.4s slide-down when the page loads and, when the owner switched on "Scroll the text", the text scrolling slowly along the bar (the text and a second copy, hidden from assistive technology, move by one copy and start again). The scrolling stops on hover and focus and has a pause button; both kinds of motion are left out for visitors with reduced motion (system setting or the reading preference) and on low-effects devices, who get still, wrapped text. Nothing pulses or flashes. Colors are the `--ann-<look>-bg/fg/link/edge` variables from `lib/palette/recipes.ts` (`announcementBar`); `npm run check:palette` checks all three looks against 17 accents. Rules are in `app/announcement.css` (logical properties, rem, forced colors, hidden in print).

It is not in the PDF resume, vCard, badge, email signature or share images, which do not use `ThemeWrapper`.

## Closing it

The close button stores `{ version, dismissedAt }` in sessionStorage under `parichay:announcement:<slug>` (`lib/announcement-dismissal.ts`). It lasts for the visit: it survives a reload and moving between pages, and is gone when the tab is closed, so reopening the page shows the bar again. One entry per portfolio, so it covers every page and language of it; a new version shows the bar again even within the visit. Nothing is sent to the server and there is no cookie. A script right after the bar hides it before the first paint, and the bar is rendered on the server, so without JavaScript it is simply there. Without usable storage it stays closed until the next page load, from memory. Focus moves to the next focusable element on the page when it is closed. The dashboard preview never reads or writes the entry.

## Not built

There is no analytics system in this project (see `docs/i18n.md` and the privacy page), so link clicks and closings are not counted.
