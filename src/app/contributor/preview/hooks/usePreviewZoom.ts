import { RefObject, useEffect, useState } from "react";
import type { ZoomMode } from "../types";

export interface UsePreviewZoomProps {
  containerRef: RefObject<HTMLDivElement>;
  measuredPageWidth: number | null;
  measuredPageHeight: number | null;
  zoomMode: ZoomMode;
}

export interface UsePreviewZoomReturn {
  scale: number;
  shouldCenterContent: boolean;
  shouldShowHorizontalScrollbar: boolean;
}

/**
 * usePreviewZoom - Preview Panel Zoom Management Hook
 * 
 * Governance: Manages view state for Preview panel zoom modes
 * Responsibility: 
 *   1. Calculate scale based on zoom mode (fit-width, fit-page, 100%)
 *   2. Respond to container resize events via ResizeObserver
 *   3. Determine if content should be centered or left-aligned
 *   4. Determine if horizontal scrollbar should be visible
 * Role: Contributor (view state only)
 * 
 * Strategy:
 * - fit-width: Scale by width only (may require vertical scroll)
 * - fit-page: Scale by both dimensions, use Math.min() to fit entire page
 * - 100%: Fixed 1.0 scale (actual size)
 * - Uses RAF to ensure layout measurements are accurate
 * - Subtracts 48px visual margin to leave gray canvas visible (24px per side)
 * 
 * State: Per-document view state (does not export)
 * 
 * @see Mylo Governance: Per document view state
 */
export function usePreviewZoom({
  containerRef,
  measuredPageWidth,
  measuredPageHeight,
  zoomMode,
}: UsePreviewZoomProps): UsePreviewZoomReturn {
  const [scale, setScale] = useState(1.0);

  /**
   * CONDITIONAL CENTERING: Determine if content overflows horizontally
   * 
   * Strategy:
   * - Calculate scaled page width = measuredPageWidth * scale
   * - Compare to container client width
   * - If overflow: use items-start (natural left-to-right scroll)
   * - If fits: use items-center (center the page)
   */
  const shouldCenterContent = (() => {
    if (!measuredPageWidth || !containerRef.current) return true; // Default to centered
    const scaledPageWidth = measuredPageWidth * scale;
    const containerWidth = containerRef.current.clientWidth;
    return scaledPageWidth <= containerWidth;
  })();
  
  /**
   * SCROLLBAR VISIBILITY: Show horizontal scrollbar only at 100% zoom with overflow
   * 
   * Strategy:
   * - At 100% zoom with horizontal overflow: show subtle horizontal scrollbar
   * - All other cases: hide all scrollbars
   * - Vertical scrollbar always hidden
   */
  const shouldShowHorizontalScrollbar = zoomMode === '100%' && !shouldCenterContent;
  
  /**
   * AUTO-FIT ZOOM: Calculate scale to fit page within preview panel
   * 
   * Strategy:
   * - fit-width: Scale by width only (existing behavior)
   * - fit-page: Scale by both width AND height, use Math.min() to fit entire page
   * - 100%: Fixed 1.0 scale (actual size)
   * - Responds to ResizeObserver for split-pane resize events
   * - Uses RAF to ensure layout measurements are accurate
   * - clientWidth/clientHeight already exclude p-8 padding (32px each side)
   * - Subtracts 48px visual margin to leave gray canvas visible (24px per side)
   * - Uses MEASURED page dimensions from Paged.js output (Step 2 fix)
   * 
   * Note: Previous double-counting bug fixed - don't subtract container padding
   * since clientWidth/clientHeight already exclude it.
   */
  const calculateScale = (pageWidth: number, pageHeight: number) => {
    const container = containerRef.current;
    if (!container) return;

    requestAnimationFrame(() => {
      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;
      
      // Subtract visual margin to leave gray canvas visible on sides
      const visualMarginWidth = 48; // 24px per side for breathing room
      const visualMarginHeight = 48; // 24px top/bottom for breathing room
      const availableWidth = containerWidth - visualMarginWidth;
      const availableHeight = containerHeight - visualMarginHeight;
      
      let newScale: number;
      
      if (zoomMode === '100%') {
        // 100%: fixed scale at actual size
        newScale = 1.0;
      } else if (zoomMode === 'fit-width') {
        // Fit-width: scale by width only (may require vertical scroll)
        newScale = availableWidth / pageWidth;
      } else {
        // Fit-page: scale by both dimensions, use smaller to fit entire page
        const scaleByWidth = availableWidth / pageWidth;
        const scaleByHeight = availableHeight / pageHeight;
        newScale = Math.min(scaleByWidth, scaleByHeight);
      }
      
      setScale(newScale);
    });
  };

  /**
   * RESIZE OBSERVER: Recalculate scale when container resizes or zoom mode changes
   * 
   * Depends on measured page dimensions from Paged.js (set by onPageMeasured callback).
   * Only active when both measuredPageWidth and measuredPageHeight are available.
   */
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !measuredPageWidth || !measuredPageHeight) return;

    // Initial calculation with measured dimensions
    calculateScale(measuredPageWidth, measuredPageHeight);

    const resizeObserver = new ResizeObserver(() => {
      calculateScale(measuredPageWidth, measuredPageHeight);
    });

    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, [measuredPageWidth, measuredPageHeight, zoomMode]);

  return {
    scale,
    shouldCenterContent,
    shouldShowHorizontalScrollbar,
  };
}