import { FileText } from "lucide-react";
import { useState } from "react";
import { Button } from "../../components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../components/ui/alert-dialog";
import { sampleDocuments, sampleToEditorState } from "../../mylo/samples";
import { EditorView } from "prosemirror-view";

/**
 * LoadSampleMenu - Sample Document Loader
 * 
 * Governance: Sample documents for demonstration and testing
 * Responsibility: Provide quick access to pre-built sample documents
 * Role: Contributor (content authoring)
 * 
 * Features:
 * - DropdownMenu with available sample documents
 * - Loads sample documents directly into editor
 * - Shows confirmation dialog if document has been modified
 * - Resets modification tracking on load
 * 
 * State: Session (loads sample into editor, no persistence)
 */

interface LoadSampleMenuProps {
  view?: EditorView | null;
  isModified?: boolean;
  onModifiedChange?: (isModified: boolean) => void;
}

export function LoadSampleMenu({ view, isModified = false, onModifiedChange }: LoadSampleMenuProps) {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingSampleId, setPendingSampleId] = useState<string | null>(null);

  const loadSample = (sampleId: string) => {
    if (!view) return;

    // Find the sample document
    const sample = sampleDocuments.find((s) => s.id === sampleId);
    if (!sample) {
      console.error('Sample not found:', sampleId);
      return;
    }

    // Convert sample to EditorState to get the new document
    const newState = sampleToEditorState(sample, view.state.schema);

    // Create a transaction that replaces the entire document content
    const tr = view.state.tr.replaceWith(
      0,
      view.state.doc.content.size,
      newState.doc.content
    );

    // Dispatch the transaction (this triggers dispatchTransaction callback)
    view.dispatch(tr);

    // Reset modification tracking
    if (onModifiedChange) {
      onModifiedChange(false);
    }
  };

  const handleSampleClick = (sampleId: string) => {
    // If document is modified, show confirmation dialog
    if (isModified) {
      setPendingSampleId(sampleId);
      setShowConfirmDialog(true);
    } else {
      // Load immediately if not modified
      loadSample(sampleId);
    }
  };

  const handleConfirm = () => {
    if (pendingSampleId) {
      loadSample(pendingSampleId);
    }
    setShowConfirmDialog(false);
    setPendingSampleId(null);
  };

  const handleCancel = () => {
    setShowConfirmDialog(false);
    setPendingSampleId(null);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            Sample Text
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {sampleDocuments.map((sample) => (
            <DropdownMenuItem
              key={sample.id}
              onSelect={() => handleSampleClick(sample.id)}
            >
              <div className="flex flex-col gap-0.5">
                <div className="text-sm">{sample.name}</div>
                {sample.description && (
                  <div className="text-xs text-mylo-text-secondary">
                    {sample.description}
                  </div>
                )}
              </div>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Load Sample Document</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to load a sample document? This will overwrite the current document.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancel}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm}>Load Sample</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}