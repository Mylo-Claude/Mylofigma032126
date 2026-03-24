/**
 * Governance Enforcement Service
 *
 * Responsibility: Apply template-defined governance rules to serialized HTML
 * before it reaches the Paged.js rendering pipeline.
 *
 * Architecture:
 * - Each governance rule is a pure function: (html: string) => string
 * - Rules are composed in a single enforcement pass
 * - Rules are gated by DocumentSettings flags
 * - No rule has knowledge of other rules
 * - Adding a new rule requires only: a pure function + a flag in DocumentSettings
 *
 * This module is the single point of governance enforcement.
 * Do not add enforcement logic to serializer.ts or pagination.ts.
 *
 * @governance Template Editor controlled
 * @see DocumentSettings in src/app/mylo/template.ts
 */

import type { DocumentSettings } from '../mylo/template';

/**
 * Strip consecutive empty paragraphs from serialized HTML.
 *
 * Rule: Two or more consecutive <p> elements containing only whitespace
 * or zero-width space characters are reduced to zero.
 * A single empty paragraph between content blocks is preserved.
 *
 * Rationale: Contributors use repeated empty lines to fake spacing.
 * Paragraph spacing is the template's responsibility via Space Before/After.
 */
function stripConsecutiveEmptyParagraphs(html: string): string {
  const container = document.createElement('div');
  container.innerHTML = html;

  const children = Array.from(container.childNodes);
  let consecutiveEmptyCount = 0;
  const toRemove: Node[] = [];

  for (const node of children) {
    if (
      node.nodeType === Node.ELEMENT_NODE &&
      (node as Element).tagName === 'P'
    ) {
      const text = (node as Element).textContent ?? '';
      const isEmpty = text.trim() === '' || text === '\u200B';
      if (isEmpty) {
        consecutiveEmptyCount++;
        if (consecutiveEmptyCount > 1) {
          toRemove.push(node);
        }
      } else {
        consecutiveEmptyCount = 0;
      }
    } else {
      consecutiveEmptyCount = 0;
    }
  }

  for (const node of toRemove) {
    container.removeChild(node);
  }

  return container.innerHTML;
}

/**
 * Apply all active governance rules to serialized HTML.
 *
 * @param html - Serialized HTML string from serializeToHTML()
 * @param settings - Resolved document settings (use resolveDocumentSettings())
 * @returns Governed HTML string with active rules applied
 */
export function applyGovernanceRules(
  html: string,
  settings: Required<DocumentSettings>
): string {
  let governed = html;
  if (settings.stripEmptyParagraphs) {
    governed = stripConsecutiveEmptyParagraphs(governed);
  }
  // Future rules added here in order
  return governed;
}

