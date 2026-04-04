/**
 * @file templates/types/styleEditor.ts
 * @role Local state types for the Template Editor property panel
 * @owns Editable draft representations of template style properties.
 *       These types are the intermediate state between the Template interface
 *       (serialised to localStorage) and the UI form fields (user input).
 * @does-not-own Conversion logic between Template ↔ draft (styleConversions.ts),
 *               template persistence (TemplateContext), UI rendering.
 *
 * Design intent:
 * - BodyStyleDraft is the Step 2 implementation for Body paragraph styling.
 * - In Step 3, this will generalise to a common StyleDraft type shared by all
 *   paragraph, character, and list style editors. Design BodyStyleDraft with
 *   that generalisation in mind — no Body-specific coupling in field names.
 * - All fields are strings to align with HTML input values. Numeric CSS values
 *   (e.g. font-size in px) are held as display strings ('13', not '13px').
 *   Conversion to/from the Template format is handled in styleConversions.ts.
 *
 * @governance Template Editor only
 * @see templates/utils/styleConversions.ts — converts Template ↔ BodyStyleDraft
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
