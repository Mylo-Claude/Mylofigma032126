/**
 * @file editor/EditorPage.tsx
 * @role Document editor route — composes EditorPanel + PreviewPanel
 * @owns Back navigation, document title display, auto-save (1s debounce),
 *       templateId persistence on template change, initial content hydration
 *       from DocumentContext into EditorPanel.
 * @does-not-own ProseMirror internals (EditorPanel), Paged.js rendering
 *               (PreviewPanel, PaginatedDocumentRenderer), zoom system,
 *               serializer, pagination service, pageConfigAdapter.
 *
 * Content round-trip:
 *   - Save:    editorState.doc.toJSON() → stored as MyloDocument.content (object)
 *   - Restore: myloSchema.nodeFromJSON(doc.content) when content.type === 'doc'
 *   - New doc: content is {} — EditorPanel falls back to welcome sample
 *
 * Template persistence:
 *   - PreviewPanel initialises from doc.templateId via the `template` prop.
 *   - onTemplateChange callback → updateDocument({ templateId }) on every change.
 *
 * @see EditorPanel.tsx — initialDoc prop hydrates content from storage
 * @see PreviewPanel.tsx — template prop + onTemplateChange callback
 * @see DocumentContext.tsx — updateDocument() for auto-save + template persist
 * @see router.tsx — /documents/:id route (protected, contributor+)
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { EditorState } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { Node as PMNode } from 'prosemirror-model';
import { ChevronLeft, Check } from 'lucide-react';
import { myloSchema } from '../mylo/schema';
import { availableTemplates, defaultTemplate } from '../mylo/templates';
import type { Template } from '../mylo/template';
import { useDocuments } from '../contexts/DocumentContext';
import { markAsNotified } from '../services/governanceNotifications';
import { useTemplates } from '../contexts/TemplateContext';
import { EditorPanel } from '../contributor/editor/EditorPanel';
import { PreviewPanel } from '../contributor/preview/PreviewPanel';

const GOVERNANCE_BANNER_MESSAGE = 'Extra blank lines are ignored in Preview. Spacing comes from the template.';

// ---------------------------------------------------------------------------
// Save status indicator
// ---------------------------------------------------------------------------

type SaveStatus = 'idle' | 'unsaved' | 'saved';

function SaveIndicator({ status }: { status: SaveStatus }) {
  if (status === 'idle') return null;

  if (status === 'unsaved') {
    return (
      <span className="text-xs text-mylo-text-tertiary select-none">
        Unsaved changes
      </span>
    );
  }

  return (
    <span className="flex items-center gap-1 text-xs text-mylo-text-secondary select-none">
      <Check className="size-3" />
      Saved
    </span>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Attempt to restore a ProseMirror Node from the stored content object.
 * Returns undefined if the content is empty ({}) or cannot be parsed —
 * EditorPanel falls back to the welcome sample in that case.
 */
function resolveInitialDoc(content: object): PMNode | undefined {
  if ((content as Record<string, unknown>).type !== 'doc') return undefined;
  try {
    return myloSchema.nodeFromJSON(content);
  } catch {
    return undefined;
  }
}

// ---------------------------------------------------------------------------
// EditorPage
// ---------------------------------------------------------------------------

export function EditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { documents, updateDocument } = useDocuments();
  const { publishedTemplates } = useTemplates();

  // Look up the active document by route param
  const doc = documents.find((d) => d.id === id) ?? null;

  // Redirect to /documents if the ID is unknown or document is trashed
  useEffect(() => {
    if (id && !doc) {
      navigate('/documents', { replace: true });
    }
  }, [id, doc, navigate]);

  // ---------------------------------------------------------------------------
  // Stable refs — computed once at mount, never reactive after that
  // ---------------------------------------------------------------------------

  // Initial ProseMirror node — captured from storage before first save
  const initialDocRef = useRef<PMNode | undefined>(undefined);
  const didResolveContentRef = useRef(false);
  if (!didResolveContentRef.current && doc) {
    initialDocRef.current = resolveInitialDoc(doc.content);
    didResolveContentRef.current = true;
  }

  // Initial template — resolved once from templateId; PreviewPanel owns local state after that
  const initialTemplateRef = useRef<Template>(
    publishedTemplates.find((t) => t.id === doc?.templateId) ??
    availableTemplates.find((t) => t.id === doc?.templateId) ??
    defaultTemplate
  );

  // Active template — tracks the currently selected template for EditorPanel governance
  const [activeTemplate, setActiveTemplate] = useState<Template>(initialTemplateRef.current);

  // ---------------------------------------------------------------------------
  // Editor state — tracked to keep PreviewPanel in sync
  // ---------------------------------------------------------------------------

  const [editorState, setEditorState] = useState<EditorState | null>(null);

  // ---------------------------------------------------------------------------
  // Modification tracking — true only when the user has explicitly typed/edited
  // ---------------------------------------------------------------------------

  const [isModified, setIsModified] = useState(false);

  // ---------------------------------------------------------------------------
  // Governance banner — shown in PreviewPanel when a governance rule triggers
  // ---------------------------------------------------------------------------

  const [showGovernanceBanner, setShowGovernanceBanner] = useState(false);

  // Incremented when any empty paragraph appears or the cursor moves while one
  // exists — forces PaginatedDocumentRenderer to re-paginate so governance
  // stripping applies even without a doc reference change.
  const [governanceTick, setGovernanceTick] = useState(0);

  const handleEmptyParagraphDetected = useCallback(() => {
    setGovernanceTick((n) => n + 1);
  }, []);

  const handleGovernanceTrigger = useCallback(() => {
    setShowGovernanceBanner(true);
  }, []);

  // × alone: session dismiss — write to sessionStorage so banner stays hidden for this session
  const handleGovernanceBannerDismiss = useCallback(() => {
    markAsNotified('empty_paragraphs', false);
    setShowGovernanceBanner(false);
  }, []);

  // × with checkbox: permanent dismiss — write to localStorage so banner never appears again
  const handleGovernanceBannerDismissPermanently = useCallback(() => {
    markAsNotified('empty_paragraphs', true);
    setShowGovernanceBanner(false);
  }, []);

  const governanceBannerMessage = GOVERNANCE_BANNER_MESSAGE;

  // ---------------------------------------------------------------------------
  // Auto-save — 1s debounce, saves doc JSON to DocumentContext
  // ---------------------------------------------------------------------------

  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleDocumentChange = useCallback(
    (state: EditorState) => {
      setEditorState(state);
      setSaveStatus('unsaved');

      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);

      saveTimerRef.current = setTimeout(() => {
        if (!id) return;
        updateDocument(id, { content: state.doc.toJSON() });
        setSaveStatus('saved');

        // Reset indicator to idle after 2s
        savedTimerRef.current = setTimeout(() => setSaveStatus('idle'), 2000);
      }, 1000);
    },
    [id, updateDocument],
  );

  // Called once when the ProseMirror view is ready — sets the initial editorState
  // for PreviewPanel without touching saveStatus or isModified.
  const handleViewReady = useCallback((view: EditorView) => {
    setEditorState(view.state);
  }, []);

  // Called by EditorPanel only when the user has actually typed or edited content
  // (transaction.steps.length > 0 && view.hasFocus()). Sets isModified so that
  // LoadSampleMenu can gate its confirmation dialog on real edits only.
  const handleUserEdit = useCallback(() => {
    setIsModified(true);
  }, []);

  // ---------------------------------------------------------------------------
  // Template persistence — called by PreviewPanel when user switches template
  // ---------------------------------------------------------------------------

  const handleTemplateChange = useCallback(
    (template: Template) => {
      setActiveTemplate(template);
      if (!id) return;
      updateDocument(id, { templateId: template.id });
    },
    [id, updateDocument],
  );

  // ---------------------------------------------------------------------------
  // Cleanup
  // ---------------------------------------------------------------------------

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    };
  }, []);

  // Don't render until document is confirmed (avoids flash before redirect)
  if (!doc) return null;

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: 'var(--mylo-canvas)' }}>
      {/* ── Header ────────────────────────────────────────────────────── */}
      <header
        className="shrink-0 flex items-center gap-3 px-4 border-b"
        style={{
          height: '48px',
          background: 'var(--mylo-surface)',
          borderColor: 'var(--mylo-border-light)',
        }}
      >
        {/* Back */}
        <button
          onClick={() => navigate('/documents')}
          className="flex items-center gap-1 text-sm transition-colors shrink-0"
          style={{ color: 'var(--mylo-text-secondary)' }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.color = 'var(--mylo-text-primary)')
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.color = 'var(--mylo-text-secondary)')
          }
          aria-label="Back to documents"
        >
          <ChevronLeft className="size-4" />
          <span>Documents</span>
        </button>

        {/* Divider */}
        <div
          className="h-4 w-px shrink-0"
          style={{ background: 'var(--mylo-border-light)' }}
        />

        {/* Document title */}
        <h1
          className="flex-1 text-sm font-medium truncate"
          style={{ color: 'var(--mylo-text-primary)' }}
        >
          {doc.title || 'Untitled'}
        </h1>

        {/* Save status */}
        <SaveIndicator status={saveStatus} />
      </header>

      {/* ── Split pane ────────────────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Editor — left half */}
        <div
          className="flex-1 overflow-hidden border-r"
          style={{ borderColor: 'var(--mylo-border-light)' }}
        >
          <EditorPanel
            onDocumentChange={handleDocumentChange}
            onViewReady={handleViewReady}
            onUserEdit={handleUserEdit}
            isModified={isModified}
            onResetModified={() => setIsModified(false)}
            initialDoc={initialDocRef.current}
            template={activeTemplate}
            onGovernanceTrigger={handleGovernanceTrigger}
            onEmptyParagraphDetected={handleEmptyParagraphDetected}
          />
        </div>

        {/* Preview — right half */}
        <div className="flex-1 overflow-hidden">
          <PreviewPanel
            editorState={editorState}
            template={activeTemplate}
            onTemplateChange={handleTemplateChange}
            showGovernanceBanner={showGovernanceBanner}
            governanceBannerMessage={governanceBannerMessage}
            onGovernanceBannerDismiss={handleGovernanceBannerDismiss}
            onGovernanceBannerDismissPermanently={handleGovernanceBannerDismissPermanently}
            governanceTick={governanceTick}
          />
        </div>
      </div>
    </div>
  );
}
