/**
 * @file templates/components/ListStylePanel.tsx
 * @role Left panel — list style property editor
 * @owns Renders the list style property panel for Bulleted List and Numbered List.
 *       List styles have all paragraph fields (same as ParagraphStylePanel) plus
 *       list-specific fields in a dedicated "List Style" accordion.
 *       • Simple title header (style name only, border-bottom)
 *       • Seven collapsible accordions:
 *           1. List Style   — Marker style, Marker color, Marker size, Indent
 *           2. Typography   — Font Family, Weight, Style, Size/LineHeight/Tracking,
 *                             Alignment, Case (overrides for list item text)
 *           3. Character Color — Color swatch + hex input
 *           4. Spacing      — Space Before/After, Left/Right Indent, First Line
 *           5. Rule Above   — enable toggle, Weight/V.Offset, Left/Right Indent, Color
 *           6. Rule Below   — same structure as Rule Above
 *           7. Style Summary — read-only two-column property grid
 *       • Pinned preview toggle bar
 *       • Save / Cancel footer
 *         Cancel: returns to the style list immediately (no confirmation).
 *         Save: persists and returns to the style list.
 * @does-not-own Template persistence (TemplateContext), style conversion
 *               (styleConversions.ts), orchestrator state (TemplateEditorPage).
 *
 * All field changes call onChange with a full new ListStyleDraft — no internal
 * draft state. The parent owns the draft.
 *
 * @governance Template Editor only
 * @see TemplateEditorPage.tsx — orchestrator; passes draft and handlers
 * @see templates/types/styleEditor.ts — ListStyleDraft interface
 * @see templates/utils/styleConversions.ts — updateDraftListStyle helper
 * @see templates/constants/stylePropertyMap.ts — STYLE_LABELS, ListStyleKey,
 *                                                 BULLETED_MARKER_OPTIONS,
 *                                                 NUMBERED_MARKER_OPTIONS
 */

import React, { useRef, useCallback } from 'react';
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
} from '../../components/ui/accordion';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Checkbox } from '../../components/ui/checkbox';
import { Label } from '../../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';

import type { ListStyleDraft, BodyStyleDraft } from '../types/styleEditor';
import type { ListStyleKey } from '../constants/stylePropertyMap';
import {
  STYLE_LABELS,
  BULLETED_MARKER_OPTIONS,
  NUMBERED_MARKER_OPTIONS,
} from '../constants/stylePropertyMap';
import { updateDraftListStyle } from '../utils/styleConversions';
import {
  FONT_WEIGHT_OPTIONS,
  FONT_FAMILY_HELPER_TEXT,
  StackedField,
  DimensionInput,
  ColorField,
} from './shared/panelComponents';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ListStylePanelProps {
  /** Which list style this panel is editing — controls header label and marker options. */
  styleKey: ListStyleKey;
  /** Current draft state. Parent owns this; all changes call onChange. */
  draft: ListStyleDraft;
  onChange: (draft: ListStyleDraft) => void;
  /** Persists current draftTemplate to TemplateContext. Same action as top-bar Save. */
  onSave: () => void;
  /** Navigate back to the style list immediately. */
  onCancel: () => void;
  /** When true, specimen renders from draftTemplate (live changes). */
  showPreview: boolean;
  onShowPreviewChange: (showPreview: boolean) => void;
}

// ---------------------------------------------------------------------------
// ListStylePanel
// ---------------------------------------------------------------------------

export function ListStylePanel({
  styleKey,
  draft,
  onChange,
  onSave,
  onCancel,
  showPreview,
  onShowPreviewChange,
}: ListStylePanelProps) {
  const colorInputRef = useRef<HTMLInputElement>(null);
  const markerColorRef = useRef<HTMLInputElement>(null);
  const ruleAboveColorRef = useRef<HTMLInputElement>(null);
  const ruleBelowColorRef = useRef<HTMLInputElement>(null);

  /** Produce a new draft with a single field updated via the pure helper. */
  const set = useCallback(
    <K extends keyof ListStyleDraft>(key: K, value: ListStyleDraft[K]) => {
      onChange(updateDraftListStyle(draft, { [key]: value }));
    },
    [draft, onChange],
  );

  const styleName = STYLE_LABELS[styleKey];
  const markerOptions = styleKey === 'bulletedList' ? BULLETED_MARKER_OPTIONS : NUMBERED_MARKER_OPTIONS;
  const previewId = `list-preview-toggle-${styleKey}`;
  const ruleAboveId = `list-rule-above-${styleKey}`;
  const ruleBelowId = `list-rule-below-${styleKey}`;

  // Style Summary computed values
  const summaryWeight =
    FONT_WEIGHT_OPTIONS.find((o) => o.value === draft.fontWeight)?.label ??
    draft.fontWeight ?? '—';
  const summaryStyle = draft.fontStyle === 'italic' ? 'Italic' : 'Normal';
  const summaryCase =
    TEXT_TRANSFORM_OPTIONS.find((o) => o.value === (draft.textTransform || 'none'))?.label ?? '—';
  const summaryAlign =
    ALIGN_OPTIONS.find((o) => o.value === draft.textAlign)?.label ?? '—';

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* ── Panel header ── */}
      <div className="px-4 py-3 border-b border-mylo-border-light shrink-0 bg-mylo-surface-subtle">
        <p className="text-sm font-medium text-foreground">{styleName}</p>
      </div>

      {/* ── Accordion body (scrollable) ── */}
      <div className="flex-1 overflow-y-auto scrollbar-none">
        <Accordion
          type="single"
          collapsible
          defaultValue="list-style"
          className="w-full"
        >

          {/* ══ 1. List Style ══ */}
          <AccordionItem value="list-style" className="border-b border-mylo-border-light">
            <AccordionTrigger className="px-4 py-2 text-xs font-semibold text-mylo-text-secondary hover:no-underline hover:bg-mylo-surface-subtle">
              List Style
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-3">
              <div className="space-y-3 pt-1">

                {/* Marker style */}
                <StackedField label="Marker Style">
                  <Select
                    value={draft.markerStyle}
                    onValueChange={(v) => set('markerStyle', v)}
                  >
                    <SelectTrigger className="h-7 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {markerOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value} className="text-xs">
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </StackedField>

                {/* Marker color */}
                <StackedField label="Marker Color">
                  <ColorField
                    value={draft.markerColor}
                    onChange={(v) => set('markerColor', v)}
                    inputRef={markerColorRef}
                  />
                </StackedField>

                {/* Marker size + Indent — two-column */}
                <div className="grid grid-cols-2 gap-4">
                  <StackedField label="Marker Size">
                    <DimensionInput
                      value={draft.markerSize}
                      onChange={(v) => set('markerSize', v)}
                      placeholder="Auto"
                    />
                  </StackedField>
                  <StackedField label="Indent">
                    <DimensionInput value={draft.indent} onChange={(v) => set('indent', v)} />
                  </StackedField>
                </div>
                <p className="text-xs text-muted-foreground leading-snug">
                  Marker size inherits from list font size when left empty.
                </p>

              </div>
            </AccordionContent>
          </AccordionItem>

          {/* ══ 2. Typography ══ */}
          <AccordionItem value="typography" className="border-b border-mylo-border-light">
            <AccordionTrigger className="px-4 py-2 text-xs font-semibold text-mylo-text-secondary hover:no-underline hover:bg-mylo-surface-subtle">
              Typography
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-3">
              <div className="space-y-3 pt-1">

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

                <div className="grid grid-cols-2 gap-4">
                  <StackedField label="Case">
                    <Select
                      value={draft.textTransform || 'none'}
                      onValueChange={(v) => set('textTransform', v === 'none' ? '' : v)}
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

          {/* ══ 3. Character Color ══ */}
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

          {/* ══ 4. Spacing ══ */}
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

          {/* ══ 5. Paragraph Rules ══ */}
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

          {/* ══ 6. Keep Options ══ */}
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

          {/* ══ 7. Style Summary ══ */}
          <AccordionItem value="style-summary">
            <AccordionTrigger className="px-4 py-2 text-xs font-semibold text-mylo-text-secondary hover:no-underline hover:bg-mylo-surface-subtle">
              Style Summary
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-3">
              <div className="grid grid-cols-[96px_1fr] gap-y-1.5 pt-1">
                {(
                  [
                    ['Marker Style', draft.markerStyle || '—'],
                    ['Marker Color', draft.markerColor || '—'],
                    ['Indent', draft.indent ? `${draft.indent} pt` : '—'],
                    ['Font Family', draft.fontFamily || '—'],
                    ['Weight', summaryWeight],
                    ['Style', summaryStyle],
                    ['Size', draft.fontSize ? `${draft.fontSize} pt` : '—'],
                    ['Line Height', draft.lineHeight ? `${draft.lineHeight} pt` : '—'],
                    ['Case', summaryCase],
                    ['Alignment', summaryAlign],
                    ['Color', draft.color || '—'],
                    ['Space Before', draft.marginTop ? `${draft.marginTop} pt` : '—'],
                    ['Space After', draft.marginBottom ? `${draft.marginBottom} pt` : '—'],
                  ] as const
                ).map(([lbl, val]) => (
                  <React.Fragment key={lbl}>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {lbl}
                    </span>
                    <span className="text-xs font-medium text-mylo-text-primary truncate">
                      {val}
                    </span>
                  </React.Fragment>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

        </Accordion>
      </div>

      {/* ── Pinned preview bar ── */}
      <div className="px-4 py-2 border-t border-mylo-border-light shrink-0 flex items-center gap-2 bg-mylo-surface-subtle">
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
