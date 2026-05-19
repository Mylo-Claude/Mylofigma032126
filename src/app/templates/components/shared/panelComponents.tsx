/**
 * @file templates/components/shared/panelComponents.tsx
 * @role Shared UI primitives used by all Template Editor panels.
 * @owns StackedField, DimensionInput, ColorField layout helpers;
 *       font-weight option helpers.
 *
 * Consolidated from ParagraphStylePanel, CharacterStylePanel, ListStylePanel
 * (identical copies in each), and PageSetupPanel (StackedField only) during
 * Phase 5B pre-Step-5 cleanup to prevent a 4th copy appearing in Step 5.
 *
 * @governance Template Editor only
 */

import { useEffect, useMemo, useState } from 'react';
import type { ChangeEvent } from 'react';
import { Input } from '../../../components/ui/input';
import {
  ensureFontMetadataLoaded,
  getAvailableFontWeights,
  getClosestAvailableWeight,
  getFontWeightLabel,
  subscribeToFontMetadata,
} from '../../utils/googleFonts';
import type { FontStyle } from '../../utils/googleFonts';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export function useFontWeightOptions(
  fontFamily: string,
  fontStyle: FontStyle,
  currentWeight: string,
  onWeightChange: (value: string) => void,
) {
  const [metadataVersion, setMetadataVersion] = useState(0);

  useEffect(() => {
    let isMounted = true;
    const unsubscribe = subscribeToFontMetadata(() => {
      if (isMounted) setMetadataVersion((version) => version + 1);
    });

    ensureFontMetadataLoaded().then(() => {
      if (isMounted) setMetadataVersion((version) => version + 1);
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const options = useMemo(() => {
    void metadataVersion;
    return getAvailableFontWeights(fontFamily, fontStyle).map((weight) => ({
      value: String(weight),
      label: getFontWeightLabel(weight),
    }));
  }, [fontFamily, fontStyle, metadataVersion]);

  useEffect(() => {
    if (options.length === 0) return;

    const hasCurrentWeight = options.some((option) => option.value === currentWeight);
    if (hasCurrentWeight) return;

    const closestWeight = String(getClosestAvailableWeight(fontFamily, currentWeight, fontStyle));
    console.warn(
      `[Template Editor] Font weight ${currentWeight || 'unset'} is not available for ${fontFamily || 'the selected font'} (${fontStyle}); using ${closestWeight}.`,
    );
    onWeightChange(closestWeight);
  }, [currentWeight, fontFamily, fontStyle, onWeightChange, options]);

  return options;
}

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
