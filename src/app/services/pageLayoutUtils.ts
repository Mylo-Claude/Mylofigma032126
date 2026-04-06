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
    
    // Convert to CSS declarations
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
    const ulSelector = '.mylo-preview ul';
    const ulProps: Record<string, string | number> = {};
    
    // Map list-specific properties
    if (listStyles.bulletedList.markerType) {
      ulProps.listStyleType = listStyles.bulletedList.markerType;
    }
    if (listStyles.bulletedList.markerColor) {
      ulProps.color = listStyles.bulletedList.markerColor;
    }
    if (listStyles.bulletedList.indentSize) {
      ulProps.paddingLeft = listStyles.bulletedList.indentSize;
    }
    
    // Add advanced properties
    if (listStyles.bulletedList.advanced) {
      Object.assign(ulProps, listStyles.bulletedList.advanced);
    }
    
    // Convert to CSS declarations
    const ulDeclarations = Object.entries(ulProps)
      .map(([prop, val]) => `  ${camelToKebab(prop)}: ${val};`)
      .join('\n');
    
    if (ulDeclarations) {
      css += `${ulSelector} {\n${ulDeclarations}\n}\n\n`;
    }
  }
  
  // Generate orderedList CSS (maps to <ol>)
  if (listStyles.orderedList) {
    const olSelector = '.mylo-preview ol';
    const olProps: Record<string, string | number> = {};
    
    // Map list-specific properties
    if (listStyles.orderedList.markerType) {
      olProps.listStyleType = listStyles.orderedList.markerType;
    }
    if (listStyles.orderedList.markerColor) {
      olProps.color = listStyles.orderedList.markerColor;
    }
    if (listStyles.orderedList.indentSize) {
      olProps.paddingLeft = listStyles.orderedList.indentSize;
    }
    
    // Add advanced properties
    if (listStyles.orderedList.advanced) {
      Object.assign(olProps, listStyles.orderedList.advanced);
    }
    
    // Convert to CSS declarations
    const olDeclarations = Object.entries(olProps)
      .map(([prop, val]) => `  ${camelToKebab(prop)}: ${val};`)
      .join('\n');
    
    if (olDeclarations) {
      css += `${olSelector} {\n${olDeclarations}\n}\n\n`;
    }
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