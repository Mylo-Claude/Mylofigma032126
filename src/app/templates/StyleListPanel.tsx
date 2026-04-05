/**
 * @file templates/StyleListPanel.tsx
 * @role Left panel — style tree view
 * @owns Renders the full style list as collapsible accordions:
 *       Paragraph Styles, Character Styles, Page Setup, Document Settings.
 *       All style rows are clickable — calls onStyleClick(key) when activated.
 *       Style rows render their name in the style's own visual appearance.
 * @does-not-own Template persistence, property panel state, style conversion logic.
 *
 * Structure:
 *   Paragraph Styles — Heading 1/2/3, Body, [divider], Bulleted List, Numbered List
 *   Character Styles — Bold, Italic, Underline, [divider], Link
 *   Page Setup       — read-only size + margin values; Edit disabled
 *   Document Settings — read-only stripEmptyParagraphs; Edit disabled
 *
 * @governance Template Editor only
 * @see TemplateEditorPage.tsx — orchestrator that renders this panel
 * @see templates/constants/stylePropertyMap.ts — AnyStyleKey, STYLE_LABELS
 */

import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '../components/ui/accordion';
import type { Template } from '../mylo/template';
import type { AnyStyleKey } from './constants/stylePropertyMap';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface StyleListPanelProps {
  template: Template;
  /** Called when any style row is clicked; receives the style key. */
  onStyleClick: (key: AnyStyleKey) => void;
}

// ---------------------------------------------------------------------------
// StyleListPanel
// ---------------------------------------------------------------------------

export function StyleListPanel({ template, onStyleClick }: StyleListPanelProps) {
  const margins = template.pageStyles;
  const stripEmpty = template.documentSettings?.stripEmptyParagraphs ?? true;

  // Resolved template style values for visual row styling
  const h1 = template.contentStyles?.heading1 ?? {};
  const h2 = template.contentStyles?.heading2 ?? {};
  const h3 = template.contentStyles?.heading3 ?? {};
  const linkColor = template.linkRules?.color;

  return (
    <div className="flex flex-col h-full overflow-y-auto scrollbar-none">
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

            {/* Heading 1 — large, bold, H1 color */}
            <button
              type="button"
              onClick={() => onStyleClick('h1')}
              className="w-full flex items-center px-6 py-1.5 hover:bg-mylo-surface-subtle transition-colors"
              style={{
                color: h1.color ?? undefined,
                fontWeight: h1.fontWeight ? String(h1.fontWeight) : '700',
                fontSize: '15px',
              }}
            >
              Heading 1
            </button>

            {/* Heading 2 — medium, semi-bold, H2 color */}
            <button
              type="button"
              onClick={() => onStyleClick('h2')}
              className="w-full flex items-center px-6 py-1.5 hover:bg-mylo-surface-subtle transition-colors text-sm"
              style={{
                color: h2.color ?? undefined,
                fontWeight: h2.fontWeight ? String(h2.fontWeight) : '600',
              }}
            >
              Heading 2
            </button>

            {/* Heading 3 — smaller, bold italic, H3 color */}
            <button
              type="button"
              onClick={() => onStyleClick('h3')}
              className="w-full flex items-center px-6 py-1.5 hover:bg-mylo-surface-subtle transition-colors text-sm italic"
              style={{
                color: h3.color ?? undefined,
                fontWeight: h3.fontWeight ? String(h3.fontWeight) : '600',
              }}
            >
              Heading 3
            </button>

            {/* Body — normal weight, normal size */}
            <button
              type="button"
              onClick={() => onStyleClick('body')}
              className="w-full flex items-center px-6 py-1.5 text-sm text-mylo-text-primary hover:bg-mylo-surface-subtle transition-colors"
            >
              Body
            </button>

            {/* Divider before list styles */}
            <div className="mx-4 my-1.5 border-t border-mylo-border-light" />

            {/* Bulleted List — preceded by bullet • */}
            <button
              type="button"
              onClick={() => onStyleClick('bulletedList')}
              className="w-full flex items-center gap-1.5 px-6 py-1.5 text-sm text-mylo-text-primary hover:bg-mylo-surface-subtle transition-colors"
            >
              <span className="text-mylo-text-tertiary select-none">•</span>
              Bulleted List
            </button>

            {/* Numbered List — preceded by 1. */}
            <button
              type="button"
              onClick={() => onStyleClick('numberedList')}
              className="w-full flex items-center gap-1.5 px-6 py-1.5 text-sm text-mylo-text-primary hover:bg-mylo-surface-subtle transition-colors"
            >
              <span className="text-mylo-text-tertiary select-none text-xs">1.</span>
              Numbered List
            </button>

          </AccordionContent>
        </AccordionItem>

        {/* ── Character Styles ── */}
        <AccordionItem value="character-styles" className="border-b border-mylo-border-light">
          <AccordionTrigger className="px-4 py-2 text-[10px] font-semibold uppercase tracking-widest text-mylo-text-tertiary hover:no-underline hover:bg-mylo-surface-subtle">
            Character Styles
          </AccordionTrigger>
          <AccordionContent className="px-0 pb-2">

            {/* Bold */}
            <button
              type="button"
              onClick={() => onStyleClick('bold')}
              className="w-full flex items-center px-6 py-1.5 text-sm font-bold text-mylo-text-primary hover:bg-mylo-surface-subtle transition-colors"
            >
              Bold
            </button>

            {/* Italic */}
            <button
              type="button"
              onClick={() => onStyleClick('italic')}
              className="w-full flex items-center px-6 py-1.5 text-sm italic text-mylo-text-primary hover:bg-mylo-surface-subtle transition-colors"
            >
              Italic
            </button>

            {/* Underline */}
            <button
              type="button"
              onClick={() => onStyleClick('underline')}
              className="w-full flex items-center px-6 py-1.5 text-sm underline text-mylo-text-primary hover:bg-mylo-surface-subtle transition-colors"
            >
              Underline
            </button>

            {/* Divider before Link */}
            <div className="mx-4 my-1.5 border-t border-mylo-border-light" />

            {/* Link — in template link color, underlined */}
            <button
              type="button"
              onClick={() => onStyleClick('link')}
              className="w-full flex items-center px-6 py-1.5 text-sm underline hover:bg-mylo-surface-subtle transition-colors"
              style={{ color: linkColor ?? '#0000ee' }}
            >
              Link
            </button>

          </AccordionContent>
        </AccordionItem>

        {/* ── Page Setup ── */}
        <AccordionItem value="page-setup" className="border-b border-mylo-border-light">
          <AccordionTrigger className="px-4 py-2 text-[10px] font-semibold uppercase tracking-widest text-mylo-text-tertiary hover:no-underline hover:bg-mylo-surface-subtle">
            <span className="flex-1 text-left">Page Setup</span>
            <span
              aria-disabled="true"
              className="text-[10px] font-normal normal-case tracking-normal text-mylo-text-tertiary opacity-40 mr-2 cursor-not-allowed"
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
            <span
              aria-disabled="true"
              className="text-[10px] font-normal normal-case tracking-normal text-mylo-text-tertiary opacity-40 mr-2 cursor-not-allowed"
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
  );
}
