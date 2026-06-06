/**
 * @file documents/components/DocumentGrid.tsx
 * @role Document browsing surface
 * @owns Real-time search filtering, document grid layout, empty states,
 *       the "New Document" CTA, folder breadcrumb label.
 * @does-not-own Document persistence (DocumentContext), navigation (callbacks),
 *               template data (TemplateContext),
 *               rename/delete UI (Modals.tsx via callbacks from DocumentsPage).
 *
 * Search filters document title in real time. Matches are case-insensitive
 * substring on title. No debounce needed — filtering is synchronous and fast.
 *
 * Empty states are designed, not blank:
 *   - No documents in workspace at all → welcome state with prominent CTA
 *   - Folder is empty → folder-specific state
 *   - Search returns no results → search-specific state
 *
 * @see DocumentCard.tsx — individual card component
 * @see DocumentContext.tsx — documents, folders data
 */

import { useState, useMemo } from 'react';
import { Search, Plus, FileText, FolderOpen, SearchX } from 'lucide-react';
import { useDocuments } from '../../contexts/DocumentContext';
import { useTemplates } from '../../contexts/TemplateContext';
import type { MyloDocument, Folder } from '../../types';
import { DocumentCard } from './DocumentCard';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface Props {
  folderId: string | null;
  onDocumentOpen: (id: string) => void;
  onNewDocument: () => void;
  onRenameDocument: (id: string, currentTitle: string) => void;
  onDeleteDocument: (id: string) => void;
}

// ---------------------------------------------------------------------------
// Empty states
// ---------------------------------------------------------------------------

function EmptyWorkspace({ onNew }: { onNew: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-64 text-center px-8">
      <div className="size-16 rounded-2xl bg-mylo-surface border border-mylo-border-light flex items-center justify-center mb-5 shadow-sm">
        <FileText className="size-8 text-mylo-text-tertiary" />
      </div>
      <h3 className="text-base font-semibold text-mylo-text-primary mb-1.5">
        Welcome to Mylo
      </h3>
      <p className="text-sm text-mylo-text-secondary mb-6 max-w-xs leading-relaxed">
        Create your first document to start writing. Your work stays here, organized the way you want it.
      </p>
      <Button onClick={onNew} className="gap-2">
        <Plus className="size-4" />
        New Document
      </Button>
    </div>
  );
}

function EmptyFolder({ onNew }: { onNew: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-64 text-center px-8">
      <div className="size-14 rounded-xl bg-mylo-surface border border-mylo-border-light flex items-center justify-center mb-4 shadow-sm">
        <FolderOpen className="size-7 text-mylo-text-tertiary" />
      </div>
      <h3 className="text-sm font-semibold text-mylo-text-primary mb-1">
        This folder is empty
      </h3>
      <p className="text-sm text-mylo-text-secondary mb-5 max-w-xs">
        Add a document to this folder to get started.
      </p>
      <Button onClick={onNew} size="sm" className="gap-2">
        <Plus className="size-3.5" />
        New Document
      </Button>
    </div>
  );
}

function EmptySearch({ query }: { query: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-64 text-center px-8">
      <SearchX className="size-10 text-mylo-text-tertiary mb-4" />
      <h3 className="text-sm font-semibold text-mylo-text-primary mb-1">
        No results for "{query}"
      </h3>
      <p className="text-sm text-mylo-text-secondary max-w-xs">
        Try a different search term.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Grid heading
// ---------------------------------------------------------------------------

function GridHeading({
  folderId,
  folders,
  total,
}: {
  folderId: string | null;
  folders: Folder[];
  total: number;
}) {
  const folder = folderId ? folders.find((f) => f.id === folderId) : null;
  const label = folder ? folder.name : 'All Documents';

  return (
    <div className="flex items-baseline gap-2">
      <h2 className="text-sm font-semibold text-mylo-text-primary whitespace-nowrap">{label}</h2>
      {total > 0 && (
        <span className="text-xs text-mylo-text-tertiary">{total}</span>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// DocumentGrid
// ---------------------------------------------------------------------------

export function DocumentGrid({ folderId, onDocumentOpen, onNewDocument, onRenameDocument, onDeleteDocument }: Props) {
  const { documents, folders } = useDocuments();
  const { templates } = useTemplates();
  const [query, setQuery] = useState('');

  // Filter to current folder view
  const folderDocs = useMemo(
    () =>
      folderId === null
        ? documents
        : documents.filter((d) => d.folderId === folderId),
    [documents, folderId],
  );

  // Real-time search filter
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return folderDocs;
    return folderDocs.filter((d) => d.title.toLowerCase().includes(q));
  }, [folderDocs, query]);

  const isEmptyWorkspace = documents.length === 0;
  const isEmptyFolder = folderDocs.length === 0 && !isEmptyWorkspace;
  const isEmptySearch = query.trim().length > 0 && filtered.length === 0;

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-mylo-border-light bg-mylo-surface shrink-0">
        <GridHeading folderId={folderId} folders={folders} total={folderDocs.length} />

        <div className="flex-1" />

        {/* Search */}
        <div className="relative w-56">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-mylo-text-tertiary pointer-events-none" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search documents…"
            className="pl-8 h-8 text-sm"
          />
        </div>

        {/* New Document */}
        <Button onClick={onNewDocument} size="sm" className="gap-1.5 shrink-0">
          <Plus className="size-3.5" />
          New Document
        </Button>
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-auto p-6">
        {/* Empty states */}
        {isEmptyWorkspace && <EmptyWorkspace onNew={onNewDocument} />}
        {isEmptyFolder && !query && <EmptyFolder onNew={onNewDocument} />}
        {isEmptySearch && <EmptySearch query={query.trim()} />}

        {/* Card grid */}
        {filtered.length > 0 && (
          <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
            {filtered.map((doc) => {
              const template = templates.find((candidate) => candidate.id === doc.templateId);
              const isTemplateUpdated = Boolean(
                template?.updatedAt &&
                doc.templateUpdatedAtSeen &&
                template.updatedAt > doc.templateUpdatedAtSeen
              );

              return (
                <DocumentCard
                  key={doc.id}
                  document={doc}
                  templateName={template?.name ?? '(Template removed)'}
                  isTemplateUpdated={isTemplateUpdated}
                  onOpen={() => onDocumentOpen(doc.id)}
                  onRename={() => onRenameDocument(doc.id, doc.title)}
                  onDelete={() => onDeleteDocument(doc.id)}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
