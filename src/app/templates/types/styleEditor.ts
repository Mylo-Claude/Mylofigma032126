/**
 * @file templates/types/styleEditor.ts
 * @role Local state types for the Template Editor property panels
 * @owns Editable draft representations of template style properties for all
 *       three style families: paragraph (BodyStyleDraft), character
 *       (CharacterStyleDraft), and list (ListStyleDraft).
 *       These types are the intermediate state between the Template interface
 *       (serialised to localStorage) and the UI form fields (user input).
 * @does-not-own Conversion logic between Template ↔ draft (styleConversions.ts),
 *               template persistence (TemplateContext), UI rendering.
 *
 * Design decisions:
 * - All dimensional values are display strings (numeric without unit suffix).
 *   E.g. '13' not '13px'. Conversion handled in styleConversions.ts.
 * - BodyStyleDraft is reused for all four paragraph styles (body/h1/h2/h3);
 *   ParagraphStylePanel selects the correct template key via styleKey prop.
 * - ListStyleDraft extends BodyStyleDraft — list items have all paragraph
 *   fields plus marker/indent overrides.
 * - CharacterStyleDraft covers the subset of fields relevant to inline marks.
 *
 * @governance Template Editor only
 * @see templates/utils/styleConversions.ts — converts Template ↔ draft types
 * @see templates/constants/stylePropertyMap.ts — field-to-template-key mapping
 */

/**
 * Editable draft state for the Body paragraph style property panel.
 *
 * Typography fields correspond to the Typography tab.
 * Spacing fields correspond to the Spacing tab.
 * advancedCss holds any advanced properties not covered by structured fields.
 *
 * All dimensional values (fontSize, lineHeight, etc.) are stored as display
 * strings — the numeric portion without the unit suffix. The UI renders the
 * unit label separately. styleConversions.ts handles the px↔display round-trip.
 */
export interface BodyStyleDraft {
  // ---------------------------------------------------------------------------
  // Typography tab
  // ---------------------------------------------------------------------------

  /** Font family stack, e.g. 'Gill Sans, sans-serif'. Empty string = not set. */
  fontFamily: string;

  /**
   * Font size as a display number string, e.g. '13' (stored as '13px').
   * Empty string means not set.
   */
  fontSize: string;

  /**
   * Font weight as a string matching the weight select options, e.g. '400'.
   * Stores numeric weight values as strings for select compatibility.
   */
  fontWeight: string;

  /** Normal or italic. */
  fontStyle: 'normal' | 'italic';

  /**
   * Line height as a display string.
   * If the template value has a px unit ('18px'), displays as '18'.
   * If unitless ('1.5'), stored and displayed as-is.
   */
  lineHeight: string;

  /**
   * Letter spacing (tracking) as a display number string, e.g. '0.2' (stored as '0.2px').
   * Empty string = not set.
   */
  letterSpacing: string;

  /** Text color as a 6-digit hex string including #, e.g. '#000000'. */
  color: string;

  /** Text alignment. */
  textAlign: 'left' | 'center' | 'right' | 'justify';

  // ---------------------------------------------------------------------------
  // Spacing tab (all from contentStyles.body.advanced)
  // ---------------------------------------------------------------------------

  /** Space Before as a display number string, maps to marginTop in advanced. */
  marginTop: string;

  /** Space After as a display number string, maps to marginBottom in advanced. */
  marginBottom: string;

  /** Left Indent as a display number string, maps to paddingLeft in advanced. */
  paddingLeft: string;

  /** Right Indent as a display number string, maps to paddingRight in advanced. */
  paddingRight: string;

  /** First Line Indent as a display number string, maps to textIndent in advanced. */
  textIndent: string;

  // ---------------------------------------------------------------------------
  // Case
  // ---------------------------------------------------------------------------

  /**
   * Text transform (case). Maps to CSS `text-transform`.
   * '' or 'none' means not set (CSS default).
   * Values: '' | 'none' | 'uppercase' | 'lowercase' | 'capitalize' | 'small-caps'
   */
  textTransform: string;

  // ---------------------------------------------------------------------------
  // Paragraph Rules
  // ---------------------------------------------------------------------------

  /** Whether Rule Above is enabled. When false, rule fields are dimmed and ignored. */
  ruleAboveEnabled: boolean;
  /** Stroke weight of Rule Above, in pt display units. */
  ruleAboveWeight: string;
  /** Vertical offset of Rule Above from the top of the line, in pt display units. */
  ruleAboveOffset: string;
  /** Left extension of Rule Above beyond the text frame, in pt display units. */
  ruleAboveLeft: string;
  /** Right extension of Rule Above beyond the text frame, in pt display units. */
  ruleAboveRight: string;
  /** Stroke color of Rule Above as a hex string, e.g. '#000000'. */
  ruleAboveColor: string;

  /** Whether Rule Below is enabled. When false, rule fields are dimmed and ignored. */
  ruleBelowEnabled: boolean;
  /** Stroke weight of Rule Below, in pt display units. */
  ruleBelowWeight: string;
  /** Vertical offset of Rule Below from the bottom of the line, in pt display units. */
  ruleBelowOffset: string;
  /** Left extension of Rule Below beyond the text frame, in pt display units. */
  ruleBelowLeft: string;
  /** Right extension of Rule Below beyond the text frame, in pt display units. */
  ruleBelowRight: string;
  /** Stroke color of Rule Below as a hex string, e.g. '#000000'. */
  ruleBelowColor: string;

  // ---------------------------------------------------------------------------
  // Advanced CSS tab (escape hatch)
  // ---------------------------------------------------------------------------

  /**
   * Free-form advanced CSS properties not covered by structured fields.
   * Format: one 'propertyName: value' entry per line (camelCase property names).
   * Example: 'textTransform: uppercase\nborderBottom: 1px solid #000'
   */
  advancedCss: string;
}

// ---------------------------------------------------------------------------
// CharacterStyleDraft
// ---------------------------------------------------------------------------

/**
 * Editable draft state for character style property panels
 * (Bold, Italic, Underline, Link).
 *
 * Character styles override a subset of paragraph style fields — no spacing,
 * paragraph rules, or keep options. All dimensional values are display strings.
 */
export interface CharacterStyleDraft {
  /** Font family override stack, e.g. 'Georgia, serif'. Empty = inherit. */
  fontFamily: string;

  /**
   * Font weight as a numeric string matching the select options, e.g. '700'.
   * For bold: stored as characterRules.bold.fontWeight (number).
   * For italic/underline/link: stored in advanced.fontWeight.
   */
  fontWeight: string;

  /** Normal or italic. */
  fontStyle: 'normal' | 'italic';

  /**
   * Font size as a display number string, e.g. '13' (stored as '13px').
   * Empty = inherit from paragraph style.
   */
  fontSize: string;

  /** Text color as a 6-digit hex string including #, e.g. '#000000'. */
  color: string;
}

// ---------------------------------------------------------------------------
// ListStyleDraft
// ---------------------------------------------------------------------------

/**
 * Editable draft state for list style property panels
 * (Bulleted List, Numbered List).
 *
 * Extends BodyStyleDraft so the ListStylePanel can reuse all paragraph
 * style fields (Typography, Spacing, Paragraph Rules) for list item text
 * overrides, plus adds list-specific marker and indent fields.
 *
 * Paragraph fields are stored in ListStyle.itemStyle in the template.
 * Marker/indent fields map to ListStyle top-level properties.
 */
export interface ListStyleDraft extends BodyStyleDraft {
  /**
   * Marker type for this list.
   * Bulleted: 'disc' | 'circle' | 'square'
   * Numbered: 'decimal' | 'lower-alpha' | 'lower-roman' | 'upper-alpha' | 'upper-roman'
   */
  markerStyle: string;

  /** Marker color as a hex string, e.g. '#000000'. */
  markerColor: string;

  /**
   * Marker glyph size as a display pt string, e.g. '12'.
   * Stored as markerSize (px string) in ListStyle. Empty = inherit.
   */
  markerSize: string;

  /**
   * Left indent / hanging indent as a display pt string, e.g. '24'.
   * Maps to indentSize in ListStyle (stored as px string).
   */
  indent: string;
}
