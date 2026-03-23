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
import { Node as PMNode } from 'prosemirror-model';
import { ChevronLeft, Check } from 'lucide-react';
import { myloSchema } from '../mylo/schema';
import { availableTemplates, defaultTemplate } from '../mylo/templates';
import type { Template } from '../mylo/template';
import { useDocuments } from '../contexts/DocumentContext';
import { EditorPanel } from '../contributor/editor/EditorPanel';
import { PreviewPanel } from '../contributor/preview/PreviewPanel';

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
    availableTemplates.find((t) => t.id === doc?.templateId) ?? defaultTemplate
  );

  // ---------------------------------------------------------------------------
  // Editor state — tracked to keep PreviewPanel in sync
  // ---------------------------------------------------------------------------

  const [editorState, setEditorState] = useState<EditorState | null>(null);

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

  // ---------------------------------------------------------------------------
  // Template persistence — called by PreviewPanel when user switches template
  // ---------------------------------------------------------------------------

  const handleTemplateChange = useCallback(
    (template: Template) => {
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
            initialDoc={initialDocRef.current}
          />
        </div>

        {/* Preview — right half */}
        <div className="flex-1 overflow-hidden">
          <PreviewPanel
            editorState={editorState}
            template={initialTemplateRef.current}
            onTemplateChange={handleTemplateChange}
          />
        </div>
      </div>
    </div>
  );
}
