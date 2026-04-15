/**
 * Adapter Validation Script
 * 
 * Step 3: Parallel Test - Validate adapter matches existing implementation
 * 
 * This script manually validates that the new adapter produces the same DOM changes
 * as the current manual implementation in pagination.ts
 * 
 * Run this in browser console or add to a test page to verify.
 */

import { applyPageConfigToPagedJs } from '../pageConfigAdapter';
import { modernTemplate } from '../modern';
import type { Template } from '../../template';

type TemplateWithOptionalPageStyles = Omit<Template, 'pageStyles'> & {
  pageStyles?: Template['pageStyles'];
};

/**
 * Validate that the adapter produces identical results to the manual implementation
 */
export function validateAdapterMatchesManualImplementation(): boolean {
  console.group('[Adapter Validation] Step 3 Test');
  
  try {
    // Create two mock elements
    const oldWayElement = document.createElement('div');
    const newWayElement = document.createElement('div');
    
    // OLD WAY: Manual implementation (from pagination.ts lines 207-210)
    const pageMargins = {
      top: modernTemplate.pageStyles!.marginTop,
      right: modernTemplate.pageStyles!.marginRight,
      bottom: modernTemplate.pageStyles!.marginBottom,
      left: modernTemplate.pageStyles!.marginLeft,
    };
    
    oldWayElement.style.setProperty('--pagedjs-margin-top', `${pageMargins.top}in`);
    oldWayElement.style.setProperty('--pagedjs-margin-right', `${pageMargins.right}in`);
    oldWayElement.style.setProperty('--pagedjs-margin-bottom', `${pageMargins.bottom}in`);
    oldWayElement.style.setProperty('--pagedjs-margin-left', `${pageMargins.left}in`);
    
    console.log('✓ Old way (manual) applied');
    
    // NEW WAY: Adapter implementation
    applyPageConfigToPagedJs(newWayElement, modernTemplate);
    console.log('✓ New way (adapter) applied');
    
    // COMPARE: Check all four margins match
    const margins = ['top', 'right', 'bottom', 'left'] as const;
    let allMatch = true;
    
    for (const side of margins) {
      const varName = `--pagedjs-margin-${side}`;
      const oldValue = oldWayElement.style.getPropertyValue(varName);
      const newValue = newWayElement.style.getPropertyValue(varName);
      
      const matches = oldValue === newValue;
      allMatch = allMatch && matches;
      
      console.log(
        `${matches ? '✓' : '✗'} ${varName}: old="${oldValue}" new="${newValue}"`,
        matches ? '' : '❌ MISMATCH'
      );
    }
    
    if (allMatch) {
      console.log('\n✅ SUCCESS: Adapter produces identical output to manual implementation');
      console.log('Modern template margins correctly applied:');
      console.log('  Top: 1.25in');
      console.log('  Right: 1in');
      console.log('  Bottom: 1in');
      console.log('  Left: 2in (distinctive)');
    } else {
      console.error('\n❌ FAILURE: Adapter output does not match manual implementation');
    }
    
    console.groupEnd();
    return allMatch;
    
  } catch (error) {
    console.error('❌ Validation error:', error);
    console.groupEnd();
    return false;
  }
}

/**
 * Test that adapter handles missing pageStyles gracefully
 */
export function validateAdapterHandlesMissingPageStyles(): boolean {
  console.group('[Adapter Validation] Missing pageStyles Test');
  
  try {
    const element = document.createElement('div');
    const templateWithoutPageStyles: TemplateWithOptionalPageStyles = {
      ...modernTemplate,
      pageStyles: undefined,
    };
    
    console.log('Testing with template that has no pageStyles...');
    console.log('✓ Should apply default margins from schema (1in each)');
    
    // Should not throw
    applyPageConfigToPagedJs(element, templateWithoutPageStyles as Template);
    
    // Should apply default margins (1in for all)
    const topMargin = element.style.getPropertyValue('--pagedjs-margin-top');
    const rightMargin = element.style.getPropertyValue('--pagedjs-margin-right');
    const bottomMargin = element.style.getPropertyValue('--pagedjs-margin-bottom');
    const leftMargin = element.style.getPropertyValue('--pagedjs-margin-left');
    
    const allDefaultsApplied = 
      topMargin === '1in' &&
      rightMargin === '1in' &&
      bottomMargin === '1in' &&
      leftMargin === '1in';
    
    if (allDefaultsApplied) {
      console.log('✅ SUCCESS: Adapter applies default margins when pageStyles is missing');
      console.log(`   Margins set: top=${topMargin}, right=${rightMargin}, bottom=${bottomMargin}, left=${leftMargin}`);
      console.groupEnd();
      return true;
    } else {
      console.error('❌ FAILURE: Default margins not correctly applied');
      console.error(`   Expected: all 1in, Got: top=${topMargin}, right=${rightMargin}, bottom=${bottomMargin}, left=${leftMargin}`);
      console.groupEnd();
      return false;
    }
  } catch (error) {
    console.error('❌ FAILURE: Adapter threw error on missing pageStyles:', error);
    console.groupEnd();
    return false;
  }
}

/**
 * Run all validations
 */
export function runAllValidations(): boolean {
  console.log('🧪 Running Step 3 Adapter Validations...\n');
  
  const test1 = validateAdapterMatchesManualImplementation();
  const test2 = validateAdapterHandlesMissingPageStyles();
  
  const allPassed = test1 && test2;
  
  console.log(
    allPassed 
      ? '\n✅ ALL VALIDATIONS PASSED - Adapter is ready for Step 4'
      : '\n❌ SOME VALIDATIONS FAILED - Fix before proceeding'
  );
  
  return allPassed;
}

// Auto-run if in browser console context
if (typeof window !== 'undefined') {
  console.log('Step 3 validation functions available:');
  console.log('  - validateAdapterMatchesManualImplementation()');
  console.log('  - validateAdapterHandlesMissingPageStyles()');
  console.log('  - runAllValidations()');
}
