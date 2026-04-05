/**
 * @file templates/ParagraphStylePanel.tsx
 * @role Left panel — generic paragraph style property editor
 * @owns Renders the paragraph style property panel for any paragraph style
 *       (Body, Heading 1, Heading 2, Heading 3) based on the `styleKey` prop.
 *       • Breadcrumb header  (← All Styles / <Style Name>)
 *       • Six collapsible accordions:
 *           1. Typography  — Font Family, Weight, Style, Size/LineHeight/Tracking,
 *                            Alignment, Case
 *           2. Character Color — Color swatch + hex input
 *           3. Spacing     — Space Before/After, Left/Right Indent, First Line
 *           4. Rule Above  — enable toggle, Weight/V.Offset, Left/Right Indent, Color
 *           5. Rule Below  — same structure as Rule Above
 *           6. Style Summary — read-only two-column property grid
 *       • Pinned preview toggle bar
 *       • Save / Cancel footer
 * @does-not-own Template persistence (TemplateContext), style conversion
 *               (styleConversions.ts), orchestrator state (TemplateEditorPage).
 *
 * All field changes call onChange with a full new BodyStyleDraft — no internal
 * draft state. The parent owns the draft.
 *
 * @governance Template Editor only
 * @see TemplateEditorPage.tsx — orchestrator; passes draft and handlers
 * @see templates/types/styleEditor.ts — BodyStyleDraft interface
 * @see templates/utils/styleConversions.ts — updateDraftBodyStyle helper
 * @see templates/constants/stylePropertyMap.ts — STYLE_LABELS, ParagraphStyleKey
 */

import { useRef, useCallback } from 'react';
import type { ChangeEvent } from 'react';
import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
} from 'lucide-react';

import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '../components/ui/accordion';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Checkbox } from '../components/ui/checkbox';
import { Label } from '../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';

import type { BodyStyleDraft } from './types/styleEditor';
import type { ParagraphStyleKey } from './constants/stylePropertyMap';
import { STYLE_LABELS } from './constants/stylePropertyMap';
import { updateDraftBodyStyle } from './utils/styleConversions';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const FONT_WEIGHT_OPTIONS = [
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

const TEXT_TRANSFORM_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: 'uppercase', label: 'Uppercase' },
  { value: 'lowercase', label: 'Lowercase' },
  { value: 'capitalize', label: 'Capitalize' },
  { value: 'small-caps', label: 'Small Caps' },
] as const;

const ALIGN_OPTIONS = [
  { value: 'left', Icon: AlignLeft, label: 'Left' },
  { value: 'center', Icon: AlignCenter, label: 'Center' },
  { value: 'right', Icon: AlignRight, label: 'Right' },
  { value: 'justify', Icon: AlignJustify, label: 'Justify' },
] as const;

/**
 * Width of compact dimension inputs (Size, Line Height, Tracking).
 * 52px fits 3-4 digit values comfortably at text-xs.
 */
const DIM_INPUT_WIDTH = 'w-[52px]' as const;

/**
 * Temporary affordance shown below the Font Family input until the Google
 * Fonts picker is added in Step 5. Remove when the picker replaces the input.
 */
const FONT_FAMILY_HELPER_TEXT =
  'Type any system font or font name. Google Fonts picker coming soon.' as const;

// ---------------------------------------------------------------------------
// Internal layout helpers
// ---------------------------------------------------------------------------

/** Label above + content below. */
function StackedField({
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
function DimensionInput({
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
function ColorField({
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

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ParagraphStylePanelProps {
  /** Which paragraph style this panel is editing — controls breadcrumb label. */
  styleKey: ParagraphStyleKey;
  /** Current draft state. Parent owns this; all changes call onChange. */
  draft: BodyStyleDraft;
  onChange: (draft: BodyStyleDraft) => void;
  /** Persists current draftTemplate to TemplateContext. Same action as top-bar Save. */
  onSave: () => void;
  /** Close the panel; draft changes are retained in draftTemplate. */
  onCancel: () => void;
  /** When true, specimen renders from draftTemplate (live changes). */
  showPreview: boolean;
  onShowPreviewChange: (showPreview: boolean) => void;
}

// ---------------------------------------------------------------------------
// ParagraphStylePanel
// ---------------------------------------------------------------------------

export function ParagraphStylePanel({
  styleKey,
  draft,
  onChange,
  onSave,
  onCancel,
  showPreview,
  onShowPreviewChange,
}: ParagraphStylePanelProps) {
  const colorInputRef = useRef<HTMLInputElement>(null);
  const ruleAboveColorRef = useRef<HTMLInputElement>(null);
  const ruleBelowColorRef = useRef<HTMLInputElement>(null);

  /** Produce a new draft with a single field updated via the pure helper. */
  const set = useCallback(
    <K extends keyof BodyStyleDraft>(key: K, value: BodyStyleDraft[K]) => {
      onChange(updateDraftBodyStyle(draft, { [key]: value }));
    },
    [draft, onChange],
  );

  // ---------------------------------------------------------------------------
  // Style Summary computed values
  // ---------------------------------------------------------------------------

  const summaryWeight =
    FONT_WEIGHT_OPTIONS.find((o) => o.value === draft.fontWeight)?.label ??
    draft.fontWeight ??
    '—';
  const summaryStyle = draft.fontStyle === 'italic' ? 'Italic' : 'Normal';
  const summaryCase =
    TEXT_TRANSFORM_OPTIONS.find(
      (o) => o.value === (draft.textTransform || 'none'),
    )?.label ?? '—';
  const summaryAlign =
    ALIGN_OPTIONS.find((o) => o.value === draft.textAlign)?.label ?? '—';

  const styleName = STYLE_LABELS[styleKey];
  const previewId = `para-preview-toggle-${styleKey}`;
  const ruleAboveId = `para-rule-above-${styleKey}`;
  const ruleBelowId = `para-rule-below-${styleKey}`;

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* ── Breadcrumb header ── */}
      <div className="px-4 py-2.5 border-b border-mylo-border-light shrink-0 flex items-center gap-1.5">
        <button
          type="button"
          onClick={onCancel}
          className="flex items-center gap-0.5 text-xs text-mylo-text-secondary hover:text-mylo-text-primary transition-colors"
        >
          ← All Styles
        </button>
        <span className="text-xs text-mylo-text-tertiary">/</span>
        <span className="text-xs font-semibold text-mylo-text-primary">{styleName}</span>
      </div>

      {/* ── Accordion body (scrollable) ── */}
      <div className="flex-1 overflow-y-auto">
        <Accordion
          type="single"
          collapsible
          defaultValue="typography"
          className="w-full"
        >

          {/* ══ 1. Typography ══ */}
          <AccordionItem value="typography" className="border-b border-mylo-border-light">
            <AccordionTrigger className="px-4 py-2 text-xs font-semibold text-mylo-text-secondary hover:no-underline hover:bg-mylo-surface-subtle">
              Typography
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-3">
              <div className="space-y-3 pt-1">

                {/* Font Family — full-width stacked */}
                <StackedField label="Font Family">
                  <Input
                    value={draft.fontFamily}
                    onChange={(e) => set('fontFamily', e.target.value)}
                    placeholder="e.g. Gill Sans, sans-serif"
                    className="h-7 text-xs"
                  />
                  <p className="text-[10px] text-muted-foreground leading-snug">
                    {FONT_FAMILY_HELPER_TEXT}
                  </p>
                </StackedField>

                {/* Weight + Style — side by side */}
                <div className="grid grid-cols-2 gap-4">
                  <StackedField label="Weight">
                    <Select
                      value={draft.fontWeight}
                      onValueChange={(v) => set('fontWeight', v)}
                    >
                      <SelectTrigger className="h-7 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FONT_WEIGHT_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value} className="text-xs">
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </StackedField>

                  <StackedField label="Style">
                    <Select
                      value={draft.fontStyle}
                      onValueChange={(v) =>
                        set('fontStyle', v as BodyStyleDraft['fontStyle'])
                      }
                    >
                      <SelectTrigger className="h-7 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="normal" className="text-xs">Normal</SelectItem>
                        <SelectItem value="italic" className="text-xs">Italic</SelectItem>
                      </SelectContent>
                    </Select>
                  </StackedField>
                </div>

                {/* Size + Line Height + Tracking — 3-column grid */}
                <div className="grid grid-cols-3 gap-4">
                  <StackedField label="Size">
                    <DimensionInput value={draft.fontSize} onChange={(v) => set('fontSize', v)} small />
                  </StackedField>
                  <StackedField label="Line Height">
                    <DimensionInput value={draft.lineHeight} onChange={(v) => set('lineHeight', v)} small />
                  </StackedField>
                  <StackedField label="Tracking">
                    <DimensionInput value={draft.letterSpacing} onChange={(v) => set('letterSpacing', v)} small />
                  </StackedField>
                </div>

                {/* Case + Alignment — two-column grid */}
                <div className="grid grid-cols-2 gap-4">
                  <StackedField label="Case">
                    <Select
                      value={draft.textTransform || 'none'}
                      onValueChange={(v) =>
                        set('textTransform', v === 'none' ? '' : v)
                      }
                    >
                      <SelectTrigger className="h-7 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TEXT_TRANSFORM_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value} className="text-xs">
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </StackedField>

                  <StackedField label="Alignment">
                    <div className="flex gap-0.5">
                      {ALIGN_OPTIONS.map(({ value, Icon }) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => set('textAlign', value)}
                          className={`p-1.5 rounded transition-colors ${
                            draft.textAlign === value
                              ? 'bg-mylo-text-primary text-white'
                              : 'text-mylo-text-secondary hover:bg-mylo-surface-subtle'
                          }`}
                        >
                          <Icon className="size-3.5" />
                        </button>
                      ))}
                    </div>
                  </StackedField>
                </div>

              </div>
            </AccordionContent>
          </AccordionItem>

          {/* ══ 2. Character Color ══ */}
          <AccordionItem value="character-color" className="border-b border-mylo-border-light">
            <AccordionTrigger className="px-4 py-2 text-xs font-semibold text-mylo-text-secondary hover:no-underline hover:bg-mylo-surface-subtle">
              Character Color
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-3">
              <div className="pt-1">
                <StackedField label="Color">
                  <ColorField value={draft.color} onChange={(v) => set('color', v)} inputRef={colorInputRef} />
                </StackedField>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* ══ 3. Spacing ══ */}
          <AccordionItem value="spacing" className="border-b border-mylo-border-light">
            <AccordionTrigger className="px-4 py-2 text-xs font-semibold text-mylo-text-secondary hover:no-underline hover:bg-mylo-surface-subtle">
              Spacing
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-3">
              <div className="space-y-3 pt-1">
                <div className="grid grid-cols-2 gap-4">
                  <StackedField label="Space Before">
                    <DimensionInput value={draft.marginTop} onChange={(v) => set('marginTop', v)} />
                  </StackedField>
                  <StackedField label="Space After">
                    <DimensionInput value={draft.marginBottom} onChange={(v) => set('marginBottom', v)} />
                  </StackedField>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <StackedField label="Left Indent">
                    <DimensionInput value={draft.paddingLeft} onChange={(v) => set('paddingLeft', v)} />
                  </StackedField>
                  <StackedField label="Right Indent">
                    <DimensionInput value={draft.paddingRight} onChange={(v) => set('paddingRight', v)} />
                  </StackedField>
                </div>
                <StackedField label="First Line">
                  <DimensionInput value={draft.textIndent} onChange={(v) => set('textIndent', v)} />
                </StackedField>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* ══ 4. Paragraph Rules ══ */}
          <AccordionItem value="paragraph-rules" className="border-b border-mylo-border-light">
            <AccordionTrigger className="px-4 py-2 text-xs font-semibold text-mylo-text-secondary hover:no-underline hover:bg-mylo-surface-subtle">
              Paragraph Rules
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-3">
              <div className="space-y-4 pt-1">

                {/* ── Rule Above ── */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id={ruleAboveId}
                      checked={draft.ruleAboveEnabled}
                      onCheckedChange={(checked) => set('ruleAboveEnabled', checked === true)}
                    />
                    <Label htmlFor={ruleAboveId} className="text-xs font-semibold text-mylo-text-secondary cursor-pointer">
                      Rule Above
                    </Label>
                  </div>
                  <div className={draft.ruleAboveEnabled ? undefined : 'opacity-40 pointer-events-none'}>
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-4">
                        <StackedField label="Weight">
                          <DimensionInput value={draft.ruleAboveWeight} onChange={(v) => set('ruleAboveWeight', v)} disabled={!draft.ruleAboveEnabled} />
                        </StackedField>
                        <StackedField label="Offset">
                          <DimensionInput value={draft.ruleAboveOffset} onChange={(v) => set('ruleAboveOffset', v)} disabled={!draft.ruleAboveEnabled} />
                        </StackedField>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <StackedField label="Left Indent">
                          <DimensionInput value={draft.ruleAboveLeft} onChange={(v) => set('ruleAboveLeft', v)} disabled={!draft.ruleAboveEnabled} />
                        </StackedField>
                        <StackedField label="Right Indent">
                          <DimensionInput value={draft.ruleAboveRight} onChange={(v) => set('ruleAboveRight', v)} disabled={!draft.ruleAboveEnabled} />
                        </StackedField>
                      </div>
                      <StackedField label="Color">
                        <ColorField value={draft.ruleAboveColor} onChange={(v) => set('ruleAboveColor', v)} disabled={!draft.ruleAboveEnabled} inputRef={ruleAboveColorRef} />
                      </StackedField>
                    </div>
                  </div>
                </div>

                <div className="border-t border-mylo-border-light" />

                {/* ── Rule Below ── */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id={ruleBelowId}
                      checked={draft.ruleBelowEnabled}
                      onCheckedChange={(checked) => set('ruleBelowEnabled', checked === true)}
                    />
                    <Label htmlFor={ruleBelowId} className="text-xs font-semibold text-mylo-text-secondary cursor-pointer">
                      Rule Below
                    </Label>
                  </div>
                  <div className={draft.ruleBelowEnabled ? undefined : 'opacity-40 pointer-events-none'}>
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-4">
                        <StackedField label="Weight">
                          <DimensionInput value={draft.ruleBelowWeight} onChange={(v) => set('ruleBelowWeight', v)} disabled={!draft.ruleBelowEnabled} />
                        </StackedField>
                        <StackedField label="Offset">
                          <DimensionInput value={draft.ruleBelowOffset} onChange={(v) => set('ruleBelowOffset', v)} disabled={!draft.ruleBelowEnabled} />
                        </StackedField>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <StackedField label="Left Indent">
                          <DimensionInput value={draft.ruleBelowLeft} onChange={(v) => set('ruleBelowLeft', v)} disabled={!draft.ruleBelowEnabled} />
                        </StackedField>
                        <StackedField label="Right Indent">
                          <DimensionInput value={draft.ruleBelowRight} onChange={(v) => set('ruleBelowRight', v)} disabled={!draft.ruleBelowEnabled} />
                        </StackedField>
                      </div>
                      <StackedField label="Color">
                        <ColorField value={draft.ruleBelowColor} onChange={(v) => set('ruleBelowColor', v)} disabled={!draft.ruleBelowEnabled} inputRef={ruleBelowColorRef} />
                      </StackedField>
                    </div>
                  </div>
                </div>

              </div>
            </AccordionContent>
          </AccordionItem>

          {/* ══ 5. Keep Options ══ */}
          <AccordionItem value="keep-options" className="border-b border-mylo-border-light">
            <AccordionTrigger className="px-4 py-2 text-xs font-semibold text-mylo-text-secondary hover:no-underline hover:bg-mylo-surface-subtle">
              Keep Options
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-3">
              <p className="pt-1 text-xs text-mylo-text-tertiary leading-relaxed">
                Keep options coming in a future update.
              </p>
            </AccordionContent>
          </AccordionItem>

          {/* ══ 6. Style Summary ══ */}
          <AccordionItem value="style-summary">
            <AccordionTrigger className="px-4 py-2 text-xs font-semibold text-mylo-text-secondary hover:no-underline hover:bg-mylo-surface-subtle">
              Style Summary
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-3">
              <div className="grid grid-cols-[96px_1fr] gap-y-1.5 pt-1">
                {(
                  [
                    ['Font Family', draft.fontFamily || '—'],
                    ['Weight', summaryWeight],
                    ['Style', summaryStyle],
                    ['Size', draft.fontSize ? `${draft.fontSize} pt` : '—'],
                    ['Line Height', draft.lineHeight ? `${draft.lineHeight} pt` : '—'],
                    ['Tracking', draft.letterSpacing ? `${draft.letterSpacing} pt` : '—'],
                    ['Case', summaryCase],
                    ['Alignment', summaryAlign],
                    ['Color', draft.color || '—'],
                    ['Space Before', draft.marginTop ? `${draft.marginTop} pt` : '—'],
                    ['Space After', draft.marginBottom ? `${draft.marginBottom} pt` : '—'],
                    [
                      'Rule Above',
                      draft.ruleAboveEnabled
                        ? `On${draft.ruleAboveWeight ? ` · ${draft.ruleAboveWeight}pt` : ''}`
                        : 'Off',
                    ],
                    [
                      'Rule Below',
                      draft.ruleBelowEnabled
                        ? `On${draft.ruleBelowWeight ? ` · ${draft.ruleBelowWeight}pt` : ''}`
                        : 'Off',
                    ],
                  ] as const
                ).map(([lbl, val]) => (
                  <>
                    <span key={`lbl-${lbl}`} className="text-xs text-muted-foreground whitespace-nowrap">
                      {lbl}
                    </span>
                    <span key={`val-${lbl}`} className="text-xs font-medium text-mylo-text-primary truncate">
                      {val}
                    </span>
                  </>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

        </Accordion>
      </div>

      {/* ── Pinned preview bar ── */}
      <div className="px-4 py-2 border-t border-mylo-border-light shrink-0 flex items-center gap-2">
        <Checkbox
          id={previewId}
          checked={showPreview}
          onCheckedChange={(checked) => onShowPreviewChange(checked === true)}
        />
        <Label htmlFor={previewId} className="text-xs text-mylo-text-primary font-medium cursor-pointer">
          Preview
        </Label>
        <span className="text-xs text-mylo-text-tertiary">
          Uncheck to compare with saved
        </span>
      </div>

      {/* ── Footer ── */}
      <div className="px-4 py-3 border-t border-mylo-border-light shrink-0 flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onCancel} className="flex-1 h-7 text-xs">
          Cancel
        </Button>
        <Button size="sm" onClick={onSave} className="flex-1 h-7 text-xs">
          Save
        </Button>
      </div>

    </div>
  );
}
