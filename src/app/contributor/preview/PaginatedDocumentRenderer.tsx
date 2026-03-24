import { useEffect, useState } from 'react';
import type { Node as PMNode } from 'prosemirror-model';
import { serializeToHTML } from '../../services/serializer';
import { paginationService } from '../../services/pagination';
import type { Template } from '../../mylo/template';
import { resolveDocumentSettings } from '../../mylo/template';
import { generateTemplateStylesheet } from '../../services/pageLayoutUtils';
import { applyGovernanceRules } from '../../services/governanceEnforcement';

/**
 * PaginatedDocumentRenderer - Paged.js Integration Component
 * 
 * Governance: Authoritative pagination using template-governed styles
 * 
 * Architecture:
 * - Converts ProseMirror doc → Semantic HTML
 * - Generates complete CSS stylesheet from template
 * - Delegates to PaginationService for Paged.js rendering
 * - Measures actual page dimensions for scale calculation
 * 
 * Rendering Path (NEW CSS Generation):
 * - Template → CSS generation (contentStyles + pageStyles)
 * - Document → Semantic HTML serialization (no inline styles)
 * - Paged.js applies CSS to HTML for pagination
 * 
 * Backward Compatibility:
 * - V1 templates (styles + pageLayout) are automatically adapted
 * - V2 templates (contentStyles + pageStyles) are used directly
 * - All templates go through CSS generation path
 */

export interface PaginatedDocumentRendererProps {
  doc: PMNode;
  template: Template;
  onPagedJsComplete: (pageCount: number) => void;
  onPageMeasured: (width: number, height: number) => void;
  scale: number;
  shouldCenter: boolean;
}

export function PaginatedDocumentRenderer({ 
  doc, 
  template, 
  onPagedJsComplete, 
  onPageMeasured, 
  scale, 
  shouldCenter 
}: PaginatedDocumentRendererProps) {
  const [pagedResult, setPagedResult] = useState<{ pageCount: number; pagesContainer: HTMLElement } | null>(null);

  /**
   * PAGINATION EFFECT
   * 
   * Triggers on doc or template changes
   * - Generates CSS from template (handles both V1 and V2 formats)
   * - Serializes document to semantic HTML
   * - Passes both to Paged.js for pagination
   * - Updates result state when complete
   */
  useEffect(() => {
    console.log('[Paged.js Effect] Starting debounced pagination...');
    
    const timer = setTimeout(async () => {
      try {
        console.log('[Renderer] Generating CSS for template:', template.id);
        
        // 1. Generate complete stylesheet (adapts V1 automatically)
        const stylesheet = generateTemplateStylesheet(template);
        
        // Log generated CSS for debugging
        console.log('[CSS Generated]:\n', stylesheet);
        
        // Validate CSS doesn't contain invalid objects
        if (stylesheet.includes('[object Object]')) {
          console.error('[CSS Generation] ❌ INVALID: Contains [object Object]');
        }
        
        // 2. Serialize to semantic HTML (no inline styles)
        const html = serializeToHTML(doc);

        // 2b. Apply governance rules before pagination
        const settings = resolveDocumentSettings(template.documentSettings);
        const governedHtml = applyGovernanceRules(html, settings);

        // 3. Paginate with stylesheet and template
        const result = await paginationService.paginate({
          content: governedHtml,
          stylesheet,
          template, // Pass template object for adapter
          onProgress: (currentPage) => {
            console.log('[Pagination] Progress:', currentPage);
          },
        });
        
        setPagedResult({ pageCount: result.pageCount, pagesContainer: result.pagesContainer });
        onPagedJsComplete(result.pageCount);
        
      } catch (error) {
        console.error('[Pagination] Error:', error);
      }
    }, 300);
    
    return () => clearTimeout(timer);
  }, [doc, template, onPagedJsComplete]);

  /**
   * PAGE MEASUREMENT: Measure actual rendered page dimensions after Paged.js completes
   * 
   * Strategy:
   * - Runs when pagedResult changes (after pagination completes)
   * - Queries first .pagedjs_page element from rendered output
   * - Measures offsetWidth and offsetHeight (actual rendered dimensions)
   * - Does NOT re-measure on window resize (only on pagination change)
   * 
   * Purpose:
   * - Replace assumed 816px width with actual measurement
   * - Account for browser rendering variations, borders, box-sizing
   * - Provide real dimensions for scale calculation
   */
  useEffect(() => {
    if (!pagedResult?.pagesContainer) return;

    // Query the first rendered page
    const firstPage = pagedResult.pagesContainer.querySelector('.pagedjs_page') as HTMLElement;
    
    if (firstPage) {
      const measuredPageWidth = firstPage.offsetWidth;
      const measuredPageHeight = firstPage.offsetHeight;
      
      console.log('[Page Measurement]', {
        measuredPageWidth,
        measuredPageHeight,
        note: 'Actual rendered dimensions from Paged.js output'
      });

      // Pass measured dimensions to parent for scale calculation
      onPageMeasured(measuredPageWidth, measuredPageHeight);
    } else {
      console.warn('[Page Measurement] No .pagedjs_page elements found');
    }
  }, [pagedResult, onPageMeasured]);

  return (
    <>
      {pagedResult && (
        <div className={`flex flex-col ${shouldCenter ? 'items-center' : 'items-start'} gap-8`}>
          {/* 
            ZOOM IMPLEMENTATION: Two-layer approach
            
            Outer container: Inverse scale width to compensate for CSS transform
            - Without this, scaled content would overflow/underflow container
            - width: 100/scale% ensures proper layout flow
            
            Inner container: CSS transform scale for actual zoom
            - transform: scale(scale) applies the zoom effect
            - transformOrigin: top center keeps pages aligned at top
          */}
          <div 
            style={{
              width: `${100 / scale}%`,
              display: 'flex',
              flexDirection: 'column',
              alignItems: shouldCenter ? 'center' : 'flex-start',
            }}
          >
            <div 
              style={{
                transform: `scale(${scale})`,
                transformOrigin: shouldCenter ? 'top center' : 'top left',
              }}
            >
              {/* 
                PAGED.JS CONTAINER INJECTION
                
                Strategy:
                - Clone pagesContainer from Paged.js result to avoid mutations
                - Apply 64px marginBottom to each .pagedjs_page for visual separation
                - Use ref callback to re-inject on result changes (handles re-pagination)
                - innerHTML clearing prevents duplicate content on updates
                
                Note: Paged.js generates complete page structure with @page rules applied.
                We inject it into DOM rather than rendering React components for pages.
              */}
              <div 
                ref={(node) => {
                  if (node && pagedResult.pagesContainer) {
                    node.innerHTML = '';
                    const pagedClone = pagedResult.pagesContainer.cloneNode(true) as HTMLElement;
                    
                    // Apply gap between pages
                    const pagedPages = pagedClone.querySelectorAll('.pagedjs_page');
                    pagedPages.forEach((page) => {
                      const pageEl = page as HTMLElement;
                      pageEl.style.marginBottom = '64px';
                    });
                    
                    node.appendChild(pagedClone);
                  }
                }}
                className="flex flex-col items-center"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}