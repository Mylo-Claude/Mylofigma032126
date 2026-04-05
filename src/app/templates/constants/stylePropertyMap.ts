/**
 * @file templates/constants/stylePropertyMap.ts
 * @role Single source of truth for Template ↔ UI field mapping
 * @owns Definitions of which template properties map to structured property
 *       panel fields, and which property panel fields map to top-level vs.
 *       advanced positions in the Template interface.
 * @does-not-own Style conversion logic (styleConversions.ts), UI rendering
 *               (TemplateEditorPage.tsx), template storage (TemplateContext).
 *
 * Adding a new structured field requires only adding it to the appropriate
 * constant here. Conversion utilities read these arrays at runtime.
 *
 * @governance Template Editor only
 * @see templates/utils/styleConversions.ts — reads these arrays at runtime
 * @see templates/types/styleEditor.ts — BodyStyleDraft keys mirror these arrays
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
