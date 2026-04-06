/**
 * @file templates/constants/pageSetupConstants.ts
 * @role Static data for Page Setup and Document Settings panels
 * @owns Page size option list, margin field descriptors, and default drafts.
 *
 * @see templates/components/PageSetupPanel.tsx — consumes PAGE_SIZE_OPTIONS
 * @see templates/utils/pageSetupConversions.ts — uses default values
 * @see mylo/templates/pageConfig.ts — authoritative page property defaults
 */

import type { PageSetupDraft, DocumentSettingsDraft } from '../types/pageSetup';

// ---------------------------------------------------------------------------
// Page size options
// ---------------------------------------------------------------------------

export const PAGE_SIZE_OPTIONS = [
  { value: 'letter',  label: 'US Letter (8.5 × 11 in)' },
  { value: 'legal',   label: 'US Legal (8.5 × 14 in)' },
  { value: 'tabloid', label: 'Tabloid (11 × 17 in)' },
  { value: 'A4',      label: 'A4 (8.27 × 11.69 in)' },
  { value: 'A5',      label: 'A5 (5.83 × 8.27 in)' },
] as const;

// ---------------------------------------------------------------------------
// Margin field descriptors (for rendering the four margin inputs)
// ---------------------------------------------------------------------------

export type MarginField = {
  key: keyof Pick<PageSetupDraft, 'marginTop' | 'marginRight' | 'marginBottom' | 'marginLeft'>;
  label: string;
};

export const MARGIN_FIELDS: MarginField[] = [
  { key: 'marginTop',    label: 'Top' },
  { key: 'marginRight',  label: 'Right' },
  { key: 'marginBottom', label: 'Bottom' },
  { key: 'marginLeft',   label: 'Left' },
];

// ---------------------------------------------------------------------------
// Default drafts
// ---------------------------------------------------------------------------

/** Default margin: 1 inch on all sides (matches pageConfig.ts '1in' default). */
const DEFAULT_MARGIN = '1';

export const DEFAULT_PAGE_SETUP_DRAFT: PageSetupDraft = {
  size: 'letter',
  marginTop:    DEFAULT_MARGIN,
  marginRight:  DEFAULT_MARGIN,
  marginBottom: DEFAULT_MARGIN,
  marginLeft:   DEFAULT_MARGIN,
};

export const DEFAULT_DOCUMENT_SETTINGS_DRAFT: DocumentSettingsDraft = {
  stripEmptyParagraphs: true,
};
