/**
 * @file templates/CharacterStylePanel.tsx
 * @role Left panel — character style property editor
 * @owns Renders the character style property panel for Bold, Italic, Underline,
 *       and Link styles. Character styles have a subset of paragraph fields:
 *       Font Family, Weight, Style (Normal/Italic), Size, Color.
 *       No Spacing tab, no Paragraph Rules, no Keep Options.
 *       • Breadcrumb header  (← All Styles / <Style Name>)
 *       • Three collapsible accordions:
 *           1. Typography  — Font Family, Weight, Style, Size
 *           2. Character Color — Color swatch + hex input
 *           3. Style Summary — read-only two-column property grid
 *       • Pinned preview toggle bar
 *       • Save / Cancel footer
 * @does-not-own Template persistence (TemplateContext), style conversion
 *               (styleConversions.ts), orchestrator state (TemplateEditorPage).
 *
 * All field changes call onChange with a full new CharacterStyleDraft — no
 * internal draft state. The parent owns the draft.
 *
 * @governance Template Editor only
 * @see TemplateEditorPage.tsx — orchestrator; passes draft and handlers
 * @see templates/types/styleEditor.ts — CharacterStyleDraft interface
 * @see templates/utils/styleConversions.ts — updateDraftCharStyle helper
 * @see templates/constants/stylePropertyMap.ts — STYLE_LABELS, CharacterStyleKey
 */

import { useRef, useCallback } from 'react';
import type { ChangeEvent } from 'react';

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

import type { CharacterStyleDraft } from './types/styleEditor';
import type { CharacterStyleKey } from './constants/stylePropertyMap';
import { STYLE_LABELS } from './constants/stylePropertyMap';
import { updateDraftCharStyle } from './utils/styleConversions';

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

const FONT_FAMILY_HELPER_TEXT =
  'Type any system font or font name. Google Fonts picker coming soon.' as const;

// ---------------------------------------------------------------------------
// Internal layout helpers
// ---------------------------------------------------------------------------

function StackedField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-mylo-text-secondary">{label}</span>
      {children}
    </div>
  );
}

function DimensionInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-1">
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="—"
        className="h-7 text-xs w-16"
        inputMode="decimal"
      />
      <span className="text-xs text-mylo-text-tertiary">pt</span>
    </div>
  );
}

function ColorField({
  value,
  onChange,
  inputRef,
}: {
  value: string;
  onChange: (v: string) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
}) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        className="size-6 rounded border border-mylo-border-light shrink-0"
        style={{ backgroundColor: value }}
        onClick={() => inputRef.current?.click()}
        aria-label="Open color picker"
      />
      <input
        ref={inputRef}
        type="color"
        className="sr-only"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <Input
        value={value}
        onChange={(e: ChangeEvent<HTMLInputElement>) => {
          const val = e.target.value;
          if (/^#[0-9a-fA-F]{0,6}$/.test(val)) onChange(val);
        }}
        className="h-7 text-xs font-mono w-24"
        maxLength={7}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface CharacterStylePanelProps {
  /** Which character style this panel is editing — controls breadcrumb label. */
  styleKey: CharacterStyleKey;
  /** Current draft state. Parent owns this; all changes call onChange. */
  draft: CharacterStyleDraft;
  onChange: (draft: CharacterStyleDraft) => void;
  /** Persists current draftTemplate to TemplateContext. Same action as top-bar Save. */
  onSave: () => void;
  /** Close the panel; draft changes are retained in draftTemplate. */
  onCancel: () => void;
  /** When true, specimen renders from draftTemplate (live changes). */
  showPreview: boolean;
  onShowPreviewChange: (showPreview: boolean) => void;
}

// ---------------------------------------------------------------------------
// CharacterStylePanel
// ---------------------------------------------------------------------------

export function CharacterStylePanel({
  styleKey,
  draft,
  onChange,
  onSave,
  onCancel,
  showPreview,
  onShowPreviewChange,
}: CharacterStylePanelProps) {
  const colorInputRef = useRef<HTMLInputElement>(null);

  /** Produce a new draft with a single field updated via the pure helper. */
  const set = useCallback(
    <K extends keyof CharacterStyleDraft>(key: K, value: CharacterStyleDraft[K]) => {
      onChange(updateDraftCharStyle(draft, { [key]: value }));
    },
    [draft, onChange],
  );

  const styleName = STYLE_LABELS[styleKey];
  const previewId = `char-preview-toggle-${styleKey}`;

  // Style Summary computed values
  const summaryWeight =
    FONT_WEIGHT_OPTIONS.find((o) => o.value === draft.fontWeight)?.label ??
    draft.fontWeight ??
    '—';
  const summaryStyle = draft.fontStyle === 'italic' ? 'Italic' : 'Normal';

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

                {/* Font Family */}
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

                {/* Weight + Style */}
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
                        set('fontStyle', v as CharacterStyleDraft['fontStyle'])
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

                {/* Size */}
                <StackedField label="Size">
                  <DimensionInput value={draft.fontSize} onChange={(v) => set('fontSize', v)} />
                </StackedField>

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

          {/* ══ 3. Style Summary ══ */}
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
                    ['Color', draft.color || '—'],
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
