import type { Metadata } from 'next';
import Link from 'next/link';
import { CONTACT_DEFAULT_RETENTION_DAYS } from '@parichay/shared';
import { LegalPage, type LegalSection } from '@/components/landing/LegalPage';
import { API_URL } from '@/lib/config';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  robots: { index: false },
};

// What this page says about the server comes from the API's own configuration, so it cannot drift
// from what the server really does: the AI service that reads resumes (LLM_PROVIDER; null means
// resume import is switched off, or the API could not be reached: the text then says so), how long
// contact messages are kept (CONTACT_RETENTION_DAYS), and the CAPTCHA of the contact form (null while
// there is none).
async function siteInfo() {
  const fallback = {
    aiProvider: null as string | null,
    retentionDays: CONTACT_DEFAULT_RETENTION_DAYS,
    captcha: null as string | null,
  };
  try {
    const res = await fetch(`${API_URL}/public/_info`, {
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return fallback;
    const body = (await res.json()) as {
      aiProvider?: string | null;
      contactRetentionDays?: number;
      captchaProvider?: string | null;
    };
    return {
      aiProvider: body.aiProvider ?? null,
      retentionDays: body.contactRetentionDays ?? fallback.retentionDays,
      captcha: body.captchaProvider ?? null,
    };
  } catch {
    return fallback;
  }
}

export default async function PrivacyPage() {
  const { aiProvider: provider, retentionDays, captcha } = await siteInfo();

  const sections: LegalSection[] = [
    {
      id: 'who',
      title: 'Who we are',
      content: (
        <>
          <p>
            Parichay (“we”, “us”) lets you build a portfolio page and publish it at your own link.
            The service is run by Shehbaz Singh, an individual based in India.
          </p>
          <p>
            This is a demo project, so there is no support email yet. See “Contact” at the end of
            this policy for how to reach the person who runs it.
          </p>
          <p>This is a small project run by one person.</p>
        </>
      ),
    },
    {
      id: 'data',
      title: 'What we collect',
      content: (
        <>
          <p>Only what you give us to run your account and your page:</p>
          <ul>
            <li>
              <strong>Your account:</strong> your email address and a password. We never store your
              password itself, only a scrambled version (a salted hash) that cannot be turned back
              into the password. We also record when you agreed to the Terms and Privacy Policy, and
              which version.
            </li>
            <li>
              <strong>Your portfolio content:</strong> everything you type into the dashboard: your
              name, tagline, About text, location, links (including any email address or phone
              number you add), skills, jobs, projects, education, your own custom sections, the
              posts and article links you write (drafts included), your page address, and your
              choices of theme, accent color and availability badge.
            </li>
            <li>
              <strong>Your photo,</strong> if you upload one (JPG, PNG or WebP, up to 2 MB). We crop
              it to a square and keep a 400 × 400 pixel copy. The same goes for the optional cover
              image of a post (cropped to 1200 × 630).
            </li>
            <li>
              <strong>Testimonials,</strong> if you let visitors send them: the name, role, company
              and message a visitor writes, and an email address if they choose to give one. They
              wait for your approval, and the email is only ever shown to you.
            </li>
            <li>
              <strong>Your link-in-bio card,</strong> if you switch it on: the buttons you write
              (their text and the address each goes to) and a few choices (its look, and which
              optional buttons it shows). The card itself holds nothing else: it is made fresh from
              what your page already shows, and the account email is never in it.
            </li>
            <li>
              <strong>Contact messages,</strong> if you switch on the contact form: the name, email
              address, optional subject and message a visitor writes. Only you can see them, in your
              dashboard (see “Messages sent through a contact form” below).
            </li>
            <li>
              <strong>Your contact card,</strong> if you switch on “Let visitors save my contact
              card”: a small file (.vcf) that your page offers through an “Add to contacts” button.
              It is made fresh from your page each time and holds only what you chose to show: your
              name, your tagline, your page address, the place you list, and the email, phone and
              other links you have not hidden. Your photo is in it only if you also switch on
              “Include my photo”. Links you hide are never in it. Anyone who opens your page can
              save this card, so check the preview in your dashboard first.
            </li>
            <li>
              <strong>Technical data:</strong> when you use the site, your internet address (IP) is
              used briefly to limit abuse (see “Cookies, storage and analytics” below).
            </li>
          </ul>
          <p>
            We do not ask for payment details, because the service is free, and we do not send you
            marketing email.
          </p>
        </>
      ),
    },
    {
      id: 'resumes',
      title: 'Resumes and AI processing',
      content: (
        <>
          <p>Resume import is optional. If you upload a PDF, here is exactly what happens:</p>
          <ul>
            <li>
              Our server reads the text out of the PDF in memory. The file itself is{' '}
              <strong>not stored</strong>: it is not saved to disk or to our database, and we do not
              log its contents.
            </li>
            <li>
              That text is sent to {provider ? <strong>{provider}</strong> : 'an AI provider'} to be
              turned into structured details (name, jobs, skills and so on).
            </li>
            <li>
              The result comes back to you to check and edit. Nothing from it is saved to your
              account until you save it yourself. AI can make mistakes, so please read it before
              saving.
            </li>
          </ul>
          <p>
            The AI provider processes the text under its own terms and privacy policy, and may keep
            it for a period. Some providers, especially on free plans, may use submitted content to
            improve their products. For example, with Google’s free Gemini plan, Google may use what
            you send to improve its products, and people at Google may read it. Please don’t upload
            a resume you wouldn’t be comfortable sharing on those terms.
          </p>
          <p>
            Only the text of the resume is sent for this feature. Nothing else from your account is
            sent to an AI provider.
          </p>
        </>
      ),
    },
    {
      id: 'public',
      title: 'Your public page',
      content: (
        <>
          <p>
            <strong>Your page is private until you publish it.</strong> Once you switch on
            “Published”, anyone with the link can see it, and search engines can find it. Visible on
            a published page:
          </p>
          <ul>
            <li>your name, tagline, About text, location and photo;</li>
            <li>
              the links you have chosen to show (including an email address or phone number, if you
              show one);
            </li>
            <li>
              your skills, jobs, projects, education, custom sections and the posts you have
              published, unless you hide them (drafts are never shown);
            </li>
            <li>your availability badge, if you switch it on;</li>
            <li>
              a short link-in-bio card at <code>/your-name/links</code>, if you switch it on. It
              shows your name, photo, tagline, place, availability badge, the links you show, your
              own buttons, and buttons for the features you have on (contact form, contact card,
              resume, share). Hidden links and anything you have switched off are not in it. It is
              kept out of search engines, but anyone with the link can open it;
            </li>
            <li>
              a “Send a message” form, if you switch on the contact form. The form never shows your
              email address, and what visitors write is not published;
            </li>
            <li>
              testimonials you have approved: the author’s name, role, company and message (never
              their email).
            </li>
          </ul>
          <p>
            Hidden sections and hidden links are not sent to visitors at all. Your account email,
            password and unpublished drafts are never shown.
          </p>
          <p>
            If you unpublish or delete your page, it stops being served by us within about a minute.
            We cannot remove copies that other sites, search engines or visitors have already made.
          </p>
        </>
      ),
    },
    {
      id: 'messages',
      title: 'Messages sent through a contact form',
      content: (
        <>
          <p>
            A portfolio owner can switch on a contact form. If you are a visitor who uses one, this
            is what happens:
          </p>
          <ul>
            <li>
              <strong>What is collected:</strong> your name, your email address, an optional subject
              and your message, as you type them, and the time you sent it. Nothing else about you
              is stored with it: no IP address, no browser details.
            </li>
            <li>
              <strong>Who can see it:</strong> only the owner of that page, when they open their
              dashboard. It is not published anywhere, and Parichay does not read it, sell it or use
              it for anything else. <strong>No email is sent</strong> by Parichay, either to the
              owner or to you: the owner finds your message when they open their dashboard, and may
              reply from their own email app. We cannot promise that they will read it or reply.
            </li>
            <li>
              <strong>What your email address is for:</strong> only so the owner can reply to you.
              Owners agree not to use it to build lists, to send marketing, or to pass it on (see
              the Terms).
            </li>
            <li>
              <strong>How long it is kept:</strong> {retentionDays} days. After that it is deleted
              automatically. The owner can delete it sooner, and it is deleted if the owner deletes
              their account. If you want a message removed earlier, ask the owner, or the person who
              runs the service (see “Contact”).
            </li>
            <li>
              <strong>Keeping spam out, without tracking you:</strong> the form has a field people
              never see, which only automated programs fill in; it notes when the form was opened,
              so that one sent faster than a person can write is dropped; and the server counts how
              many messages come from one address. That count is kept only in the server’s memory,
              under a scrambled version of the address that is made with a secret that changes every
              day, so it is not written to the database or to our logs, and it cannot be traced back
              to you or matched from one day to the next. It starts again when the server restarts.
              {captcha ? (
                <>
                  {' '}
                  The form also uses <strong>{captcha}</strong>, a privacy-friendly check from
                  Cloudflare that confirms you are a person. It is loaded only when you open the
                  form, and Cloudflare receives your IP address and some browser details to run the
                  check, under its own privacy policy.
                </>
              ) : (
                <> The form does not use a CAPTCHA or any outside service.</>
              )}
            </li>
          </ul>
        </>
      ),
    },
    {
      id: 'providers',
      title: 'Who else handles your data',
      content: (
        <>
          <p>
            We use a few other companies to run the service. They handle data only for that purpose:
          </p>
          <ul>
            <li>
              <strong>Neon</strong> (database): stores your account and portfolio content. Our
              database runs in Singapore (AWS region ap-southeast-1).
            </li>
            <li>
              <strong>Cloudinary</strong> (images): stores and delivers your photo and post cover
              images. Visitors’ browsers load the photo from Cloudinary, so Cloudinary sees their IP
              address when they do. The same goes for an email signature you make with the signature
              generator: it is built in your browser, and nothing is stored or sent anywhere. Once
              you paste it into your email, the people who open your messages load your photo from
              Cloudinary and the badge from this site, and so those two can see their IP address
              when they do. Many mail apps block such images until the reader allows them. The
              signature has no tracking of any kind.
            </li>
            <li>
              <strong>{provider ?? 'The AI provider'}</strong> (resume reading): receives resume
              text, as described above.
            </li>
            {captcha && (
              <li>
                <strong>Cloudflare</strong> ({captcha}, spam protection): when a visitor opens the
                contact form, their browser loads a small check from Cloudflare, which sees their IP
                address and browser details. It does not receive the message.
              </li>
            )}
            <li>
              <strong>Hosting:</strong> the website and the server behind it run on our hosting
              providers. Hosting providers see requests and keep ordinary server logs.
            </li>
          </ul>
          <p>We do not sell your data, and we do not share it with advertisers.</p>
          <p>
            Your data is handled by providers in other countries (the database is in Singapore).
          </p>
        </>
      ),
    },
    {
      id: 'storage',
      title: 'Cookies, storage and analytics',
      content: (
        <>
          <p>
            <strong>Analytics:</strong> the app has no analytics. We do not count page views, track
            visitors, use advertising or tracking scripts, or build profiles of anyone. Your page’s
            visitors are not tracked by us.
          </p>
          <p>
            <strong>Cookies and browser storage.</strong> This is everything we put in your browser:
          </p>
          <ul>
            <li>
              <strong>One cookie, “session”:</strong> keeps you signed in. It is needed for the
              dashboard to work, only readable by our servers (not by page scripts), and expires
              after your login does (7 days by default). It is set only if you log in or register.
            </li>
            <li>
              <strong>Two small notes in your browser’s local storage</strong> (“onboarding-done”
              and “celebrated”, each tied to your profile): they remember that you have already seen
              the welcome tour and the first-publish message, so we don’t show them again. They
              never leave your browser.
            </li>
          </ul>
          <p>
            <strong>On a published page,</strong> if a visitor opens “Reading preferences” and
            changes something, their choices (text size, font, line spacing, motion) are kept in one
            small note in their own browser’s local storage (“parichay:reading-prefs”). It never
            leaves their browser, is not a cookie, and is used only to show the page the way they
            asked. If a portfolio shows an announcement bar and a visitor closes it, a second small
            note is kept in the tab’s session storage (“parichay:announcement:” followed by that
            portfolio’s address): it holds the version of the announcement that was closed and when,
            so the bar stays closed for the rest of the visit. It is gone when the tab is closed,
            never leaves their browser and is not a cookie. Downloading a contact card or a resume
            stores nothing about the visitor: we do not record who downloaded it, and the contact
            card contains only what the owner chose to show.
          </p>
          <p>
            The link-in-bio card works like the portfolio page: it sets no cookies and has no
            analytics, so button clicks are not counted. The clock on it uses the visitor’s device
            time and stores nothing.
          </p>
          <p>
            Using a contact form stores nothing in the visitor’s browser either: what they type is
            sent when they press “Send” and is not kept in their browser.
          </p>
          <p>
            Visitors to a published page get no cookies from us. We do not use the cookies or
            storage above for tracking, so we do not show a cookie banner.
          </p>
          <p>
            <strong>IP addresses.</strong> To stop abuse (such as password guessing or spam), the
            server counts requests per IP address for a short time, in memory, and does not save it
            to the database. Our hosting providers may also log IP addresses as part of normal
            operation.
          </p>
        </>
      ),
    },
    {
      id: 'retention',
      title: 'How long we keep things',
      content: (
        <ul>
          <li>
            <strong>Your account and portfolio:</strong> until you delete your account.
          </li>
          <li>
            <strong>Deleting your account</strong> (Settings → Delete account) removes your account
            and everything under it from our database straight away, and removes your photo and
            cover images from Cloudinary. Your public page stops working at once.
          </li>
          <li>
            <strong>Backups:</strong> our database provider may keep backups for a while after
            deletion.
          </li>
          <li>
            <strong>Resume files:</strong> not kept. The text is held in memory while it is being
            read, then discarded.
          </li>
          <li>
            <strong>Testimonials:</strong> kept in your account, including pending and rejected
            ones, until you delete them or your account.
          </li>
          <li>
            <strong>Link-in-bio buttons and choices:</strong> in your account until you change or
            delete them, or delete your account.
          </li>
          <li>
            <strong>Contact messages:</strong> {retentionDays} days, then they are deleted
            automatically (the clean-up runs every few hours and whenever the server starts). The
            owner can delete them sooner. They are deleted with the account too.
          </li>
          <li>
            <strong>Server logs:</strong> kept by our hosts for a limited time. We try not to put
            personal data in our own logs.
          </li>
        </ul>
      ),
    },
    {
      id: 'rights',
      title: 'Your rights and choices',
      content: (
        <>
          <p>You are in control of your data. In the dashboard’s Settings page you can:</p>
          <ul>
            <li>
              <strong>See and correct it:</strong> everything we hold is in your dashboard, and you
              can edit it any time.
            </li>
            <li>
              <strong>Export it:</strong> “Download my data” gives you a JSON file with your account
              email, profile, every section, custom sections, posts (drafts included), testimonials,
              the contact messages still stored, your link-in-bio buttons and settings. (There is no
              analytics data to include, because we do not collect any.)
            </li>
            <li>
              <strong>Delete it:</strong> “Delete account” erases your account and all your content.
              It cannot be undone.
            </li>
          </ul>
          <p>
            Depending on where you live, you may also have the right to object to or restrict how we
            use your data, to move it elsewhere, to withdraw consent, and to complain to your data
            protection authority. To use any of these, or if something above does not work, get in
            touch with the person who runs the service (see “Contact”).
          </p>
        </>
      ),
    },
    {
      id: 'security',
      title: 'Keeping data safe',
      content: (
        <p>
          Passwords are stored only as salted hashes. You stay signed in with a cookie that page
          scripts cannot read. Connections are encrypted, and resume text and testimonials are
          handled as described above. No system is perfectly secure, so please use a password you do
          not use elsewhere. If we learn of a breach affecting you, we will tell you as the law
          requires.
        </p>
      ),
    },
    {
      id: 'children',
      title: 'Children',
      content: (
        <p>
          The service is not meant for children. The service is for people aged 16 and over. If you
          believe a child has made an account, contact us and we will delete it.
        </p>
      ),
    },
    {
      id: 'changes',
      title: 'Changes to this policy',
      content: (
        <p>
          If we change this policy in a way that matters, we will update the date at the top and
          tell signed-in users in the app. The version you agreed to when you registered is saved
          with your account.
        </p>
      ),
    },
    {
      id: 'contact',
      title: 'Contact',
      content: (
        <p>
          This is a demo project and has no support address yet. For questions or requests about
          your data, contact Shehbaz Singh, who runs it. You can also read our{' '}
          <Link href="/terms">Terms of Use</Link>.
        </p>
      ),
    },
  ];

  return (
    <LegalPage
      title="Privacy Policy"
      intro={
        <>
          <p className="font-semibold">The short version</p>
          <ul className="mt-2 list-disc space-y-1 ps-5">
            <li>We keep your email, your portfolio content and your photo, and nothing more.</li>
            <li>
              A resume you upload is read and not stored. Its text goes to an AI provider to be
              turned into details you review.
            </li>
            <li>
              Your page is public only after you publish it, and you can unpublish it any time.
            </li>
            <li>We have no analytics and no advertising. We do not sell your data.</li>
            <li>You can download all your data or delete your account yourself, in Settings.</li>
          </ul>
        </>
      }
      sections={sections}
    />
  );
}
