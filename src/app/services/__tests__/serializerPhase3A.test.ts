/**
 * Phase 3A Validation Tests
 * 
 * Tests serializer dual-path rendering:
 * - OLD PATH: With template → inline styles
 * - NEW PATH: Without template → semantic HTML only
 */

import { serializeToHTML, generateStylesheetFromTemplate } from '../serializer';
import { myloSchema } from '../../mylo/schema';
import { modernTemplate } from '../../mylo/templates/modern';

/**
 * Validation Checkpoint 3A.1-3A.4
 */
export function runPhase3ATests() {
  console.log('\n========================================');
  console.log('Phase 3A: Serializer Validation Tests');
  console.log('========================================');
  
  testOldPathWithTemplate();
  testNewPathWithoutTemplate();
  testStylesheetGeneration();
  
  console.log('\n========================================');
  console.log('Phase 3A Tests Complete');
  console.log('========================================\n');
}

/**
 * Test OLD PATH: serializeToHTML with template (inline styles)
 */
function testOldPathWithTemplate() {
  console.log('\n=== Test: OLD PATH (with template) ===');
  
  // Create simple document with body paragraph and heading
  const doc = myloSchema.node('doc', null, [
    myloSchema.node('paragraph', { type: 'body' }, [
      myloSchema.text('This is body text.')
    ]),
    myloSchema.node('paragraph', { type: 'heading1' }, [
      myloSchema.text('This is a heading')
    ]),
  ]);
  
  const html = serializeToHTML(doc, modernTemplate);
  
  console.log('Generated HTML (OLD PATH):\n', html);
  
  // Validation checks
  const hasInlineStyles = html.includes('style=');
  const hasParagraph = html.includes('<p');
  const hasHeading = html.includes('<h1');
  const hasDataType = html.includes('data-type');
  
  console.log('✓ Checks:');
  console.log('  - Has inline styles:', hasInlineStyles ? '✓' : '✗');
  console.log('  - Has <p> tag:', hasParagraph ? '✓' : '✗');
  console.log('  - Has <h1> tag:', hasHeading ? '✓' : '✗');
  console.log('  - Has data-type attr:', hasDataType ? '✓' : '✗');
  
  console.assert(hasInlineStyles, 'OLD PATH should include inline styles');
  console.assert(hasParagraph, 'Should contain <p> tag');
  console.assert(hasHeading, 'Should contain <h1> tag');
}

/**
 * Test NEW PATH: serializeToHTML without template (semantic HTML only)
 */
function testNewPathWithoutTemplate() {
  console.log('\n=== Test: NEW PATH (without template) ===');
  
  // Create simple document with body paragraph and heading
  const doc = myloSchema.node('doc', null, [
    myloSchema.node('paragraph', { type: 'body' }, [
      myloSchema.text('This is body text.')
    ]),
    myloSchema.node('paragraph', { type: 'heading1' }, [
      myloSchema.text('This is a heading')
    ]),
  ]);
  
  const html = serializeToHTML(doc); // No template parameter
  
  console.log('Generated HTML (NEW PATH):\n', html);
  
  // Validation checks
  const hasInlineStyles = html.includes('style=');
  const hasParagraph = html.includes('<p');
  const hasHeading = html.includes('<h1');
  const hasDataType = html.includes('data-type');
  
  console.log('✓ Checks:');
  console.log('  - Has NO inline styles:', !hasInlineStyles ? '✓' : '✗');
  console.log('  - Has <p> tag:', hasParagraph ? '✓' : '✗');
  console.log('  - Has <h1> tag:', hasHeading ? '✓' : '✗');
  console.log('  - Has data-type attr:', hasDataType ? '✓' : '✗');
  
  console.assert(!hasInlineStyles, 'NEW PATH should NOT include inline styles');
  console.assert(hasParagraph, 'Should contain <p> tag');
  console.assert(hasHeading, 'Should contain <h1> tag');
}

/**
 * Test stylesheet generation from template
 */
function testStylesheetGeneration() {
  console.log('\n=== Test: Stylesheet Generation ===');
  
  const css = generateStylesheetFromTemplate(modernTemplate);
  
  console.log('Generated CSS:\n', css);
  
  // Validation checks
  const hasPageRule = css.includes('@page');
  const hasBodySelector = css.includes('.mylo-preview p');
  const hasHeadingSelector = css.includes('.mylo-preview h1');
  const hasMargins = css.includes('margin:');
  
  console.log('✓ Checks:');
  console.log('  - Has @page rule:', hasPageRule ? '✓' : '✗');
  console.log('  - Has .mylo-preview p:', hasBodySelector ? '✓' : '✗');
  console.log('  - Has .mylo-preview h1:', hasHeadingSelector ? '✓' : '✗');
  console.log('  - Has margins:', hasMargins ? '✓' : '✗');
  
  console.assert(hasPageRule, 'CSS should include @page rule');
  console.assert(hasBodySelector, 'CSS should include body selector');
  console.assert(hasHeadingSelector, 'CSS should include heading selector');
}