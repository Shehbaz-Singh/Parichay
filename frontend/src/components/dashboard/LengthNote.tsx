// A soft nudge under a section's title about how much a visitor will read. Never a limit: the page
// folds the extra behind "more", and everything is still there.
export function LengthNote({
  count,
  noun,
  advice,
}: {
  count: number;
  noun: string; // "projects"
  advice: string; // "Most visitors read about 3 to 5."
}) {
  if (count === 0) return null;
  return (
    <p className="text-sm text-muted">
      {count} {count === 1 ? noun.replace(/s$/, '') : noun} so far. {advice}
    </p>
  );
}
