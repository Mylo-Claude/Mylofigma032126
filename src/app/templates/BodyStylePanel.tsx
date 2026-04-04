/**
 * @file templates/BodyStylePanel.tsx
 * @role Left panel — Body style property editor
 * @owns Renders the Body paragraph style property panel with a breadcrumb
 *       header, six collapsible accordions (Typography, Spacing, Rules Above,
 *       Rules Below, Case, Advanced CSS), a pinned preview toggle bar, and a
 *       Save/Cancel footer.
 * @does-not-own Template persistence (TemplateContext), style conversion
 *               (styleConversions.ts), orchestrator state (TemplateEditorPage).
 *
 * All field changes call onChange with a full new BodyStyleDraft — no internal
 * draft state. The parent owns the draft.
 *
 * @governance Template Editor only
 * @see TemplateEditorPage.tsx — orchestrator; passes bodyDraft and handlers
 * @see templates/types/styleEditor.ts — BodyStyleDraft interface
 * @see templates/utils/styleConversions.ts — updateDraftBodyStyle helper
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

/**
 * Temporary affordance shown below the Font Family input until the Google
 * Fonts picker is added in Step 5. Remove when the picker replaces the input.
 */
const FONT_FAMILY_HELPER_TEXT =
  'Type any system font or font name. Google Fonts picker coming soon.' as const;

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Labeled row: left-side fixed-width label, right side flexible content.
 */
function LabeledField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-mylo-text-secondary w-24 shrink-0">{label}</span>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}

/**
 * Number input with a "pt" unit label to the right.
 */
function DimensionInput({
  value,
  onChange,
  placeholder,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center gap-1">
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? '—'}
        className="h-7 text-xs w-16"
        inputMode="decimal"
        disabled={disabled}
      />
      <span className={`text-xs ${disabled ? 'text-mylo-text-tertiary opacity-40' : 'text-mylo-text-tertiary'}`}>
        pt
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface BodyStylePanelProps {
  bodyDraft: BodyStyleDraft;
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
// BodyStylePanel
// ---------------------------------------------------------------------------

export function BodyStylePanel({
  bodyDraft,
  onChange,
  onSave,
  onCancel,
  showPreview,
  onShowPreviewChange,
}: BodyStylePanelProps) {
  const colorInputRef = useRef<HTMLInputElement>(null);
  const ruleAboveColorRef = useRef<HTMLInputElement>(null);
  const ruleBelowColorRef = useRef<HTMLInputElement>(null);

  /**
   * Produce a new draft with a single field updated via the pure helper.
   */
  const set = useCallback(
    <K extends keyof BodyStyleDraft>(key: K, value: BodyStyleDraft[K]) => {
      onChange(updateDraftBodyStyle(bodyDraft, { [key]: value }));
    },
    [bodyDraft, onChange],
  );

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* ── Breadcrumb header ── */}
      <div className="px-4 pt-3 pb-2 border-b border-mylo-border-light shrink-0">
        <button
          type="button"
          onClick={onCancel}
          className="flex items-center gap-1 text-xs text-mylo-text-secondary hover:text-mylo-text-primary mb-2 transition-colors"
        >
          ← All Styles
        </button>
        <div className="flex items-center gap-1">
          <span className="text-xs text-mylo-text-tertiary">Body</span>
          <span className="text-xs text-mylo-text-tertiary">/</span>
          <span className="text-xs text-mylo-text-secondary font-medium">paragraph</span>
        </div>
      </div>

      {/* ── Accordion body (scrollable) ── */}
      <div className="flex-1 overflow-y-auto">
        <Accordion
          type="single"
          collapsible
          defaultValue="typography"
          className="w-full"
        >

          {/* ── Typography ── */}
          <AccordionItem value="typography" className="border-b border-mylo-border-light">
            <AccordionTrigger className="px-4 py-2 text-xs font-semibold text-mylo-text-secondary hover:no-underline hover:bg-mylo-surface-subtle">
              Typography
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-3">
              <div className="space-y-3 pt-1">

                {/* Font Family */}
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-mylo-text-secondary">Font Family</span>
                  <Input
                    value={bodyDraft.fontFamily}
                    onChange={(e) => set('fontFamily', e.target.value)}
                    placeholder="e.g. Gill Sans, sans-serif"
                    className="h-7 text-xs"
                  />
                  <p className="text-xs text-muted-foreground leading-snug">
                    {FONT_FAMILY_HELPER_TEXT}
                  </p>
                </div>

                {/* Weight */}
                <LabeledField label="Weight">
                  <Select
                    value={bodyDraft.fontWeight}
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
                </LabeledField>

                {/* Style */}
                <LabeledField label="Style">
                  <Select
                    value={bodyDraft.fontStyle}
                    onValueChange={(v) => set('fontStyle', v as BodyStyleDraft['fontStyle'])}
                  >
                    <SelectTrigger className="h-7 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="normal" className="text-xs">Normal</SelectItem>
                      <SelectItem value="italic" className="text-xs">Italic</SelectItem>
                    </SelectContent>
                  </Select>
                </LabeledField>

                {/* Size */}
                <LabeledField label="Size">
                  <DimensionInput
                    value={bodyDraft.fontSize}
                    onChange={(v) => set('fontSize', v)}
                  />
                </LabeledField>

                {/* Line Height */}
                <LabeledField label="Line Height">
                  <DimensionInput
                    value={bodyDraft.lineHeight}
                    onChange={(v) => set('lineHeight', v)}
                  />
                </LabeledField>

                {/* Tracking */}
                <LabeledField label="Tracking">
                  <DimensionInput
                    value={bodyDraft.letterSpacing}
                    onChange={(v) => set('letterSpacing', v)}
                  />
                </LabeledField>

                {/* Alignment */}
                <LabeledField label="Alignment">
                  <div className="flex gap-0.5">
                    {(
                      [
                        { value: 'left', Icon: AlignLeft },
                        { value: 'center', Icon: AlignCenter },
                        { value: 'right', Icon: AlignRight },
                        { value: 'justify', Icon: AlignJustify },
                      ] as const
                    ).map(({ value, Icon }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => set('textAlign', value)}
                        className={`p-1 rounded transition-colors ${
                          bodyDraft.textAlign === value
                            ? 'bg-mylo-text-primary text-white'
                            : 'text-mylo-text-secondary hover:bg-mylo-surface-subtle'
                        }`}
                      >
                        <Icon className="size-3.5" />
                      </button>
                    ))}
                  </div>
                </LabeledField>

                {/* Color */}
                <LabeledField label="Color">
                  <div className="flex items-center gap-2">
                    {/* Color swatch — opens native color picker */}
                    <button
                      type="button"
                      className="size-6 rounded border border-mylo-border-light shrink-0"
                      style={{ backgroundColor: bodyDraft.color }}
                      onClick={() => colorInputRef.current?.click()}
                      aria-label="Open color picker"
                    />
                    {/* Hidden native color input */}
                    <input
                      ref={colorInputRef}
                      type="color"
                      className="sr-only"
                      value={bodyDraft.color}
                      onChange={(e) => set('color', e.target.value)}
                    />
                    {/* Hex text input */}
                    <Input
                      value={bodyDraft.color}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => {
                        const val = e.target.value;
                        if (/^#[0-9a-fA-F]{0,6}$/.test(val)) {
                          set('color', val);
                        }
                      }}
                      className="h-7 text-xs font-mono w-24"
                      maxLength={7}
                    />
                  </div>
                </LabeledField>

              </div>
            </AccordionContent>
          </AccordionItem>

          {/* ── Spacing ── */}
          <AccordionItem value="spacing" className="border-b border-mylo-border-light">
            <AccordionTrigger className="px-4 py-2 text-xs font-semibold text-mylo-text-secondary hover:no-underline hover:bg-mylo-surface-subtle">
              Spacing
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-3">
              <div className="space-y-3 pt-1">
                <LabeledField label="Space Before">
                  <DimensionInput
                    value={bodyDraft.marginTop}
                    onChange={(v) => set('marginTop', v)}
                  />
                </LabeledField>
                <LabeledField label="Space After">
                  <DimensionInput
                    value={bodyDraft.marginBottom}
                    onChange={(v) => set('marginBottom', v)}
                  />
                </LabeledField>
                <LabeledField label="Left Indent">
                  <DimensionInput
                    value={bodyDraft.paddingLeft}
                    onChange={(v) => set('paddingLeft', v)}
                  />
                </LabeledField>
                <LabeledField label="Right Indent">
                  <DimensionInput
                    value={bodyDraft.paddingRight}
                    onChange={(v) => set('paddingRight', v)}
                  />
                </LabeledField>
                <LabeledField label="First Line">
                  <DimensionInput
                    value={bodyDraft.textIndent}
                    onChange={(v) => set('textIndent', v)}
                  />
                </LabeledField>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* ── Rules Above ── */}
          <AccordionItem value="rules-above" className="border-b border-mylo-border-light">
            <AccordionTrigger className="px-4 py-2 text-xs font-semibold text-mylo-text-secondary hover:no-underline hover:bg-mylo-surface-subtle">
              Rule Above
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-3">
              <div className="space-y-3 pt-1">

                {/* Enabled toggle */}
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="rule-above-enabled"
                    checked={bodyDraft.ruleAboveEnabled}
                    onCheckedChange={(checked) =>
                      set('ruleAboveEnabled', checked === true)
                    }
                  />
                  <Label
                    htmlFor="rule-above-enabled"
                    className="text-xs text-mylo-text-secondary font-normal cursor-pointer"
                  >
                    Enable Rule Above
                  </Label>
                </div>

                {/* Dimension fields — dimmed when disabled */}
                <div className={bodyDraft.ruleAboveEnabled ? '' : 'opacity-40 pointer-events-none'}>
                  <div className="space-y-3">
                    <LabeledField label="Weight">
                      <DimensionInput
                        value={bodyDraft.ruleAboveWeight}
                        onChange={(v) => set('ruleAboveWeight', v)}
                        disabled={!bodyDraft.ruleAboveEnabled}
                      />
                    </LabeledField>
                    <LabeledField label="Offset">
                      <DimensionInput
                        value={bodyDraft.ruleAboveOffset}
                        onChange={(v) => set('ruleAboveOffset', v)}
                        disabled={!bodyDraft.ruleAboveEnabled}
                      />
                    </LabeledField>
                    <LabeledField label="Left">
                      <DimensionInput
                        value={bodyDraft.ruleAboveLeft}
                        onChange={(v) => set('ruleAboveLeft', v)}
                        disabled={!bodyDraft.ruleAboveEnabled}
                      />
                    </LabeledField>
                    <LabeledField label="Right">
                      <DimensionInput
                        value={bodyDraft.ruleAboveRight}
                        onChange={(v) => set('ruleAboveRight', v)}
                        disabled={!bodyDraft.ruleAboveEnabled}
                      />
                    </LabeledField>
                    <LabeledField label="Color">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          className="size-6 rounded border border-mylo-border-light shrink-0"
                          style={{ backgroundColor: bodyDraft.ruleAboveColor }}
                          onClick={() => ruleAboveColorRef.current?.click()}
                          aria-label="Open color picker"
                          disabled={!bodyDraft.ruleAboveEnabled}
                        />
                        <input
                          ref={ruleAboveColorRef}
                          type="color"
                          className="sr-only"
                          value={bodyDraft.ruleAboveColor}
                          onChange={(e) => set('ruleAboveColor', e.target.value)}
                        />
                        <Input
                          value={bodyDraft.ruleAboveColor}
                          onChange={(e: ChangeEvent<HTMLInputElement>) => {
                            const val = e.target.value;
                            if (/^#[0-9a-fA-F]{0,6}$/.test(val)) {
                              set('ruleAboveColor', val);
                            }
                          }}
                          className="h-7 text-xs font-mono w-24"
                          maxLength={7}
                          disabled={!bodyDraft.ruleAboveEnabled}
                        />
                      </div>
                    </LabeledField>
                  </div>
                </div>

              </div>
            </AccordionContent>
          </AccordionItem>

          {/* ── Rules Below ── */}
          <AccordionItem value="rules-below" className="border-b border-mylo-border-light">
            <AccordionTrigger className="px-4 py-2 text-xs font-semibold text-mylo-text-secondary hover:no-underline hover:bg-mylo-surface-subtle">
              Rule Below
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-3">
              <div className="space-y-3 pt-1">

                {/* Enabled toggle */}
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="rule-below-enabled"
                    checked={bodyDraft.ruleBelowEnabled}
                    onCheckedChange={(checked) =>
                      set('ruleBelowEnabled', checked === true)
                    }
                  />
                  <Label
                    htmlFor="rule-below-enabled"
                    className="text-xs text-mylo-text-secondary font-normal cursor-pointer"
                  >
                    Enable Rule Below
                  </Label>
                </div>

                {/* Dimension fields — dimmed when disabled */}
                <div className={bodyDraft.ruleBelowEnabled ? '' : 'opacity-40 pointer-events-none'}>
                  <div className="space-y-3">
                    <LabeledField label="Weight">
                      <DimensionInput
                        value={bodyDraft.ruleBelowWeight}
                        onChange={(v) => set('ruleBelowWeight', v)}
                        disabled={!bodyDraft.ruleBelowEnabled}
                      />
                    </LabeledField>
                    <LabeledField label="Offset">
                      <DimensionInput
                        value={bodyDraft.ruleBelowOffset}
                        onChange={(v) => set('ruleBelowOffset', v)}
                        disabled={!bodyDraft.ruleBelowEnabled}
                      />
                    </LabeledField>
                    <LabeledField label="Left">
                      <DimensionInput
                        value={bodyDraft.ruleBelowLeft}
                        onChange={(v) => set('ruleBelowLeft', v)}
                        disabled={!bodyDraft.ruleBelowEnabled}
                      />
                    </LabeledField>
                    <LabeledField label="Right">
                      <DimensionInput
                        value={bodyDraft.ruleBelowRight}
                        onChange={(v) => set('ruleBelowRight', v)}
                        disabled={!bodyDraft.ruleBelowEnabled}
                      />
                    </LabeledField>
                    <LabeledField label="Color">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          className="size-6 rounded border border-mylo-border-light shrink-0"
                          style={{ backgroundColor: bodyDraft.ruleBelowColor }}
                          onClick={() => ruleBelowColorRef.current?.click()}
                          aria-label="Open color picker"
                          disabled={!bodyDraft.ruleBelowEnabled}
                        />
                        <input
                          ref={ruleBelowColorRef}
                          type="color"
                          className="sr-only"
                          value={bodyDraft.ruleBelowColor}
                          onChange={(e) => set('ruleBelowColor', e.target.value)}
                        />
                        <Input
                          value={bodyDraft.ruleBelowColor}
                          onChange={(e: ChangeEvent<HTMLInputElement>) => {
                            const val = e.target.value;
                            if (/^#[0-9a-fA-F]{0,6}$/.test(val)) {
                              set('ruleBelowColor', val);
                            }
                          }}
                          className="h-7 text-xs font-mono w-24"
                          maxLength={7}
                          disabled={!bodyDraft.ruleBelowEnabled}
                        />
                      </div>
                    </LabeledField>
                  </div>
                </div>

              </div>
            </AccordionContent>
          </AccordionItem>

          {/* ── Case ── */}
          <AccordionItem value="case" className="border-b border-mylo-border-light">
            <AccordionTrigger className="px-4 py-2 text-xs font-semibold text-mylo-text-secondary hover:no-underline hover:bg-mylo-surface-subtle">
              Case
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-3">
              <div className="pt-1">
                <LabeledField label="Transform">
                  <Select
                    value={bodyDraft.textTransform || 'none'}
                    onValueChange={(v) => set('textTransform', v === 'none' ? '' : v)}
                  >
                    <SelectTrigger className="h-7 text-xs">
                      <SelectValue placeholder="None" />
                    </SelectTrigger>
                    <SelectContent>
                      {TEXT_TRANSFORM_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value} className="text-xs">
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </LabeledField>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* ── Advanced CSS ── */}
          <AccordionItem value="advanced-css">
            <AccordionTrigger className="px-4 py-2 text-xs font-semibold text-mylo-text-secondary hover:no-underline hover:bg-mylo-surface-subtle">
              Advanced CSS
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-3">
              <div className="space-y-1 pt-1">
                <textarea
                  value={bodyDraft.advancedCss}
                  onChange={(e) => set('advancedCss', e.target.value)}
                  placeholder={'textTransform: uppercase\nborderBottom: 1px solid #000'}
                  rows={4}
                  className="w-full text-xs font-mono rounded border border-mylo-border-light bg-mylo-surface p-2 resize-y focus:outline-none focus:ring-1 focus:ring-mylo-border"
                  spellCheck={false}
                />
                <p className="text-[10px] text-mylo-text-tertiary leading-snug">
                  Advanced CSS is applied directly. Verify in the specimen before saving.
                </p>
              </div>
            </AccordionContent>
          </AccordionItem>

        </Accordion>
      </div>

      {/* ── Pinned preview bar ── */}
      <div className="px-4 py-2 border-t border-mylo-border-light shrink-0 flex items-center gap-2">
        <Checkbox
          id="body-preview-toggle"
          checked={showPreview}
          onCheckedChange={(checked) => onShowPreviewChange(checked === true)}
        />
        <Label
          htmlFor="body-preview-toggle"
          className="text-xs text-muted-foreground font-normal cursor-pointer"
        >
          Preview changes
        </Label>
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
