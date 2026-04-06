/**
 * @file templates/types/pageSetup.ts
 * @role Draft state types for Page Setup and Document Settings panels
 * @owns UI-layer draft interfaces for the two non-style panels.
 *       These are the in-panel editing representations; conversion to/from
 *       Template is handled by pageSetupConversions.ts.
 *
 * @see templates/utils/pageSetupConversions.ts — Template ↔ draft helpers
 * @see templates/components/PageSetupPanel.tsx — consumes PageSetupDraft
 * @see templates/components/DocumentSettingsPanel.tsx — consumes DocumentSettingsDraft
 * @see mylo/template.ts — PageStyles and DocumentSettings (canonical types)
 */

/**
 * UI draft for the Page Setup panel.
 * Margins are stored as strings (user input); converted to numbers on commit
 * via draftToPageStyles() to match the pageConfigAdapter contract.
 */
export interface PageSetupDraft {
  /** Page size preset key. e.g. 'letter', 'A4', 'legal' */
  size: string;
  /** Top margin in inches (string for controlled input) */
  marginTop: string;
  /** Right margin in inches (string for controlled input) */
  marginRight: string;
  /** Bottom margin in inches (string for controlled input) */
  marginBottom: string;
  /** Left margin in inches (string for controlled input) */
  marginLeft: string;
}

/**
 * UI draft for the Document Settings panel.
 * Mirrors DocumentSettings but always fully typed (no optional fields).
 */
export interface DocumentSettingsDraft {
  /** When true, consecutive empty paragraphs are stripped on export. */
  stripEmptyParagraphs: boolean;
}
