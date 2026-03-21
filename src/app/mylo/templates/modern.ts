import type { Template } from '../template';

/**
 * Modern Template - V2 Format
 * Corporate/modern styling with Gill Sans font and blue accent color:
 * - Gill Sans throughout
 * - Blue (#25408E) accent color for headings and bold
 * - H1 with decorative gradient underlines
 * - Lightweight body text (300 weight)
 * 
 * MIGRATED TO V2: Uses contentStyles + pageStyles instead of styles + pageLayout
 */
export const modernTemplate: Template = {
  id: "modern-template-v1",
  name: "Modern",
  version: "1.0.0",

  // NEW FORMAT: Content styles (paragraph and character formatting)
  contentStyles: {
    body: {
      fontFamily: "Gill Sans, sans-serif",
      fontSize: "13px",
      lineHeight: "18px",
      fontWeight: 300,
      color: "#000000",
      advanced: {
        marginTop: "0",
        marginBottom: "9px",
        letterSpacing: "0.2px",
      },
    },
    heading1: {
      fontFamily: "Gill Sans, sans-serif",
      fontSize: "24px",
      fontWeight: 600,
      lineHeight: "38px",
      color: "#25408E",
      advanced: {
        textAlign: "left",
        marginTop: "0",
        marginBottom: "40px",
        padding: "0px",
        backgroundImage: 'linear-gradient(to right, #ededed 0%, #ededed 94%,  #25408E 100%), linear-gradient(to right, #ededed 0%, #ededed 94%,  #25408E 100%), linear-gradient(to right, #ededed 0%, #ededed 94%, #25408E 100%)',
        backgroundRepeat: 'no-repeat, no-repeat, no-repeat',
        backgroundSize: '100% 5px, 95% 5px, 90% 5px',
        backgroundPosition: '0px calc(50% - 16px), 0px 50%, 0px calc(50% + 16px)',
      },
    },
    heading2: {
      fontFamily: "Gill Sans, sans-serif",
      fontSize: "17px",
      fontWeight: 600,
      lineHeight: "1.4",
      color: "#25408E",
      advanced: {
        marginTop: "10px",
        marginBottom: "10px",
        paddingTop: "10px",
      },
    },
    heading3: {
      fontFamily: "Gill Sans, sans-serif",
      fontSize: "13px",
      fontWeight: 600,
      lineHeight: "15px",
      color: "#000000",
      advanced: {
        marginTop: "0",
        marginBottom: "3px",
        fontStyle: "italic",
        paddingBottom: "3px",
      },
    },
  },

  // NEW FORMAT: Page layout (size and margins)
  pageStyles: {
    size: "letter",
    marginTop: 1.25,
    marginRight: 1.25,
    marginBottom: 1.25,
    marginLeft: 2.0, // Distinctive 2-inch left margin
  },

  // UNCHANGED: List styles remain the same
  listStyles: {
    bulletedList: {
      markerType: "disc",
      indentSize: "35px",
      itemSpacing: "0px",
      markerColor: "#000000",
      advanced: {
        marginBottom: "18px",
        paddingLeft: "35px",
      },
    },
    orderedList: {
      markerType: "decimal",
      indentSize: "35px",
      itemSpacing: "0px",
      markerColor: "#000000",
      advanced: {
        marginBottom: "18px",
        paddingLeft: "35px",
      },
    },
  },

  // UNCHANGED: Character rules remain the same
  characterRules: {
    bold: {
      enabled: true,
      fontWeight: 600,
      color: "#25408E",
    },
    italic: {
      enabled: true,
    },
    underline: {
      enabled: true,
      style: "solid",
      color: "#B3B3B3",
      advanced: {
        textUnderlineOffset: "4px",
        textDecorationThickness: "1.5px",
      },
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
    color: "#25408E",
    underline: true,
    hoverColor: "#1a2f6b",
  },
};