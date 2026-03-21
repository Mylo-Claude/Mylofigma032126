import type { Template } from '../template';

/**
 * Default Template - V2 Format
 * Demonstrates template enforcement:
 * - System fonts throughout
 * - Fixed hierarchy with clear visual distinction
 * - Clean, readable typography
 * 
 * MIGRATED TO V2: Uses contentStyles + pageStyles instead of styles + pageLayout
 */
export const defaultTemplate: Template = {
  id: "default-template-v1",
  name: "Default",
  version: "1.0.0",

  // NEW FORMAT: Content styles (paragraph and character formatting)
  contentStyles: {
    body: {
      fontFamily: 'system-ui, -apple-system, Arial, sans-serif',
      fontSize: "16px",
      fontWeight: 400,
      lineHeight: "1.5",
      color: "#000000",
      advanced: {
        marginTop: "0",
        marginBottom: "16px",
      },
    },
    heading1: {
      fontFamily: 'system-ui, -apple-system, Arial, sans-serif',
      fontSize: "32px",
      fontWeight: 700,
      lineHeight: "1.2",
      color: "#000000",
      advanced: {
        marginTop: "24px",
        marginBottom: "16px",
      },
    },
    heading2: {
      fontFamily: 'system-ui, -apple-system, Arial, sans-serif',
      fontSize: "24px",
      fontWeight: 600,
      lineHeight: "1.3",
      color: "#000000",
      advanced: {
        marginTop: "20px",
        marginBottom: "12px",
      },
    },
    heading3: {
      fontFamily: 'system-ui, -apple-system, Arial, sans-serif',
      fontSize: "18px",
      fontWeight: 600,
      lineHeight: "1.4",
      color: "#000000",
      advanced: {
        marginTop: "16px",
        marginBottom: "8px",
      },
    },
  },

  // NEW FORMAT: Page layout (size and margins)
  pageStyles: {
    size: "letter",
    marginTop: 1.0,
    marginRight: 1.0,
    marginBottom: 1.0,
    marginLeft: 1.0,
  },

  // UNCHANGED: List styles remain the same
  listStyles: {
    bulletedList: {
      markerType: "disc",
      indentSize: "24px",
      itemSpacing: "8px",
      markerColor: "#1a1a1a",
    },
    orderedList: {
      markerType: "decimal",
      indentSize: "24px",
      itemSpacing: "8px",
      markerColor: "#1a1a1a",
    },
  },

  // UNCHANGED: Character rules remain the same
  characterRules: {
    bold: {
      enabled: true,
      fontWeight: 700,
    },
    italic: {
      enabled: true,
    },
    underline: {
      enabled: true,
      style: "solid",
    },
    superscript: {
      enabled: true,
      fontSize: "0.75em",
    },
    subscript: {
      enabled: true,
      fontSize: "0.75em",
    },
  },

  // UNCHANGED: Link rules remain the same
  linkRules: {
    color: "#0066cc",
    underline: true,
    hoverColor: "#0052a3",
  },
};