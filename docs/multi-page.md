# Multi-page portfolios

A profile is one long page (`layoutMode = single`, the default) or a small site of pages (`multi`). Switching is a setting, not a migration: single mode ignores the page settings, so nothing is lost either way.

## The model

- `Profile.pageConfig` (JSON) lists the pages: which are shown, their names (up to 30 characters), their order, and which sections each takes. It is repaired on every read (`normalizePageConfig` in `shared/src/pages.ts`).
- Built-in pages: Home (always on, always first), Work, About, Writing, Contact.
- `CustomPage` rows are up to 3 extra pages (title, address, plain text or limited Markdown). They take sections like the others, including the owner's custom sections.
- The API decides which pages exist for a visitor (`resolvePublicPages`): a page the owner hid, or with nothing on it, is not in `profile.pages`, so it is not in the navigation or the sitemap and its address is a 404. The frontend only reads that list.
- Profiles that used to be split automatically (more than 6 projects, 5 jobs or 12 skills) were moved to multi mode by the migration with the same pages and no Contact page.

## Routes

Every route also exists under `/<username>/<locale>/...`.

| Route                             | Single mode                                                                    | Multi mode                                                                                            |
| --------------------------------- | ------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------- |
| `/<u>`                            | the whole page                                                                 | Home: intro, 3 to 4 featured projects, About excerpt, working-together card, a contact call to action |
| `/<u>/work`                       | 307 to `/<u>#projects`                                                         | Work                                                                                                  |
| `/<u>/about`                      | 307 to `/<u>#about`                                                            | About                                                                                                 |
| `/<u>/contact`                    | the contact form's own page (the no-JavaScript form), 404 when the form is off | Contact page, form open from the start                                                                |
| `/<u>/work/<project>`             | project page                                                                   | project page (same)                                                                                   |
| `/<u>/p/<page>`                   | 404                                                                            | a page the owner made                                                                                 |
| `/<u>/writing`, `/writing/<post>` | unchanged                                                                      | unchanged; 404 when the Writing page is hidden                                                        |

- **Mode-dependent redirects are 307, not 301/308.** The owner can switch back at any time, and a permanent redirect would stay in browsers and keep sending visitors to the wrong place. Only the canonical redirects (upper-case address, `/<u>/en` for the default language) are permanent.
- **Old anchors.** A server never sees `#projects`, so on a multi-mode Home a tiny client script forwards an anchor that is not on Home to the page that has the section (`AnchorForward`). It uses `location.replace`, so the back button works, and without JavaScript the visitor just stays on Home.
- **Project pages live in both modes**, so a shared project link never breaks. In single mode there is no navigation and the back link goes to `#projects`.
- The Contact page is the only page rendered per request, because the contact form carries a signed time stamp that must be fresh. A post without JavaScript comes back to `/contact?sent=1`; in multi mode a language in the query is redirected to the language's own address.

## Reserved names

Custom pages live under `/p/`, so they cannot clash with a page name; the page names, `links`, `resume`, `p` and every language code are refused as custom page addresses anyway (`RESERVED_PAGE_SLUGS`). Language codes are checked against page names by `npm run check:reserved-routes -w @parichay/frontend`.

## SEO and sharing

- Each page has its own title, description, canonical address and hreflang alternates for the enabled languages.
- Open Graph image: a project page uses its cover or a generated card (title and owner name; text in scripts the renderer cannot shape is left out, as in the profile card). Other pages use the profile's card.
- Structured data: ProfilePage with a Person on Home, About and Contact, `CreativeWork` (or `SoftwareSourceCode` when the project lives on a code host) plus a `BreadcrumbList` on project pages, `Article` plus a `BreadcrumbList` on posts.
- The sitemap lists pages and projects, per language, **only for profiles that opted in** (`Profile.sitemapListed`, `GET /public/_pages`). Portfolios are personal, so the default is not listed.
- The share button on a project page shares that page's address with the owner's share message. The resume PDF, vCard, badge, link-in-bio card and QR code keep pointing at the whole profile; the PDF draws every project (`buildBlocks(profile, '', 'complete')`).
- There is no analytics system, so no page-view counts.
