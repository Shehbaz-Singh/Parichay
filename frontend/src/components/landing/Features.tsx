import {
  BadgeCheck,
  FileUp,
  LayoutList,
  MessageSquareQuote,
  Palette,
  PenLine,
  QrCode,
  ShieldCheck,
} from 'lucide-react';

const FEATURES = [
  {
    Icon: FileUp,
    title: 'Resume import',
    text: 'Upload a PDF and review what was found. Nothing is saved until you say so, and the PDF itself is not stored.',
  },
  {
    Icon: Palette,
    title: 'Themes and accent colors',
    text: 'Five themes and any accent color. Text colors adjust so your page stays readable.',
  },
  {
    Icon: LayoutList,
    title: 'Custom sections',
    text: 'Add sections of your own, under any heading you like, such as talks or interests. Show, hide, rename and reorder any section.',
  },
  {
    Icon: PenLine,
    title: 'Writing',
    text: 'Publish short posts in Markdown, or link to articles you wrote elsewhere. Each post gets its own page.',
  },
  {
    Icon: MessageSquareQuote,
    title: 'Testimonials',
    text: 'Let visitors leave a testimonial and approve each one before it appears. Their email is never shown.',
  },
  {
    Icon: QrCode,
    title: 'QR code and share link',
    text: 'Your page has its own address, a copy button and a share menu. Download a QR code for a printed resume.',
  },
  {
    Icon: BadgeCheck,
    title: 'Availability badge',
    text: 'Say you are open to work, freelance or collaboration, with a short message of your own. Switch it off any time.',
  },
  {
    Icon: ShieldCheck,
    title: 'Your data',
    text: 'Export everything you have added as a file, or delete your account and all of it, at any time.',
  },
];

export function Features() {
  return (
    <section
      id="features"
      aria-labelledby="features-heading"
      className="scroll-mt-20 border-y border-line bg-surface py-20"
    >
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <h2 id="features-heading" className="type-page text-3xl sm:text-4xl">
          What you get
        </h2>
        <ul className="mt-12 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map(({ Icon, title, text }) => (
            <li key={title}>
              <Icon aria-hidden="true" className="size-6 text-accent-fg" />
              <h3 className="type-subsection mt-3 text-lg">{title}</h3>
              <p className="mt-2 text-muted">{text}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
