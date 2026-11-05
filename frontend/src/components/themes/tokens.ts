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
