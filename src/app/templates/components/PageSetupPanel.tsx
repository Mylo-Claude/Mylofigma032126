/**
 * @file templates/components/PageSetupPanel.tsx
 * @role Left panel — page setup property editor
 * @owns Renders the Page Setup panel with controls for page size and margins.
 *       Follows the same Option C architecture as the style panels: no internal
 *       draft state, all changes propagate to the parent via onChange.
 *
 *       Layout:
 *         • Breadcrumb header  (← All Styles / Page Setup)
 *         • Two collapsible accordions:
 *             1. Page Size  — Select for preset size
 *             2. Margins    — Top / Right / Bottom / Left inch inputs
 *         • Save / Cancel footer
 *
 * @does-not-own Template persistence, draft ownership, specimen rendering.
 *
 * @governance Template Editor only
 * @see TemplateEditorPage.tsx — orchestrator; owns draft and handlers
 * @see templates/types/pageSetup.ts — PageSetupDraft interface
 * @see templates/utils/pageSetupConversions.ts — draftToPageStyles
 * @see templates/constants/pageSetupConstants.ts — PAGE_SIZE_OPTIONS, MARGIN_FIELDS
 */

import React, { useCallback } from 'react';

import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '../../components/ui/accordion';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';

import type { PageSetupDraft } from '../types/pageSetup';
import { PAGE_SIZE_OPTIONS, MARGIN_FIELDS } from '../constants/pageSetupConstants';
import { StackedField } from './shared/panelComponents';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface PageSetupPanelProps {
  /** Current draft state. Parent owns this; all changes call onChange. */
  draft: PageSetupDraft;
  onChange: (draft: PageSetupDraft) => void;
  /** Persists the current draftTemplate to TemplateContext. */
  onSave: () => void;
  /** Close the panel; draft changes are retained in draftTemplate. */
  onCancel: () => void;
}

// ---------------------------------------------------------------------------
// PageSetupPanel
// ---------------------------------------------------------------------------

export function PageSetupPanel({
  draft,
  onChange,
  onSave,
  onCancel,
}: PageSetupPanelProps) {
  const set = useCallback(
    <K extends keyof PageSetupDraft>(key: K, value: PageSetupDraft[K]) => {
      onChange({ ...draft, [key]: value });
    },
    [draft, onChange],
  );

  const sizeLabel =
    PAGE_SIZE_OPTIONS.find((o) => o.value === draft.size)?.label ?? draft.size;

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
        <span className="text-xs font-semibold text-mylo-text-primary">Page Setup</span>
      </div>

      {/* ── Accordion body (scrollable) ── */}
      <div className="flex-1 overflow-y-auto scrollbar-none">
        <Accordion
          type="single"
          collapsible
          defaultValue="page-size"
          className="w-full"
        >

          {/* ══ 1. Page Size ══ */}
          <AccordionItem value="page-size" className="border-b border-mylo-border-light">
            <AccordionTrigger className="px-4 py-2 text-xs font-semibold text-mylo-text-secondary hover:no-underline hover:bg-mylo-surface-subtle">
              Page Size
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-3">
              <div className="pt-1">
                <StackedField label="Size">
                  <Select value={draft.size} onValueChange={(v) => set('size', v)}>
                    <SelectTrigger className="h-7 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAGE_SIZE_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value} className="text-xs">
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </StackedField>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* ══ 2. Margins ══ */}
          <AccordionItem value="margins" className="border-b border-mylo-border-light">
            <AccordionTrigger className="px-4 py-2 text-xs font-semibold text-mylo-text-secondary hover:no-underline hover:bg-mylo-surface-subtle">
              Margins
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-3">
              <div className="grid grid-cols-2 gap-4 pt-1">
                {MARGIN_FIELDS.map(({ key, label }) => (
                  <StackedField key={key} label={label}>
                    <div className="flex items-center gap-1">
                      <Input
                        value={draft[key]}
                        onChange={(e) => set(key, e.target.value)}
                        placeholder="1"
                        className="h-7 text-xs w-16"
                        inputMode="decimal"
                      />
                      <span className="text-xs text-mylo-text-tertiary">in</span>
                    </div>
                  </StackedField>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* ══ 3. Summary ══ */}
          <AccordionItem value="summary">
            <AccordionTrigger className="px-4 py-2 text-xs font-semibold text-mylo-text-secondary hover:no-underline hover:bg-mylo-surface-subtle">
              Summary
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-3">
              <div className="grid grid-cols-[96px_1fr] gap-y-1.5 pt-1">
                {(
                  [
                    ['Size', sizeLabel],
                    ['Top margin',    draft.marginTop    ? `${draft.marginTop} in`    : '—'],
                    ['Right margin',  draft.marginRight  ? `${draft.marginRight} in`  : '—'],
                    ['Bottom margin', draft.marginBottom ? `${draft.marginBottom} in` : '—'],
                    ['Left margin',   draft.marginLeft   ? `${draft.marginLeft} in`   : '—'],
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
