/**
 * @file templates/TemplateListPage.tsx
 * @role Template library dashboard
 * @owns Grid of template cards, + New Template action, kebab-menu actions
 *       (Edit, Duplicate, Delete) per card.
 * @does-not-own Template data persistence (TemplateContext), template authoring
 *               UI (TemplateEditorPage), session/role state.
 *
 * @governance Route is enforced by ProtectedRoute in router.tsx to
 *             template-editor and admin roles only. Contributors who reach
 *             this page directly are redirected to /documents by the router.
 *
 * @see TemplateContext.tsx — template CRUD
 * @see TemplateEditorPage.tsx — authoring surface (Phase 5B)
 * @see router.tsx — /templates route (role-gated)
 */

import { useNavigate } from 'react-router';
import { format } from 'date-fns';
import { Plus, MoreHorizontal, Pencil, Copy, Trash2, LayoutTemplate } from 'lucide-react';
import { useTemplates } from '../contexts/TemplateContext';
import type { Template } from '../mylo/template';
import { AppHeader } from '../documents/components/AppHeader';
import { Button } from '../components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';

// ---------------------------------------------------------------------------
// Status badge
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
// Template card
// ---------------------------------------------------------------------------

interface TemplateCardProps {
  template: Template;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

function TemplateCard({ template, onEdit, onDuplicate, onDelete }: TemplateCardProps) {
  const updatedAt = template.updatedAt
    ? format(new Date(template.updatedAt), 'MMM d, yyyy')
    : '—';

  return (
    <div className="group relative bg-mylo-surface border border-mylo-border-light rounded-xl p-5 flex flex-col gap-4 hover:border-mylo-border hover:shadow-sm transition-all">
      {/* Icon */}
      <div className="size-10 rounded-lg bg-mylo-surface-subtle border border-mylo-border-light flex items-center justify-center">
        <LayoutTemplate className="size-5 text-mylo-text-tertiary" />
      </div>

      {/* Kebab menu */}
      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-mylo-text-tertiary hover:text-mylo-text-primary"
              aria-label="Template options"
            >
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem onClick={onEdit} className="gap-2">
              <Pencil className="size-3.5" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onDuplicate} className="gap-2">
              <Copy className="size-3.5" />
              Duplicate
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={onDelete}
              className="gap-2 text-destructive focus:text-destructive"
            >
              <Trash2 className="size-3.5" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Content */}
      <div className="flex flex-col gap-2 min-w-0">
        <p className="text-sm font-semibold text-mylo-text-primary truncate leading-snug">
          {template.name || 'Untitled Template'}
        </p>
        <StatusBadge status={template.status} />
      </div>

      {/* Footer */}
      <div className="mt-auto pt-3 border-t border-mylo-border-light">
        <p className="text-xs text-mylo-text-tertiary">Modified {updatedAt}</p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

function EmptyTemplates({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-80 text-center px-8">
      <div className="size-16 rounded-2xl bg-mylo-surface border border-mylo-border-light flex items-center justify-center mb-5 shadow-sm">
        <LayoutTemplate className="size-8 text-mylo-text-tertiary" />
      </div>
      <h3 className="text-base font-semibold text-mylo-text-primary mb-1.5">
        No templates yet
      </h3>
      <p className="text-sm text-mylo-text-secondary mb-6 max-w-xs leading-relaxed">
        Create a template to define how documents look. Contributors will see
        published templates in their preview panel.
      </p>
      <Button onClick={onCreate} className="gap-2">
        <Plus className="size-4" />
        New Template
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// TemplateListPage
// ---------------------------------------------------------------------------

export function TemplateListPage() {
  const navigate = useNavigate();
  const { templates, createTemplate, deleteTemplate, updateTemplate } = useTemplates();

  const handleNew = () => {
    const t = createTemplate();
    navigate(`/templates/${t.id}`);
  };

  const handleEdit = (id: string) => {
    navigate(`/templates/${id}`);
  };

  const handleDuplicate = (template: Template) => {
    // Create a new draft with the duplicated template's structure, then
    // update its name to signal it is a copy. updateTemplate immediately
    // after createTemplate to avoid a double-render flash.
    const dup = createTemplate();
    updateTemplate(dup.id, {
      ...template,
      id: dup.id,                                       // preserve the new UUID
      name: `${template.name || 'Untitled Template'} (Copy)`,
      status: 'draft',
    });
    navigate(`/templates/${dup.id}`);
  };

  const handleDelete = (id: string) => {
    deleteTemplate(id);
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-mylo-surface-subtle">
      <AppHeader />

      <main className="flex-1 overflow-auto">
        {/* Page header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-mylo-border-light bg-mylo-surface">
          <div>
            <h1 className="text-base font-semibold text-mylo-text-primary">Templates</h1>
            <p className="text-sm text-mylo-text-secondary mt-0.5">
              {templates.length} {templates.length === 1 ? 'template' : 'templates'}
            </p>
          </div>
          <Button onClick={handleNew} className="gap-2">
            <Plus className="size-4" />
            New Template
          </Button>
        </div>

        {/* Grid or empty state */}
        <div className="p-8">
          {templates.length === 0 ? (
            <EmptyTemplates onCreate={handleNew} />
          ) : (
            <div
              className="grid gap-4"
              style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}
            >
              {templates.map((t) => (
                <TemplateCard
                  key={t.id}
                  template={t}
                  onEdit={() => handleEdit(t.id)}
                  onDuplicate={() => handleDuplicate(t)}
                  onDelete={() => handleDelete(t.id)}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
