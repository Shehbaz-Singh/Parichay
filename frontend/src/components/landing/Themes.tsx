import { ThemeExplorer } from './ThemeExplorer';

const THEMES = [
  ['Executive', 'A resume-like page: a dark sidebar, dense text led by Experience. Prints cleanly.'],
  ['Editorial', 'A quiet magazine page on warm paper with a narrow reading column.'],
  ['Soft', 'Warm and calm: a centered introduction, a quiet timeline, dark ink throughout.'],
  ['Bento', 'Rounded tiles on a cool page, with Experience as one full-width list.'],
  ['Creative', 'Bold type, a slanted header band in your accent and offset shadows.'],
  ['Sidebar', 'A dark side rail beside an airy page, with Experience in a band of your accent.'],
  ['Aurora', 'One soft glow of your accent behind the introduction. Dark or light.'],
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
        Seven themes, any accent color
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
