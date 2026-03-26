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
  isModified?: boolean;
  onModifiedChange?: (isModified: boolean) => void;
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
}

/**
 * Returns true if the document contains ANY empty paragraph at the top level.
 * Runs on every transaction (including selection-only) so the preview
 * re-renders even when the cursor moves without changing content.
 *
 * A single empty paragraph is enough to trigger a preview re-render because
 * the governance rule strips ALL empty paragraphs — the template controls
 * all spacing via Space Before/After on paragraph styles.
 */
function checkForEmptyParagraph(state: EditorState): boolean {
  let found = false
  state.doc.forEach((node) => {
    if (found) return
    if (node.type.name === 'paragraph' && node.textContent.trim() === '') {
      found = true
    }
  })
  return found
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

  const { $from } = state.selection
  const node = $from.node()
  const isCurrentEmpty = node.type.name === 'paragraph' && node.textContent.trim() === ''

  if (isCurrentEmpty) {
    triggeredRef.current = true
    onGovernanceTrigger?.()
  }
}

export function EditorPanel({ onDocumentChange, onViewReady, isModified, onModifiedChange, initialDoc, template, onGovernanceTrigger, onEmptyParagraphDetected }: EditorPanelProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const [, setUpdateCount] = useState(0);

  // Store callbacks in refs to avoid recreating the editor
  const onDocumentChangeRef = useRef(onDocumentChange);
  const onViewReadyRef = useRef(onViewReady);
  const onModifiedChangeRef = useRef(onModifiedChange);
  // Capture initialDoc at mount — not reactive after mount
  const initialDocRef = useRef(initialDoc);
  // Keep latest template accessible inside the dispatchTransaction closure
  const templateRef = useRef<Template | undefined>(template);
  // Keep latest governance trigger callback accessible inside closure
  const onGovernanceTriggerRef = useRef(onGovernanceTrigger);
  // Keep latest empty-paragraph callback accessible inside closure
  const onEmptyParagraphDetectedRef = useRef(onEmptyParagraphDetected);
  // Prevent re-triggering the governance banner within the same page load
  const governanceTriggeredRef = useRef(false);
  // Track previous empty-paragraph presence to avoid firing on every keystroke
  const hadEmptyParagraphRef = useRef(false);

  useEffect(() => {
    onDocumentChangeRef.current = onDocumentChange;
    onViewReadyRef.current = onViewReady;
    onModifiedChangeRef.current = onModifiedChange;
    templateRef.current = template;
    onGovernanceTriggerRef.current = onGovernanceTrigger;
    onEmptyParagraphDetectedRef.current = onEmptyParagraphDetected;
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

          // Mark document as modified
          if (onModifiedChangeRef.current) {
            onModifiedChangeRef.current(true);
          }

          // Governance notification: consecutive empty paragraphs
          checkEmptyParagraphNotification(newState, templateRef.current ?? null, governanceTriggeredRef, onGovernanceTriggerRef.current)
        }
      }
    });

    viewRef.current = view;

    // Notify parent that view is ready
    if (onViewReadyRef.current) {
      onViewReadyRef.current(view);
    }

    // Initial document state
    onDocumentChangeRef.current(state);

    return () => {
      view.destroy();
    };
  }, []); // Empty dependency array - only run once

  return (
    <div className="h-full flex flex-col bg-mylo-editor-bg">
      <EditorToolbar view={viewRef.current} isModified={isModified} onModifiedChange={onModifiedChange} />
      
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