/**
 * @file templates/utils/pageSetupConversions.ts
 * @role Pure conversion helpers for Page Setup and Document Settings panels
 * @owns Transforms between Template (PageStyles / DocumentSettings) and the
 *       UI draft types (PageSetupDraft / DocumentSettingsDraft).
 *
 * Contract with pageConfigAdapter.ts (do not modify that file):
 *   - Margin keys: marginTop, marginRight, marginBottom, marginLeft
 *   - Margin values: plain number (inches) — adapter appends 'in' when writing to Paged.js
 *   - Size: plain string preset name ('letter', 'A4', etc.)
 *
 * @see mylo/template.ts — PageStyles, DocumentSettings
 * @see mylo/templates/pageConfigAdapter.ts — consumes PageStyles (read-only contract)
 * @see templates/types/pageSetup.ts — PageSetupDraft, DocumentSettingsDraft
 * @see templates/constants/pageSetupConstants.ts — DEFAULT_PAGE_SETUP_DRAFT
 */

import type { PageStyles, DocumentSettings } from '../../mylo/template';
import type { PageSetupDraft, DocumentSettingsDraft } from '../types/pageSetup';

// ---------------------------------------------------------------------------
// Page Setup conversions
// ---------------------------------------------------------------------------

/**
 * Convert a Template's PageStyles to a PageSetupDraft for UI editing.
 * Missing margin values default to '1' (1 inch), matching pageConfig defaults.
 */
export function pageStylesToDraft(pageStyles: PageStyles): PageSetupDraft {
  return {
    size:         pageStyles.size ?? 'letter',
    marginTop:    pageStyles.marginTop    !== undefined ? String(pageStyles.marginTop)    : '1',
    marginRight:  pageStyles.marginRight  !== undefined ? String(pageStyles.marginRight)  : '1',
    marginBottom: pageStyles.marginBottom !== undefined ? String(pageStyles.marginBottom) : '1',
    marginLeft:   pageStyles.marginLeft   !== undefined ? String(pageStyles.marginLeft)   : '1',
  };
}

/**
 * Convert a PageSetupDraft back to PageStyles for writing to Template.
 * String margin values are parsed to numbers; invalid/empty values fall back to 1.
 * The resulting numbers are used directly by pageConfigAdapter: `${value}in`.
 */
export function draftToPageStyles(draft: PageSetupDraft): PageStyles {
  const parseMargin = (v: string): number => {
    const n = parseFloat(v);
    return Number.isFinite(n) && n >= 0 ? n : 1;
  };
  return {
    size:         draft.size,
    marginTop:    parseMargin(draft.marginTop),
    marginRight:  parseMargin(draft.marginRight),
    marginBottom: parseMargin(draft.marginBottom),
    marginLeft:   parseMargin(draft.marginLeft),
  };
}

// ---------------------------------------------------------------------------
// Document Settings conversions
// ---------------------------------------------------------------------------

/**
 * Convert optional DocumentSettings to a fully-typed DocumentSettingsDraft.
 * Missing settings default to `true` (matches resolveDocumentSettings behaviour).
 */
export function documentSettingsToDraft(settings?: DocumentSettings): DocumentSettingsDraft {
  return {
    stripEmptyParagraphs: settings?.stripEmptyParagraphs ?? true,
  };
}

/**
 * Convert a DocumentSettingsDraft back to DocumentSettings for writing to Template.
 */
export function draftToDocumentSettings(draft: DocumentSettingsDraft): DocumentSettings {
  return {
    stripEmptyParagraphs: draft.stripEmptyParagraphs,
  };
}
