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
 * Strip ALL empty paragraphs from serialized HTML.
 *
 * Rule: Any <p> element containing only whitespace or zero-width space
 * characters is removed — regardless of position or count.
 *
 * Rationale: The template controls ALL document spacing via Space Before and
 * Space After on paragraph styles. An empty paragraph — even a single one —
 * is a spacing workaround that bypasses template governance. Zero empty
 * paragraphs should ever pass through to the rendered output.
 */
function stripAllEmptyParagraphs(html: string): string {
  const container = document.createElement('div');
  container.innerHTML = html;

  const toRemove: Node[] = [];

  for (const node of Array.from(container.childNodes)) {
    const isEmptyP =
      node.nodeType === Node.ELEMENT_NODE &&
      (node as Element).tagName === 'P' &&
      ((node as Element).textContent?.trim() === '' || (node as Element).textContent === '\u200B');

    if (isEmptyP) {
      toRemove.push(node);
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
    governed = stripAllEmptyParagraphs(governed);
  }
  // Future rules added here in order
  return governed;
}

