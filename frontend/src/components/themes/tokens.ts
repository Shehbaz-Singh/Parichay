// Class strings that every theme, nav and page template shares, so a change lands everywhere at once.

// The one keyboard focus ring.
export const focusRing =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-fg';
// Break long unbroken text (URLs, emails) instead of overflowing.
export const wrap = '[overflow-wrap:anywhere]';
// The heading font a theme sets through --font-theme-display.
export const display = 'font-(family-name:--font-theme-display)';
// Where the desktop rail replaces the top bar.
export const WIDE = '(min-width: 900px)';
// Sora a little tighter than its default: what makes Bento's large headings look composed.
export const tightDisplay = `${display} tracking-[-0.02em]`;
// The mono face of Creative, for dates and tags.
export const mono = 'font-(family-name:--font-theme-mono)';
// The links of the Editorial and Executive themes (the single page and the pages share them).
export const editorialLink = `ed-underline text-accent-fg ${focusRing}`;
export const executiveLink = `text-accent-fg underline underline-offset-2 hover:no-underline ${focusRing}`;
// A bold underlined accent link, as Sidebar and Soft draw them.
export const strongTextLink = `font-bold text-accent-fg underline underline-offset-4 hover:no-underline ${focusRing}`;
