import { ThemeExplorer } from './ThemeExplorer';

const THEMES = [
  ['Editorial', 'A quiet magazine page: serif headings, a drop cap, plenty of space.'],
  ['Bento', 'A grid of rounded tiles that adapt to your content, tinted by your accent.'],
  ['Soft', 'Warm and calm: a centered introduction, a quiet timeline, one tint.'],
  ['Executive', 'A professional two-column resume that prints cleanly.'],
  ['Creative', 'Bold type and a header in your accent color.'],
];

// The same example profile in every theme, drawn live: change the theme or the accent color and
// the page changes with it.
export function Themes() {
  return (
    <section
      id="themes"
      aria-labelledby="themes-heading"
      className="mx-auto max-w-6xl scroll-mt-20 px-5 py-20 sm:px-8"
    >
      <h2 id="themes-heading" className="type-page text-3xl sm:text-4xl">
        Five themes, any accent color
      </h2>
      <p className="mt-4 max-w-2xl text-lg text-muted">
        Every theme shows the same content, so you can switch at any time without retyping. Try them
        on an example profile: pick a theme, then an accent color.
      </p>
      <div className="mt-10">
        <ThemeExplorer idPrefix="themes" withAccents />
      </div>
      <dl className="mt-10 grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-5">
        {THEMES.map(([name, text]) => (
          <div key={name}>
            <dt className="font-display text-lg font-semibold">{name}</dt>
            <dd className="mt-1 text-sm text-muted">{text}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
