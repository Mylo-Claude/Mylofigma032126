/**
 * Page Config Adapter
 * 
 * Applies template page configuration to Paged.js rendering system.
 * This adapter knows how to bridge between our template model and Paged.js internals.
 * 
 * Integration Contract:
 * 1. Reads template.pageStyles configuration
 * 2. Uses PAGE_PROPERTIES schema to map to Paged.js variables
 * 3. Sets CSS variables that Paged.js actually uses for rendering
 * 
 * This is the single point where we touch Paged.js internals.
 * All future page properties should flow through this adapter.
 */

import { PAGE_PROPERTIES } from './pageConfig';
import type { Template } from '../template';

/**
 * Apply template page configuration to a Paged.js page element.
 * 
 * This function reads the template's pageStyles and sets the corresponding
 * Paged.js CSS variables on the provided page element.
 * 
 * @param pageElement - A Paged.js page container (usually .pagedjs_pages)
 * @param template - The template containing page configuration
 */
export function applyPageConfigToPagedJs(
  pageElement: HTMLElement,
  template: Template
): void {
  // Extract pageStyles from template (may be undefined)
  const pageStyles = template.pageStyles;

  // ── 1. Page size ────────────────────────────────────────────────────────────
  // Paged.js injects its own :root stylesheet (always Letter) AFTER ours, so
  // @page { size } overrides fail. Instead, override every Paged.js dimension
  // CSS variable directly on the .pagedjs_pages element. Because CSS custom
  // properties resolve from the nearest ancestor, these inline-style overrides
  // take precedence over Paged.js's :root declarations for all page box children.
  const sizeKey = (pageStyles?.size ?? 'letter') as keyof typeof PAGE_PROPERTIES.pageSizes;
  const sizeConfig =
    PAGE_PROPERTIES.pageSizes[sizeKey] ?? PAGE_PROPERTIES.pageSizes.letter;
  const sizeVars = PAGE_PROPERTIES.pagedJsSizeVars;

  sizeVars.width.forEach((varName) => {
    pageElement.style.setProperty(varName, sizeConfig.width);
    console.log(`[PageConfigAdapter] Set ${varName} = ${sizeConfig.width}`);
  });
  sizeVars.height.forEach((varName) => {
    pageElement.style.setProperty(varName, sizeConfig.height);
    console.log(`[PageConfigAdapter] Set ${varName} = ${sizeConfig.height}`);
  });

  // ── 2. Margins ──────────────────────────────────────────────────────────────
  const margins = PAGE_PROPERTIES.margins;

  // Read template margin values and apply to Paged.js CSS variables
  Object.entries(margins).forEach(([side, config]) => {
    // Get value from template (e.g., pageStyles.marginTop)
    const propertyKey = `margin${side.charAt(0).toUpperCase() + side.slice(1)}` as keyof typeof pageStyles;
    const templateValue = pageStyles?.[propertyKey];

    // Determine final value: template value or default
    const value = templateValue !== undefined
      ? `${templateValue}in`  // Template values are in inches (number type)
      : config.default;       // Default from schema

    // Set the Paged.js CSS variable
    pageElement.style.setProperty(config.pagedJsVar, value);

    console.log(`[PageConfigAdapter] Set ${config.pagedJsVar} = ${value}`);
  });
}