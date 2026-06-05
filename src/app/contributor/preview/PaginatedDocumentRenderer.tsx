import { useEffect, useRef, useState } from 'react';
import type { Node as PMNode } from 'prosemirror-model';
import { serializeToHTML } from '../../services/serializer';
import { paginationService } from '../../services/pagination';
import type { Template } from '../../mylo/template';
import { resolveDocumentSettings } from '../../mylo/template';
import { generateTemplateStylesheet } from '../../services/pageLayoutUtils';
import { applyGovernanceRules } from '../../services/governanceEnforcement';
import {
  ensureFontMetadataLoaded,
  loadGoogleFont,
  extractFontLoadRequests,
} from '../../templates/utils/googleFonts';

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
  /**
   * Incremented by EditorPage whenever empty paragraphs are detected.
   * Forces re-pagination when the doc reference hasn't changed
   * (e.g. cursor move while empty paragraphs exist in the document).
   */
  governanceTick?: number;
}

export function PaginatedDocumentRenderer({
  doc,
  template,
  onPagedJsComplete,
  onPageMeasured,
  scale,
  shouldCenter,
  governanceTick,
}: PaginatedDocumentRendererProps) {
  const [pagedResult, setPagedResult] = useState<{ pageCount: number; pagesContainer: HTMLElement } | null>(null);
  const pagesContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isActive = true;

    ensureFontMetadataLoaded().then(() => {
      if (!isActive) return;
      extractFontLoadRequests(template).forEach((request) => {
        loadGoogleFont(request.family, request.styles);
      });
    });

    return () => {
      isActive = false;
    };
  }, [template]);

  /**
   * PAGINATION EFFECT
   *
   * Triggers on doc, template, or governanceTick changes.
   * - Generates CSS from template (handles both V1 and V2 formats)
   * - Serializes document to semantic HTML
   * - Applies governance rules (strips empty paragraphs, etc.)
   * - Passes governed HTML + CSS to Paged.js for pagination
   * - Updates result state when complete
   */
  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        // 1. Generate complete stylesheet (adapts V1 automatically)
        const stylesheet = generateTemplateStylesheet(template);

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
          template,
        });

        setPagedResult({ pageCount: result.pageCount, pagesContainer: result.pagesContainer });
        onPagedJsComplete(result.pageCount);

      } catch (error) {
        console.error('[Pagination] Error:', error);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [doc, template, onPagedJsComplete, governanceTick]);

  /**
   * PAGE MEASUREMENT: Measure actual rendered page dimensions after Paged.js completes.
   *
   * Queries the first .pagedjs_page element for real offsetWidth/offsetHeight.
   * These measured dimensions drive the zoom scale calculation in usePreviewZoom.
   */
  useEffect(() => {
    if (!pagedResult?.pagesContainer) return;

    const firstPage = pagedResult.pagesContainer.querySelector('.pagedjs_page') as HTMLElement;

    if (firstPage) {
      onPageMeasured(firstPage.offsetWidth, firstPage.offsetHeight);
    }
  }, [pagedResult, onPageMeasured]);

  /**
   * DOM INJECTION: Insert Paged.js output into the container when pagedResult changes.
   *
   * Strategy:
   * - Clone pagesContainer from Paged.js result to avoid mutations
   * - Apply 64px marginBottom to each .pagedjs_page for visual separation
   * - Clear container before appending to prevent duplicate content on re-pagination
   */
  useEffect(() => {
    const container = pagesContainerRef.current;
    if (!container || !pagedResult?.pagesContainer) return;

    container.innerHTML = '';
    const pagedClone = pagedResult.pagesContainer.cloneNode(true) as HTMLElement;

    pagedClone.querySelectorAll('.pagedjs_page').forEach((page) => {
      (page as HTMLElement).style.marginBottom = '64px';
    });

    container.appendChild(pagedClone);
  }, [pagedResult]);

  return (
    <>
      {pagedResult && (
        <div className={`pilcrow-paged-document flex flex-col ${shouldCenter ? 'items-center' : 'items-start'} gap-8`}>
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
            className="pilcrow-zoom-outer"
            style={{
              width: `${100 / scale}%`,
              display: 'flex',
              flexDirection: 'column',
              alignItems: shouldCenter ? 'center' : 'flex-start',
            }}
          >
            <div
              className="pilcrow-zoom-inner"
              style={{
                transform: `scale(${scale})`,
                transformOrigin: shouldCenter ? 'top center' : 'top left',
              }}
            >
              <div
                ref={pagesContainerRef}
                className="flex flex-col items-center"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
