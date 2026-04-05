/**
 * @file templates/TemplateEditorPage.tsx
 * @role Template Editor orchestrator
 * @owns Three-zone template editor: style list (left), property panel (left — on
 *       style selection), and live specimen preview (right). Used for both
 *       /templates/new and /templates/:id routes.
 * @does-not-own Template persistence (TemplateContext), Paged.js rendering pipeline
 *               (PaginatedDocumentRenderer — reused as-is), serializer, pagination
 *               service, pageLayoutUtils. None of these may be modified here.
 *               Panel rendering: delegated to StyleListPanel and BodyStylePanel.
 *
 * State model:
 *   savedTemplate  — snapshot of the last explicitly-saved version (frozen until Save)
 *   draftTemplate  — local working copy; updated live on every panel field change
 *   bodyDraft      — property panel form state for the Body style; kept in sync with
 *                    draftTemplate via handleBodyDraftChange
 *   isDirty        — true when draftTemplate differs from savedTemplate
 *   showPreview    — when true: renderer uses draftTemplate (live A/B toggle)
 *                    when false: renderer uses savedTemplate (see saved state)
 *
 * Mutations:
 *   Field change  — calls updateDraftBodyStyle (styleConversions.ts), immediately
 *                   writes bodyDraft → draftTemplate.contentStyles.body (live preview)
 *   Save (panel)  — same as top-bar Save; persists draftTemplate to TemplateContext
 *   Save (topbar) — persists draftTemplate to TemplateContext; updates savedTemplate
 *   Revert        — restores draftTemplate from savedTemplate; clears isDirty
 *   Cancel        — closes property panel; draftTemplate retains live changes
 *   Publish/Unpublish — calls TemplateContext directly; also updates local draft status
 *
 * @governance Template Editor + Admin
 * @see TemplateContext.tsx — template CRUD
 * @see TemplateListPage.tsx — navigates here on create / edit
 * @see PaginatedDocumentRenderer.tsx — reused for the live specimen preview
 * @see mylo/samples/specimen-documents.ts — specimen content
 * @see templates/utils/styleConversions.ts — Template ↔ BodyStyleDraft conversion
 * @see templates/StyleListPanel.tsx — left panel style tree view
 * @see templates/BodyStylePanel.tsx — left panel Body style property editor
 * @see router.tsx — /templates/new and /templates/:id routes (role-gated)
 */

import {
  useState,
  useCallback,
  useMemo,
  useEffect,
  useRef,
} from 'react';
import type { KeyboardEvent, ChangeEvent } from 'react';
import { useParams, useNavigate } from 'react-router';
import { ChevronLeft } from 'lucide-react';

import { useTemplates } from '../contexts/TemplateContext';
import type { Template } from '../mylo/template';
import { myloSchema } from '../mylo/schema';
import { sampleToEditorState } from '../mylo/samples/converter';
import { specimenDocuments, defaultSpecimen } from '../mylo/samples/specimen-documents';
import type { SampleDocument } from '../mylo/samples/types';

import { PaginatedDocumentRenderer } from '../contributor/preview/PaginatedDocumentRenderer';
import { usePreviewZoom } from '../contributor/preview/hooks/usePreviewZoom';

import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/ui/alert-dialog';

import type { BodyStyleDraft } from './types/styleEditor';
import {
  templateBodyToStyleDraft,
  styleDraftToTemplateBody,
} from './utils/styleConversions';
import { StyleListPanel } from './StyleListPanel';
import { BodyStylePanel } from './BodyStylePanel';

// ---------------------------------------------------------------------------
// StatusBadge
// ---------------------------------------------------------------------------

function StatusBadge({ status }: { status: 'draft' | 'published' | undefined }) {
  const resolved = status ?? 'published';
  return resolved === 'published' ? (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
      Published
    </span>
  ) : (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-mylo-surface-subtle text-mylo-text-secondary border border-mylo-border-light">
      Draft
    </span>
  );
}

// ---------------------------------------------------------------------------
// TemplateEditorPage
// ---------------------------------------------------------------------------

export function TemplateEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    templates,
    createTemplate,
    updateTemplate,
    publishTemplate,
    unpublishTemplate,
  } = useTemplates();

  // When route is /templates/new, create a template and redirect immediately
  useEffect(() => {
    if (!id) {
      const t = createTemplate();
      navigate(`/templates/${t.id}`, { replace: true });
    }
    // createTemplate and navigate are stable; only run once when id is missing
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Resolve the current template from context (re-derives on every context update).
  // Used only for: initialising state on mount, not-found redirect.
  const contextTemplate = id ? templates.find((t) => t.id === id) ?? null : null;

  // savedTemplate — frozen snapshot of the last explicitly-saved version.
  // Only updated by handleSave. Drives the "Preview off" state in the renderer
  // and is the restore point for Revert.
  const [savedTemplate, setSavedTemplate] = useState<Template | null>(contextTemplate);

  // draftTemplate — local working copy. Updated live on every panel field change.
  const [draftTemplate, setDraftTemplate] = useState<Template | null>(contextTemplate);

  const [isDirty, setIsDirty] = useState(false);

  // showPreview — when true: renderer shows draftTemplate (live changes).
  // When false: renderer shows savedTemplate (A/B comparison).
  const [showPreview, setShowPreview] = useState(true);

  // Sync local state when navigating to a different template (id change only).
  const prevIdRef = useRef(id);
  useEffect(() => {
    if (id !== prevIdRef.current) {
      prevIdRef.current = id;
      const template = id ? templates.find((t) => t.id === id) ?? null : null;
      setDraftTemplate(template);
      setSavedTemplate(template);
      setIsDirty(false);
      setShowPreview(true);
      setActiveView('styleList');
      setBodyDraft(null);
    }
  }, [id, templates]);

  // Template name inline editing
  const [isEditingName, setIsEditingName] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditingName) nameInputRef.current?.select();
  }, [isEditingName]);

  // Left panel view state
  const [activeView, setActiveView] = useState<'styleList' | 'bodyPanel'>('styleList');

  // Body style property panel state (null = not yet initialised)
  const [bodyDraft, setBodyDraft] = useState<BodyStyleDraft | null>(null);

  // Specimen selection
  const [selectedSpecimen, setSelectedSpecimen] = useState<SampleDocument>(defaultSpecimen);

  // Unsaved changes guard dialog
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const pendingNavigationRef = useRef<(() => void) | null>(null);

  // Preview zoom
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [measuredPageWidth, setMeasuredPageWidth] = useState<number | null>(null);
  const [measuredPageHeight, setMeasuredPageHeight] = useState<number | null>(null);

  const { scale, shouldCenterContent } = usePreviewZoom({
    containerRef: scrollContainerRef,
    measuredPageWidth,
    measuredPageHeight,
    zoomMode: 'fit-page',
  });

  const handlePageMeasured = useCallback((width: number, height: number) => {
    setMeasuredPageWidth(width);
    setMeasuredPageHeight(height);
  }, []);

  // Page count is not displayed in the Template Editor; callback required by PaginatedDocumentRenderer
  const handlePagedJsComplete = useCallback((_pageCount: number) => { /* no-op */ }, []);

  // Stable specimen doc — recomputed only when selected specimen changes
  const specimenDoc = useMemo(() => {
    return sampleToEditorState(selectedSpecimen, myloSchema).doc;
  }, [selectedSpecimen]);

  // ---------------------------------------------------------------------------
  // Redirect if template not found (after loading)
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (id && templates.length > 0 && !contextTemplate) {
      navigate('/templates', { replace: true });
    }
  }, [id, templates, contextTemplate, navigate]);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  /**
   * Called by BodyStylePanel whenever any field changes.
   * Immediately writes the new bodyDraft to draftTemplate for live preview.
   */
  const handleBodyDraftChange = useCallback((draft: BodyStyleDraft) => {
    setBodyDraft(draft);
    setDraftTemplate((prev) =>
      prev
        ? {
            ...prev,
            contentStyles: {
              ...prev.contentStyles,
              body: styleDraftToTemplateBody(draft),
            },
          }
        : prev
    );
    setIsDirty(true);
  }, []);

  const handleBodyClick = useCallback(() => {
    if (!draftTemplate) return;
    setBodyDraft(templateBodyToStyleDraft(draftTemplate));
    setActiveView('bodyPanel');
  }, [draftTemplate]);

  /**
   * Persists draftTemplate to TemplateContext and updates savedTemplate.
   * Called by both the top-bar Save button and the panel Save button.
   */
  const handleSave = useCallback(() => {
    if (!draftTemplate) return;
    updateTemplate(draftTemplate.id, draftTemplate);
    setSavedTemplate(draftTemplate);
    setIsDirty(false);
  }, [draftTemplate, updateTemplate]);

  /**
   * Close the property panel and return to the style list.
   * Does NOT revert draft changes — draftTemplate retains live edits.
   */
  const handleCancel = useCallback(() => {
    setActiveView('styleList');
    setBodyDraft(null);
  }, []);

  /**
   * Restore draftTemplate to the last saved state (savedTemplate).
   * Also resets bodyDraft if the panel is open.
   */
  const handleRevert = useCallback(() => {
    if (!savedTemplate) return;
    setDraftTemplate(savedTemplate);
    setIsDirty(false);
    if (activeView === 'bodyPanel') {
      setBodyDraft(templateBodyToStyleDraft(savedTemplate));
    }
  }, [savedTemplate, activeView]);

  const handlePublishToggle = useCallback(() => {
    if (!draftTemplate) return;
    if (draftTemplate.status === 'published') {
      unpublishTemplate(draftTemplate.id);
      setDraftTemplate((prev) => prev ? { ...prev, status: 'draft' } : prev);
    } else {
      publishTemplate(draftTemplate.id);
      setDraftTemplate((prev) => prev ? { ...prev, status: 'published' } : prev);
    }
  }, [draftTemplate, publishTemplate, unpublishTemplate]);

  const handleNameBlur = useCallback(() => {
    setIsEditingName(false);
  }, []);

  const handleNameKeyDown = useCallback((e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === 'Escape') {
      setIsEditingName(false);
    }
  }, []);

  const handleNameChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setDraftTemplate((prev) => prev ? { ...prev, name: e.target.value } : prev);
    setIsDirty(true);
  }, []);

  /** Navigate back to /templates, showing the unsaved changes guard if needed. */
  const handleBack = useCallback(() => {
    if (isDirty) {
      pendingNavigationRef.current = () => navigate('/templates');
      setShowLeaveDialog(true);
    } else {
      navigate('/templates');
    }
  }, [isDirty, navigate]);

  const handleLeaveConfirm = useCallback(() => {
    setShowLeaveDialog(false);
    pendingNavigationRef.current?.();
    pendingNavigationRef.current = null;
  }, []);

  const handleLeaveCancel = useCallback(() => {
    setShowLeaveDialog(false);
    pendingNavigationRef.current = null;
  }, []);

  // ---------------------------------------------------------------------------
  // Loading / not found states
  // ---------------------------------------------------------------------------

  if (!id || !draftTemplate) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-mylo-surface">
        <p className="text-sm text-mylo-text-secondary">Loading…</p>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  const templateName = draftTemplate.name || 'Untitled Template';
  const isPublished = draftTemplate.status === 'published';

  // Renderer template: draft for live preview, saved for A/B comparison
  const rendererTemplate = showPreview ? draftTemplate : (savedTemplate ?? draftTemplate);

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-mylo-surface-subtle">

      {/* ────────────────────── Top bar ────────────────────── */}
      <div className="h-12 shrink-0 bg-mylo-surface border-b border-mylo-border-light flex items-center gap-3 px-4">

        {/* Back button */}
        <button
          type="button"
          onClick={handleBack}
          className="flex items-center gap-1 text-xs text-mylo-text-secondary hover:text-mylo-text-primary transition-colors shrink-0"
        >
          <ChevronLeft className="size-3.5" />
          Templates
        </button>

        <span className="text-mylo-border-light text-sm shrink-0">/</span>

        {/* Template name — editable inline */}
        {isEditingName ? (
          <input
            ref={nameInputRef}
            type="text"
            value={draftTemplate.name}
            onChange={handleNameChange}
            onBlur={handleNameBlur}
            onKeyDown={handleNameKeyDown}
            className="text-sm font-medium text-mylo-text-primary bg-transparent border-b border-mylo-border focus:outline-none min-w-0 flex-1 max-w-xs"
          />
        ) : (
          <button
            type="button"
            onClick={() => setIsEditingName(true)}
            className="text-sm font-medium text-mylo-text-primary hover:text-mylo-text-primary truncate max-w-xs min-w-0 flex-1 text-left"
          >
            {templateName}
          </button>
        )}

        {/* Specimen dropdown */}
        <Select
          value={selectedSpecimen.id}
          onValueChange={(sid) => {
            const doc = specimenDocuments.find((d) => d.id === sid);
            if (doc) setSelectedSpecimen(doc);
          }}
        >
          <SelectTrigger className="h-7 text-xs w-44 shrink-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {specimenDocuments.map((doc) => (
              <SelectItem key={doc.id} value={doc.id} className="text-xs">
                {doc.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Status badge */}
        <StatusBadge status={draftTemplate.status} />

        {/* Spacer */}
        <div className="flex-1" />

        {/* Revert */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRevert}
          disabled={!isDirty}
          className="h-7 px-2 text-xs"
        >
          Revert
        </Button>

        {/* Save */}
        <Button
          size="sm"
          onClick={handleSave}
          className="h-7 px-3 text-xs"
        >
          Save
        </Button>

        {/* Publish / Unpublish */}
        <Button
          variant={isPublished ? 'outline' : 'default'}
          size="sm"
          onClick={handlePublishToggle}
          className="h-7 px-3 text-xs shrink-0"
        >
          {isPublished ? 'Unpublish' : 'Publish'}
        </Button>
      </div>

      {/* ────────────────────── Body (two columns) ────────────────────── */}
      <div className="flex-1 flex overflow-hidden">

        {/* Left column (300px): style list or property panel */}
        <div className="w-[360px] shrink-0 bg-mylo-surface border-r border-mylo-border-light flex flex-col overflow-hidden">
          {activeView === 'styleList' ? (
            <StyleListPanel
              template={draftTemplate}
              onBodyClick={handleBodyClick}
            />
          ) : bodyDraft !== null ? (
            <BodyStylePanel
              bodyDraft={bodyDraft}
              onChange={handleBodyDraftChange}
              onSave={handleSave}
              onCancel={handleCancel}
              showPreview={showPreview}
              onShowPreviewChange={setShowPreview}
            />
          ) : null}
        </div>

        {/* Right column: specimen preview */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-auto p-8 bg-mylo-canvas"
        >
          <PaginatedDocumentRenderer
            doc={specimenDoc}
            template={rendererTemplate}
            onPagedJsComplete={handlePagedJsComplete}
            onPageMeasured={handlePageMeasured}
            scale={scale}
            shouldCenter={shouldCenterContent}
          />
        </div>
      </div>

      {/* ────────────────────── Unsaved changes guard ────────────────────── */}
      <AlertDialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved changes</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes to{' '}
              <strong>{templateName}</strong>. Leave without saving?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleLeaveCancel}>Stay</AlertDialogCancel>
            <AlertDialogAction onClick={handleLeaveConfirm}>
              Leave without saving
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
