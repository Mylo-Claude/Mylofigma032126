/**
 * Page Layout Utilities
 * 
 * Purpose: Convert template margin settings to Paged.js CSS rules
 * Governance: Template Editor controls margins via template configuration
 * 
 * Step 2: Margin-to-CSS Conversion
 */

import type { Template, PageStyles, ContentStyles, TemplateStyle, ListStyle } from '../mylo/template';
import { PAGE_PROPERTIES } from '../mylo/templates/pageConfig';

/**
 * Convert camelCase to kebab-case for CSS properties.
 */
function camelToKebab(str: string): string {
  return str.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);
}

/**
 * Generate @page CSS rules from PageStyles.
 * 
 * STEP 6: Now schema-driven using PAGE_PROPERTIES
 *
 * @param pageStyles - Page styling configuration
 * @returns CSS string with @page rule
 */
function generatePageCSS(pageStyles: PageStyles): string {
  // Resolve explicit dimensions from the pageSizes map.
  // Paged.js does not reliably parse named size strings (e.g. "legal", "A4") in
  // @page { size: ... }; it requires explicit inch values like "8.5in 14in" to
  // generate its internal --pagedjs-width / --pagedjs-height :root variables correctly.
  const sizeKey = (pageStyles.size ?? 'letter') as keyof typeof PAGE_PROPERTIES.pageSizes;
  const sizeConfig = PAGE_PROPERTIES.pageSizes[sizeKey] ?? PAGE_PROPERTIES.pageSizes.letter;

  // STEP 6: Schema-driven margin generation
  const margins = PAGE_PROPERTIES.margins;
  const marginTop    = pageStyles.marginTop    ?? parseFloat(margins.top.default);
  const marginRight  = pageStyles.marginRight  ?? parseFloat(margins.right.default);
  const marginBottom = pageStyles.marginBottom ?? parseFloat(margins.bottom.default);
  const marginLeft   = pageStyles.marginLeft   ?? parseFloat(margins.left.default);

  return `
@page {
  size: ${sizeConfig.width} ${sizeConfig.height};
  margin: ${marginTop}in ${marginRight}in ${marginBottom}in ${marginLeft}in;
}`.trim();
}

/**
 * Generate content styling CSS from ContentStyles.
 *
 * Maps semantic keys to HTML selectors.
 *
 * Paragraph rule indents (ruleAboveLeft, ruleAboveRight, ruleBelowLeft,
 * ruleBelowRight) are not valid CSS properties — they are editor-only
 * keys stored in the advanced object. When present alongside borderTop/
 * borderBottom they are handled via ::before / ::after pseudo-elements
 * so that margin-left / margin-right can independently inset the rule
 * line. Without pseudo-elements, a border-top on a block element cannot
 * be inset from its sides.
 *
 * @param contentStyles - Content styling configuration
 * @returns CSS string with scoped selectors
 */
function generateContentCSS(contentStyles: ContentStyles): string {
  // Map semantic template keys to HTML element selectors
  const selectorMap: Record<keyof ContentStyles, string> = {
    body: 'p',
    heading1: 'h1',
    heading2: 'h2',
    heading3: 'h3',
  };

  let css = '';

  for (const [key, styleObj] of Object.entries(contentStyles)) {
    const htmlElement = selectorMap[key as keyof ContentStyles];
    const selector = `.mylo-preview ${htmlElement}[data-type="${key}"]`;

    // Collect all CSS properties (top-level + advanced)
    const allProps: Record<string, string | number> = {};

    for (const [prop, value] of Object.entries(styleObj)) {
      if (prop === 'advanced' && typeof value === 'object' && value !== null) {
        // Flatten advanced properties into main properties
        Object.assign(allProps, value);
      } else if (typeof value !== 'object') {
        // Add top-level property
        allProps[prop] = value;
      }
      // Skip other object properties (shouldn't exist)
    }

    // Extract paragraph-rule indent keys — these are editor-only storage keys,
    // not valid CSS properties, and must never appear in the output stylesheet.
    const ruleAboveLeft  = allProps.ruleAboveLeft  as string | undefined;
    const ruleAboveRight = allProps.ruleAboveRight as string | undefined;
    const ruleBelowLeft  = allProps.ruleBelowLeft  as string | undefined;
    const ruleBelowRight = allProps.ruleBelowRight as string | undefined;
    delete allProps.ruleAboveLeft;
    delete allProps.ruleAboveRight;
    delete allProps.ruleBelowLeft;
    delete allProps.ruleBelowRight;

    // Rule Above with left/right indent — generate ::before pseudo-element.
    // A border-top on a block element spans the full box width with no way to
    // independently inset it. A ::before block can carry its own margin-left /
    // margin-right to shorten the rule from either side.
    if (allProps.borderTop && (ruleAboveLeft || ruleAboveRight)) {
      const borderTopVal    = allProps.borderTop as string;
      const verticalOffset  = (allProps.paddingTop as string | undefined) || '0';
      delete allProps.borderTop;
      delete allProps.paddingTop;

      css += `${selector}::before {\n`;
      css += `  content: '';\n`;
      css += `  display: block;\n`;
      css += `  height: 0;\n`;
      css += `  border-top: ${borderTopVal};\n`;
      css += `  margin-left: ${ruleAboveLeft  || '0'};\n`;
      css += `  margin-right: ${ruleAboveRight || '0'};\n`;
      css += `  margin-bottom: ${verticalOffset};\n`;
      css += `}\n\n`;
    }

    // Rule Below with left/right indent — generate ::after pseudo-element.
    // border-top on ::after draws a line at the top of the pseudo-element,
    // which sits below the element's content, producing the rule-below effect.
    if (allProps.borderBottom && (ruleBelowLeft || ruleBelowRight)) {
      const borderBottomVal = allProps.borderBottom as string;
      const verticalOffset  = (allProps.paddingBottom as string | undefined) || '0';
      delete allProps.borderBottom;
      delete allProps.paddingBottom;

      css += `${selector}::after {\n`;
      css += `  content: '';\n`;
      css += `  display: block;\n`;
      css += `  height: 0;\n`;
      css += `  border-top: ${borderBottomVal};\n`;
      css += `  margin-left: ${ruleBelowLeft  || '0'};\n`;
      css += `  margin-right: ${ruleBelowRight || '0'};\n`;
      css += `  margin-top: ${verticalOffset};\n`;
      css += `}\n\n`;
    }

    // Convert remaining properties to CSS declarations
    const declarations = Object.entries(allProps)
      .map(([prop, val]) => `  ${camelToKebab(prop)}: ${val};`)
      .join('\n');

    css += `${selector} {\n${declarations}\n}\n\n`;
  }

  return css.trim();
}

/**
 * Generate list styling CSS from ListStyles.
 *
 * Maps semantic keys to HTML selectors for ul and ol elements.
 *
 * @param listStyles - List styling configuration from template
 * @param bodyStyle - Body typography to apply to list items
 * @returns CSS string with scoped selectors
 */
function generateListCSS(listStyles: { bulletedList: any; orderedList: any }, bodyStyle: any): string {
  let css = '';

  // Generate bulletedList CSS (maps to <ul>)
  if (listStyles.bulletedList) {
    const bl = listStyles.bulletedList;

    // ul: structure (marker type, indentation). Color is intentionally omitted here —
    // setting `color` on `ul` is overridden by the more-specific `li` rule below.
    // Marker color is applied via `::marker` so it is independent of text color.
    const ulProps: Record<string, string | number> = {};
    if (bl.markerType) ulProps.listStyleType = bl.markerType;
    if (bl.indentSize) ulProps.paddingLeft = bl.indentSize;
    if (bl.advanced) Object.assign(ulProps, bl.advanced);

    const ulDeclarations = Object.entries(ulProps)
      .map(([prop, val]) => `  ${camelToKebab(prop)}: ${val};`)
      .join('\n');
    if (ulDeclarations) css += `.mylo-preview ul {\n${ulDeclarations}\n}\n\n`;

    // ul li::marker: color (Bug 1) and font-size / marker size (Bug 3)
    const ulMarkerProps: Record<string, string | number> = {};
    if (bl.markerColor) ulMarkerProps.color = bl.markerColor;
    if (bl.markerSize) ulMarkerProps.fontSize = bl.markerSize;

    const ulMarkerDeclarations = Object.entries(ulMarkerProps)
      .map(([prop, val]) => `  ${camelToKebab(prop)}: ${val};`)
      .join('\n');
    if (ulMarkerDeclarations) css += `.mylo-preview ul li::marker {\n${ulMarkerDeclarations}\n}\n\n`;
  }

  // Generate orderedList CSS (maps to <ol>)
  if (listStyles.orderedList) {
    const ol = listStyles.orderedList;

    const olProps: Record<string, string | number> = {};
    if (ol.markerType) olProps.listStyleType = ol.markerType;
    if (ol.indentSize) olProps.paddingLeft = ol.indentSize;
    if (ol.advanced) Object.assign(olProps, ol.advanced);

    const olDeclarations = Object.entries(olProps)
      .map(([prop, val]) => `  ${camelToKebab(prop)}: ${val};`)
      .join('\n');
    if (olDeclarations) css += `.mylo-preview ol {\n${olDeclarations}\n}\n\n`;

    // ol li::marker: color and font-size
    const olMarkerProps: Record<string, string | number> = {};
    if (ol.markerColor) olMarkerProps.color = ol.markerColor;
    if (ol.markerSize) olMarkerProps.fontSize = ol.markerSize;

    const olMarkerDeclarations = Object.entries(olMarkerProps)
      .map(([prop, val]) => `  ${camelToKebab(prop)}: ${val};`)
      .join('\n');
    if (olMarkerDeclarations) css += `.mylo-preview ol li::marker {\n${olMarkerDeclarations}\n}\n\n`;
  }
  
  // Generate list item typography (inherit from body) and spacing
  const liSelector = '.mylo-preview li';
  const liProps: Record<string, string | number> = {};
  
  // Apply body typography to list items
  if (bodyStyle) {
    // Core typography properties
    if (bodyStyle.fontFamily) liProps.fontFamily = bodyStyle.fontFamily;
    if (bodyStyle.fontSize) liProps.fontSize = bodyStyle.fontSize;
    if (bodyStyle.fontWeight) liProps.fontWeight = bodyStyle.fontWeight;
    if (bodyStyle.lineHeight) liProps.lineHeight = bodyStyle.lineHeight;
    if (bodyStyle.color) liProps.color = bodyStyle.color;
    if (bodyStyle.letterSpacing) liProps.letterSpacing = bodyStyle.letterSpacing;
    
    // Handle advanced properties from body
    if (bodyStyle.advanced) {
      // Only apply typography-related advanced properties, not layout
      const typographyProps = ['fontFamily', 'fontSize', 'fontWeight', 'lineHeight', 'color', 'letterSpacing', 'fontStyle'];
      for (const [key, value] of Object.entries(bodyStyle.advanced)) {
        if (typographyProps.includes(key)) {
          liProps[key] = value as string | number;
        }
      }
    }
  }
  
  // Add item spacing
  const itemSpacing = listStyles.bulletedList?.itemSpacing || listStyles.orderedList?.itemSpacing;
  if (itemSpacing) {
    liProps.marginBottom = itemSpacing;
  }
  
  // Convert to CSS declarations
  const liDeclarations = Object.entries(liProps)
    .map(([prop, val]) => `  ${camelToKebab(prop)}: ${val};`)
    .join('\n');
  
  if (liDeclarations) {
    css += `${liSelector} {\n${liDeclarations}\n}\n\n`;
  }
  
  return css.trim();
}

/**
 * Generate character mark CSS from CharacterRules.
 *
 * Generates CSS for bold, italic, underline, superscript, subscript, and links.
 *
 * @param characterRules - Character rules from template
 * @param linkRules - Link rules from template
 * @returns CSS string with scoped selectors for character marks
 */
function generateCharacterCSS(characterRules: Template['characterRules'], linkRules: Template['linkRules']): string {
  let css = '';
  
  // Bold - <strong> tag
  if (characterRules.bold.enabled) {
    const selector = '.mylo-preview strong';
    const props: Record<string, string | number> = {};
    
    if (characterRules.bold.fontWeight) {
      props.fontWeight = characterRules.bold.fontWeight;
    }
    if (characterRules.bold.color) {
      props.color = characterRules.bold.color;
    }
    
    // Apply advanced properties
    if (characterRules.bold.advanced) {
      Object.assign(props, characterRules.bold.advanced);
    }
    
    const declarations = Object.entries(props)
      .map(([prop, val]) => `  ${camelToKebab(prop)}: ${val};`)
      .join('\n');
    
    if (declarations) {
      css += `${selector} {\n${declarations}\n}\n\n`;
    }
  }
  
  // Italic - <em> tag
  if (characterRules.italic.enabled) {
    const selector = '.mylo-preview em';
    const props: Record<string, string | number> = {};
    
    // Apply advanced properties
    if (characterRules.italic.advanced) {
      Object.assign(props, characterRules.italic.advanced);
    }
    
    const declarations = Object.entries(props)
      .map(([prop, val]) => `  ${camelToKebab(prop)}: ${val};`)
      .join('\n');
    
    if (declarations) {
      css += `${selector} {\n${declarations}\n}\n\n`;
    }
  }
  
  // Underline - <u> tag
  if (characterRules.underline.enabled) {
    const selector = '.mylo-preview u';
    const props: Record<string, string | number> = {};
    
    // Default underline styling
    props.textDecoration = 'underline';
    
    if (characterRules.underline.style) {
      props.textDecorationStyle = characterRules.underline.style;
    }
    if (characterRules.underline.color) {
      props.textDecorationColor = characterRules.underline.color;
    }
    
    // Apply advanced properties
    if (characterRules.underline.advanced) {
      Object.assign(props, characterRules.underline.advanced);
    }
    
    const declarations = Object.entries(props)
      .map(([prop, val]) => `  ${camelToKebab(prop)}: ${val};`)
      .join('\n');
    
    if (declarations) {
      css += `${selector} {\n${declarations}\n}\n\n`;
    }
  }
  
  // Superscript - <sup> tag
  if (characterRules.superscript.enabled) {
    const selector = '.mylo-preview sup';
    const props: Record<string, string | number> = {};
    
    if (characterRules.superscript.fontSize) {
      props.fontSize = characterRules.superscript.fontSize;
    }
    
    // Apply advanced properties
    if (characterRules.superscript.advanced) {
      Object.assign(props, characterRules.superscript.advanced);
    }
    
    const declarations = Object.entries(props)
      .map(([prop, val]) => `  ${camelToKebab(prop)}: ${val};`)
      .join('\n');
    
    if (declarations) {
      css += `${selector} {\n${declarations}\n}\n\n`;
    }
  }
  
  // Subscript - <sub> tag
  if (characterRules.subscript.enabled) {
    const selector = '.mylo-preview sub';
    const props: Record<string, string | number> = {};
    
    if (characterRules.subscript.fontSize) {
      props.fontSize = characterRules.subscript.fontSize;
    }
    
    // Apply advanced properties
    if (characterRules.subscript.advanced) {
      Object.assign(props, characterRules.subscript.advanced);
    }
    
    const declarations = Object.entries(props)
      .map(([prop, val]) => `  ${camelToKebab(prop)}: ${val};`)
      .join('\n');
    
    if (declarations) {
      css += `${selector} {\n${declarations}\n}\n\n`;
    }
  }
  
  // Links - <a> tag
  const linkSelector = '.mylo-preview a';
  const linkProps: Record<string, string | number> = {};
  
  if (linkRules.color) {
    linkProps.color = linkRules.color;
  }
  if (linkRules.underline !== undefined) {
    linkProps.textDecoration = linkRules.underline ? 'underline' : 'none';
  }
  
  // Apply advanced properties
  if (linkRules.advanced) {
    Object.assign(linkProps, linkRules.advanced);
  }
  
  const linkDeclarations = Object.entries(linkProps)
    .map(([prop, val]) => `  ${camelToKebab(prop)}: ${val};`)
    .join('\n');
  
  if (linkDeclarations) {
    css += `${linkSelector} {\n${linkDeclarations}\n}\n\n`;
  }
  
  return css.trim();
}

/**
 * Generate complete stylesheet from template configuration.
 * All templates now use V2 format (contentStyles + pageStyles).
 *
 * @param template - Template configuration (V2 format)
 * @returns Complete CSS string with @page rules and content styles
 */
function generateTemplateStylesheet(template: Template): string {
  // V2 format - use directly
  const contentStyles = template.contentStyles;
  const pageStyles = template.pageStyles;
  
  // Generate all sections
  const pageCSS = generatePageCSS(pageStyles);
  const contentCSS = generateContentCSS(contentStyles);
  const listCSS = template.listStyles ? generateListCSS(template.listStyles, contentStyles.body) : '';
  const characterCSS = generateCharacterCSS(template.characterRules, template.linkRules);
  
  // Combine with clear separation
  return `${pageCSS}\n\n${contentCSS}${listCSS ? '\n\n' + listCSS : ''}${characterCSS ? '\n\n' + characterCSS : ''}`;
}

/**
 * INLINE VALIDATION TESTS
 * Run these tests to verify CSS generation correctness
 */

/**
 * Test V2 format template stylesheet generation
 */
function testV2TemplateGeneration() {
  console.log('\n=== Testing V2 Template Generation ===');
  
  const v2Template: Template = {
    id: 'test-v2',
    name: 'Test V2 Template',
    version: '2.0',
    contentStyles: {
      body: { fontSize: '12pt', lineHeight: '1.5' },
      heading1: { fontSize: '24pt', fontWeight: 'bold' },
      heading2: { fontSize: '18pt', fontWeight: 'bold' },
      heading3: { fontSize: '14pt', fontWeight: 'bold' },
    },
    pageStyles: {
      size: 'letter',
      marginTop: 1,
      marginRight: 1,
      marginBottom: 1,
      marginLeft: 1,
    },
    listStyles: {
      bulletedList: { markerType: 'disc', indentSize: '30px' },
      orderedList: { markerType: 'decimal', indentSize: '30px' },
    },
    characterRules: {
      bold: { enabled: true },
      italic: { enabled: true },
      underline: { enabled: true },
      superscript: { enabled: true },
      subscript: { enabled: true },
    },
    linkRules: {
      underline: true,
    },
  };
  
  const css = generateTemplateStylesheet(v2Template);
  console.log('Generated CSS:\n', css);
  console.log('✓ V2 template generation complete');
}

/**
 * Test camelCase to kebab-case conversion
 */
function testCamelToKebab() {
  console.log('\n=== Testing camelToKebab ===');
  
  const tests = [
    ['fontSize', 'font-size'],
    ['lineHeight', 'line-height'],
    ['fontWeight', 'font-weight'],
    ['textAlign', 'text-align'],
    ['marginTop', 'margin-top'],
  ];
  
  tests.forEach(([input, expected]) => {
    const result = camelToKebab(input);
    const pass = result === expected;
    console.log(`${pass ? '✓' : '✗'} ${input} → ${result} ${!pass ? `(expected ${expected})` : ''}`);
  });
}

/**
 * Run all validation tests
 */
export function runCSSGeneratorTests() {
  console.log('\n========================================');
  console.log('CSS Generator Validation Tests');
  console.log('========================================');
  
  testCamelToKebab();
  testV2TemplateGeneration();
  
  console.log('\n========================================');
  console.log('All tests complete');
  console.log('========================================\n');
}

// ============================================================================
// PUBLIC API EXPORTS
// ============================================================================

/**
 * Main stylesheet generation function
 */
export { generateTemplateStylesheet };

/**
 * Individual CSS generators (for granular control if needed)
 */
export { generatePageCSS, generateContentCSS };