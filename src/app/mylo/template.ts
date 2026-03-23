/**
 * Template configuration.
 * 
 * All templates now use V2 format (contentStyles + pageStyles).
 * V1 format (styles + pageLayout) has been fully migrated and removed.
 */
export interface Template {
  id: string;
  name: string;
  version: string;

  /**
   * Publication status.
   * - 'draft'     — visible only to template-editor and admin; not available in the
   *                 contributor preview toolbar.
   * - 'published' — available to all roles via the preview template selector.
   *
   * Optional so that the three hardcoded seed templates (which predated this field)
   * remain valid Template objects without modification. TemplateContext applies a
   * default of 'published' during seeding and 'draft' on createTemplate().
   */
  status?: 'draft' | 'published';

  /**
   * ISO 8601 timestamp of the last modification.
   * Set by TemplateContext on seed and on every createTemplate / updateTemplate call.
   * Optional for backward compatibility with the hardcoded seed templates.
   */
  updatedAt?: string;

  // ===== REQUIRED FORMAT =====
  /** Content styling - generates CSS selectors */
  contentStyles: ContentStyles;
  
  /** Page styling - generates @page rules */
  pageStyles: PageStyles;
  
  // ===== UNCHANGED =====
  listStyles: {
    bulletedList: ListStyle;
    orderedList: ListStyle;
  };

  // Character mark rendering rules
  characterRules: {
    bold: {
      enabled: boolean;
      fontWeight?: number; // Template can map bold to specific weight
      color?: string; // Template can override bold text color
      /**
       * Advanced CSS properties for unlimited Template Editor flexibility.
       * Supports any valid CSS property via React.CSSProperties.
       */
      advanced?: CSSProperties;
    };
    italic: {
      enabled: boolean; // Template can suppress italic
      /**
       * Advanced CSS properties for unlimited Template Editor flexibility.
       * Supports any valid CSS property via React.CSSProperties.
       */
      advanced?: CSSProperties;
    };
    underline: {
      enabled: boolean; // Template can suppress underline
      style?: "solid" | "dotted" | "dashed";
      color?: string;
      /**
       * Advanced CSS properties for unlimited Template Editor flexibility.
       * Supports any valid CSS property via React.CSSProperties.
       */
      advanced?: CSSProperties;
    };
    superscript: {
      enabled: boolean;
      fontSize?: string;
    };
    subscript: {
      enabled: boolean;
      fontSize?: string;
    };
  };

  linkRules: {
    color?: string;
    underline: boolean;
    hoverColor?: string;
  };
}

/**
 * Type guard to check if template uses new format.
 * 
 * @param template - Template to check
 * @returns true if template has contentStyles and pageStyles (new format)
 */
export function isTemplateV2(template: Template): boolean {
  return !!(template.contentStyles && template.pageStyles);
}

/**
 * Type guard to check if template uses old format.
 * 
 * @param template - Template to check
 * @returns true if template has styles and pageLayout (old format)
 */
export function isTemplateV1(template: Template): boolean {
  return !!(template.styles && template.pageLayout);
}