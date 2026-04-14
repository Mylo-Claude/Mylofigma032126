/**
 * @file documents/components/Modals.tsx
 * @role Modal dialogs for document workspace actions
 * @owns CreateDocumentModal, CreateFolderModal, RenameModal, TrashModal.
 *       Each modal is self-contained: it reads from context, calls context
 *       actions directly, and reports completion via callbacks.
 * @does-not-own Document/folder persistence (DocumentContext), navigation
 *               (callbacks), template rendering (not invoked here).
 *
 * @see DocumentContext.tsx — createDocument, createFolder, updateDocument,
 *                            updateFolder, restoreDocument, permanentDeleteDocument
 * @see SessionContext.tsx — session.name used as createdBy
 */

import { useState } from 'react';
import { format } from 'date-fns';
import { FileText, RotateCcw, Trash2 } from 'lucide-react';
import { useDocuments } from '../../contexts/DocumentContext';
import { useSession } from '../../contexts/SessionContext';
import { useTemplates } from '../../contexts/TemplateContext';
import type { MyloDocument } from '../../types';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../../components/ui/dialog';
import { ScrollArea } from '../../components/ui/scroll-area';
import { Separator } from '../../components/ui/separator';

// ---------------------------------------------------------------------------
// CreateDocumentModal
// ---------------------------------------------------------------------------

interface CreateDocumentModalProps {
  open: boolean;
  onClose: () => void;
  defaultFolderId: string | null;
  onCreated: (id: string) => void;
}

export function CreateDocumentModal({
  open,
  onClose,
  defaultFolderId,
  onCreated,
}: CreateDocumentModalProps) {
  const { createDocument } = useDocuments();
  const { session } = useSession();
  const { publishedTemplates } = useTemplates();
  const [title, setTitle] = useState('');
  const [templateId, setTemplateId] = useState(publishedTemplates[0]?.id ?? 'default-template-v1');

  const handleClose = () => {
    setTitle('');
    setTemplateId(publishedTemplates[0]?.id ?? 'default-template-v1');
    onClose();
  };

  const handleCreate = () => {
    const trimmed = title.trim();
    if (!trimmed) return;
    const doc = createDocument(trimmed, defaultFolderId, templateId, session?.name ?? 'Unknown');
    handleClose();
    onCreated(doc.id);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && title.trim()) handleCreate();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Document</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          {/* Title */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="doc-title">Title</Label>
            <Input
              id="doc-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Document title"
              autoFocus
            />
          </div>

          {/* Template */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="doc-template">Template</Label>
            <Select value={templateId} onValueChange={setTemplateId}>
              <SelectTrigger id="doc-template" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {publishedTemplates.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={!title.trim()}>
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// RenameModal — handles document rename
// ---------------------------------------------------------------------------

interface RenameModalProps {
  open: boolean;
  onClose: () => void;
  documentId: string;
  currentTitle: string;
}

export function RenameModal({ open, onClose, documentId, currentTitle }: RenameModalProps) {
  const { updateDocument } = useDocuments();
  const [title, setTitle] = useState(currentTitle);

  const handleClose = () => {
    setTitle(currentTitle);
    onClose();
  };

  const handleSave = () => {
    const trimmed = title.trim();
    if (!trimmed || trimmed === currentTitle) { onClose(); return; }
    updateDocument(documentId, { title: trimmed });
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') handleClose();
  };

  // Sync external currentTitle when modal opens
  const handleOpenChange = (o: boolean) => {
    if (o) setTitle(currentTitle);
    else handleClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Rename Document</DialogTitle>
        </DialogHeader>

        <div className="py-2">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
            onFocus={(e) => e.target.select()}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={!title.trim()}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// TrashModal
// ---------------------------------------------------------------------------

interface TrashModalProps {
  open: boolean;
  onClose: () => void;
}

function TrashRow({
  doc,
  onRestore,
  onDelete,
}: {
  doc: MyloDocument;
  onRestore: () => void;
  onDelete: () => void;
}) {
  const deletedDate = doc.deletedAt
    ? format(new Date(doc.deletedAt), 'MMM d, yyyy')
    : '—';

  return (
    <div className="flex items-center gap-3 py-3 group">
      <div className="size-8 rounded-md bg-mylo-surface-subtle border border-mylo-border-light flex items-center justify-center shrink-0">
        <FileText className="size-4 text-mylo-text-tertiary" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-mylo-text-primary truncate">
          {doc.title || 'Untitled'}
        </p>
        <p className="text-xs text-mylo-text-tertiary">Deleted {deletedDate}</p>
      </div>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="sm"
          onClick={onRestore}
          className="h-7 px-2 gap-1 text-mylo-text-secondary hover:text-mylo-text-primary text-xs"
        >
          <RotateCcw className="size-3" />
          Restore
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onDelete}
          className="h-7 px-2 gap-1 text-destructive hover:text-destructive text-xs"
        >
          <Trash2 className="size-3" />
          Delete
        </Button>
      </div>
    </div>
  );
}

export function TrashModal({ open, onClose }: TrashModalProps) {
  const { trashedDocuments, restoreDocument, permanentDeleteDocument } = useDocuments();

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Trash</DialogTitle>
        </DialogHeader>

        {trashedDocuments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <Trash2 className="size-8 text-mylo-text-tertiary mb-3" />
            <p className="text-sm font-medium text-mylo-text-primary">Trash is empty</p>
            <p className="text-xs text-mylo-text-secondary mt-1">
              Deleted documents appear here and can be restored.
            </p>
          </div>
        ) : (
          <ScrollArea className="max-h-80">
            <div className="px-1 divide-y divide-mylo-border-light">
              {trashedDocuments.map((doc, i) => (
                <TrashRow
                  key={doc.id}
                  doc={doc}
                  onRestore={() => restoreDocument(doc.id)}
                  onDelete={() => permanentDeleteDocument(doc.id)}
                />
              ))}
            </div>
          </ScrollArea>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
          {trashedDocuments.length > 0 && (
            <Button
              variant="destructive"
              onClick={() => {
                trashedDocuments.forEach((d) => permanentDeleteDocument(d.id));
              }}
            >
              Empty Trash
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
