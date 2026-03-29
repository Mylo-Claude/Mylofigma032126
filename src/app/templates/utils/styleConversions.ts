/**
 * @file templates/utils/styleConversions.ts
 * @role Pure conversion utilities between Template format and BodyStyleDraft
 * @owns Bidirectional conversion between `Template.contentStyles.body` (the
 *       persisted TemplateStyle object) and `BodyStyleDraft` (the local state
 *       driving the property panel UI form fields). Also owns the px↔display
 *       string conversion, the advanced CSS textarea serialisation, and the
 *       `updateDraftBodyStyle` merge helper for live-preview field changes.
 * @does-not-own Template persistence (TemplateContext), UI rendering
 *               (TemplateEditorPage), field mapping constants (stylePropertyMap).
 *
 * All functions are pure with no side effects. They take values and return
 * new values — no mutation, no I/O, no context access.
 *
 * @governance Template Editor only
 * @see templates/types/styleEditor.ts — BodyStyleDraft interface
 * @see templates/constants/stylePropertyMap.ts — BODY_ADVANCED_STRUCTURED_FIELDS
 * @see mylo/template.ts — Template, TemplateStyle types
 */

import type { Template, TemplateStyle, CSSProperties } from '../../mylo/template';
import type { BodyStyleDraft } from '../types/styleEditor';
import { BODY_ADVANCED_STRUCTURED_FIELDS } from '../constants/stylePropertyMap';

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Return the string value of a CSSProperties entry, or empty string if absent. */
function cssValStr(props: CSSProperties, key: string): string {
  const val = props[key];
  if (val === undefined) return '';
  return String(val);
}

/** Coerce a Template top-level style value to string, or return empty string. */
function styleValStr(val: string | number | undefined): string {
  if (val === undefined || val === null) return '';
  return String(val);
}

/**
 * Safe cast to one of the BodyStyleDraft alignment values.
 * Falls back to 'left' for unrecognised values.
 */
function toTextAlign(value: string): BodyStyleDraft['textAlign'] {
  if (value === 'center' || value === 'right' || value === 'justify') return value;
  return 'left';
}

/** Safe cast to one of the BodyStyleDraft fontStyle values. */
function toFontStyle(value: string): BodyStyleDraft['fontStyle'] {
  return value === 'italic' ? 'italic' : 'normal';
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Convert a px string to a display number string for form fields.
 *
 * Strips the 'px' or 'pt' suffix and returns the numeric portion.
 * Unitless values (e.g. CSS line-height multipliers like '1.5') are returned
 * unchanged — they carry no suffix to strip.
 *
 * Examples:
 *   '13px'  → '13'
 *   '0.2px' → '0.2'
 *   '1.5'   → '1.5'  (unitless — returned as-is)
 *   ''      → ''
 */
export function pxToPtDisplay(value: string): string {
  if (!value) return '';
  return value.replace(/px$/i, '').replace(/pt$/i, '').trim();
}

/**
 * Convert a display number string back to a px string for storage.
 *
 * '0' is kept unitless since it is valid CSS without a unit.
 * Empty strings return empty string (field not set — no unit added).
 *
 * Examples:
 *   '13'  → '13px'
 *   '0'   → '0'
 *   ''    → ''
 */
export function ptDisplayToPx(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (trimmed === '0') return '0';
  return `${trimmed}px`;
}

/**
 * Parse the advanced CSS textarea string into a property key/value map.
 *
 * Format: one 'camelCaseProperty: value' entry per line.
 * Blank lines and malformed entries (no colon) are silently skipped.
 *
 * Example:
 *   'textTransform: uppercase\nborderBottom: 1px solid #000'
 *   → { textTransform: 'uppercase', borderBottom: '1px solid #000' }
 */
export function parseAdvancedCss(text: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const colonIndex = trimmed.indexOf(':');
    if (colonIndex === -1) continue;
    const key = trimmed.slice(0, colonIndex).trim();
    const value = trimmed.slice(colonIndex + 1).trim();
    if (key && value) {
      result[key] = value;
    }
  }
  return result;
}

/**
 * Serialise a CSS properties object back into a textarea string.
 *
 * Example:
 *   { textTransform: 'uppercase', borderBottom: '1px solid #000' }
 *   → 'textTransform: uppercase\nborderBottom: 1px solid #000'
 */
export function serializeAdvancedCss(props: Record<string, string>): string {
  return Object.entries(props)
    .map(([key, value]) => `${key}: ${value}`)
    .join('\n');
}

/**
 * Read a Template object and produce a BodyStyleDraft for the property panel.
 *
 * Reads top-level `contentStyles.body` properties and extracts known advanced
 * properties into structured fields. Any remaining advanced properties that
 * are not in BODY_ADVANCED_STRUCTURED_FIELDS are serialised into the
 * `advancedCss` textarea field.
 *
 * Handles missing or undefined values gracefully — templates created before
 * certain fields existed will not crash; empty strings are used as defaults.
 */
export function templateBodyToStyleDraft(template: Template): BodyStyleDraft {
  const body = template.contentStyles?.body ?? {};
  const advanced: CSSProperties = body.advanced ?? {};

  // Identify which advanced keys are structured (surfaced as form fields)
  const structuredKeys = new Set<string>(BODY_ADVANCED_STRUCTURED_FIELDS);

  // Collect unstructured advanced properties → advancedCss textarea
  const unstructured: Record<string, string> = {};
  for (const [key, value] of Object.entries(advanced)) {
    if (!structuredKeys.has(key)) {
      unstructured[key] = String(value);
    }
  }

  return {
    // Typography
    fontFamily: styleValStr(body.fontFamily),
    fontSize: pxToPtDisplay(styleValStr(body.fontSize)),
    fontWeight: styleValStr(body.fontWeight) || '400',
    fontStyle: toFontStyle(cssValStr(advanced, 'fontStyle')),
    lineHeight: pxToPtDisplay(styleValStr(body.lineHeight)),
    letterSpacing: pxToPtDisplay(cssValStr(advanced, 'letterSpacing')),
    color: styleValStr(body.color) || '#000000',
    textAlign: toTextAlign(cssValStr(advanced, 'textAlign')),

    // Spacing (from advanced)
    marginTop: pxToPtDisplay(cssValStr(advanced, 'marginTop')),
    marginBottom: pxToPtDisplay(cssValStr(advanced, 'marginBottom')),
    paddingLeft: pxToPtDisplay(cssValStr(advanced, 'paddingLeft')),
    paddingRight: pxToPtDisplay(cssValStr(advanced, 'paddingRight')),
    textIndent: pxToPtDisplay(cssValStr(advanced, 'textIndent')),

    // Advanced CSS textarea
    advancedCss: serializeAdvancedCss(unstructured),
  };
}

/**
 * Convert a BodyStyleDraft back into the contentStyles.body TemplateStyle shape,
 * ready to merge into the template object.
 *
 * Only fields with non-empty values are included — omitting a field is the same
 * as "not set" in the CSS output.
 *
 * The `advancedCss` textarea is parsed and merged with the structured advanced
 * fields. Structured fields take precedence over any duplicates in advancedCss.
 *
 * Line height special case: CSS line-height values < 10 are unitless multipliers
 * (e.g. '1.5' means 1.5× font size). Values ≥ 10 are treated as pixel values
 * and stored with the 'px' suffix (e.g. '18' → '18px').
 */
export function styleDraftToTemplateBody(draft: BodyStyleDraft): TemplateStyle {
  // Start with parsed free-form advanced CSS (structured fields override it below)
  const advanced: Record<string, string | number> = {
    ...parseAdvancedCss(draft.advancedCss),
  };

  // Spacing fields → px
  const spacingFields = [
    'marginTop', 'marginBottom', 'paddingLeft', 'paddingRight', 'textIndent',
  ] as const;
  for (const field of spacingFields) {
    const px = ptDisplayToPx(draft[field]);
    if (px) {
      advanced[field] = px;
    } else {
      delete advanced[field];
    }
  }

  // letterSpacing → px
  const letterSpacingPx = ptDisplayToPx(draft.letterSpacing);
  if (letterSpacingPx) {
    advanced.letterSpacing = letterSpacingPx;
  } else {
    delete advanced.letterSpacing;
  }

  // textAlign — omit 'left' since it is the CSS default
  if (draft.textAlign && draft.textAlign !== 'left') {
    advanced.textAlign = draft.textAlign;
  } else {
    delete advanced.textAlign;
  }

  // fontStyle — omit 'normal' since it is the CSS default
  if (draft.fontStyle === 'italic') {
    advanced.fontStyle = 'italic';
  } else {
    delete advanced.fontStyle;
  }

  // Build the top-level TemplateStyle
  const style: TemplateStyle = {};

  if (draft.fontFamily) style.fontFamily = draft.fontFamily;

  const fsPx = ptDisplayToPx(draft.fontSize);
  if (fsPx) style.fontSize = fsPx;

  if (draft.fontWeight) style.fontWeight = draft.fontWeight;

  // Line height: values < 10 are CSS multipliers (unitless); ≥ 10 are px values
  const lhDisplay = draft.lineHeight.trim();
  if (lhDisplay) {
    const lhNum = parseFloat(lhDisplay);
    const isMultiplier = !isNaN(lhNum) && lhNum > 0 && lhNum < 10;
    style.lineHeight = isMultiplier ? lhDisplay : ptDisplayToPx(lhDisplay);
  }

  if (draft.color) style.color = draft.color;

  if (Object.keys(advanced).length > 0) {
    style.advanced = advanced;
  }

  return style;
}

/**
 * Merge a partial BodyStyleDraft patch into the current draft, returning a
 * new BodyStyleDraft. Used by each property panel field's onChange handler to
 * produce the next draft state without mutating the current one.
 *
 * Placing this here (rather than inline in the component) keeps business logic
 * out of UI components and makes the merge logic independently testable.
 *
 * Example:
 *   updateDraftBodyStyle(draft, { fontSize: '14' })
 *   → { ...draft, fontSize: '14' }
 */
export function updateDraftBodyStyle(
  current: BodyStyleDraft,
  patch: Partial<BodyStyleDraft>,
): BodyStyleDraft {
  return { ...current, ...patch };
}
