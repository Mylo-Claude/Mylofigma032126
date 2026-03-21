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
} as const;
