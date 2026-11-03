// Shown at once while the next page of a portfolio is made on the server, so moving between pages answers
// the tap immediately instead of looking stuck. It is a thin bar under the top of the screen, not a page
// of placeholders: the page that arrives replaces it without a layout jump. No motion when the visitor
// asks for less.
export default function Loading() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-0 top-0 z-50 h-1 overflow-hidden"
    >
      <span className="sr-only">Loading</span>
      <span className="block h-full w-1/3 bg-current text-[#9e3d21] motion-safe:animate-[portfolio-load_1s_ease-in-out_infinite] motion-reduce:w-full motion-reduce:opacity-40" />
    </div>
  );
}
