/**
 * @file templates/components/shared/panelComponents.tsx
 * @role Shared UI primitives used by all Template Editor panels.
 * @owns StackedField, DimensionInput, ColorField layout helpers;
 *       FONT_WEIGHT_OPTIONS and FONT_FAMILY_HELPER_TEXT constants.
 *
 * Consolidated from ParagraphStylePanel, CharacterStylePanel, ListStylePanel
 * (identical copies in each), and PageSetupPanel (StackedField only) during
 * Phase 5B pre-Step-5 cleanup to prevent a 4th copy appearing in Step 5.
 *
 * @governance Template Editor only
 */

import type { ChangeEvent } from 'react';
import { Input } from '../../../components/ui/input';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const FONT_WEIGHT_OPTIONS = [
  { value: '100', label: 'Thin (100)' },
  { value: '200', label: 'Extra Light (200)' },
  { value: '300', label: 'Light (300)' },
  { value: '400', label: 'Regular (400)' },
  { value: '500', label: 'Medium (500)' },
  { value: '600', label: 'Semi Bold (600)' },
  { value: '700', label: 'Bold (700)' },
  { value: '800', label: 'Extra Bold (800)' },
  { value: '900', label: 'Black (900)' },
] as const;

/**
 * Temporary affordance shown below the Font Family input until the Google
 * Fonts picker is added in Step 5. Remove when the picker replaces the input.
 */
export const FONT_FAMILY_HELPER_TEXT =
  'Type any system font or font name. Google Fonts picker coming soon.' as const;

// ---------------------------------------------------------------------------
// Layout helpers
// ---------------------------------------------------------------------------

/** Width of compact dimension inputs (Size, Line Height, Tracking).
 *  52px fits 3-4 digit values comfortably at text-xs. */
const DIM_INPUT_WIDTH = 'w-[52px]' as const;

/** Label above + content below. */
export function StackedField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-mylo-text-secondary">{label}</span>
      {children}
    </div>
  );
}

/** Number + "pt" unit pair. `small` renders a max-52px input for compact three-in-a-row layouts. */
export function DimensionInput({
  value,
  onChange,
  placeholder,
  disabled,
  small,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
  small?: boolean;
}) {
  return (
    <div className="flex items-center gap-1">
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? '—'}
        className={`h-7 text-xs ${small ? DIM_INPUT_WIDTH : 'w-16'}`}
        inputMode="decimal"
        disabled={disabled}
      />
      <span
        className={`text-xs text-mylo-text-tertiary${disabled ? ' opacity-40' : ''}`}
      >
        pt
      </span>
    </div>
  );
}

/** Color swatch + hidden color input + hex text input. */
export function ColorField({
  value,
  onChange,
  disabled,
  inputRef,
}: {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  inputRef: React.RefObject<HTMLInputElement | null>;
}) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        className="size-6 rounded border border-mylo-border-light shrink-0 disabled:opacity-40"
        style={{ backgroundColor: value }}
        onClick={() => inputRef.current?.click()}
        aria-label="Open color picker"
        disabled={disabled}
      />
      <input
        ref={inputRef}
        type="color"
        className="sr-only"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      />
      <Input
        value={value}
        onChange={(e: ChangeEvent<HTMLInputElement>) => {
          const val = e.target.value;
          if (/^#[0-9a-fA-F]{0,6}$/.test(val)) onChange(val);
        }}
        className="h-7 text-xs font-mono w-24"
        maxLength={7}
        disabled={disabled}
      />
    </div>
  );
}
