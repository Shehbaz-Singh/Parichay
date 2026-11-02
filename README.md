<div align="center">

# Parichay · परिचय

**Introduce yourself properly.**

Upload your resume, pick a look, and get a polished portfolio page at one link that's yours.

![Next.js](https://img.shields.io/badge/Next.js-000000?style=flat&logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=flat&logo=tailwindcss&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=flat&logo=express&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat&logo=postgresql&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=flat&logo=prisma&logoColor=white)

</div>

## About

Parichay (परिचय) is the Hindi word for "introduction". It is a web app that turns your resume, or a few details you type in, into a clean portfolio page at your own address, like `yoursite.com/your-name`. There is no design work and no hosting to set up. You choose a theme, add your projects and publish.

It is a full-stack TypeScript project: a Next.js frontend, an Express API, a PostgreSQL database, and a shared package of validation schemas that both sides use.

## Features

**Build your page**

- **Resume import.** Upload a PDF and your details, links, skills, jobs, education and projects are filled in for you to review. Nothing is saved until you say so, and the PDF itself is never stored.
- **Live preview.** See your page change as you type, at phone, tablet or desktop width, using the same theme your visitors will see. Changes save automatically.
- **Five themes, any accent color.** Editorial, Bento, Soft, Executive and Creative, each with its own fonts. Text colors adjust so your page stays readable on any accent.
- **Sections you control.** Show, hide, rename and reorder sections, and add your own, like Certifications, Awards or Open source. Hiding a section keeps what you wrote in it.
- **Writing.** Publish short posts in Markdown with a cover image, or link to articles you wrote elsewhere. Each post gets its own page and share image.
- **Testimonials.** Let visitors leave one, and approve each before it appears. Their email is never public.
- **Contact form and inbox.** Let visitors write to you from your page, and read their messages in the dashboard (a Messages page with an unread count, filters, archive, delete and a reply link that opens your own email app). Nothing is emailed, your address is never shown, and messages are deleted after 90 days. Spam is kept out without tracking visitors: a hidden field, a minimum time, in-memory limits keyed by a daily-rotating hash, a per-profile daily cap, duplicate detection and an optional Cloudflare Turnstile check.
- **Link-in-bio card.** A compact, mobile-first card at `/your-name/links` for an Instagram bio, a WhatsApp status or an email signature: up to 8 buttons of your own, your visible links, and buttons for the contact form, contact card, resume and share when those are on, plus your working-hours line. Light and soft looks on your accent color, every language of your page, a phone-width preview and a QR code in the dashboard. It is kept out of search engines and points to your full portfolio.
- **Availability badge.** Say you are open to work, freelance or collaboration, with a message of your own.
- **Working together card.** Show your local time, whether you are within working hours, your weekly schedule, how soon you reply and the best way to reach you. Visitors see your time next to theirs, with the difference worked out for them.
- **Multiple languages.** Offer your page in a main language plus up to four more, from Hindi, Telugu, Tamil, Bengali, Marathi, Gujarati, Punjabi, Urdu, Spanish, French, German, Portuguese and Arabic. You translate your own text (tagline, about, jobs, projects, posts and so on) field by field, with an optional AI suggestion you review before anything is saved. Anything not translated shows in your main language. Each language has its own address (`/your-name/hi`), the right fonts and text direction (including right-to-left for Urdu and Arabic), a language switcher, and search-engine language tags. See [docs/i18n.md](docs/i18n.md).
- **Command palette.** Press Ctrl+K (Cmd+K on a Mac) in the dashboard to jump to any page or item, publish, copy your link, or change your theme.

**Share it**

- One link to copy, a share menu, and a downloadable **QR code** for a printed resume.
- A **Download resume (PDF)** button, made from your page in the look of your theme: real selectable text, your section order, and only the links you show. You can switch it off.
- Proper link previews when the page is shared, and a sitemap for posts.

**Stay in control**

- **Export** everything you added as a file, or **delete** your account and all of it, at any time.
- A new page stays private until you switch on Publish, and unpublished and missing pages look the same.

## Tech stack

**Frontend**

![Next.js](https://img.shields.io/badge/Next.js-000000?style=flat&logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=flat&logo=tailwindcss&logoColor=white)

**Backend**

![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=flat&logo=express&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=flat&logo=prisma&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-000000?style=flat&logo=jsonwebtokens&logoColor=white)

**Data and services**

![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat&logo=postgresql&logoColor=white)
![Neon](https://img.shields.io/badge/Neon-00E599?style=flat&logo=neon&logoColor=black)
![Cloudinary](https://img.shields.io/badge/Cloudinary-3448C5?style=flat&logo=cloudinary&logoColor=white)
![Gemini](https://img.shields.io/badge/Gemini-8E75B2?style=flat&logo=googlegemini&logoColor=white)

**Shared and tooling**

![Zod](https://img.shields.io/badge/Zod-3E67B1?style=flat&logo=zod&logoColor=white)
![ESLint](https://img.shields.io/badge/ESLint-4B32C3?style=flat&logo=eslint&logoColor=white)
![Prettier](https://img.shields.io/badge/Prettier-F7B93E?style=flat&logo=prettier&logoColor=black)
![npm](https://img.shields.io/badge/npm-CB3837?style=flat&logo=npm&logoColor=white)

It is an npm workspaces monorepo, and the `shared` package holds the Zod schemas that both the frontend and the backend use.

### How it fits together

```
parichay/
├── frontend/   Next.js app: landing page, public portfolio pages, dashboard
├── backend/    Express API, Prisma schema and migrations
├── shared/     Zod schemas and types used by both sides
└── docs/       Brand guide: palette, fonts, logo and voice
```

A few choices worth knowing:

- **The login token lives in an httpOnly cookie.** The browser never calls the API directly. The site forwards requests and attaches the token, so scripts on the page can never read it.
- **Everything is validated on the server** with the shared schemas, and the API never returns password hashes or other people's data.
- **Themes are real components.** Each one receives the whole public profile and draws it. The dashboard preview and the landing page use the same code.
- **Built for a sleepy free-tier backend.** Slow responses show a "waking up" message, reads retry, and a failed save keeps what you typed.
- **Public pages are cached briefly**, and the cache is cleared the moment you save.
- **Safe by default.** Links accept only http(s), email and phone formats. Uploads are checked by their actual contents. Markdown is rendered without raw HTML. Logins and uploads are rate limited per visitor.
- **Accessible.** Built to WCAG 2.2 AA: contrast, visible focus, keyboard support, reduced motion and a skip link.

## Getting started

You need Node 20 or newer and a PostgreSQL database (a free Neon project works). Cloudinary and Gemini keys are optional: without them, uploads and resume import are simply unavailable.

```bash
# 1. Install
npm install

# 2. Configure (each file explains its settings)
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local

# 3. Create the tables
npm run prisma:deploy -w @parichay/backend

# 4. Run everything: API on :4000, site on :3000
npm run dev
```

| Command             | What it does                                     |
| ------------------- | ------------------------------------------------ |
| `npm run dev`       | Builds `shared`, then runs all three in watch    |
| `npm run build`     | Production build of shared, backend and frontend |
| `npm run typecheck` | Type-checks the backend and frontend             |
| `npm run lint`      | ESLint across the repo                           |
| `npm run format`    | Prettier (`format:check` only checks)            |

## Privacy

Parichay keeps your email, your page content and your images, and nothing more. There is no tracking or advertising. The only cookie is the sign-in one. Read the full [Privacy Policy](frontend/src/app/privacy/page.tsx) and [Terms](frontend/src/app/terms/page.tsx).

## License

MIT. See [LICENSE](LICENSE).

<div align="center">

Crafted with care, and a little &#9829;, by [Shehbaz Singh](https://github.com/Shehbaz-Singh)

</div>
