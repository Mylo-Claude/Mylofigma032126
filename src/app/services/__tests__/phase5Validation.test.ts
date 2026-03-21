/**
 * Phase 5 Validation Tests
 * 
 * Tests for Default Template V2 Migration
 */

import { defaultTemplate } from '../../mylo/templates/default';
import { isTemplateV2 } from '../../mylo/template';
import { generateTemplateStylesheet } from '../pageLayoutUtils';

/**
 * Run all Phase 5 validation tests
 */
export function runPhase5Tests() {
  console.log('\n========================================');
  console.log('Phase 5: Default Template V2 Migration');
  console.log('========================================\n');

  // Test 1: Type checking
  console.log('=== Test 1: Type Checking ===');
  const isV2 = isTemplateV2(defaultTemplate);
  console.log('isTemplateV2(defaultTemplate):', isV2);
  console.log('✓ Result:', isV2 ? '✅ PASS - Template is V2 format' : '❌ FAIL - Template is not V2 format');
  console.log('');

  // Test 2: Template structure validation
  console.log('=== Test 2: Template Structure ===');
  const hasContentStyles = !!defaultTemplate.contentStyles;
  const hasPageStyles = !!defaultTemplate.pageStyles;
  const hasOldStyles = !!(defaultTemplate as any).styles;
  const hasOldPageLayout = !!(defaultTemplate as any).pageLayout;
  
  console.log('Has contentStyles:', hasContentStyles ? '✅' : '❌');
  console.log('Has pageStyles:', hasPageStyles ? '✅' : '❌');
  console.log('Has old styles property:', hasOldStyles ? '❌ (should be removed)' : '✅ (correctly removed)');
  console.log('Has old pageLayout property:', hasOldPageLayout ? '❌ (should be removed)' : '✅ (correctly removed)');
  
  const structureValid = hasContentStyles && hasPageStyles && !hasOldStyles && !hasOldPageLayout;
  console.log('✓ Structure:', structureValid ? '✅ PASS' : '❌ FAIL');
  console.log('');

  // Test 3: CSS generation
  console.log('=== Test 3: CSS Generation ===');
  const css = generateTemplateStylesheet(defaultTemplate);
  console.log('Generated CSS length:', css.length, 'characters');
  console.log('');
  
  // Check for key CSS features
  const hasPageRule = css.includes('@page');
  const hasLetterSize = css.includes('size: letter');
  const hasUniformMargins = css.includes('margin: 1in 1in 1in 1in') || css.includes('margin: 1in');
  const hasBodyRule = css.includes('.mylo-preview p[data-type="body"]');
  const hasH1Rule = css.includes('.mylo-preview h1[data-type="heading1"]');
  const hasH2Rule = css.includes('.mylo-preview h2[data-type="heading2"]');
  const hasH3Rule = css.includes('.mylo-preview h3[data-type="heading3"]');
  const hasSystemFont = css.includes('system-ui');
  
  console.log('CSS Validation:');
  console.log('  @page rule:', hasPageRule ? '✅' : '❌');
  console.log('  Letter size:', hasLetterSize ? '✅' : '❌');
  console.log('  1in uniform margins:', hasUniformMargins ? '✅' : '❌');
  console.log('  Body rule:', hasBodyRule ? '✅' : '❌');
  console.log('  H1 rule:', hasH1Rule ? '✅' : '❌');
  console.log('  H2 rule:', hasH2Rule ? '✅' : '❌');
  console.log('  H3 rule:', hasH3Rule ? '✅' : '❌');
  console.log('  System font:', hasSystemFont ? '✅' : '❌');
  
  const cssValid = hasPageRule && hasLetterSize && hasUniformMargins && 
                   hasBodyRule && hasH1Rule && hasH2Rule && hasH3Rule &&
                   hasSystemFont;
  console.log('✓ CSS Generation:', cssValid ? '✅ PASS' : '❌ FAIL');
  console.log('');
  
  // Display CSS preview
  console.log('=== CSS Preview (first 500 chars) ===');
  console.log(css.substring(0, 500));
  console.log('...');
  console.log('');

  // Test 4: Content styles validation
  console.log('=== Test 4: Content Styles Validation ===');
  const contentStyles = defaultTemplate.contentStyles!;
  const hasBody = !!contentStyles.body;
  const hasH1 = !!contentStyles.heading1;
  const hasH2 = !!contentStyles.heading2;
  const hasH3 = !!contentStyles.heading3;
  
  console.log('Body style defined:', hasBody ? '✅' : '❌');
  console.log('H1 style defined:', hasH1 ? '✅' : '❌');
  console.log('H2 style defined:', hasH2 ? '✅' : '❌');
  console.log('H3 style defined:', hasH3 ? '✅' : '❌');
  
  if (hasBody) {
    console.log('Body font:', contentStyles.body.fontFamily);
    console.log('Body size:', contentStyles.body.fontSize);
    console.log('Body weight:', contentStyles.body.fontWeight);
  }
  
  if (hasH1) {
    console.log('H1 font:', contentStyles.heading1.fontFamily);
    console.log('H1 size:', contentStyles.heading1.fontSize);
    console.log('H1 color:', contentStyles.heading1.color);
  }
  
  const contentStylesValid = hasBody && hasH1 && hasH2 && hasH3;
  console.log('✓ Content Styles:', contentStylesValid ? '✅ PASS' : '❌ FAIL');
  console.log('');

  // Test 5: Page styles validation
  console.log('=== Test 5: Page Styles Validation ===');
  const pageStyles = defaultTemplate.pageStyles!;
  const hasSize = !!pageStyles.size;
  const hasMargins = pageStyles.marginTop !== undefined && 
                     pageStyles.marginRight !== undefined &&
                     pageStyles.marginBottom !== undefined &&
                     pageStyles.marginLeft !== undefined;
  const isUniformMargin = pageStyles.marginTop === 1.0 &&
                          pageStyles.marginRight === 1.0 &&
                          pageStyles.marginBottom === 1.0 &&
                          pageStyles.marginLeft === 1.0;
  
  console.log('Size defined:', hasSize ? '✅' : '❌', `(${pageStyles.size})`);
  console.log('Margins defined:', hasMargins ? '✅' : '❌');
  console.log('  Top:', pageStyles.marginTop, 'in');
  console.log('  Right:', pageStyles.marginRight, 'in');
  console.log('  Bottom:', pageStyles.marginBottom, 'in');
  console.log('  Left:', pageStyles.marginLeft, 'in');
  console.log('  Uniform (all 1in):', isUniformMargin ? '✅' : '❌');
  
  const pageStylesValid = hasSize && hasMargins && isUniformMargin;
  console.log('✓ Page Styles:', pageStylesValid ? '✅ PASS' : '❌ FAIL');
  console.log('');

  // Overall result
  console.log('========================================');
  const allPassed = isV2 && structureValid && cssValid && contentStylesValid && pageStylesValid;
  console.log('Overall Phase 5 Result:', allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED');
  console.log('========================================\n');

  return {
    isV2,
    structureValid,
    cssValid,
    contentStylesValid,
    pageStylesValid,
    allPassed,
  };
}
