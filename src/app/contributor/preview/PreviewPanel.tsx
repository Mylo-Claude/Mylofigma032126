import { EditorState } from "prosemirror-state";
import { defaultTemplate } from "../../mylo/templates";
import type { Template } from "../../mylo/template";
import { useRef, useState } from "react";
import { PreviewToolbar } from "./PreviewToolbar";
import { PaginatedDocumentRenderer } from "./PaginatedDocumentRenderer";
import { usePreviewZoom } from "./hooks/usePreviewZoom";
import { usePageTracking } from "./hooks/usePageTracking";

/**
 * PreviewPanel - Contributor Preview Surface
 * 
 * Governance: Preview is authoritative for pagination and rendering
 * Responsibility: Display template-governed output
 * Role: Contributor (read-only rendering)
 * 
 * This component uses Paged.js library for authoritative pagination:
 * - Replaces custom pagination system (removed in migration)
 * - Provides industry-standard page breaking and measurement
 * - Debounced 300ms to batch rapid editor changes
 * - Maintains Preview as single source of truth per governance rules
 * 
 * Architecture:
 * 1. PreviewPanel: Parent component managing scale, scroll tracking, page count display
 * 2. PaginatedDocumentRenderer: Handles Paged.js pagination lifecycle
 * 3. serializeToHTML: Converts ProseMirror to HTML (in /src/app/services/serializer.ts)
 * 
 * @see Mylo Governance: Preview enforcement model
 * @see Mylo Governance: Editor and Preview separation
 */

interface PreviewPanelProps {
  editorState: EditorState | null;
  template?: Template;
}

type ZoomMode = 'fit-width' | 'fit-page' | '100%';

export function PreviewPanel({ editorState, template: externalTemplate }: PreviewPanelProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<Template>(externalTemplate || defaultTemplate);
  const [pagedJsPageCount, setPagedJsPageCount] = useState<number>(0);
  const [measuredPageWidth, setMeasuredPageWidth] = useState<number | null>(null);
  const [measuredPageHeight, setMeasuredPageHeight] = useState<number | null>(null);
  const [zoomMode, setZoomMode] = useState<ZoomMode>('fit-page'); // TEMP: Testing fit-page mode

  // Log current zoom mode for debugging
  console.log('[Zoom Mode]', zoomMode);
  
  const { scale, shouldCenterContent, shouldShowHorizontalScrollbar } = usePreviewZoom({
    containerRef: scrollContainerRef,
    measuredPageWidth,
    measuredPageHeight,
    zoomMode,
  });
  
  const { currentPage } = usePageTracking({
    containerRef: scrollContainerRef,
    scale,
    pagedJsPageCount,
  });

  if (!editorState) {
    return (
      <div className="h-full flex flex-col">
        <div className="border-b border-mylo-border-light p-4">
          <h2 className="text-lg font-semibold text-mylo-text-primary">Preview</h2>
          <p className="text-sm text-mylo-text-secondary">Template-governed rendering</p>
        </div>
        <div className="flex-1 flex items-center justify-center text-mylo-text-tertiary">
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-mylo-canvas">
      <div className="border-b border-mylo-border-light px-4 py-2 bg-mylo-surface flex items-center justify-between">
        <PreviewToolbar
          selectedTemplate={selectedTemplate}
          onTemplateChange={setSelectedTemplate}
          zoomMode={zoomMode}
          onZoomChange={setZoomMode}
        />
        <p className="text-xs text-mylo-text-secondary">
          Page {currentPage} of {pagedJsPageCount}
        </p>
      </div>
      
      <div 
        ref={scrollContainerRef}
        className={`flex-1 overflow-auto p-8 ${shouldShowHorizontalScrollbar ? 'preview-scroll pb-3' : 'hide-scrollbar'}`}
      >
        <PaginatedDocumentRenderer 
          doc={editorState.doc} 
          template={selectedTemplate} 
          onPagedJsComplete={(pageCount) => setPagedJsPageCount(pageCount)}
          onPageMeasured={(width, height) => {
            setMeasuredPageWidth(width);
            setMeasuredPageHeight(height);
          }}
          scale={scale}
          shouldCenter={shouldCenterContent}
        />
      </div>
    </div>
  );
}