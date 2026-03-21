import type { Template } from '../template';

/**
 * Traditional Template - V2 Format
 * Based on traditional legal/academic document styling:
 * - Minion Pro serif font throughout
 * - Red accent color for headings and emphasis
 * - ALL CAPS for H1 and H2
 * - Numbered list alternates between decimal, lower-alpha, lower-roman by depth
 * 
 * MIGRATED TO V2: Uses contentStyles + pageStyles instead of styles + pageLayout
 */
export const formalTemplate: Template = {
  id: "formal-template-v1",
  name: "Traditional",
  version: "1.0.0",

  // NEW FORMAT: Content styles (paragraph and character formatting)
  contentStyles: {
    body: {
      fontFamily: "Minion Pro, Georgia, serif",
      fontSize: "13px",
      lineHeight: "18px",
      fontWeight: 400,
      color: "#000000",
      advanced: {
        marginTop: "0",
        marginBottom: "10px",
      },
    },
    heading1: {
      fontFamily: "Minion Pro, Georgia, serif",
      fontSize: "20px",
      fontWeight: 600,
      lineHeight: "24px",
      color: "#91161a",
      advanced: {
        textAlign: "center",
        textTransform: "uppercase",
        letterSpacing: "4px",
        borderTop: "1px solid #91161a",
        borderBottom: "1px solid #91161a",
        padding: "10px 0px 8px 0px",
        marginTop: "0",
        marginBottom: "55px",
      },
    },
    heading2: {
      fontFamily: "Minion Pro, Georgia, serif",
      fontSize: "14px",
      fontWeight: 700,
      lineHeight: "1.4",
      color: "#91161a",
      advanced: {
        textTransform: "uppercase",
        letterSpacing: "2px",
        borderTop: "0.5px solid #000000",
        padding: "5px 0px 0px 0px",
        marginTop: "34px",
        marginBottom: "10px",
      },
    },
    heading3: {
      fontFamily: "Minion Pro, Georgia, serif",
      fontSize: "13px",
      fontWeight: 700,
      lineHeight: "17px",
      color: "#000000",
      advanced: {
        marginTop: "5px",
        marginBottom: "0px",
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
      indentSize: "1.5rem",
      itemSpacing: "0px",
      markerColor: "#000000",
    },
    orderedList: {
      markerType: "decimal",
      indentSize: "1.5rem",
      itemSpacing: "0px",
      markerColor: "#000000",
    },
  },

  characterRules: {
    bold: {
      enabled: true,
      fontWeight: 700,
      color: "#91161a", // Red color for bold text in formal template
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

  linkRules: {
    color: "#91161a",
    underline: true,
    hoverColor: "#6b1015",
  },
};