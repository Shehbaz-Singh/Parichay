import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalPage, type LegalSection } from '@/components/landing/LegalPage';

export const metadata: Metadata = {
  title: 'Terms of Use',
  robots: { index: false },
};

const sections: LegalSection[] = [
  {
    id: 'agreement',
    title: 'Who we are and what you agree to',
    content: (
      <>
        <p>
          Parichay (“the service”) lets you build a portfolio page and publish it at your own link.
          It is run by Shehbaz Singh, an individual based in India. By creating an account or using
          the service you agree to these Terms and to our{' '}
          <Link href="/privacy">Privacy Policy</Link>. If you do not agree, please do not use it.
        </p>
        <p>You must be at least 16 to use the service.</p>
      </>
    ),
  },
  {
    id: 'account',
    title: 'Your account',
    content: (
      <ul>
        <li>Give a real email address, and keep your password private.</li>
        <li>You are responsible for what happens under your account.</li>
        <li>
          One person, one account. Please do not make accounts for other people without their
          say-so.
        </li>
        <li>
          You can delete your account at any time in Settings. That erases your account and content.
        </li>
      </ul>
    ),
  },
  {
    id: 'content',
    title: 'Your content stays yours',
    content: (
      <>
        <p>
          What you put on your portfolio (your text, photo, links and so on) belongs to you. We do
          not claim ownership of it.
        </p>
        <p>
          To run the service, you give us permission to store it, process it, and show it as you
          direct: publicly on your page once you publish it, and to the services that help us run
          the service (such as our database and image hosts). That permission ends when you delete
          the content or your account, apart from short-lived backups.
        </p>
        <p>
          You promise that you have the right to share what you post, that it is accurate, and that
          it does not break anyone’s rights or the rules below. If you add a testimonial from
          someone, you are responsible for having their permission and for what it says. If you
          switch on the contact form, you are responsible for how you use the messages you receive
          and the people’s details in them (see “Acceptable use”).
        </p>
        <p>
          If you use resume import, the text of your resume is processed by an AI service. It can
          make mistakes, so read what it produces before you save it. See the Privacy Policy for the
          details.
        </p>
      </>
    ),
  },
  {
    id: 'rules',
    title: 'Acceptable use',
    content: (
      <>
        <p>Please use the service in good faith. You must not:</p>
        <ul>
          <li>break the law, or help anyone else to;</li>
          <li>
            pretend to be someone else, or post false or misleading information about yourself or
            others;
          </li>
          <li>
            post hateful, harassing, threatening, sexually explicit or violent content, or content
            that exploits or endangers children;
          </li>
          <li>
            post other people’s private information, or content that infringes copyright, trademarks
            or other rights;
          </li>
          <li>use your page for spam, scams, phishing, or to spread malware or links to it;</li>
          <li>
            use the contact form’s inbox to harvest visitors’ data, to add people to a list or send
            marketing to someone who only wrote you a message, or to pass their name or email
            address on. A visitor’s address is there so you can reply to what they wrote, and for
            nothing else. Messages are deleted automatically after a set time, and you may not keep
            copies of them for other purposes;
          </li>
          <li>
            attack, overload or probe the service, bypass its limits (such as rate limits), scrape
            it in bulk, or try to get into other people’s accounts or data;
          </li>
          <li>
            use the service to build something that harms it or other users, or resell it without
            our written permission.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: 'removal',
    title: 'When we may remove content or accounts',
    content: (
      <>
        <p>
          We may remove content, unpublish a page, or suspend or close an account if it breaks these
          Terms or the law, if someone credibly reports a problem, or if it puts the service or
          other people at risk. Where we reasonably can, we will tell you why and give you a chance
          to fix it first. We may act immediately when something is harmful or illegal.
        </p>
        <p>
          If we close your account because of a breach, you can ask us for a copy of your data
          before it is deleted, where the law allows. To report a page, contact the person who runs
          the service (see “Contact”).
        </p>
      </>
    ),
  },
  {
    id: 'free',
    title: 'A free service that may change',
    content: (
      <>
        <p>
          The service is free and provided as it is. We may add, change or remove features, set or
          change limits (for example on uploads or sign-ups), or stop the service altogether. If we
          plan to stop it, we will try to give you notice and time to download your data, which you
          can do any time in Settings.
        </p>
      </>
    ),
  },
  {
    id: 'warranty',
    title: 'No warranty',
    content: (
      <>
        <p>
          We work to keep the service running and your data safe, but we do not promise that it will
          always be available, error-free, or free from loss of data. The service is provided “as
          is” and “as available”, without warranties of any kind, to the extent the law allows. Keep
          your own copy of anything important (the data export in Settings makes this easy).
        </p>
        <p>
          We are not responsible for what other users publish, for content on sites you link to, or
          for how third parties use information you choose to make public.
        </p>
      </>
    ),
  },
  {
    id: 'liability',
    title: 'Limit of our responsibility',
    content: (
      <p>
        To the extent the law allows, we are not liable for indirect or consequential losses (such
        as lost opportunities or lost profits) arising from your use of the service, and our total
        liability for any claim is limited to the amount you have paid us, which is nothing, because
        the service is free. Nothing in these Terms limits anything that cannot be limited by law,
        such as responsibility for fraud or for death or personal injury caused by negligence.
      </p>
    ),
  },
  {
    id: 'changes',
    title: 'Changes to these Terms',
    content: (
      <p>
        We may update these Terms. When we do, we will change the date and version at the top. If
        the change matters, we will tell signed-in users in the app. Using the service after a
        change means you accept the new Terms. The version you agreed to when you registered is
        saved with your account.
      </p>
    ),
  },
  {
    id: 'law',
    title: 'Governing law',
    content: (
      <p>
        These Terms are governed by the laws of India, and disputes will be handled by the courts of
        India, unless your local consumer law gives you the right to go elsewhere.
      </p>
    ),
  },
  {
    id: 'contact',
    title: 'Contact',
    content: (
      <p>
        This is a demo project and has no support address yet. For questions about these Terms, or
        to report a page, contact Shehbaz Singh, who runs it.
      </p>
    ),
  },
];

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Use"
      intro={
        <>
          <p className="font-semibold">The short version</p>
          <ul className="mt-2 list-disc space-y-1 ps-5">
            <li>What you put on your page is yours.</li>
            <li>Be honest, be kind, and don’t misuse the service.</li>
            <li>We can remove content or accounts that break the rules.</li>
            <li>The service is free and comes with no guarantees. It may change.</li>
            <li>You can download your data or delete your account whenever you like.</li>
          </ul>
        </>
      }
      sections={sections}
    />
  );
}
