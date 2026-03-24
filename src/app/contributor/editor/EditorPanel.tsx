import { useEffect, useRef, useState } from "react";
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
import { toast } from "sonner";
import type { Template } from "../../mylo/template";
import { resolveDocumentSettings } from "../../mylo/template";
import { shouldNotify, markAsNotified } from "../../services/governanceNotifications";

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
}

/**
 * Detects consecutive empty paragraphs and shows a governance notification.
 *
 * Detection: cursor is in an empty paragraph AND the previous sibling
 * is also an empty paragraph.
 *
 * @governance Contributor education — empty paragraph stripping
 */
function checkEmptyParagraphNotification(
  state: EditorState,
  template: Template | null
): void {
  if (!template) return

  const settings = resolveDocumentSettings(template.documentSettings)
  if (!shouldNotify('empty-paragraphs', settings.stripEmptyParagraphs)) return

  const { $from } = state.selection
  const node = $from.node()
  const isCurrentEmpty = node.type.name === 'paragraph' && node.textContent.trim() === ''

  if (!isCurrentEmpty) return

  // Check previous sibling
  const parentNode = $from.node($from.depth - 1)
  const index = $from.index($from.depth - 1)

  if (index > 0) {
    const prevNode = parentNode.child(index - 1)
    const isPrevEmpty = prevNode.type.name === 'paragraph' && prevNode.textContent.trim() === ''

    if (isPrevEmpty) {
      markAsNotified('empty-paragraphs')
      toast("Extra blank lines don't affect the preview. Paragraph spacing is controlled by the template.", {
        duration: 6000,
        dismissible: true,
      })
    }
  }
}

export function EditorPanel({ onDocumentChange, onViewReady, isModified, onModifiedChange, initialDoc, template }: EditorPanelProps) {
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

  useEffect(() => {
    onDocumentChangeRef.current = onDocumentChange;
    onViewReadyRef.current = onViewReady;
    onModifiedChangeRef.current = onModifiedChange;
    templateRef.current = template;
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
        
        // Notify parent of document changes
        if (transaction.docChanged) {
          onDocumentChangeRef.current(newState);

          // Mark document as modified
          if (onModifiedChangeRef.current) {
            onModifiedChangeRef.current(true);
          }

          // Governance notification: consecutive empty paragraphs
          checkEmptyParagraphNotification(view.state, templateRef.current ?? null)
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