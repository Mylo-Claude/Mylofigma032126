import React, { useEffect, useRef, useState } from "react";
import { EditorState, Transaction } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { Node as PMNode } from "prosemirror-model";
import { myloSchema } from "../../mylo/schema";
import { history } from "prosemirror-history";
import { keymap } from "prosemirror-keymap";
import { baseKeymap } from "prosemirror-commands";
import { EditorToolbar } from "./EditorToolbar";
import { myloKeymap } from "../../mylo/keymap";
import { welcome } from "../../mylo/samples/welcome";
import { sampleToEditorState } from "../../mylo/samples/converter";
import type { Template } from "../../mylo/template";
import { resolveDocumentSettings } from "../../mylo/template";
import { shouldNotify } from "../../services/governanceNotifications";

/**
 * EditorPanel - Contributor Editor Surface
 * 
 * Governance: Contributors apply structural markers only
 * Responsibility: 
 *   - Provide ProseMirror-based drafting environment
 *   - Capture structural intent (headings, lists, character markers)
 *   - Never control Preview typography (governed by templates)
 * Role: Contributor (content authoring)
 * 
 * The Editor is NOT brand-accurate. It uses drafting typography for clarity.
 * Preview is the authoritative rendering surface.
 * 
 * State: Document content state (structure markers, text, links)
 * 
 * @see Mylo Governance: Contributor structure authority model
 * @see Mylo Governance: Editor drafting defaults
 */

interface EditorPanelProps {
  onDocumentChange: (state: EditorState) => void;
  onViewReady?: (view: EditorView) => void;
  /**
   * Optional initial ProseMirror node to populate the editor.
   * When provided, replaces the default welcome sample.
   * Captured once at mount — changes after mount have no effect.
   * Phase 4: hydrated from DocumentContext content (stored as doc.toJSON()).
   */
  initialDoc?: PMNode;
  /** Active template — used for governance education notifications. */
  template?: Template;
  /**
   * Called once per page load when a governance rule triggers a notification.
   * EditorPage uses this to show the inline GovernanceBanner in PreviewPanel.
   */
  onGovernanceTrigger?: () => void;
  /**
   * Called when empty paragraph presence changes from absent to present.
   * EditorPage uses this to force the preview to re-paginate even without
   * a doc change (e.g. cursor move while empty paragraphs exist).
   */
  onEmptyParagraphDetected?: () => void;
  /**
   * Called when the user makes an explicit edit (transaction has steps AND the
   * editor is focused). NOT called for programmatic doc replacements.
   * EditorPage uses this to set isModified so LoadSampleMenu can gate its dialog.
   */
  onUserEdit?: () => void;
  /**
   * Whether the document has unsaved user edits. Threaded down to LoadSampleMenu
   * so it can decide whether to show the "overwrite?" confirmation dialog.
   */
  isModified?: boolean;
  /**
   * Called after a programmatic doc replacement (e.g. loading a sample) to
   * clear the isModified flag in EditorPage.
   */
  onResetModified?: () => void;
}

/**
 * Returns true if the document contains ANY empty paragraph at the top level.
 * Runs on every transaction (including selection-only) so the preview
 * re-renders even when the cursor moves without changing content.
 *
 * A single empty paragraph is enough to trigger a preview re-render because
 * the governance rule strips ALL empty paragraphs — the template controls
 * all spacing via Space Before/After on paragraph styles.
 *
 * Empty detection matches governanceEnforcement.ts: both trim() === '' and
 * the serializer's zero-width-space form (\u200B) are treated as empty.
 */
function checkForEmptyParagraph(state: EditorState): boolean {
  const paragraphType = state.schema.nodes.paragraph;
  let found = false;
  state.doc.forEach((node) => {
    if (found) return;
    const isEmpty = node.textContent.trim() === '' || node.textContent === '\u200B';
    if (node.type === paragraphType && isEmpty) {
      found = true;
    }
  });
  return found;
}

function hasAuthoredParagraphContent(state: EditorState): boolean {
  const paragraphType = state.schema.nodes.paragraph;
  let found = false;
  state.doc.forEach((node) => {
    if (found) return;
    if (node.type !== paragraphType) return;

    const normalizedText = node.textContent.replace(/\u200B/g, '').trim();
    if (normalizedText.length > 0) {
      found = true;
    }
  });
  return found;
}

/**
 * Detects any empty paragraph and triggers a governance notification.
 *
 * Detection: cursor is in an empty paragraph. A single empty paragraph is
 * enough to warrant the notification because ALL empty paragraphs are stripped
 * from the preview — the template controls all spacing.
 *
 * Uses persistent: true so that permanently-dismissed notifications are
 * never re-triggered (checked against localStorage).
 *
 * @governance Contributor education — empty paragraph stripping
 */
function checkEmptyParagraphNotification(
  state: EditorState,
  template: Template | null,
  triggeredRef: React.MutableRefObject<boolean>,
  onGovernanceTrigger?: () => void,
): void {
  if (!template || triggeredRef.current) return

  const settings = resolveDocumentSettings(template.documentSettings)
  if (!settings.stripEmptyParagraphs) return
  if (!shouldNotify('empty_paragraphs')) return
  if (!hasAuthoredParagraphContent(state)) return

  const { $from } = state.selection
  const node = $from.node()
  const paragraphType = state.schema.nodes.paragraph;
  const isCurrentEmpty = node.type === paragraphType && node.textContent.trim() === ''

  if (isCurrentEmpty) {
    triggeredRef.current = true
    onGovernanceTrigger?.()
  }
}

export function EditorPanel({ onDocumentChange, onViewReady, initialDoc, template, onGovernanceTrigger, onEmptyParagraphDetected, onUserEdit, isModified, onResetModified }: EditorPanelProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const [, setUpdateCount] = useState(0);

  // Store callbacks in refs to avoid recreating the editor
  const onDocumentChangeRef = useRef(onDocumentChange);
  const onViewReadyRef = useRef(onViewReady);
  // Capture initialDoc at mount — not reactive after mount
  const initialDocRef = useRef(initialDoc);
  // Keep latest template accessible inside the dispatchTransaction closure
  const templateRef = useRef<Template | undefined>(template);
  // Keep latest governance trigger callback accessible inside closure
  const onGovernanceTriggerRef = useRef(onGovernanceTrigger);
  // Keep latest empty-paragraph callback accessible inside closure
  const onEmptyParagraphDetectedRef = useRef(onEmptyParagraphDetected);
  // Called only when the user makes an explicit edit (steps present + focused)
  const onUserEditRef = useRef(onUserEdit);
  // Reset isModified after a programmatic doc replacement
  const onResetModifiedRef = useRef(onResetModified);
  // Prevent re-triggering the governance banner within the same page load
  const governanceTriggeredRef = useRef(false);
  // Track previous empty-paragraph presence to avoid firing on every keystroke
  const hadEmptyParagraphRef = useRef(false);

  // Reset governance trigger state when the initial document changes.
  // Guards against the case where a new document is loaded into the same
  // component instance without unmounting (e.g. same-session document switch).
  useEffect(() => {
    governanceTriggeredRef.current = false;
    hadEmptyParagraphRef.current = false;
  }, [initialDoc]);

  useEffect(() => {
    onDocumentChangeRef.current = onDocumentChange;
    onViewReadyRef.current = onViewReady;
    templateRef.current = template;
    onGovernanceTriggerRef.current = onGovernanceTrigger;
    onEmptyParagraphDetectedRef.current = onEmptyParagraphDetected;
    onUserEditRef.current = onUserEdit;
    onResetModifiedRef.current = onResetModified;
  });

  useEffect(() => {
    if (!editorRef.current) return;

    // Use provided initialDoc (restored from storage) or fall back to welcome sample
    const initialDoc = initialDocRef.current ?? sampleToEditorState(welcome, myloSchema).doc;

    // Create editor state
    const state = EditorState.create({
      doc: initialDoc,
      schema: myloSchema,
      plugins: [
        history(),
        myloKeymap(),
        keymap(baseKeymap),
      ]
    });

    // Create editor view
    const view = new EditorView(editorRef.current, {
      state,
      dispatchTransaction(transaction: Transaction) {
        const newState = view.state.apply(transaction);
        view.updateState(newState);

        // Force toolbar re-render on selection or document changes
        setUpdateCount(c => c + 1);

        // Fire onEmptyParagraphDetected when:
        //   (a) empty paragraph newly appears (false → true), or
        //   (b) cursor moves while empty paragraphs already exist (selection-only)
        // Does NOT fire on every doc change while an unrelated empty para exists
        // elsewhere — that would re-paginate on every keystroke needlessly.
        const hasEmptyParagraph = checkForEmptyParagraph(newState);
        if (hasEmptyParagraph && (!hadEmptyParagraphRef.current || !transaction.docChanged)) {
          onEmptyParagraphDetectedRef.current?.();
        }
        hadEmptyParagraphRef.current = hasEmptyParagraph;

        // Notify parent of document changes
        if (transaction.docChanged) {
          onDocumentChangeRef.current(newState);

          // Only mark as modified when the user actually typed or edited content.
          // Programmatic replacements (loading a sample) have steps but the view
          // is not focused — they must not set the dirty flag.
          const isUserEdit = transaction.steps.length > 0 && view.hasFocus();
          if (isUserEdit) {
            onUserEditRef.current?.();
          }

          // Governance notification: consecutive empty paragraphs
          checkEmptyParagraphNotification(newState, templateRef.current ?? null, governanceTriggeredRef, onGovernanceTriggerRef.current)
        }
      }
    });

    viewRef.current = view;

    // Notify parent that view is ready.
    // onViewReady receives the EditorView so EditorPage can read initial state
    // (via view.state) without triggering the document-change / save-status path.
    if (onViewReadyRef.current) {
      onViewReadyRef.current(view);
    }

    return () => {
      view.destroy();
    };
  }, []); // Empty dependency array - only run once

  return (
    <div className="h-full flex flex-col bg-mylo-editor-bg">
      <EditorToolbar view={viewRef.current} isModified={isModified} onResetModified={onResetModified} />
      
      <div className="flex-1 overflow-auto p-6 hide-scrollbar">
        <div 
          ref={editorRef} 
          className="prose max-w-none min-h-full"
          style={{
            outline: 'none',
          }}
        />
      </div>
    </div>
  );
}
