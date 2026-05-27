/**
 * CSS property map — used for the `advanced` escape-hatch field in style objects.
 * Accepts camelCase property names mapping to CSS string or numeric values.
 * Camel-case keys are converted to kebab-case at stylesheet generation time.
 */
export type CSSProperties = Record<string, string | number>;

/**
 * Style configuration for a single content level (body, heading1, heading2, heading3).
 * Top-level properties map to CSS declarations directly.
 * The `advanced` property is an escape hatch for any CSS not covered by structured fields.
 */
export interface TemplateStyle {
  fontFamily?: string;
  fontSize?: string;
  fontWeight?: number | string;
  lineHeight?: string;
  color?: string;
  advanced?: CSSProperties;
}

/**
 * Content styles — maps the four semantic content levels to their style configurations.
 */
export interface ContentStyles {
  body: TemplateStyle;
  heading1: TemplateStyle;
  heading2: TemplateStyle;
  heading3: TemplateStyle;
}

/**
 * Page layout styles for Paged.js @page rules.
 * Margins are expressed in inches.
 */
export interface PageStyles {
  size: string;
  marginTop?: number;
  marginRight?: number;
  marginBottom?: number;
  marginLeft?: number;
}

/**
 * List marker and spacing configuration for bullet/ordered lists.
 * `itemStyle` holds optional paragraph-level style overrides for list item text.
 * `markerSize` holds the pt size of the marker glyph (stored as a px string, e.g. '12px').
 */
export interface ListStyle {
  markerType: string;
  indentSize: string;
  itemSpacing?: string;
  markerColor?: string;
  /** Size of the list marker glyph, e.g. '12px'. Optional — inherits from body when absent. */
  markerSize?: string;
  /** Paragraph-level style overrides for list item text (font, size, spacing, etc.). */
  itemStyle?: TemplateStyle;
  advanced?: CSSProperties;
}

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
      advanced?: CSSProperties;
    };
    subscript: {
      enabled: boolean;
      fontSize?: string;
      advanced?: CSSProperties;
    };
  };

  linkRules: {
    color?: string;
    underline: boolean;
    hoverColor?: string;
    /** Advanced CSS overrides applied to <a> elements (e.g. fontFamily, fontSize). */
    advanced?: CSSProperties;
  };

  /**
   * Document-level governance rules.
   * Controls which contributor formatting behaviors are stripped at render time.
   * Defaults to stripEmptyParagraphs: true if not specified.
   *
   * @see Mylo Governance: Contributor formatting enforcement
   */
  documentSettings?: DocumentSettings
}

/**
 * DocumentSettings — Template-level governance configuration.
 *
 * These settings define which contributor formatting workarounds
 * are silently stripped during Preview rendering. They do not
 * affect the Editor surface — contributors can still type freely.
 *
 * @governance Template Editor controlled — Contributors cannot override
 */
export interface DocumentSettings {
  /**
   * Remove consecutive empty paragraphs before rendering.
   * Prevents contributors from using blank lines to control spacing.
   * Paragraph spacing is defined by Space Before / Space After in the template.
   * Default: true
   */
  stripEmptyParagraphs?: boolean
}

/**
 * Returns resolved DocumentSettings with all defaults applied.
 * Use this instead of reading documentSettings directly.
 */
export function resolveDocumentSettings(settings?: DocumentSettings): Required<DocumentSettings> {
  return {
    stripEmptyParagraphs: settings?.stripEmptyParagraphs ?? true,
  }
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const t = template as any;
  return !!(t.styles && t.pageLayout);
}