/**
 * @file templates/StyleListPanel.tsx
 * @role Left panel — style tree view
 * @owns Renders the full style list as collapsible accordions:
 *       Paragraph Styles, Character Styles, Page Setup, Document Settings.
 *       Calls onBodyClick when the Body row is activated.
 * @does-not-own Template persistence, property panel state, style conversion logic.
 *
 * @governance Template Editor only
 * @see TemplateEditorPage.tsx — orchestrator that renders this panel
 */

import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '../components/ui/accordion';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../components/ui/tooltip';
import type { Template } from '../mylo/template';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface StyleListPanelProps {
  template: Template;
  onBodyClick: () => void;
}

// ---------------------------------------------------------------------------
// StyleListPanel
// ---------------------------------------------------------------------------

export function StyleListPanel({ template, onBodyClick }: StyleListPanelProps) {
  const margins = template.pageStyles;
  const stripEmpty = template.documentSettings?.stripEmptyParagraphs ?? true;

  return (
    <TooltipProvider>
      <div className="flex flex-col h-full overflow-y-auto">
        <Accordion
          type="single"
          collapsible
          defaultValue="paragraph-styles"
          className="w-full"
        >

          {/* ── Paragraph Styles ── */}
          <AccordionItem value="paragraph-styles" className="border-b border-mylo-border-light">
            <AccordionTrigger className="px-4 py-2 text-[10px] font-semibold uppercase tracking-widest text-mylo-text-tertiary hover:no-underline hover:bg-mylo-surface-subtle">
              Paragraph Styles
            </AccordionTrigger>
            <AccordionContent className="px-0 pb-2">
              {(['Heading 1', 'Heading 2', 'Heading 3'] as const).map((label) => (
                <Tooltip key={label}>
                  <TooltipTrigger asChild>
                    <div className="flex items-center justify-between px-6 py-1.5 text-sm text-mylo-text-tertiary cursor-default opacity-60 select-none">
                      <span>{label}</span>
                      <span className="text-xs text-mylo-text-tertiary">paragraph</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p className="text-xs">Coming soon</p>
                  </TooltipContent>
                </Tooltip>
              ))}

              {/* Body — clickable */}
              <button
                type="button"
                onClick={onBodyClick}
                className="w-full flex items-center justify-between px-6 py-1.5 text-sm text-mylo-text-primary hover:bg-mylo-surface-subtle font-medium transition-colors"
              >
                <span>Body</span>
                <span className="text-xs text-mylo-text-tertiary">paragraph</span>
              </button>
            </AccordionContent>
          </AccordionItem>

          {/* ── Character Styles ── */}
          <AccordionItem value="character-styles" className="border-b border-mylo-border-light">
            <AccordionTrigger className="px-4 py-2 text-[10px] font-semibold uppercase tracking-widest text-mylo-text-tertiary hover:no-underline hover:bg-mylo-surface-subtle">
              Character Styles
            </AccordionTrigger>
            <AccordionContent className="px-0 pb-2">
              {(['Bold', 'Italic', 'Underline'] as const).map((label) => (
                <Tooltip key={label}>
                  <TooltipTrigger asChild>
                    <div className="flex items-center px-6 py-1.5 text-sm text-mylo-text-tertiary cursor-default opacity-60 select-none">
                      {label}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p className="text-xs">Coming soon</p>
                  </TooltipContent>
                </Tooltip>
              ))}
            </AccordionContent>
          </AccordionItem>

          {/* ── Page Setup ── */}
          <AccordionItem value="page-setup" className="border-b border-mylo-border-light">
            <AccordionTrigger className="px-4 py-2 text-[10px] font-semibold uppercase tracking-widest text-mylo-text-tertiary hover:no-underline hover:bg-mylo-surface-subtle">
              <span className="flex-1 text-left">Page Setup</span>
              {/* Edit is disabled until page-setup editing is implemented */}
              <span
                aria-disabled="true"
                className="text-xs font-normal normal-case tracking-normal text-mylo-text-tertiary opacity-40 mr-2 cursor-not-allowed"
              >
                Edit
              </span>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-3">
              <div className="space-y-0.5 text-xs text-mylo-text-secondary">
                <p>Size: {margins.size ?? 'Letter'}</p>
                {margins.marginTop !== undefined && (
                  <p>
                    Margins: {margins.marginTop}"&nbsp;{margins.marginRight}"&nbsp;
                    {margins.marginBottom}"&nbsp;{margins.marginLeft}"
                  </p>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* ── Document Settings ── */}
          <AccordionItem value="document-settings">
            <AccordionTrigger className="px-4 py-2 text-[10px] font-semibold uppercase tracking-widest text-mylo-text-tertiary hover:no-underline hover:bg-mylo-surface-subtle">
              <span className="flex-1 text-left">Document Settings</span>
              {/* Edit is disabled until document-settings editing is implemented */}
              <span
                aria-disabled="true"
                className="text-xs font-normal normal-case tracking-normal text-mylo-text-tertiary opacity-40 mr-2 cursor-not-allowed"
              >
                Edit
              </span>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-3">
              <div className="text-xs text-mylo-text-secondary">
                <p>Strip empty paragraphs: {stripEmpty ? 'On' : 'Off'}</p>
              </div>
            </AccordionContent>
          </AccordionItem>

        </Accordion>
      </div>
    </TooltipProvider>
  );
}
