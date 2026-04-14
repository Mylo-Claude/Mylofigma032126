/**
 * @file documents/DocumentsPage.tsx
 * @role Document management dashboard — the daily home screen for Contributors
 * @owns Page composition (AppHeader + FolderSidebar + DocumentGrid),
 *       modal orchestration (which modal is open and with what data),
 *       folder selection state passed down to the grid,
 *       role-aware Templates section (visible to all roles; manage link
 *       only for Template Editor + Admin).
 * @does-not-own Document/folder CRUD (DocumentContext), individual component
 *               rendering (each component owns its own surface), routing logic,
 *               session state (AppHeader owns display of session).
 *
 * Layout:
 *   [AppHeader — full width]
 *   [FolderSidebar w-56] | [DocumentGrid flex-1]
 *   [TemplatesSection — below grid, full width of main]
 *
 * @see AppHeader.tsx, FolderSidebar.tsx, DocumentGrid.tsx, Modals.tsx
 * @see RoleContext.tsx — role-aware Templates section
 */

import { useState } from 'react';
import { useNavigate } from 'react-router';
import { LayoutTemplate, ArrowRight } from 'lucide-react';
import { useRole } from '../contexts/RoleContext';
import { useDocuments } from '../contexts/DocumentContext';
import { useTemplates } from '../contexts/TemplateContext';
import { AppHeader } from './components/AppHeader';
import { FolderSidebar } from './components/FolderSidebar';
import { DocumentGrid } from './components/DocumentGrid';
import { CreateDocumentModal, RenameModal, TrashModal } from './components/Modals';
import { Button } from '../components/ui/button';

// ---------------------------------------------------------------------------
// Templates section — role-aware, always visible but manage link is gated
// ---------------------------------------------------------------------------

function TemplatesSection() {
  const { role } = useRole();
  const { publishedTemplates } = useTemplates();
  const navigate = useNavigate();
  const canManage = role === 'template-editor' || role === 'admin';

  return (
    <div className="px-6 pb-8">
      <div className="border border-mylo-border-light rounded-xl bg-mylo-surface p-5">
        {/* Section header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <LayoutTemplate className="size-4 text-mylo-text-tertiary" />
            <h3 className="text-sm font-semibold text-mylo-text-primary">Available Templates</h3>
          </div>
          {canManage && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/templates')}
              className="h-7 px-2 gap-1 text-xs text-mylo-text-secondary hover:text-mylo-text-primary"
            >
              Manage
              <ArrowRight className="size-3" />
            </Button>
          )}
        </div>

        {/* Template pills */}
        <div className="flex flex-wrap gap-2">
          {publishedTemplates.map((t) => (
            <div
              key={t.id}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-mylo-border-light bg-mylo-surface-subtle text-sm"
            >
              <div className="size-2 rounded-full bg-mylo-border" />
              <span className="text-mylo-text-secondary font-medium">{t.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Rename state shape
// ---------------------------------------------------------------------------

interface RenameTarget {
  id: string;
  currentTitle: string;
}

// ---------------------------------------------------------------------------
// DocumentsPage
// ---------------------------------------------------------------------------

export function DocumentsPage() {
  const navigate = useNavigate();
  const { deleteDocument } = useDocuments();

  // --- Folder selection ---
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);

  // --- Modal state ---
  const [createDocOpen, setCreateDocOpen] = useState(false);
  const [trashOpen, setTrashOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<RenameTarget | null>(null);

  // --- Handlers ---
  const handleDocumentOpen = (id: string) => navigate(`/documents/${id}`);

  const handleDocumentCreated = (id: string) => navigate(`/documents/${id}`);

  const handleRenameDocument = (id: string, currentTitle: string) => {
    setRenameTarget({ id, currentTitle });
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-mylo-surface-subtle">
      <AppHeader />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <FolderSidebar
          selectedFolderId={selectedFolderId}
          onFolderSelect={setSelectedFolderId}
          onTrashOpen={() => setTrashOpen(true)}
        />

        {/* Main content */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Document grid — takes available space */}
          <div className="flex-1 overflow-auto">
            <DocumentGrid
              folderId={selectedFolderId}
              onDocumentOpen={handleDocumentOpen}
              onNewDocument={() => setCreateDocOpen(true)}
              onRenameDocument={handleRenameDocument}
              onDeleteDocument={deleteDocument}
            />

            {/* Templates section — below grid */}
            <TemplatesSection />
          </div>
        </main>
      </div>

      {/* Modals */}
      <CreateDocumentModal
        open={createDocOpen}
        onClose={() => setCreateDocOpen(false)}
        defaultFolderId={selectedFolderId}
        onCreated={handleDocumentCreated}
      />

      <RenameModal
        open={renameTarget !== null}
        onClose={() => setRenameTarget(null)}
        documentId={renameTarget?.id ?? ''}
        currentTitle={renameTarget?.currentTitle ?? ''}
      />

      <TrashModal
        open={trashOpen}
        onClose={() => setTrashOpen(false)}
      />
    </div>
  );
}
