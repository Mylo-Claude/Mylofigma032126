/**
 * @file templates/constants/stylePropertyMap.ts
 * @role Single source of truth for Template ↔ UI field mapping
 * @owns Definitions of which template properties map to structured property
 *       panel fields; style key constants, labels, and template key mappings
 *       for all three style families (paragraph, character, list).
 * @does-not-own Style conversion logic (styleConversions.ts), UI rendering
 *               (TemplateEditorPage.tsx), template storage (TemplateContext).
 *
 * Adding a new structured field requires only adding it to the appropriate
 * constant here. Conversion utilities read these arrays at runtime.
 *
 * @governance Template Editor only
 * @see templates/utils/styleConversions.ts — reads these arrays at runtime
 * @see templates/types/styleEditor.ts — draft types mirror these arrays
 */

/**
 * Top-level properties from `contentStyles.body` that map to structured panel fields.
 * These live directly on the TemplateStyle object (not inside `advanced`).
 */
export const BODY_TOP_LEVEL_FIELDS = [
  'fontFamily',
  'fontSize',
  'fontWeight',
  'lineHeight',
  'color',
] as const;

/**
 * Properties from `contentStyles.body.advanced` that map to structured panel fields.
 * Each key corresponds to a named field in the Spacing or Typography tab.
 *
 * UI label mapping:
 *   marginTop    → Space Before   (Spacing tab)
 *   marginBottom → Space After    (Spacing tab)
 *   letterSpacing → Tracking      (Typography tab)
 *   textAlign    → Alignment      (Typography tab)
 *   fontStyle    → Style          (Typography tab)
 *   textIndent   → First Line Indent (Spacing tab)
 *   paddingLeft  → Left Indent    (Spacing tab)
 *   paddingRight → Right Indent   (Spacing tab)
 */
export const BODY_ADVANCED_STRUCTURED_FIELDS = [
  'marginTop',
  'marginBottom',
  'letterSpacing',
  'textAlign',
  'fontStyle',
  'textIndent',
  'paddingLeft',
  'paddingRight',
  'textTransform',
  // Paragraph rule fields (stored in advanced; not yet rendered as CSS)
  'ruleAboveEnabled',
  'ruleAboveWeight',
  'ruleAboveOffset',
  'ruleAboveLeft',
  'ruleAboveRight',
  'ruleAboveColor',
  'ruleBelowEnabled',
  'ruleBelowWeight',
  'ruleBelowOffset',
  'ruleBelowLeft',
  'ruleBelowRight',
  'ruleBelowColor',
] as const;

/**
 * Union of all structured field keys — top-level and advanced combined.
 * Used by styleConversions.ts to identify which `advanced` properties should
 * be surfaced as structured fields and which should fall through to the
 * Advanced CSS textarea.
 */
export const ALL_STRUCTURED_FIELDS = [
  ...BODY_TOP_LEVEL_FIELDS,
  ...BODY_ADVANCED_STRUCTURED_FIELDS,
] as const;

// Type aliases for use in conversion utilities
export type BodyTopLevelField = typeof BODY_TOP_LEVEL_FIELDS[number];
export type BodyAdvancedStructuredField = typeof BODY_ADVANCED_STRUCTURED_FIELDS[number];
export type AllStructuredField = typeof ALL_STRUCTURED_FIELDS[number];

// ---------------------------------------------------------------------------
// Style key families
// ---------------------------------------------------------------------------

/** All paragraph style keys surfaced in the Style List panel. */
export const PARAGRAPH_STYLE_KEYS = ['body', 'h1', 'h2', 'h3'] as const;
export type ParagraphStyleKey = typeof PARAGRAPH_STYLE_KEYS[number];

/** All character style keys surfaced in the Style List panel. */
export const CHARACTER_STYLE_KEYS = ['bold', 'italic', 'underline', 'link'] as const;
export type CharacterStyleKey = typeof CHARACTER_STYLE_KEYS[number];

/** All list style keys surfaced in the Style List panel. */
export const LIST_STYLE_KEYS = ['bulletedList', 'numberedList'] as const;
export type ListStyleKey = typeof LIST_STYLE_KEYS[number];

/** Union of all style keys across all three families. */
export type AnyStyleKey = ParagraphStyleKey | CharacterStyleKey | ListStyleKey;

// ---------------------------------------------------------------------------
// Template key mappings
// ---------------------------------------------------------------------------

/**
 * Maps paragraph style panel keys ('body' | 'h1' | 'h2' | 'h3') to
 * the corresponding key in Template.contentStyles.
 */
export const PARA_CONTENT_KEY_MAP = {
  body: 'body',
  h1: 'heading1',
  h2: 'heading2',
  h3: 'heading3',
} as const;
export type ParaContentKey = typeof PARA_CONTENT_KEY_MAP[ParagraphStyleKey];

/**
 * Maps list style panel keys ('bulletedList' | 'numberedList') to
 * the corresponding key in Template.listStyles.
 */
export const LIST_TEMPLATE_KEY_MAP = {
  bulletedList: 'bulletedList',
  numberedList: 'orderedList',
} as const;
export type ListTemplateKey = typeof LIST_TEMPLATE_KEY_MAP[ListStyleKey];

// ---------------------------------------------------------------------------
// Display labels
// ---------------------------------------------------------------------------

/** Human-readable labels for every style key — used in breadcrumbs and list rows. */
export const STYLE_LABELS: Record<AnyStyleKey, string> = {
  body: 'Body',
  h1: 'Heading 1',
  h2: 'Heading 2',
  h3: 'Heading 3',
  bold: 'Bold',
  italic: 'Italic',
  underline: 'Underline',
  link: 'Link',
  bulletedList: 'Bulleted List',
  numberedList: 'Numbered List',
};

// ---------------------------------------------------------------------------
// List marker options
// ---------------------------------------------------------------------------

/** Marker type options presented for bulleted list panels. */
export const BULLETED_MARKER_OPTIONS = [
  { value: 'disc', label: 'Disc' },
  { value: 'circle', label: 'Circle' },
  { value: 'square', label: 'Square' },
] as const;

/** Marker type options presented for numbered list panels. */
export const NUMBERED_MARKER_OPTIONS = [
  { value: 'decimal', label: 'Decimal (1, 2, 3)' },
  { value: 'lower-alpha', label: 'Lower Alpha (a, b, c)' },
  { value: 'lower-roman', label: 'Lower Roman (i, ii, iii)' },
  { value: 'upper-alpha', label: 'Upper Alpha (A, B, C)' },
  { value: 'upper-roman', label: 'Upper Roman (I, II, III)' },
] as const;
