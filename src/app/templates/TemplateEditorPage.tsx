/**
 * @file templates/TemplateEditorPage.tsx
 * @role Template Editor orchestrator
 * @owns Three-zone template editor: style list (left), property panel (left — on
 *       style selection), and live specimen preview (right). Used for both
 *       /templates/new and /templates/:id routes.
 * @does-not-own Template persistence (TemplateContext), Paged.js rendering pipeline
 *               (PaginatedDocumentRenderer — reused as-is), serializer, pagination
 *               service, pageLayoutUtils. None of these may be modified here.
 *               Panel rendering: delegated to StyleListPanel, ParagraphStylePanel,
 *               CharacterStylePanel, and ListStylePanel.
 *
 * State model:
 *   savedTemplate  — snapshot of the last explicitly-saved version (frozen until Save)
 *   draftTemplate  — local working copy; updated live on every panel field change
 *   panel          — discriminated union describing which panel is open and its draft state
 *   isDirty        — true when draftTemplate differs from savedTemplate
 *   showPreview    — when true: renderer uses draftTemplate (live A/B toggle)
 *                    when false: renderer uses savedTemplate (see saved state)
 *
 * Panel state:
 *   { view: 'styleList' }                                      — style list visible
 *   { view: 'paragraph'; styleKey; draft: BodyStyleDraft }   — paragraph style panel
 *   { view: 'character'; styleKey; draft: CharStyleDraft }   — character style panel
 *   { view: 'list';      styleKey; draft: ListStyleDraft }   — list style panel
 *   { view: 'page-setup'; draft: PageSetupDraft }            — page setup panel
 *   { view: 'document-settings'; draft: DocumentSettingsDraft } — document settings panel
 *
 * Mutations:
 *   Style row click — initialises panel draft from draftTemplate; opens appropriate panel
 *   Field change    — calls the relevant updateDraft* helper → draftTemplate update (live)
 *   Save (panel)    — same as top-bar Save; persists draftTemplate to TemplateContext
 *   Save (topbar)   — persists draftTemplate; updates savedTemplate
 *   Revert          — restores draftTemplate from savedTemplate; re-derives open panel draft
 *   Cancel          — closes property panel; draftTemplate retains live changes
 *   Publish/Unpublish — calls TemplateContext directly; also updates local draft status
 *
 * @governance Template Editor + Admin
 * @see TemplateContext.tsx — template CRUD
 * @see TemplateListPage.tsx — navigates here on create / edit
 * @see PaginatedDocumentRenderer.tsx — reused for the live specimen preview
 * @see mylo/samples/specimen-documents.ts — specimen content
 * @see templates/utils/styleConversions.ts — Template ↔ draft conversion
 * @see templates/StyleListPanel.tsx — left panel style tree view
 * @see templates/ParagraphStylePanel.tsx — paragraph style property editor
 * @see templates/CharacterStylePanel.tsx — character style property editor
 * @see templates/ListStylePanel.tsx — list style property editor
 * @see templates/components/PageSetupPanel.tsx — page setup property editor
 * @see templates/components/DocumentSettingsPanel.tsx — document settings editor
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

import { toast } from 'sonner';
import type { BodyStyleDraft, CharacterStyleDraft, ListStyleDraft } from './types/styleEditor';
import type { PageSetupDraft, DocumentSettingsDraft } from './types/pageSetup';
import {
  PARAGRAPH_STYLE_KEYS,
  CHARACTER_STYLE_KEYS,
  LIST_STYLE_KEYS,
  PARA_CONTENT_KEY_MAP,
} from './constants/stylePropertyMap';
import type {
  AnyStyleKey,
  ParagraphStyleKey,
  CharacterStyleKey,
  ListStyleKey,
} from './constants/stylePropertyMap';
import {
  templateStyleToParaDraft,
  paraDraftToTemplateStyle,
  templateStyleToCharacterDraft,
  characterDraftToTemplateUpdate,
  templateStyleToListDraft,
  listDraftToTemplateUpdate,
} from './utils/styleConversions';
import {
  pageStylesToDraft,
  draftToPageStyles,
  documentSettingsToDraft,
  draftToDocumentSettings,
} from './utils/pageSetupConversions';
import { StyleListPanel } from './components/StyleListPanel';
import { ParagraphStylePanel } from './components/ParagraphStylePanel';
import { CharacterStylePanel } from './components/CharacterStylePanel';
import { ListStylePanel } from './components/ListStylePanel';
import { PageSetupPanel } from './components/PageSetupPanel';
import { DocumentSettingsPanel } from './components/DocumentSettingsPanel';

// ---------------------------------------------------------------------------
// Panel state discriminated union
// ---------------------------------------------------------------------------

type PanelState =
  | { view: 'styleList' }
  | { view: 'paragraph'; styleKey: ParagraphStyleKey; draft: BodyStyleDraft }
  | { view: 'character'; styleKey: CharacterStyleKey; draft: CharacterStyleDraft }
  | { view: 'list'; styleKey: ListStyleKey; draft: ListStyleDraft }
  | { view: 'page-setup'; draft: PageSetupDraft }
  | { view: 'document-settings'; draft: DocumentSettingsDraft };

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
  const contextTemplate = id ? templates.find((t) => t.id === id) ?? null : null;

  // savedTemplate — frozen snapshot of the last explicitly-saved version.
  const [savedTemplate, setSavedTemplate] = useState<Template | null>(
    contextTemplate ? structuredClone(contextTemplate) : null
  );

  // draftTemplate — local working copy. Updated live on every panel field change.
  const [draftTemplate, setDraftTemplate] = useState<Template | null>(
    contextTemplate ? structuredClone(contextTemplate) : null
  );

  const [isDirty, setIsDirty] = useState(false);

  // showPreview — when true: renderer shows draftTemplate (live changes).
  const [showPreview, setShowPreview] = useState(true);

  // panel — which panel is open and what draft it's editing.
  const [panel, setPanel] = useState<PanelState>({ view: 'styleList' });

  // Sync local state when navigating to a different template (id change only).
  const prevIdRef = useRef(id);
  useEffect(() => {
    if (id !== prevIdRef.current) {
      prevIdRef.current = id;
      const template = id ? templates.find((t) => t.id === id) ?? null : null;
      setDraftTemplate(template ? structuredClone(template) : null);
      setSavedTemplate(template ? structuredClone(template) : null);
      setIsDirty(false);
      setShowPreview(true);
      setPanel({ view: 'styleList' });
    }
  }, [id, templates]);

  // Template name inline editing
  const [isEditingName, setIsEditingName] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditingName) nameInputRef.current?.select();
  }, [isEditingName]);

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
    containerRef: scrollContainerRef as React.RefObject<HTMLDivElement>,
    measuredPageWidth,
    measuredPageHeight,
    zoomMode: 'fit-page',
  });

  const handlePageMeasured = useCallback((width: number, height: number) => {
    setMeasuredPageWidth(width);
    setMeasuredPageHeight(height);
  }, []);

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
   * Called when any style row in StyleListPanel is clicked.
   * Derives the initial draft from draftTemplate and opens the correct panel.
   */
  const handleStyleClick = useCallback((styleKey: AnyStyleKey) => {
    if (!draftTemplate) return;
    // Reset preview toggle to live mode whenever a new style panel is opened.
    setShowPreview(true);

    if ((PARAGRAPH_STYLE_KEYS as readonly string[]).includes(styleKey)) {
      setPanel({
        view: 'paragraph',
        styleKey: styleKey as ParagraphStyleKey,
        draft: templateStyleToParaDraft(draftTemplate, styleKey as ParagraphStyleKey),
      });
    } else if ((CHARACTER_STYLE_KEYS as readonly string[]).includes(styleKey)) {
      setPanel({
        view: 'character',
        styleKey: styleKey as CharacterStyleKey,
        draft: templateStyleToCharacterDraft(draftTemplate, styleKey as CharacterStyleKey),
      });
    } else if ((LIST_STYLE_KEYS as readonly string[]).includes(styleKey)) {
      setPanel({
        view: 'list',
        styleKey: styleKey as ListStyleKey,
        draft: templateStyleToListDraft(draftTemplate, styleKey as ListStyleKey),
      });
    }
  }, [draftTemplate]);

  /**
   * Called by ParagraphStylePanel whenever any field changes.
   * Immediately writes the new draft to draftTemplate for live preview.
   */
  const handleParaDraftChange = useCallback((draft: BodyStyleDraft) => {
    if (panel.view !== 'paragraph') return;
    // Cast is safe: view === 'paragraph' guard ensures styleKey is ParagraphStyleKey.
    // Without @types/react, useState narrows to any — explicit cast restores type safety.
    const contentKey = PARA_CONTENT_KEY_MAP[panel.styleKey as ParagraphStyleKey];
    setPanel({ ...panel, draft });
    setDraftTemplate((prev) =>
      prev
        ? {
            ...prev,
            contentStyles: {
              ...prev.contentStyles,
              [contentKey]: paraDraftToTemplateStyle(draft),
            },
          }
        : prev
    );
    setIsDirty(true);
  }, [panel]);

  /**
   * Called by CharacterStylePanel whenever any field changes.
   * Immediately applies the character draft to draftTemplate for live preview.
   */
  const handleCharDraftChange = useCallback((draft: CharacterStyleDraft) => {
    if (panel.view !== 'character') return;
    setPanel({ ...panel, draft });
    setDraftTemplate((prev) =>
      prev ? characterDraftToTemplateUpdate(prev, draft, panel.styleKey) : prev
    );
    setIsDirty(true);
  }, [panel]);

  /**
   * Called by ListStylePanel whenever any field changes.
   * Immediately applies the list draft to draftTemplate for live preview.
   */
  const handleListDraftChange = useCallback((draft: ListStyleDraft) => {
    if (panel.view !== 'list') return;
    setPanel({ ...panel, draft });
    setDraftTemplate((prev) =>
      prev ? listDraftToTemplateUpdate(prev, draft, panel.styleKey) : prev
    );
    setIsDirty(true);
  }, [panel]);

  /** Open the Page Setup panel, seeding the draft from draftTemplate.pageStyles. */
  const handlePageSetupEdit = useCallback(() => {
    if (!draftTemplate) return;
    setPanel({
      view: 'page-setup',
      draft: pageStylesToDraft(draftTemplate.pageStyles),
    });
  }, [draftTemplate]);

  /** Open the Document Settings panel, seeding the draft from draftTemplate.documentSettings. */
  const handleDocumentSettingsEdit = useCallback(() => {
    if (!draftTemplate) return;
    setPanel({
      view: 'document-settings',
      draft: documentSettingsToDraft(draftTemplate.documentSettings),
    });
  }, [draftTemplate]);

  /** Called by PageSetupPanel whenever any field changes. */
  const handlePageSetupDraftChange = useCallback((draft: PageSetupDraft) => {
    if (panel.view !== 'page-setup') return;
    setPanel({ view: 'page-setup', draft });
    setDraftTemplate((prev) =>
      prev ? { ...prev, pageStyles: draftToPageStyles(draft) } : prev
    );
    setIsDirty(true);
  // [panel.view] rather than [panel]: the guard only checks view, and including
  // the full panel object would cause a new callback on every draft keystroke,
  // creating an infinite loop (callback change → parent re-render → new panel
  // object → callback change). Style handlers use [panel] because they also
  // read panel.styleKey inside the callback body.
  }, [panel.view]);

  /** Called by DocumentSettingsPanel whenever any field changes. */
  const handleDocumentSettingsDraftChange = useCallback((draft: DocumentSettingsDraft) => {
    if (panel.view !== 'document-settings') return;
    setPanel({ view: 'document-settings', draft });
    setDraftTemplate((prev) =>
      prev ? { ...prev, documentSettings: draftToDocumentSettings(draft) } : prev
    );
    setIsDirty(true);
  // [panel.view] — same reasoning as handlePageSetupDraftChange above.
  }, [panel.view]);

  /**
   * Persists draftTemplate to TemplateContext and updates savedTemplate.
   * Called by both the top-bar Save button and each panel's Save button.
   */
  const handleSave = useCallback(() => {
    if (!draftTemplate) return;
    updateTemplate(draftTemplate.id, draftTemplate);
    setSavedTemplate(structuredClone(draftTemplate));
    setIsDirty(false);
    toast.success('Template saved');
    setPanel({ view: 'styleList' });
  }, [draftTemplate, updateTemplate]);

  /**
   * Close the property panel and return to the style list.
   * Resets draftTemplate to the last saved state so unsaved edits
   * do not persist if the same panel is reopened.
   */
  const handleCancel = useCallback(() => {
    setDraftTemplate(structuredClone(savedTemplate));
    setIsDirty(false);
    setPanel({ view: 'styleList' });
  }, [savedTemplate]);

  /**
   * Restore draftTemplate to the last saved state (savedTemplate).
   * Also re-derives the panel draft if a panel is currently open.
   */
  const handleRevert = useCallback(() => {
    if (!savedTemplate) return;
    setDraftTemplate(structuredClone(savedTemplate));
    setIsDirty(false);

    if (panel.view === 'paragraph') {
      setPanel({
        ...panel,
        draft: templateStyleToParaDraft(savedTemplate, panel.styleKey),
      });
    } else if (panel.view === 'character') {
      setPanel({
        ...panel,
        draft: templateStyleToCharacterDraft(savedTemplate, panel.styleKey),
      });
    } else if (panel.view === 'list') {
      setPanel({
        ...panel,
        draft: templateStyleToListDraft(savedTemplate, panel.styleKey),
      });
    } else if (panel.view === 'page-setup') {
      setPanel({ view: 'page-setup', draft: pageStylesToDraft(savedTemplate.pageStyles) });
    } else if (panel.view === 'document-settings') {
      setPanel({ view: 'document-settings', draft: documentSettingsToDraft(savedTemplate.documentSettings) });
    }
  }, [savedTemplate, panel]);

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

        <button
          type="button"
          onClick={handleBack}
          className="flex items-center gap-1 text-xs text-mylo-text-secondary hover:text-mylo-text-primary transition-colors shrink-0"
        >
          <ChevronLeft className="size-3.5" />
          Templates
        </button>

        <span className="text-mylo-border-light text-sm shrink-0">/</span>

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

        <StatusBadge status={draftTemplate.status} />

        <div className="flex-1" />

        <Button
          variant="ghost"
          size="sm"
          onClick={handleRevert}
          disabled={!isDirty}
          className="h-7 px-2 text-xs"
        >
          Revert
        </Button>

        <Button size="sm" onClick={handleSave} className="h-7 px-3 text-xs">
          Save
        </Button>

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

        {/* Left column (360px): style list or property panel */}
        <div className="w-[360px] shrink-0 bg-mylo-surface border-r border-mylo-border-light flex flex-col overflow-hidden">
          {panel.view === 'styleList' ? (
            <StyleListPanel
              template={draftTemplate}
              onStyleClick={handleStyleClick}
              onPageSetupEdit={handlePageSetupEdit}
              onDocumentSettingsEdit={handleDocumentSettingsEdit}
            />
          ) : panel.view === 'paragraph' ? (
            <ParagraphStylePanel
              styleKey={panel.styleKey}
              draft={panel.draft}
              onChange={handleParaDraftChange}
              onSave={handleSave}
              onCancel={handleCancel}
              showPreview={showPreview}
              onShowPreviewChange={setShowPreview}
            />
          ) : panel.view === 'character' ? (
            <CharacterStylePanel
              styleKey={panel.styleKey}
              draft={panel.draft}
              onChange={handleCharDraftChange}
              onSave={handleSave}
              onCancel={handleCancel}
              showPreview={showPreview}
              onShowPreviewChange={setShowPreview}
            />
          ) : panel.view === 'list' ? (
            <ListStylePanel
              styleKey={panel.styleKey}
              draft={panel.draft}
              onChange={handleListDraftChange}
              onSave={handleSave}
              onCancel={handleCancel}
              showPreview={showPreview}
              onShowPreviewChange={setShowPreview}
            />
          ) : panel.view === 'page-setup' ? (
            <PageSetupPanel
              draft={panel.draft}
              onChange={handlePageSetupDraftChange}
              onSave={handleSave}
              onCancel={handleCancel}
            />
          ) : panel.view === 'document-settings' ? (
            <DocumentSettingsPanel
              draft={panel.draft}
              onChange={handleDocumentSettingsDraftChange}
              onSave={handleSave}
              onCancel={handleCancel}
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
