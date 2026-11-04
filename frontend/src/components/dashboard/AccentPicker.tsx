'use client';

import { useFormContext, useWatch } from 'react-hook-form';
import { DEFAULT_ACCENT } from '@parichay/shared';
import { ACCENT_PRESETS, normalizeHex } from '@/lib/color';
import { HEAVY_SHIFT, themeColors } from '@/lib/palette';
import { getTheme } from '@/lib/themes';
import { Card, ErrorText, Input } from '../ui';

// Choose the page's accent color: 8 swatches, the browser's color picker, or a typed hex code.
// All three write the form's `accentColor` field, which the live preview shows at once. A color
// that cannot be read as text on the chosen theme is still allowed: buttons and the header use it
// as it is, and links and tags use the nearest readable shade (see readableAccent).
export function AccentPicker() {
  const { control, register, setValue } = useFormContext<{ accentColor: string; theme: string }>();
  const value = useWatch({ control, name: 'accentColor' });
  const theme = getTheme(useWatch({ control, name: 'theme' }));
  const hex = normalizeHex(value);
  // How far the theme had to move this color (in lightness) to read as text and as a button: any move is
  // told to the owner, a big one more firmly. The check is the one the public page uses (lib/palette).
  const shift = hex ? themeColors(theme.key, hex).accentShift : 0;
  const adjusted = shift > 0;
  const heavy = shift > HEAVY_SHIFT;
  const set = (next: string) =>
    setValue('accentColor', next, { shouldDirty: true, shouldValidate: true });

  return (
    <fieldset className="space-y-3">
      <legend className="mb-1 text-sm font-medium">Accent color</legend>

      <div className="flex flex-wrap gap-2">
        {ACCENT_PRESETS.map((preset) => (
          <label key={preset.hex} className="cursor-pointer">
            <input
              type="radio"
              name="accent-preset"
              className="peer sr-only"
              checked={hex === preset.hex}
              onChange={() => set(preset.hex)}
            />
            <span
              style={{ backgroundColor: preset.hex }}
              className="block size-8 rounded-full ring-ink ring-offset-2 ring-offset-page peer-checked:ring-2 peer-focus-visible:ring-2"
            />
            <span className="sr-only">{preset.name}</span>
          </label>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <input
          type="color"
          aria-label="Pick a custom color"
          value={hex ?? DEFAULT_ACCENT}
          onChange={(e) => set(e.target.value)}
          className="h-10 w-12 cursor-pointer rounded-control border border-line bg-page p-1"
        />
        <Input
          {...register('accentColor')}
          aria-label="Hex color code"
          aria-invalid={!hex}
          aria-describedby={hex ? undefined : 'accent-error'}
          maxLength={7}
          spellCheck={false}
          autoCapitalize="none"
          autoComplete="off"
          className="w-28 font-mono"
        />
      </div>

      {/* Shown as soon as the value is not a full #RRGGBB, not only after a save attempt. */}
      <ErrorText id="accent-error">{hex ? undefined : 'Use a hex color like #2563eb.'}</ErrorText>
      {adjusted && (
        <Card tone="warning" padding="sm" role="status" className="text-sm">
          {heavy ? (
            <>
              This color is too {theme.scheme === 'dark' ? 'dark' : 'light'} to read on the{' '}
              {theme.name} theme, so the page uses a noticeably{' '}
              {theme.scheme === 'dark' ? 'lighter' : 'different'} shade for text, links and buttons.
              Pick a mid-tone for a closer match.
            </>
          ) : (
            <>
              This color is a little too {theme.scheme === 'dark' ? 'dark' : 'light'} to read as
              text on the {theme.name} theme, so links, tags and buttons use a nearby shade that
              stays readable.
            </>
          )}
        </Card>
      )}
    </fieldset>
  );
}
