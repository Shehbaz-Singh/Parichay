import { FileUp, Palette, Share2 } from 'lucide-react';

const STEPS = [
  {
    Icon: FileUp,
    title: 'Upload your resume or start from scratch',
    text: 'Upload a PDF and what it says is filled in for you to review. Or type your details in yourself.',
  },
  {
    Icon: Palette,
    title: 'Choose a look and make it yours',
    text: 'Pick one of six themes and an accent color. A live preview changes as you type.',
  },
  {
    Icon: Share2,
    title: 'Publish and share your link',
    text: 'Switch on Publish and your page is live at its own address. Copy the link and send it anywhere.',
  },
];

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      aria-labelledby="how-heading"
      className="scroll-mt-20 border-y border-line bg-surface py-20"
    >
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <h2 id="how-heading" className="type-page text-3xl sm:text-4xl">
          How it works
        </h2>
        <ol className="mt-12 grid gap-10 md:grid-cols-3 md:gap-8">
          {STEPS.map(({ Icon, title, text }, i) => (
            <li key={title}>
              <div className="flex items-center gap-4">
                <span
                  aria-hidden="true"
                  className="font-display text-5xl leading-none font-semibold text-accent-fg"
                >
                  {i + 1}
                </span>
                <Icon aria-hidden="true" className="size-6 text-muted" />
              </div>
              <h3 className="type-subsection mt-4 text-xl">
                <span className="sr-only">Step {i + 1}: </span>
                {title}
              </h3>
              <p className="mt-2 text-muted">{text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
