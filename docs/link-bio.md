# Link-in-bio card

A compact, mobile-first card at `/<slug>/links` (and `/<slug>/<locale>/links`) for places that allow one link: an Instagram bio, a WhatsApp status, an email signature. It is a different page from the portfolio, not a theme: one column of at most 480 px, drawn on the server, with client JavaScript only for the contact form, the Share menu and the clock.

## Data

- `Profile.linkBioEnabled` (default off), `linkBioStyle` (`light` | `soft`, default `light`) and five "show this button" switches (`linkBioShowContact`, `Vcard`, `Resume`, `Share`, `Work`, default on). They are changed only by `PUT /profile/me/link-bio`, never by `PUT /profile/me`. The card can only be switched **on** while the page is published.
- The custom buttons are rows of their own table, `LinkBioLink` (`label` up to 40 characters, `url`, `order`), at most 8 per profile. A table (not a JSON column) because that is how the profile's links and skills are stored, because reordering, the limit and the per-profile lock reuse the same helpers, and because the translation system keys a text by the id of a row. Endpoints: `GET/POST /profile/me/link-bio/links`, `PUT/DELETE .../:id`, `PATCH .../reorder`.
- Labels are plain text (control characters stripped, tag-like text refused). Addresses go through `linkBioUrlSchema`: control characters removed, then parsed, only `http:` and `https:` with a host and no password, and the **normalised** form is stored, so what is checked is what is saved. `javascript:`, `data:`, `vbscript:`, `file:`, `mailto:` and relative or scheme-less addresses are refused. The page checks again before drawing a link.
- Labels are translatable (`Translation`, entity `linkBioLink`, field `label`) while the address is shared by every language. They count in a language's completeness only while the card is on. Deleting a button deletes its translations in the same transaction.
- The buttons are in the account export (`profile.linkBioLinks`), the settings are on the exported profile row.

## API

`GET /public/:slug/links[?lang=xx]` is built from an explicit select: name, tagline, location, avatar, accent colour, the look, the availability badge (only when on), the **visible** links, the buttons, and which optional buttons to draw. It never carries hidden links or the account email, and 404s when the card is off, the page is unpublished or missing. The optional buttons come from `linkCardFeatures()` in `shared/src/link-card.ts`, which the dashboard preview uses too, so the preview shows exactly the buttons visitors get.

## Page

Order: the owner's buttons, the owner's visible links (with icons), Contact me, Add to contacts, Download resume, View full portfolio; then Share, the working-hours line, and the "Made with Parichay" link. A button for a feature that is off, or has no data, is not drawn. No new features are invented for it.

SEO: the page has `noindex, follow` and a canonical URL that is the portfolio in the same language. The card is a thin copy of the portfolio, so it should not compete with it in results; the canonical covers tools that ignore `noindex`. Link previews are unaffected: they read Open Graph tags, and the route re-uses the portfolio's `opengraph-image` (`profileCard`).

There is no analytics system, so clicks are not counted. The card sets no cookies and stores nothing in the browser.
