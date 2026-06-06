/**
 * @file documents/components/DocumentCard.tsx
 * @role Individual document card in the grid
 * @owns Visual card layout (title, template name, timestamps), hover state,
 *       kebab menu with rename and delete actions.
 * @does-not-own Document persistence (DocumentContext), navigation (DocumentGrid),
 *               rename/delete logic (callbacks from parent), template data.
 *
 * Design: title is the primary element, metadata is clearly secondary.
 * The kebab menu appears on hover so the card surface stays uncluttered.
 *
 * @see DocumentGrid.tsx — renders the card grid and owns navigation
 * @see Modals.tsx — RenameModal triggered by onRename callback
 * @see DocumentContext.tsx — deleteDocument called via onDelete
 */

import { MoreHorizontal, Pencil, Trash2, FileText } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import type { MyloDocument } from '../../types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';
import { cn } from '../../components/ui/utils';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface Props {
  document: MyloDocument;
  templateName: string;
  isTemplateUpdated: boolean;
  onOpen: () => void;
  onRename: () => void;
  onDelete: () => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCreated(iso: string): string {
  try {
    return format(new Date(iso), 'MMM d, yyyy');
  } catch {
    return '—';
  }
}

function formatEdited(iso: string): string {
  try {
    const date = new Date(iso);
    const diffMs = Date.now() - date.getTime();
    const diffMins = diffMs / 60_000;

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${Math.floor(diffMins)}m ago`;
    if (diffMins < 60 * 24) return `${Math.floor(diffMins / 60)}h ago`;
    return formatDistanceToNow(date, { addSuffix: true });
  } catch {
    return '—';
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function DocumentCard({ document, templateName, isTemplateUpdated, onOpen, onRename, onDelete }: Props) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => e.key === 'Enter' && onOpen()}
      className={cn(
        'group relative flex flex-col bg-mylo-surface rounded-xl border border-mylo-border-light',
        'p-5 cursor-pointer select-none',
        'hover:border-mylo-border hover:shadow-md transition-all duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
      )}
    >
      {/* Doc icon */}
      <div className="mb-4 size-10 rounded-lg bg-mylo-surface-subtle border border-mylo-border-light flex items-center justify-center">
        <FileText className="size-5 text-mylo-text-tertiary" />
      </div>

      {/* Title */}
      <h3 className="text-sm font-semibold text-mylo-text-primary leading-snug line-clamp-2 mb-1">
        {document.title || 'Untitled'}
      </h3>

      {/* Template name */}
      <p className="text-xs text-mylo-text-tertiary mb-4">
        {templateName}
      </p>

      {isTemplateUpdated && (
        <span className="self-start rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700 ring-1 ring-inset ring-amber-200 mb-4">
          Template updated
        </span>
      )}

      {/* Footer: timestamps + kebab */}
      <div className="mt-auto flex items-end justify-between gap-2">
        <div className="space-y-0.5">
          <p className="text-[11px] text-mylo-text-tertiary">
            Created {formatCreated(document.createdAt)}
          </p>
          <p className="text-[11px] text-mylo-text-tertiary">
            Edited {formatEdited(document.updatedAt)}
          </p>
        </div>

        {/* Kebab menu — visible on hover */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(
                'size-7 flex items-center justify-center rounded-md shrink-0',
                'opacity-0 group-hover:opacity-100 transition-opacity',
                'hover:bg-mylo-surface-subtle text-mylo-text-tertiary hover:text-mylo-text-secondary',
              )}
              onClick={(e) => e.stopPropagation()}
              tabIndex={-1}
            >
              <MoreHorizontal className="size-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem
              onClick={(e) => { e.stopPropagation(); onRename(); }}
            >
              <Pencil className="size-3.5" />
              Rename
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="size-3.5" />
              Move to Trash
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
