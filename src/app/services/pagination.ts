import { Previewer } from 'pagedjs';
import { applyPageConfigToPagedJs } from '../mylo/templates/pageConfigAdapter';
import type { Template } from '../mylo/template';

/**
 * Pagination Service
 * 
 * Wrapper around Paged.js library for authoritative pagination.
 * 
 * This service takes HTML content and applies pagination using
 * a complete stylesheet with @page and content CSS rules.
 */

export interface PaginationResult {
  pageCount: number;
  pagesContainer: HTMLElement;
}

/**
 * Options for pagination service.
 */
export interface PaginationOptions {
  content: string;
  
  // Complete stylesheet with @page and content CSS rules
  stylesheet?: string;
  
  // Template object for adapter
  template?: Template;
  
  onProgress?: (currentPage: number) => void;
}

/**
 * Pagination Service
 * 
 * Handles conversion of HTML content to paginated output using Paged.js
 */
class PaginationService {
  private currentAbortController: AbortController | null = null;
  
  constructor() {
    // Previewer instances created per pagination call to avoid state corruption
  }

  /**
   * Paginate HTML content using template rules
   * 
   * @param options - Pagination options including content and template
   * @returns Promise resolving to pagination result
   */
  async paginate(options: PaginationOptions): Promise<PaginationResult> {
    const { content, onProgress, stylesheet, template: myloTemplate } = options;
    
    console.log('[Pagination] Using stylesheet-based rendering');

    // Cancel any in-flight pagination
    if (this.currentAbortController) {
      console.log('[Paged.js] Cancelling previous pagination run');
      this.currentAbortController.abort();
    }
    
    this.currentAbortController = new AbortController();
    const signal = this.currentAbortController.signal;

    console.log(`[Paged.js] Content length: ${content.length} characters`);
    console.log('[Paged.js] Stylesheet length:', stylesheet?.length || 0);

    // Guard: Handle empty content case
    if (!content || content.trim().length === 0) {
      console.log('[Paged.js] Empty content detected, returning single blank page');
      
      const emptyContainer = document.createElement('div');
      emptyContainer.className = 'pagedjs_pages';
      
      const emptyPage = document.createElement('div');
      emptyPage.className = 'pagedjs_page';
      emptyPage.style.cssText = 'width: 816px; height: 1056px; background: white;';
      
      emptyContainer.appendChild(emptyPage);
      
      return {
        pageCount: 1,
        pagesContainer: emptyContainer
      };
    }

    try {
      // Check if cancelled before proceeding
      if (signal.aborted) {
        throw new Error('Pagination cancelled');
      }

      // Prepare content - wrap for scoping
      const preparedContent = `<div class="mylo-preview">${content}</div>`;
      console.log('[Pagination] Wrapped content with .mylo-preview');

      // Create a DocumentFragment from HTML string
      // Paged.js expects content as a DocumentFragment or Element
      const template = document.createElement('template');
      template.innerHTML = preparedContent;
      const contentFragment = template.content;
      
      console.log('[Pagination] Content fragment created');
      console.log('[Pagination] Fragment childNodes count:', contentFragment.childNodes.length);
      console.log('[Pagination] Fragment first child:', contentFragment.firstChild?.nodeName);

      // Create a dedicated container for Paged.js output
      const renderContainer = document.createElement('div');
      renderContainer.style.cssText = 'position: absolute; left: -9999px; top: 0; width: 816px; height: 1056px;';
      document.body.appendChild(renderContainer);

      // Inject stylesheet into DOM as <style> element
      let styleElementId: string | null = null;
      
      if (stylesheet) {
        // Clean up any previous Mylo template stylesheets before injecting new one
        const oldStyles = document.querySelectorAll('style[id^="mylo-temp-styles-"]');
        oldStyles.forEach(oldStyle => {
          console.log('[Pagination] Removing old stylesheet:', oldStyle.id);
          oldStyle.remove();
        });
        
        // Create a persistent style element in the document
        styleElementId = `mylo-temp-styles-${Date.now()}`;
        const styleElement = document.createElement('style');
        styleElement.id = styleElementId;
        styleElement.textContent = stylesheet;
        document.head.appendChild(styleElement);
        console.log('[Pagination] Injected stylesheet into <head> with id:', styleElementId);
      }

      const startTime = performance.now();
      
      const paged = new Previewer();
      const flow = await paged.preview(
        contentFragment,
        [], // Always pass empty array - stylesheets are in <head>
        renderContainer
      );

      const endTime = performance.now();
      const duration = Math.round(endTime - startTime);

      // Extract results from flow (which is the Chunker instance)
      const pagesContainer = flow.pagesArea;
      const pageCount = flow.total || 0;

      console.log(`[Paged.js] Pagination complete in ${duration}ms`);
      console.log(`[Paged.js] Total pages: ${pageCount}`);
      
      // Override Paged.js margin CSS variables after pagination
      // Paged.js ignores standard @page margin rules and uses its own CSS variables
      // We must set these variables directly for margins to take effect
      if (myloTemplate) {
        console.log('[Paged.js] Applying margin variables via adapter');
        
        // Find the Paged.js container
        const pagedPages = pagesContainer.querySelector('.pagedjs_pages') || pagesContainer;
        
        if (pagedPages) {
          // Use the adapter to apply margin CSS variables
          applyPageConfigToPagedJs(pagedPages as HTMLElement, myloTemplate);
          
          console.log('[Paged.js] ✅ Margin variables applied to:', pagedPages.className);
        } else {
          console.warn('[Paged.js] ⚠️  Could not find Paged.js container to apply margin variables');
        }
      }
      
      // ❌ DO NOT clean up stylesheet - it needs to persist for rendering
      // The stylesheet must remain in <head> for the paginated content to display correctly
      // Margins and other styles won't render if we remove the stylesheet

      // Check if cancelled after pagination
      if (signal.aborted) {
        throw new Error('Pagination cancelled');
      }

      // Report progress if callback provided
      if (onProgress) {
        onProgress(pageCount);
      }

      // Clear controller on success
      this.currentAbortController = null;

      return {
        pageCount,
        pagesContainer
      };
    } catch (error) {
      // Clear controller on error
      this.currentAbortController = null;
      
      if (error instanceof Error && (error.name === 'AbortError' || error.message === 'Pagination cancelled')) {
        console.log('[Paged.js] Pagination was cancelled');
        throw error;
      }
      
      console.error('[Paged.js] Pagination failed:', error);
      throw new Error(`Pagination failed: ${error}`);
    }
  }

  /**
   * Clean up pagination results from a container
   * 
   * @param container - Container to clean up
   */
  cleanup(container: HTMLElement) {
    console.log('[Paged.js] Cleaning up previous pagination');
    container.innerHTML = '';
  }

  /**
   * Remove all Paged.js generated elements from document
   * 
   * Useful for cleanup between pagination runs
   */
  cleanupAll() {
    const pagedContainers = document.querySelectorAll('.pagedjs_pages');
    pagedContainers.forEach(container => {
      container.remove();
    });
    console.log(`[Paged.js] Removed ${pagedContainers.length} old pagination containers`);
  }
}

// Export singleton instance
export const paginationService = new PaginationService();