/**
 * @file documents/components/FolderSidebar.tsx
 * @role Folder navigation panel
 * @owns Folder tree rendering, expand/collapse state, inline folder creation,
 *       inline folder renaming, folder context menu (rename, add subfolder, delete),
 *       trash access link, New Folder action.
 * @does-not-own Folder persistence (DocumentContext), document filtering
 *               (DocumentGrid handles filtering by folderId), routing decisions,
 *               template navigation (AppHeader handles /templates nav link).
 *
 * Inline creation: clicking "New Folder" inserts an editable input at root (or
 * inside a folder via its context menu). Enter = confirm, Escape/empty blur = cancel.
 *
 * Inline rename: clicking "Rename" from context menu converts the folder name
 * into an editable input in-place. Same confirm/cancel keyboard behaviour.
 *
 * @see DocumentContext.tsx — folders, createFolder, updateFolder, deleteFolder
 */

import { useState, useRef, useEffect, useCallback, createContext, useContext } from 'react';
import {
  ChevronRight,
  FolderIcon,
  FolderOpenIcon,
  Files,
  Plus,
  MoreHorizontal,
  Pencil,
  FolderPlus,
  Trash2,
  Trash,
} from 'lucide-react';
import { useDocuments } from '../../contexts/DocumentContext';
import { useSession } from '../../contexts/SessionContext';
import type { Folder } from '../../types';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';
import { ScrollArea } from '../../components/ui/scroll-area';
import { cn } from '../../components/ui/utils';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface FolderNode {
  folder: Folder;
  children: FolderNode[];
}

interface Props {
  selectedFolderId: string | null;
  onFolderSelect: (id: string | null) => void;
  onTrashOpen: () => void;
}

// Inline edit state — null = not editing, string = parent folder id ('' = root)
type InlineCreate = { parentId: string | null } | null;
type InlineRename = { folderId: string; currentName: string } | null;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildTree(folders: Folder[], parentId: string | null = null): FolderNode[] {
  return folders
    .filter((f) => f.parentId === parentId)
    .map((folder) => ({
      folder,
      children: buildTree(folders, folder.id),
    }));
}

// ---------------------------------------------------------------------------
// InlineInput — shared between create and rename flows
// ---------------------------------------------------------------------------

function InlineInput({
  initialValue = '',
  placeholder,
  onConfirm,
  onCancel,
  depth = 0,
}: {
  initialValue?: string;
  placeholder: string;
  onConfirm: (value: string) => void;
  onCancel: () => void;
  depth?: number;
}) {
  const [value, setValue] = useState(initialValue);
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    ref.current?.focus();
    ref.current?.select();
  }, []);

  const commit = useCallback(() => {
    const trimmed = value.trim();
    if (trimmed) onConfirm(trimmed);
    else onCancel();
  }, [value, onConfirm, onCancel]);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { e.preventDefault(); commit(); }
    if (e.key === 'Escape') onCancel();
  };

  return (
    <div className="px-2 py-0.5" style={{ paddingLeft: `${depth * 12 + 8}px` }}>
      <Input
        ref={ref}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKey}
        onBlur={commit}
        placeholder={placeholder}
        className="h-7 text-sm"
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// FolderRow — single tree item
// ---------------------------------------------------------------------------

function FolderRow({
  node,
  depth,
  isSelected,
  isExpanded,
  isRenaming,
  onSelect,
  onToggle,
  onRenameStart,
  onRenameConfirm,
  onRenameCancel,
  onAddSubfolder,
  onDelete,
  inlineCreateParentId,
  onInlineCreateConfirm,
  onInlineCreateCancel,
}: {
  node: FolderNode;
  depth: number;
  isSelected: boolean;
  isExpanded: boolean;
  isRenaming: boolean;
  onSelect: () => void;
  onToggle: () => void;
  onRenameStart: () => void;
  onRenameConfirm: (name: string) => void;
  onRenameCancel: () => void;
  onAddSubfolder: () => void;
  onDelete: () => void;
  inlineCreateParentId: string | null | undefined;
  onInlineCreateConfirm: (name: string) => void;
  onInlineCreateCancel: () => void;
}) {
  const hasChildren = node.children.length > 0 || inlineCreateParentId === node.folder.id;

  return (
    <>
      {/* Folder row */}
      <div
        role="button"
        tabIndex={0}
        onClick={onSelect}
        onKeyDown={(e) => e.key === 'Enter' && onSelect()}
        className={cn(
          'group flex items-center gap-1 py-1 pr-1 rounded-md cursor-pointer text-sm select-none',
          'hover:bg-mylo-surface-subtle transition-colors',
          isSelected && 'bg-mylo-surface-subtle text-mylo-text-primary font-medium',
          !isSelected && 'text-mylo-text-secondary',
        )}
        style={{ paddingLeft: `${depth * 12 + 4}px` }}
      >
        {/* Chevron */}
        <button
          className="shrink-0 size-5 flex items-center justify-center rounded hover:bg-mylo-border-light transition-colors"
          onClick={(e) => { e.stopPropagation(); onToggle(); }}
          tabIndex={-1}
        >
          <ChevronRight
            className={cn(
              'size-3.5 text-mylo-text-tertiary transition-transform duration-150',
              isExpanded && 'rotate-90',
              !hasChildren && 'opacity-0',
            )}
          />
        </button>

        {/* Folder icon */}
        {isExpanded
          ? <FolderOpenIcon className="size-3.5 shrink-0 text-mylo-text-tertiary" />
          : <FolderIcon className="size-3.5 shrink-0 text-mylo-text-tertiary" />
        }

        {/* Name or inline rename input */}
        {isRenaming ? (
          <div className="flex-1 min-w-0" onClick={(e) => e.stopPropagation()}>
            <InlineInput
              initialValue={node.folder.name}
              placeholder="Folder name"
              onConfirm={onRenameConfirm}
              onCancel={onRenameCancel}
            />
          </div>
        ) : (
          <span className="flex-1 min-w-0 truncate">{node.folder.name}</span>
        )}

        {/* Context menu — visible on hover */}
        {!isRenaming && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="shrink-0 size-6 flex items-center justify-center rounded opacity-0 group-hover:opacity-100 hover:bg-mylo-border-light transition-all"
                onClick={(e) => e.stopPropagation()}
                tabIndex={-1}
              >
                <MoreHorizontal className="size-3.5 text-mylo-text-tertiary" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" side="right" className="w-44">
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onRenameStart(); }}>
                <Pencil className="size-3.5" />
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onAddSubfolder(); }}>
                <FolderPlus className="size-3.5" />
                Add subfolder
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="size-3.5" />
                Delete folder
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Children + inline create child */}
      {isExpanded && (
        <>
          {node.children.map((child) => (
            <ConnectedFolderRow
              key={child.folder.id}
              node={child}
              depth={depth + 1}
            />
          ))}
          {inlineCreateParentId === node.folder.id && (
            <InlineInput
              placeholder="Folder name"
              onConfirm={onInlineCreateConfirm}
              onCancel={onInlineCreateCancel}
              depth={depth + 1}
            />
          )}
        </>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// ConnectedFolderRow — wires FolderRow to FolderSidebar context
// ---------------------------------------------------------------------------

// We use a render-prop / context pattern to avoid prop-drilling deep into
// the recursive tree. State is hoisted to FolderSidebar via callbacks passed
// as context values through React context (local to this module).

// createContext and useContext are imported at the top of this file via the React import.

interface TreeCtx {
  selectedId: string | null;
  expandedIds: Set<string>;
  inlineCreate: InlineCreate;
  inlineRename: InlineRename;
  onSelect: (id: string | null) => void;
  onToggle: (id: string) => void;
  onRenameStart: (folderId: string, name: string) => void;
  onRenameConfirm: (name: string) => void;
  onRenameCancel: () => void;
  onAddSubfolder: (parentId: string) => void;
  onDelete: (id: string) => void;
  onInlineCreateConfirm: (name: string) => void;
  onInlineCreateCancel: () => void;
}

const TreeContext = createContext<TreeCtx | null>(null);
function useTree() {
  const ctx = useContext(TreeContext);
  if (!ctx) throw new Error('useTree must be inside TreeContext');
  return ctx;
}

function ConnectedFolderRow({ node, depth }: { node: FolderNode; depth: number }) {
  const ctx = useTree();
  const folderId = node.folder.id;

  return (
    <FolderRow
      node={node}
      depth={depth}
      isSelected={ctx.selectedId === folderId}
      isExpanded={ctx.expandedIds.has(folderId)}
      isRenaming={ctx.inlineRename?.folderId === folderId}
      onSelect={() => ctx.onSelect(folderId)}
      onToggle={() => ctx.onToggle(folderId)}
      onRenameStart={() => ctx.onRenameStart(folderId, node.folder.name)}
      onRenameConfirm={ctx.onRenameConfirm}
      onRenameCancel={ctx.onRenameCancel}
      onAddSubfolder={() => ctx.onAddSubfolder(folderId)}
      onDelete={() => ctx.onDelete(folderId)}
      inlineCreateParentId={ctx.inlineCreate?.parentId}
      onInlineCreateConfirm={ctx.onInlineCreateConfirm}
      onInlineCreateCancel={ctx.onInlineCreateCancel}
    />
  );
}

// ---------------------------------------------------------------------------
// FolderSidebar
// ---------------------------------------------------------------------------

export function FolderSidebar({ selectedFolderId, onFolderSelect, onTrashOpen }: Props) {
  const { folders, createFolder, updateFolder, deleteFolder, trashedDocuments } = useDocuments();
  const { session } = useSession();

  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [inlineCreate, setInlineCreate] = useState<InlineCreate>(null);
  const [inlineRename, setInlineRename] = useState<InlineRename>(null);

  const tree = buildTree(folders);

  // --- Expand/collapse ---
  const handleToggle = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // --- Folder selection ---
  const handleSelect = (id: string | null) => {
    onFolderSelect(id);
  };

  // --- Inline create ---
  const startRootCreate = () => {
    setInlineCreate({ parentId: null });
    setInlineRename(null);
  };

  const handleInlineCreateConfirm = (name: string) => {
    const parentId = inlineCreate?.parentId ?? null;
    const folder = createFolder(name, parentId, session?.name ?? 'Unknown');
    // Auto-expand the parent if it exists
    if (parentId) {
      setExpandedIds((prev) => new Set([...prev, parentId]));
    }
    onFolderSelect(folder.id);
    setInlineCreate(null);
  };

  const handleInlineCreateCancel = () => setInlineCreate(null);

  const handleAddSubfolder = (parentId: string) => {
    setInlineCreate({ parentId });
    setInlineRename(null);
    // Ensure the parent is expanded so the input is visible
    setExpandedIds((prev) => new Set([...prev, parentId]));
  };

  // --- Inline rename ---
  const handleRenameStart = (folderId: string, currentName: string) => {
    setInlineRename({ folderId, currentName });
    setInlineCreate(null);
  };

  const handleRenameConfirm = (name: string) => {
    if (inlineRename) updateFolder(inlineRename.folderId, name);
    setInlineRename(null);
  };

  const handleRenameCancel = () => setInlineRename(null);

  // --- Delete ---
  const handleDelete = (id: string) => {
    if (selectedFolderId === id) onFolderSelect(null);
    deleteFolder(id);
  };

  const trashCount = trashedDocuments.length;

  // --- Tree context value ---
  const treeCtx: TreeCtx = {
    selectedId: selectedFolderId,
    expandedIds,
    inlineCreate,
    inlineRename,
    onSelect: handleSelect,
    onToggle: handleToggle,
    onRenameStart: handleRenameStart,
    onRenameConfirm: handleRenameConfirm,
    onRenameCancel: handleRenameCancel,
    onAddSubfolder: handleAddSubfolder,
    onDelete: handleDelete,
    onInlineCreateConfirm: handleInlineCreateConfirm,
    onInlineCreateCancel: handleInlineCreateCancel,
  };

  return (
    <aside className="w-56 shrink-0 flex flex-col bg-mylo-surface border-r border-mylo-border-light overflow-hidden">
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-0.5">

          {/* All Documents root item */}
          <button
            onClick={() => onFolderSelect(null)}
            className={cn(
              'w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm text-left transition-colors',
              selectedFolderId === null
                ? 'bg-mylo-surface-subtle text-mylo-text-primary font-medium'
                : 'text-mylo-text-secondary hover:bg-mylo-surface-subtle',
            )}
          >
            <Files className="size-3.5 shrink-0 text-mylo-text-tertiary" />
            All Documents
          </button>

          {/* Folder tree */}
          {tree.length > 0 && (
            <div className="pt-1">
              <TreeContext.Provider value={treeCtx}>
                {tree.map((node) => (
                  <ConnectedFolderRow key={node.folder.id} node={node} depth={0} />
                ))}
              </TreeContext.Provider>
            </div>
          )}

          {/* Root-level inline create input */}
          {inlineCreate?.parentId === null && (
            <InlineInput
              placeholder="Folder name"
              onConfirm={handleInlineCreateConfirm}
              onCancel={handleInlineCreateCancel}
              depth={0}
            />
          )}
        </div>
      </ScrollArea>

      {/* Bottom actions */}
      <div className="p-2 border-t border-mylo-border-light space-y-0.5">

        {/* Trash */}
        <button
          onClick={onTrashOpen}
          className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm text-left text-mylo-text-secondary hover:bg-mylo-surface-subtle transition-colors"
        >
          <Trash className="size-3.5 shrink-0 text-mylo-text-tertiary" />
          Trash
          {trashCount > 0 && (
            <span className="ml-auto text-[11px] font-medium text-mylo-text-tertiary">
              {trashCount}
            </span>
          )}
        </button>

        {/* New Folder */}
        <button
          onClick={startRootCreate}
          className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm text-left text-mylo-text-secondary hover:bg-mylo-surface-subtle transition-colors"
        >
          <Plus className="size-3.5 shrink-0 text-mylo-text-tertiary" />
          New Folder
        </button>
      </div>
    </aside>
  );
}
