/**
 * @file templates/utils/styleConversions.ts
 * @role Pure conversion utilities between Template format and style drafts
 * @owns Bidirectional conversion between Template (persisted) and all draft
 *       types (local panel state): BodyStyleDraft (paragraph styles),
 *       CharacterStyleDraft (bold/italic/underline/link), ListStyleDraft
 *       (bulletedList/numberedList). Also owns px↔display string conversion,
 *       the advanced CSS textarea serialisation, and the `updateDraft*`
 *       merge helpers for live-preview field changes.
 * @does-not-own Template persistence (TemplateContext), UI rendering
 *               (TemplateEditorPage), field mapping constants (stylePropertyMap).
 *
 * All functions are pure with no side effects. They take values and return
 * new values — no mutation, no I/O, no context access.
 *
 * @governance Template Editor only
 * @see templates/types/styleEditor.ts — draft interfaces
 * @see templates/constants/stylePropertyMap.ts — BODY_ADVANCED_STRUCTURED_FIELDS
 * @see mylo/template.ts — Template, TemplateStyle, ListStyle types
 */

import type { Template, TemplateStyle, CSSProperties, ContentStyles } from '../../mylo/template';
import type { BodyStyleDraft, CharacterStyleDraft, ListStyleDraft } from '../types/styleEditor';
import {
  BODY_ADVANCED_STRUCTURED_FIELDS,
  PARA_CONTENT_KEY_MAP,
  LIST_TEMPLATE_KEY_MAP,
} from '../constants/stylePropertyMap';
import type { ParagraphStyleKey, CharacterStyleKey, ListStyleKey } from '../constants/stylePropertyMap';

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

/** Safe cast to one of the draft fontStyle values. */
function toFontStyle(value: string): 'normal' | 'italic' {
  return value === 'italic' ? 'italic' : 'normal';
}

/**
 * Parse a CSS border shorthand like '1px solid #91161a' into weight and color.
 * Weight is returned as a display string (no px suffix).
 */
function parseBorderShorthand(value: string): { weight: string; color: string } {
  if (!value) return { weight: '', color: '' };
  const parts = value.trim().split(/\s+/);
  const weight = parts[0] ? pxToPtDisplay(parts[0]) : '';
  const color = parts[2] ?? '';
  return { weight, color };
}

/**
 * Parse a CSS padding shorthand like '10px 0px 8px 0px' into individual sides.
 * All values are returned as display strings (no px suffix).
 */
function parsePaddingShorthand(value: string): { top: string; bottom: string } {
  if (!value) return { top: '', bottom: '' };
  const parts = value.trim().split(/\s+/);
  if (parts.length === 1) {
    const v = pxToPtDisplay(parts[0]);
    return { top: v, bottom: v };
  }
  // 2-value: vertical | horizontal → top = bottom = first value
  if (parts.length === 2) {
    const v = pxToPtDisplay(parts[0]);
    return { top: v, bottom: v };
  }
  // 3-value: top | horizontal | bottom  (length=3)
  // 4-value: top | right | bottom | left (length=4)
  return {
    top: pxToPtDisplay(parts[0]),
    bottom: pxToPtDisplay(parts[parts.length === 3 ? 2 : 2]),
  };
}

// ---------------------------------------------------------------------------
// Public API — unit conversion
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

// ---------------------------------------------------------------------------
// Public API — advanced CSS textarea serialisation
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Internal — core TemplateStyle → BodyStyleDraft converter
// ---------------------------------------------------------------------------

/**
 * Convert a TemplateStyle object directly to a BodyStyleDraft.
 * Extracted from templateBodyToStyleDraft so it can be reused by all
 * paragraph and list style conversions without requiring a full Template.
 */
function styleObjectToBodyDraft(style: TemplateStyle): BodyStyleDraft {
  const advanced: CSSProperties = style.advanced ?? {};

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
    fontFamily: styleValStr(style.fontFamily),
    fontSize: pxToPtDisplay(styleValStr(style.fontSize)),
    fontWeight: styleValStr(style.fontWeight) || '400',
    fontStyle: toFontStyle(cssValStr(advanced, 'fontStyle')),
    lineHeight: pxToPtDisplay(styleValStr(style.lineHeight)),
    letterSpacing: pxToPtDisplay(cssValStr(advanced, 'letterSpacing')),
    color: styleValStr(style.color) || '#000000',
    textAlign: toTextAlign(cssValStr(advanced, 'textAlign')),
    textTransform: cssValStr(advanced, 'textTransform'),

    // Spacing (from advanced)
    marginTop: pxToPtDisplay(cssValStr(advanced, 'marginTop')),
    marginBottom: pxToPtDisplay(cssValStr(advanced, 'marginBottom')),
    paddingLeft: pxToPtDisplay(cssValStr(advanced, 'paddingLeft')),
    paddingRight: pxToPtDisplay(cssValStr(advanced, 'paddingRight')),
    textIndent: pxToPtDisplay(cssValStr(advanced, 'textIndent')),

    // Paragraph Rules — read from native CSS border properties first (used by
    // built-in templates like Traditional), falling back to the custom ruleAbove*/
    // ruleBelow* keys written by the editor when the user has previously saved rules.
    ...(() => {
      const borderTopVal = cssValStr(advanced, 'borderTop');
      const borderBottomVal = cssValStr(advanced, 'borderBottom');

      // Vertical offsets come from individual paddingTop/paddingBottom, or from
      // the CSS padding shorthand (Traditional uses 'padding: top right bottom left').
      let paddingTopDisplay = pxToPtDisplay(cssValStr(advanced, 'paddingTop'));
      let paddingBottomDisplay = pxToPtDisplay(cssValStr(advanced, 'paddingBottom'));
      const paddingShorthand = cssValStr(advanced, 'padding');
      if (paddingShorthand && !paddingTopDisplay && !paddingBottomDisplay) {
        const parsed = parsePaddingShorthand(paddingShorthand);
        paddingTopDisplay = parsed.top;
        paddingBottomDisplay = parsed.bottom;
      }

      let ruleAboveEnabled: boolean;
      let ruleAboveWeight: string;
      let ruleAboveColor: string;
      let ruleAboveOffset: string;
      if (borderTopVal) {
        const parsed = parseBorderShorthand(borderTopVal);
        ruleAboveEnabled = true;
        ruleAboveWeight = parsed.weight;
        ruleAboveColor = parsed.color || '#000000';
        ruleAboveOffset = paddingTopDisplay;
      } else {
        ruleAboveEnabled = cssValStr(advanced, 'ruleAboveEnabled') === 'true';
        ruleAboveWeight = pxToPtDisplay(cssValStr(advanced, 'ruleAboveWeight'));
        ruleAboveColor = cssValStr(advanced, 'ruleAboveColor') || '#000000';
        ruleAboveOffset = pxToPtDisplay(cssValStr(advanced, 'ruleAboveOffset'));
      }

      let ruleBelowEnabled: boolean;
      let ruleBelowWeight: string;
      let ruleBelowColor: string;
      let ruleBelowOffset: string;
      if (borderBottomVal) {
        const parsed = parseBorderShorthand(borderBottomVal);
        ruleBelowEnabled = true;
        ruleBelowWeight = parsed.weight;
        ruleBelowColor = parsed.color || '#000000';
        ruleBelowOffset = paddingBottomDisplay;
      } else {
        ruleBelowEnabled = cssValStr(advanced, 'ruleBelowEnabled') === 'true';
        ruleBelowWeight = pxToPtDisplay(cssValStr(advanced, 'ruleBelowWeight'));
        ruleBelowColor = cssValStr(advanced, 'ruleBelowColor') || '#000000';
        ruleBelowOffset = pxToPtDisplay(cssValStr(advanced, 'ruleBelowOffset'));
      }

      return {
        ruleAboveEnabled,
        ruleAboveWeight,
        ruleAboveOffset,
        ruleAboveLeft: pxToPtDisplay(cssValStr(advanced, 'ruleAboveLeft')),
        ruleAboveRight: pxToPtDisplay(cssValStr(advanced, 'ruleAboveRight')),
        ruleAboveColor,
        ruleBelowEnabled,
        ruleBelowWeight,
        ruleBelowOffset,
        ruleBelowLeft: pxToPtDisplay(cssValStr(advanced, 'ruleBelowLeft')),
        ruleBelowRight: pxToPtDisplay(cssValStr(advanced, 'ruleBelowRight')),
        ruleBelowColor,
      };
    })(),

    // Advanced CSS textarea
    advancedCss: serializeAdvancedCss(unstructured),
  };
}

// ---------------------------------------------------------------------------
// Public API — paragraph style conversions
// ---------------------------------------------------------------------------

/**
 * Read a Template object and produce a BodyStyleDraft for the Body style panel.
 * Kept for backward compatibility — prefer templateStyleToParaDraft(template, 'body').
 */
export function templateBodyToStyleDraft(template: Template): BodyStyleDraft {
  return templateStyleToParaDraft(template, 'body');
}

/**
 * Read a Template object and produce a BodyStyleDraft for any paragraph style
 * (body, h1, h2, h3). The styleKey determines which contentStyles key to read.
 */
export function templateStyleToParaDraft(
  template: Template,
  styleKey: ParagraphStyleKey,
): BodyStyleDraft {
  const contentKey = PARA_CONTENT_KEY_MAP[styleKey] as keyof ContentStyles;
  const style: TemplateStyle = template.contentStyles?.[contentKey] ?? {};
  return styleObjectToBodyDraft(style);
}

/**
 * Convert a BodyStyleDraft back into a TemplateStyle shape,
 * ready to merge into template.contentStyles[key].
 *
 * Only fields with non-empty values are included — omitting a field is the same
 * as "not set" in the CSS output.
 *
 * Line height special case: values < 10 are unitless multipliers ('1.5' means
 * 1.5× font size). Values ≥ 10 are treated as pixel values ('18' → '18px').
 */
export function paraDraftToTemplateStyle(draft: BodyStyleDraft): TemplateStyle {
  return styleDraftToTemplateBody(draft);
}

/**
 * Convert a BodyStyleDraft back into the contentStyles.body TemplateStyle shape,
 * ready to merge into the template object.
 * @deprecated Use paraDraftToTemplateStyle. Kept for backward compatibility.
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

  // textTransform — omit '' and 'none' since they are the CSS default
  if (draft.textTransform && draft.textTransform !== 'none') {
    advanced.textTransform = draft.textTransform;
  } else {
    delete advanced.textTransform;
  }

  // Paragraph Rules — written as native CSS border properties so the CSS generator
  // can render them. Custom ruleAbove*/ruleBelow* keys and the CSS padding shorthand
  // are cleaned up so they don't conflict on re-read.
  const oldRuleKeys = [
    'ruleAboveEnabled', 'ruleAboveWeight', 'ruleAboveOffset', 'ruleAboveLeft', 'ruleAboveRight', 'ruleAboveColor',
    'ruleBelowEnabled', 'ruleBelowWeight', 'ruleBelowOffset', 'ruleBelowLeft', 'ruleBelowRight', 'ruleBelowColor',
  ];
  for (const key of oldRuleKeys) delete advanced[key];
  // Replace padding shorthand with individual paddingTop/paddingBottom for rule offsets
  delete advanced['padding'];

  if (draft.ruleAboveEnabled) {
    const wPx = ptDisplayToPx(draft.ruleAboveWeight) || '1px';
    const color = draft.ruleAboveColor || '#000000';
    advanced.borderTop = `${wPx} solid ${color}`;
    const offsetPx = ptDisplayToPx(draft.ruleAboveOffset);
    if (offsetPx) advanced.paddingTop = offsetPx; else delete advanced.paddingTop;
    const lPx = ptDisplayToPx(draft.ruleAboveLeft); if (lPx) advanced.ruleAboveLeft = lPx; else delete advanced.ruleAboveLeft;
    const rPx = ptDisplayToPx(draft.ruleAboveRight); if (rPx) advanced.ruleAboveRight = rPx; else delete advanced.ruleAboveRight;
  } else {
    delete advanced.borderTop;
    delete advanced.paddingTop;
    delete advanced.ruleAboveLeft;
    delete advanced.ruleAboveRight;
  }

  if (draft.ruleBelowEnabled) {
    const wPx = ptDisplayToPx(draft.ruleBelowWeight) || '1px';
    const color = draft.ruleBelowColor || '#000000';
    advanced.borderBottom = `${wPx} solid ${color}`;
    const offsetPx = ptDisplayToPx(draft.ruleBelowOffset);
    if (offsetPx) advanced.paddingBottom = offsetPx; else delete advanced.paddingBottom;
    const lPx = ptDisplayToPx(draft.ruleBelowLeft); if (lPx) advanced.ruleBelowLeft = lPx; else delete advanced.ruleBelowLeft;
    const rPx = ptDisplayToPx(draft.ruleBelowRight); if (rPx) advanced.ruleBelowRight = rPx; else delete advanced.ruleBelowRight;
  } else {
    delete advanced.borderBottom;
    delete advanced.paddingBottom;
    delete advanced.ruleBelowLeft;
    delete advanced.ruleBelowRight;
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
 * new BodyStyleDraft. Used by each property panel field's onChange handler.
 */
export function updateDraftBodyStyle(
  current: BodyStyleDraft,
  patch: Partial<BodyStyleDraft>,
): BodyStyleDraft {
  return { ...current, ...patch };
}

// ---------------------------------------------------------------------------
// Public API — character style conversions
// ---------------------------------------------------------------------------

/**
 * Read a Template object and produce a CharacterStyleDraft for the given
 * character style key (bold, italic, underline, link).
 *
 * - bold:      reads characterRules.bold.fontWeight/color and advanced
 * - italic:    reads characterRules.italic.advanced (fontStyle defaults to 'italic')
 * - underline: reads characterRules.underline.color and advanced
 * - link:      reads linkRules.color and linkRules.advanced
 */
export function templateStyleToCharacterDraft(
  template: Template,
  styleKey: CharacterStyleKey,
): CharacterStyleDraft {
  if (styleKey === 'link') {
    const linkAdv: CSSProperties = template.linkRules?.advanced ?? {};
    return {
      fontFamily: cssValStr(linkAdv, 'fontFamily'),
      fontWeight: cssValStr(linkAdv, 'fontWeight') || '400',
      fontStyle: toFontStyle(cssValStr(linkAdv, 'fontStyle')),
      fontSize: pxToPtDisplay(cssValStr(linkAdv, 'fontSize')),
      color: template.linkRules?.color || '#0000ee',
    };
  }

  if (styleKey === 'bold') {
    const boldRule = template.characterRules.bold;
    const advanced: CSSProperties = boldRule.advanced ?? {};
    return {
      fontFamily: cssValStr(advanced, 'fontFamily'),
      fontWeight: styleValStr(boldRule.fontWeight) || '700',
      fontStyle: toFontStyle(cssValStr(advanced, 'fontStyle')),
      fontSize: pxToPtDisplay(cssValStr(advanced, 'fontSize')),
      color: boldRule.color || cssValStr(advanced, 'color') || '#000000',
    };
  }

  if (styleKey === 'italic') {
    const italicRule = template.characterRules.italic;
    const advanced: CSSProperties = italicRule.advanced ?? {};
    const rawFontStyle = cssValStr(advanced, 'fontStyle');
    return {
      fontFamily: cssValStr(advanced, 'fontFamily'),
      fontWeight: cssValStr(advanced, 'fontWeight') || '400',
      // italic panel defaults fontStyle to 'italic' when not explicitly overridden
      fontStyle: rawFontStyle ? toFontStyle(rawFontStyle) : 'italic',
      fontSize: pxToPtDisplay(cssValStr(advanced, 'fontSize')),
      color: cssValStr(advanced, 'color') || '#000000',
    };
  }

  // underline
  const underlineRule = template.characterRules.underline;
  const advanced: CSSProperties = underlineRule.advanced ?? {};
  return {
    fontFamily: cssValStr(advanced, 'fontFamily'),
    fontWeight: cssValStr(advanced, 'fontWeight') || '400',
    fontStyle: toFontStyle(cssValStr(advanced, 'fontStyle')),
    fontSize: pxToPtDisplay(cssValStr(advanced, 'fontSize')),
    color: underlineRule.color || cssValStr(advanced, 'color') || '#000000',
  };
}

/**
 * Apply a CharacterStyleDraft back to the template, returning a new Template.
 * Each style key writes to a different section of the template:
 * - bold → characterRules.bold (fontWeight/color top-level; others in advanced)
 * - italic → characterRules.italic.advanced
 * - underline → characterRules.underline.color + advanced
 * - link → linkRules.color + linkRules.advanced
 */
export function characterDraftToTemplateUpdate(
  template: Template,
  draft: CharacterStyleDraft,
  styleKey: CharacterStyleKey,
): Template {
  /** Build an advanced CSSProperties object from the non-top-level draft fields. */
  const buildAdvanced = (
    includeFontWeight: boolean,
    includeColor: boolean,
  ): CSSProperties | undefined => {
    const adv: CSSProperties = {};
    if (draft.fontFamily) adv.fontFamily = draft.fontFamily;
    const fsPx = ptDisplayToPx(draft.fontSize);
    if (fsPx) adv.fontSize = fsPx;
    if (draft.fontStyle === 'italic') adv.fontStyle = 'italic';
    if (includeFontWeight && draft.fontWeight) adv.fontWeight = draft.fontWeight;
    if (includeColor && draft.color) adv.color = draft.color;
    return Object.keys(adv).length > 0 ? adv : undefined;
  };

  if (styleKey === 'link') {
    return {
      ...template,
      linkRules: {
        ...template.linkRules,
        color: draft.color,
        advanced: buildAdvanced(true, false),
      },
    };
  }

  if (styleKey === 'bold') {
    return {
      ...template,
      characterRules: {
        ...template.characterRules,
        bold: {
          ...template.characterRules.bold,
          fontWeight: draft.fontWeight ? Number(draft.fontWeight) : undefined,
          color: draft.color || undefined,
          advanced: buildAdvanced(false, false),
        },
      },
    };
  }

  if (styleKey === 'italic') {
    return {
      ...template,
      characterRules: {
        ...template.characterRules,
        italic: {
          ...template.characterRules.italic,
          advanced: buildAdvanced(true, true),
        },
      },
    };
  }

  // underline
  return {
    ...template,
    characterRules: {
      ...template.characterRules,
      underline: {
        ...template.characterRules.underline,
        color: draft.color || undefined,
        advanced: buildAdvanced(true, false),
      },
    },
  };
}

/**
 * Merge a partial CharacterStyleDraft patch into the current draft.
 * Used by CharacterStylePanel field onChange handlers.
 */
export function updateDraftCharStyle(
  current: CharacterStyleDraft,
  patch: Partial<CharacterStyleDraft>,
): CharacterStyleDraft {
  return { ...current, ...patch };
}

// ---------------------------------------------------------------------------
// Public API — list style conversions
// ---------------------------------------------------------------------------

/**
 * Read a Template object and produce a ListStyleDraft for the given list
 * style key (bulletedList, numberedList).
 *
 * Paragraph fields are read from listStyle.itemStyle (TemplateStyle).
 * Marker/indent fields are read from the ListStyle top-level properties.
 */
export function templateStyleToListDraft(
  template: Template,
  styleKey: ListStyleKey,
): ListStyleDraft {
  const templateKey = LIST_TEMPLATE_KEY_MAP[styleKey] as 'bulletedList' | 'orderedList';
  const listStyle = template.listStyles[templateKey];
  const defaultMarker = styleKey === 'bulletedList' ? 'disc' : 'decimal';

  // Paragraph overrides for list item text (empty style if not set)
  const itemStyle: TemplateStyle = listStyle.itemStyle ?? {};
  const paraDraft = styleObjectToBodyDraft(itemStyle);

  return {
    ...paraDraft,
    markerStyle: listStyle.markerType || defaultMarker,
    markerColor: listStyle.markerColor || '#000000',
    markerSize: pxToPtDisplay(listStyle.markerSize || ''),
    indent: pxToPtDisplay(listStyle.indentSize || ''),
  };
}

/**
 * Apply a ListStyleDraft back to the template, returning a new Template.
 * Paragraph fields are written to listStyle.itemStyle.
 * Marker/indent fields are written to ListStyle top-level properties.
 */
export function listDraftToTemplateUpdate(
  template: Template,
  draft: ListStyleDraft,
  styleKey: ListStyleKey,
): Template {
  const templateKey = LIST_TEMPLATE_KEY_MAP[styleKey] as 'bulletedList' | 'orderedList';
  const existingListStyle = template.listStyles[templateKey];

  // Convert paragraph draft fields to a TemplateStyle for itemStyle
  const itemStyle = styleDraftToTemplateBody(draft);

  const updatedListStyle = {
    ...existingListStyle,
    markerType: draft.markerStyle,
    markerColor: draft.markerColor,
    markerSize: draft.markerSize ? ptDisplayToPx(draft.markerSize) : existingListStyle.markerSize,
    indentSize: draft.indent ? ptDisplayToPx(draft.indent) : existingListStyle.indentSize,
    itemStyle: Object.keys(itemStyle).length > 0 ? itemStyle : undefined,
  };

  return {
    ...template,
    listStyles: {
      ...template.listStyles,
      [templateKey]: updatedListStyle,
    },
  };
}

/**
 * Merge a partial ListStyleDraft patch into the current draft.
 * Used by ListStylePanel field onChange handlers.
 */
export function updateDraftListStyle(
  current: ListStyleDraft,
  patch: Partial<ListStyleDraft>,
): ListStyleDraft {
  return { ...current, ...patch };
}
