2.6: Add character formatting CSS generator
/**
 * Generate character-level formatting CSS.
 * Simple semantic element rules.
 * 
 * @returns CSS string for character formatting
 */
function generateCharacterCSS(): string {
  return `
.mylo-preview strong {
  font-weight: 700;
}

.mylo-preview em {
  font-style: italic;
}

.mylo-preview u {
  text-decoration: underline;
}`.trim();
}
2.7: Add main stylesheet generator (supports both formats)
/**
 * Generate complete stylesheet for a template.
 * 
 * BACKWARD COMPATIBILITY: Supports both old and new template formats.
 * - If template has contentStyles + pageStyles (new): use directly
 * - If template has styles + pageLayout (old): adapt to new format
 * 
 * @param template - Template configuration (old or new format)
 * @returns Complete CSS stylesheet string
 */
export function generateTemplateStylesheet(template: Template): string {
  console.log('[CSS Generation] Generating stylesheet for:', template.id);
  
  // Determine format and get styles
  let contentStyles: ContentStyles;
  let pageStyles: PageStyles;
  
  if (template.contentStyles && template.pageStyles) {
    // New format - use directly
    console.log('[CSS Generation] Using new format (contentStyles + pageStyles)');
    contentStyles = template.contentStyles;
    pageStyles = template.pageStyles;
  } else if (template.styles && template.pageLayout) {
    // Old format - adapt
    console.log('[CSS Generation] Using old format (styles + pageLayout), adapting...');
    contentStyles = adaptContentStyles(template.styles);
    pageStyles = adaptPageLayout(template.pageLayout);
  } else {
    // Invalid template
    throw new Error(`Template ${template.id} is missing required style properties. Must have either (contentStyles + pageStyles) or (styles + pageLayout).`);
  }
  
  // Generate CSS sections
  const pageCSS = generatePageCSS(pageStyles);
  const contentCSS = generateContentCSS(contentStyles);
  const characterCSS = generateCharacterCSS();
  
  // Combine into full stylesheet
  const fullStylesheet = `
/* Template: ${template.name} (${template.id}) */

/* ===== Page Rules ===== */
${pageCSS}

/* ===== Content Styles ===== */
${contentCSS}

/* ===== Character Formatting ===== */
${characterCSS}
`.trim();
  
  console.log('[CSS Generation] Generated stylesheet, length:', fullStylesheet.length);
  
  return fullStylesheet;
}
2.8: Keep old function for now
/**
 * Generate page margin CSS (old function, kept for compatibility).
 * 
 * @deprecated Use generateTemplateStylesheet() instead.
 * This function will be removed after all code migrates to new CSS generation.
 */
export function generatePageMarginCSS(
  margins: { top: number; right: number; bottom: number; left: number },
  templateId: string
): string {
  console.warn('[DEPRECATED] generatePageMarginCSS is deprecated. Use generateTemplateStylesheet() instead.');
  
  return `@page ${templateId} { margin: ${margins.top}in ${margins.right}in ${margins.bottom}in ${margins.left}in; }`;
}
Validation Checkpoint 2.1
Tests:
import { generateTemplateStylesheet } from './pageLayoutUtils';
import { modernTemplate } from '../mylo/templates/modern'; // Old format

// Test with OLD format template
console.log('=== Testing with OLD format ===');
const stylesheet = generateTemplateStylesheet(modernTemplate);

console.log('Generated stylesheet:');
console.log(stylesheet);

// Verify output contains expected sections
console.assert(stylesheet.includes('@page'), 'Should contain @page rule');
console.assert(stylesheet.includes('.mylo-preview h1'), 'Should contain h1 selector');
console.assert(stylesheet.includes('.mylo-preview p'), 'Should contain p selector');
console.assert(stylesheet.includes('.mylo-preview strong'), 'Should contain strong selector');
console.assert(stylesheet.includes('margin:'), 'Should contain margin property');

// Test with NEW format template (create a test one)
const testTemplateV2 = {
  id: 'test-v2',
  name: 'Test V2',
  version: '1.0',
  contentStyles: {
    body: { fontFamily: 'Arial', fontSize: '14px' },
    heading1: { fontFamily: 'Helvetica', fontSize: '28px' },
    heading2: { fontFamily: 'Helvetica', fontSize: '22px' },
    heading3: { fontFamily: 'Helvetica', fontSize: '18px' },
  },
  pageStyles: {
    size: 'letter' as const,
    marginTop: 1.5,
    marginRight: 1,
    marginBottom: 1,
    marginLeft: 1,
  },
  listStyles: { /* ... */ },
  characterRules: { /* ... */ },
  linkRules: { /* ... */ },
};

console.log('\n=== Testing with NEW format ===');
const stylesheetV2 = generateTemplateStylesheet(testTemplateV2);

console.log('Generated stylesheet:');
console.log(stylesheetV2);

console.assert(stylesheetV2.includes('size: letter'), 'Should contain size: letter');
console.assert(stylesheetV2.includes('1.5in'), 'Should contain 1.5in top margin');
Checklist:
•	 CSS generation works with OLD format templates (via adapters)
•	 CSS generation works with NEW format templates (direct)
•	 Output contains @page rules
•	 Output contains content selectors (.mylo-preview h1, etc.)
•	 Output contains character formatting rules
•	 Old generatePageMarginCSS() still exists (for compatibility)
•	 No errors when testing with existing templates
Success Criteria:
•	✅ Can generate CSS from old format templates
•	✅ Can generate CSS from new format templates
•	✅ Existing code not affected yet
•	✅ System still runs normally
