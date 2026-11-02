import { ChevronDown } from 'lucide-react';

export const QUESTIONS = [
  {
    q: 'Is Parichay free to use?',
    a: 'Yes! Parichay is currently free to use. You can create, customize, and publish your portfolio without paying a fee or providing payment details. As the project grows, our pricing may evolve, but we’ll keep things transparent along the way.'
  },
  {
    q: 'Can I control which parts of my portfolio are visible?',
    a: 'Absolutely. You can show or hide individual sections, rename them, and rearrange them to suit your needs. Hiding a section preserves its content, so you can restore it whenever you like. Your portfolio also remains private by default until you choose to publish it.'
  },
  {
    q: 'Who owns my content?',
    a: 'Your content belongs to you. You can edit your portfolio whenever you like and export your data. If you upload a resume PDF, we send its text to an AI service for processing rather than storing the original file. The extracted information is retained only until you choose to save it.'
  },
  {
    q: 'Can I delete my data or account?',
    a: 'Yes. You can manage your data from your account settings and delete your account whenever you choose. Account deletion removes your profile, posts, testimonials, and images. If you’d like to keep a copy of your information, you can export your data before deleting your account.'
  },
  {
    q: 'What does “Parichay” mean?',
    a: 'परिचय (Parichay) is a Hindi word meaning “introduction.” It represents the first impression you make when someone discovers your work, your story, and your achievements. That’s exactly what Parichay helps you create: a personal space to introduce yourself to the world.'
  }
]

// Native <details>: it opens and closes with the keyboard and works without JavaScript.
export function Faq() {
  return (
    <section
      id="faq"
      aria-labelledby="faq-heading"
      className="mx-auto max-w-3xl scroll-mt-20 px-5 pb-20 sm:px-8"
    >
      <h2 id="faq-heading" className="type-page text-3xl sm:text-4xl">
        Questions
      </h2>
      <div className="mt-8 divide-y divide-line border-y border-line">
        {QUESTIONS.map(({ q, a }) => (
          <details key={q} className="group">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 text-lg font-medium [&::-webkit-details-marker]:hidden">
              {q}
              <ChevronDown
                aria-hidden="true"
                className="size-5 shrink-0 text-muted transition-transform group-open:rotate-180"
              />
            </summary>
            <p className="pb-5 text-muted">{a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
