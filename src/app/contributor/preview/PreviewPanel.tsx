import { EditorState } from "prosemirror-state";
import { defaultTemplate } from "../../mylo/templates";
import type { Template } from "../../mylo/template";
import { useCallback, useEffect, useRef, useState } from "react";
import { Printer } from "lucide-react";
import { Button } from "../../components/ui/button";
import { PreviewToolbar } from "./PreviewToolbar";
import { PaginatedDocumentRenderer } from "./PaginatedDocumentRenderer";
import { GovernanceBanner } from "./GovernanceBanner";
import { usePreviewZoom } from "./hooks/usePreviewZoom";
import { usePageTracking } from "./hooks/usePageTracking";
import type { ZoomMode } from "./types";

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
  /**
   * Called when the user selects a different template in the PreviewToolbar.
   * Phase 4: EditorPage uses this to persist the new templateId to DocumentContext.
   */
  onTemplateChange?: (template: Template) => void;
  /** When true, show the inline governance banner below the preview toolbar. */
  showGovernanceBanner?: boolean;
  /** Message to display in the governance banner. */
  governanceBannerMessage?: string;
  /** Called when × is clicked without the checkbox — session dismiss only. */
  onGovernanceBannerDismiss?: () => void;
  /** Called when × is clicked with "Don't show this again" checked — permanent dismiss. */
  onGovernanceBannerDismissPermanently?: () => void;
  /**
   * Incremented by EditorPage whenever empty paragraphs are detected.
   * Forces re-pagination even when the doc reference hasn't changed (e.g. cursor move).
   */
  governanceTick?: number;
}

export function PreviewPanel({
  editorState,
  template: externalTemplate,
  onTemplateChange,
  showGovernanceBanner,
  governanceBannerMessage,
  onGovernanceBannerDismiss,
  onGovernanceBannerDismissPermanently,
  governanceTick,
}: PreviewPanelProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<Template>(externalTemplate || defaultTemplate);
  const [pagedJsPageCount, setPagedJsPageCount] = useState<number>(0);
  const [measuredPageWidth, setMeasuredPageWidth] = useState<number | null>(null);
  const [measuredPageHeight, setMeasuredPageHeight] = useState<number | null>(null);
  const [zoomMode, setZoomMode] = useState<ZoomMode>('fit-page');

  // Sync selectedTemplate when externalTemplate prop changes.
  // useState only consumes its initial value once — this keeps local state
  // correct if the parent provides a different template after mount.
  useEffect(() => {
    if (externalTemplate) {
      setSelectedTemplate(externalTemplate);
    }
  }, [externalTemplate]);

  const handleTemplateChange = (template: Template) => {
    setSelectedTemplate(template);
    onTemplateChange?.(template);
  };

  // Stable callbacks — prevents PaginatedDocumentRenderer's pagination
  // effect from re-firing every render due to unstable function references.
  const handlePagedJsComplete = useCallback((pageCount: number) => {
    setPagedJsPageCount(pageCount);
  }, []);

  const handlePageMeasured = useCallback((width: number, height: number) => {
    setMeasuredPageWidth(width);
    setMeasuredPageHeight(height);
  }, []);

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
  const hasRenderedPages = pagedJsPageCount > 0;

  const handleSavePdf = () => {
    window.print();
  };

  if (!editorState) {
    return (
      <div className="pilcrow-preview-panel h-full flex flex-col">
        <div className="pilcrow-preview-toolbar-row border-b border-mylo-border-light p-4">
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
    <div className="pilcrow-preview-panel h-full flex flex-col bg-mylo-canvas">
      <div className="pilcrow-preview-toolbar-row border-b border-mylo-border-light px-4 py-2 bg-mylo-surface flex items-center justify-between">
        <PreviewToolbar
          selectedTemplate={selectedTemplate}
          onTemplateChange={handleTemplateChange}
          zoomMode={zoomMode}
          onZoomChange={setZoomMode}
        />
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleSavePdf}
            disabled={!hasRenderedPages}
            aria-label="Save PDF"
            title="Opens your browser’s print dialog."
          >
            <Printer className="size-4" />
            Save PDF
          </Button>
          <p className="text-xs text-mylo-text-secondary">
            Page {currentPage} of {pagedJsPageCount}
          </p>
        </div>
      </div>

      {showGovernanceBanner && (
        <div className="pilcrow-governance-banner">
          <GovernanceBanner
            message={governanceBannerMessage!}
            onDismiss={onGovernanceBannerDismiss!}
            onDismissPermanently={onGovernanceBannerDismissPermanently!}
          />
        </div>
      )}

      <div
        ref={scrollContainerRef}
        className={`pilcrow-preview-canvas flex-1 overflow-auto p-8 ${shouldShowHorizontalScrollbar ? 'preview-scroll pb-3' : 'hide-scrollbar'}`}
      >
        <PaginatedDocumentRenderer
          doc={editorState.doc}
          template={selectedTemplate}
          onPagedJsComplete={handlePagedJsComplete}
          onPageMeasured={handlePageMeasured}
          scale={scale}
          shouldCenter={shouldCenterContent}
          governanceTick={governanceTick}
        />
      </div>
    </div>
  );
}
