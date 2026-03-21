/**
 * Page Config Adapter Tests
 * 
 * Step 3: Parallel Test - Validate adapter matches existing implementation
 * 
 * This test ensures the new adapter produces the same DOM changes
 * as the current manual implementation in pagination.ts
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { applyPageConfigToPagedJs } from '../pageConfigAdapter';
import { modernTemplate } from '../modern';
import type { Template } from '../../template';

describe('pageConfigAdapter', () => {
  let mockPageElement: HTMLElement;

  beforeEach(() => {
    // Create a mock Paged.js page element
    mockPageElement = document.createElement('div');
    mockPageElement.className = 'pagedjs_pages';
  });

  describe('applyPageConfigToPagedJs', () => {
    it('should apply margin CSS variables to page element', () => {
      // Apply using the adapter
      applyPageConfigToPagedJs(mockPageElement, modernTemplate);

      // Verify all four margin variables are set
      expect(mockPageElement.style.getPropertyValue('--pagedjs-margin-top')).toBe('1.25in');
      expect(mockPageElement.style.getPropertyValue('--pagedjs-margin-right')).toBe('1in');
      expect(mockPageElement.style.getPropertyValue('--pagedjs-margin-bottom')).toBe('1in');
      expect(mockPageElement.style.getPropertyValue('--pagedjs-margin-left')).toBe('2in');
    });

    it('should match the output of the current manual implementation', () => {
      // Simulate the OLD way (manual implementation from pagination.ts)
      const pageMargins = {
        top: modernTemplate.pageStyles!.marginTop,
        right: modernTemplate.pageStyles!.marginRight,
        bottom: modernTemplate.pageStyles!.marginBottom,
        left: modernTemplate.pageStyles!.marginLeft,
      };

      const oldWayElement = document.createElement('div');
      oldWayElement.style.setProperty('--pagedjs-margin-top', `${pageMargins.top}in`);
      oldWayElement.style.setProperty('--pagedjs-margin-right', `${pageMargins.right}in`);
      oldWayElement.style.setProperty('--pagedjs-margin-bottom', `${pageMargins.bottom}in`);
      oldWayElement.style.setProperty('--pagedjs-margin-left', `${pageMargins.left}in`);

      // Apply using the NEW way (adapter)
      const newWayElement = document.createElement('div');
      applyPageConfigToPagedJs(newWayElement, modernTemplate);

      // Assert both methods produce identical results
      expect(newWayElement.style.getPropertyValue('--pagedjs-margin-top'))
        .toBe(oldWayElement.style.getPropertyValue('--pagedjs-margin-top'));
      expect(newWayElement.style.getPropertyValue('--pagedjs-margin-right'))
        .toBe(oldWayElement.style.getPropertyValue('--pagedjs-margin-right'));
      expect(newWayElement.style.getPropertyValue('--pagedjs-margin-bottom'))
        .toBe(oldWayElement.style.getPropertyValue('--pagedjs-margin-bottom'));
      expect(newWayElement.style.getPropertyValue('--pagedjs-margin-left'))
        .toBe(oldWayElement.style.getPropertyValue('--pagedjs-margin-left'));
    });

    it('should handle templates without pageStyles gracefully', () => {
      const templateWithoutPageStyles: Template = {
        ...modernTemplate,
        pageStyles: undefined,
      };

      // Should not throw
      expect(() => {
        applyPageConfigToPagedJs(mockPageElement, templateWithoutPageStyles);
      }).not.toThrow();

      // Should apply default values from schema (1in for all margins)
      expect(mockPageElement.style.getPropertyValue('--pagedjs-margin-top')).toBe('1in');
      expect(mockPageElement.style.getPropertyValue('--pagedjs-margin-right')).toBe('1in');
      expect(mockPageElement.style.getPropertyValue('--pagedjs-margin-bottom')).toBe('1in');
      expect(mockPageElement.style.getPropertyValue('--pagedjs-margin-left')).toBe('1in');
    });

    it('should use schema defaults when margins are missing', () => {
      // Create a template with partial pageStyles (missing margin properties)
      const partialTemplate: Template = {
        ...modernTemplate,
        pageStyles: {
          size: 'letter',
          marginTop: 1,
          marginRight: 1,
          marginBottom: 1,
          marginLeft: 1,
        },
      };

      // Manually remove a margin property to test fallback
      // @ts-expect-error - intentionally creating invalid state for testing
      delete partialTemplate.pageStyles.marginTop;

      applyPageConfigToPagedJs(mockPageElement, partialTemplate);

      // Should use default from schema (1in)
      expect(mockPageElement.style.getPropertyValue('--pagedjs-margin-top')).toBe('1in');
      // Should use template values for others
      expect(mockPageElement.style.getPropertyValue('--pagedjs-margin-left')).toBe('1in');
    });
  });

  describe('integration with Modern template', () => {
    it('should correctly apply Modern template distinctive 2-inch left margin', () => {
      applyPageConfigToPagedJs(mockPageElement, modernTemplate);

      // Modern template has distinctive 2-inch left margin
      expect(mockPageElement.style.getPropertyValue('--pagedjs-margin-left')).toBe('2in');
      
      // And standard margins on other sides
      expect(mockPageElement.style.getPropertyValue('--pagedjs-margin-top')).toBe('1.25in');
      expect(mockPageElement.style.getPropertyValue('--pagedjs-margin-right')).toBe('1in');
      expect(mockPageElement.style.getPropertyValue('--pagedjs-margin-bottom')).toBe('1in');
    });
  });
});