/**
 * @file services/__tests__/governanceEnforcement.test.ts
 * @description Inline tests for governance enforcement rules.
 * Matches the existing test pattern in the codebase.
 */

import { applyGovernanceRules } from '../governanceEnforcement';

function assert(condition: boolean, message: string): void {
  if (!condition) {
    console.error(`[GovernanceEnforcement] FAIL: ${message}`);
  } else {
    console.log(`[GovernanceEnforcement] PASS: ${message}`);
  }
}

const ACTIVE_SETTINGS = { stripEmptyParagraphs: true } as const;
const INACTIVE_SETTINGS = { stripEmptyParagraphs: false } as const;

export function runGovernanceEnforcementTests(): void {
  console.log('[GovernanceEnforcement] Running governance enforcement tests...');

  // Test 1: Single empty paragraph between content blocks is stripped
  {
    const html = '<p>Hello</p><p></p><p>World</p>';
    const result = applyGovernanceRules(html, ACTIVE_SETTINGS);
    const container = document.createElement('div');
    container.innerHTML = result;
    const paragraphs = container.querySelectorAll('p');
    assert(paragraphs.length === 2, 'Single empty paragraph between content blocks is stripped');
  }

  // Test 2: Two consecutive empty paragraphs are stripped
  {
    const html = '<p>Hello</p><p></p><p></p><p>World</p>';
    const result = applyGovernanceRules(html, ACTIVE_SETTINGS);
    const container = document.createElement('div');
    container.innerHTML = result;
    const paragraphs = container.querySelectorAll('p');
    assert(paragraphs.length === 2, 'Two consecutive empty paragraphs are stripped');
  }

  // Test 3: Five consecutive empty paragraphs are stripped
  {
    const html = '<p>Hello</p><p></p><p></p><p></p><p></p><p></p><p>World</p>';
    const result = applyGovernanceRules(html, ACTIVE_SETTINGS);
    const container = document.createElement('div');
    container.innerHTML = result;
    const paragraphs = container.querySelectorAll('p');
    assert(paragraphs.length === 2, 'Five consecutive empty paragraphs are stripped');
  }

  // Test 4: Content with no empty paragraphs is unchanged
  {
    const html = '<p>Hello</p><p>World</p>';
    const result = applyGovernanceRules(html, ACTIVE_SETTINGS);
    const container = document.createElement('div');
    container.innerHTML = result;
    const paragraphs = container.querySelectorAll('p');
    assert(paragraphs.length === 2, 'Content with no empty paragraphs is unchanged');
  }

  // Test 5: Empty paragraphs at start are stripped
  {
    const html = '<p></p><p></p><p>World</p>';
    const result = applyGovernanceRules(html, ACTIVE_SETTINGS);
    const container = document.createElement('div');
    container.innerHTML = result;
    const paragraphs = container.querySelectorAll('p');
    assert(paragraphs.length === 1, 'Empty paragraphs at start are stripped');
  }

  // Test 6: Rule inactive — content unchanged even with empty paragraphs
  {
    const html = '<p>Hello</p><p></p><p></p><p>World</p>';
    const result = applyGovernanceRules(html, INACTIVE_SETTINGS);
    const container = document.createElement('div');
    container.innerHTML = result;
    const paragraphs = container.querySelectorAll('p');
    assert(paragraphs.length === 4, 'With rule inactive, empty paragraphs are preserved');
  }

  console.log('[GovernanceEnforcement] Tests complete.');
}
