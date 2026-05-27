/**
 * Page Configuration Schema
 * 
 * Single source of truth for page properties and their mapping to Paged.js variables.
 * 
 * This schema defines:
 * - What page properties templates can configure
 * - How they map to Paged.js CSS variables
 * - Default values when not specified
 * 
 * To add a new page property:
 * 1. Add it to this schema
 * 2. Everything else updates automatically via the adapter
 */

export const PAGE_PROPERTIES = {
  margins: {
    top: {
      pagedJsVar: '--pagedjs-margin-top',
      default: '1in'
    },
    right: {
      pagedJsVar: '--pagedjs-margin-right',
      default: '1in'
    },
    bottom: {
      pagedJsVar: '--pagedjs-margin-bottom',
      default: '1in'
    },
    left: {
      pagedJsVar: '--pagedjs-margin-left',
      default: '1in'
    },
  },

  /**
   * Page size presets.
   * Values are in CSS inch strings.
   *
   * Paged.js sets page box dimensions via CSS custom properties on :root in its own
   * injected stylesheet (injected after ours, so @page size: overrides fail).
   * The adapter must set ALL width/height vars on .pagedjs_pages so the nearest-
   * ancestor inheritance rule overrides the :root values for page box descendants.
   *
   * To add a new preset:
   * 1. Add an entry here.
   * 2. Add a matching entry in templates/constants/pageSetupConstants.ts PAGE_SIZE_OPTIONS.
   * Everything else (adapter, panel) updates automatically.
   */
  pageSizes: {
    letter:  { width: '8.5in',  height: '11in'    },
    legal:   { width: '8.5in',  height: '14in'    },
    A4:      { width: '8.27in', height: '11.69in' },
    A5:      { width: '5.83in', height: '8.27in'  },
    tabloid: { width: '11in',   height: '17in'    },
  },

  /**
   * All Paged.js CSS custom property names that control page dimensions.
   * Must be overridden together on .pagedjs_pages to avoid Paged.js's :root defaults
   * (which are always set to letter size) from controlling page box sizing.
   */
  pagedJsSizeVars: {
    width:  ['--pagedjs-width',  '--pagedjs-width-right',  '--pagedjs-width-left',  '--pagedjs-pagebox-width'],
    height: ['--pagedjs-height', '--pagedjs-height-right', '--pagedjs-height-left', '--pagedjs-pagebox-height'],
  },
} as const;
