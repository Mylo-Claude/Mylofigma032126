/**
 * @file contexts/DocumentContext.tsx
 * @role Document and folder state management
 * @owns Document CRUD, folder CRUD, soft-delete/trash/restore lifecycle,
 *       localStorage persistence for mylo_documents and mylo_folders.
 * @does-not-own Session/auth (SessionContext), template data (TemplateContext),
 *               ProseMirror editor state (managed by EditorPanel),
 *               template rendering (serializer, pagination services).
 *
 * Permission model: All three roles have identical CRUD permissions — no
 * ownership restrictions in this single-browser POC. Role-gating is the
 * responsibility of UI components, not this context.
 *
 * Document deletion policy:
 *   - Soft delete (deleteDocument): sets deletedAt, document moves to trash.
 *   - Restore (restoreDocument): clears deletedAt, document returns to active list.
 *   - Permanent delete (permanentDeleteDocument): removes from localStorage entirely.
 *
 * Folder deletion policy:
 *   - Hard delete only (no trash for folders).
 *   - Deleting a folder recursively removes all descendant folders.
 *   - Documents in deleted folders are orphaned to root (folderId → null).
 *
 * createdBy: call sites (Modals.tsx, FolderSidebar.tsx) pass session.name explicitly.
 * DocumentContext does not import SessionContext — no layering violation.
 *
 * @see types/index.ts — MyloDocument, Folder types
 */

import { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { MyloDocument, Folder } from '../types';
import { useTemplates } from './TemplateContext';

const DOCUMENTS_KEY = 'mylo_documents';
const FOLDERS_KEY = 'mylo_folders';

// ---------------------------------------------------------------------------
// Storage helpers
// ---------------------------------------------------------------------------

function loadFromStorage<T>(key: string): T[] {
  try {
    const stored = localStorage.getItem(key);
    return stored ? (JSON.parse(stored) as T[]) : [];
  } catch {
    return [];
  }
}

function saveToStorage<T>(key: string, value: T[]): void {
  localStorage.setItem(key, JSON.stringify(value));
}

function generateId(): string {
  return crypto.randomUUID();
}

function nowISO(): string {
  return new Date().toISOString();
}

// ---------------------------------------------------------------------------
// Context shape
// ---------------------------------------------------------------------------

interface DocumentContextType {
  // ----- Documents -----

  /** Active (non-deleted) documents. */
  documents: MyloDocument[];
  /** Soft-deleted documents — in trash, awaiting restore or permanent deletion. */
  trashedDocuments: MyloDocument[];

  /**
   * Create a new document with empty content.
   * EditorPanel will initialize content with the welcome sample when content is empty ({}).
   * createdBy must be passed by the call site (e.g. session.name from useSession).
   * Returns the newly created document.
   */
  createDocument: (
    title: string,
    folderId: string | null,
    templateId: string,
    createdBy: string
  ) => MyloDocument;

  /**
   * Update mutable fields on an existing document.
   * Always updates updatedAt to the current timestamp.
   */
  updateDocument: (
    id: string,
    updates: Partial<Pick<MyloDocument, 'title' | 'content' | 'templateId' | 'templateUpdatedAtSeen' | 'folderId'>>
  ) => void;

  /** Soft-delete: moves document to trash by setting deletedAt. */
  deleteDocument: (id: string) => void;

  /** Restore from trash: clears deletedAt, document returns to active list. */
  restoreDocument: (id: string) => void;

  /** Permanent delete: removes document from localStorage entirely. Irreversible. */
  permanentDeleteDocument: (id: string) => void;

  // ----- Folders -----

  /** All folders (no soft delete — folders are hard-deleted). */
  folders: Folder[];

  /**
   * Create a folder at the given parent (null = root).
   * createdBy must be passed by the call site (e.g. session.name from useSession).
   * Returns the new folder.
   */
  createFolder: (name: string, parentId: string | null, createdBy: string) => Folder;

  /** Rename a folder. */
  updateFolder: (id: string, name: string) => void;

  /**
   * Delete a folder and all its descendants.
   * Documents in the deleted subtree are orphaned to root (folderId → null).
   */
  deleteFolder: (id: string) => void;
}

const DocumentContext = createContext<DocumentContextType | null>(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function DocumentProvider({ children }: { children: ReactNode }) {
  const { templates } = useTemplates();
  const [allDocuments, setAllDocuments] = useState<MyloDocument[]>(() => {
    const storedDocuments = loadFromStorage<MyloDocument>(DOCUMENTS_KEY);
    let didNormalize = false;
    const normalizedDocuments = storedDocuments.map((document) => {
      if (document.templateUpdatedAtSeen !== undefined) return document;

      const template = templates.find((candidate) => candidate.id === document.templateId);
      if (!template?.updatedAt) return document;

      didNormalize = true;
      return { ...document, templateUpdatedAtSeen: template.updatedAt };
    });

    if (didNormalize) {
      saveToStorage(DOCUMENTS_KEY, normalizedDocuments);
    }

    return normalizedDocuments;
  });

  const [folders, setFolders] = useState<Folder[]>(() =>
    loadFromStorage<Folder>(FOLDERS_KEY)
  );

  // Derived views — computed each render, no extra state needed
  const documents = allDocuments.filter(d => d.deletedAt === null);
  const trashedDocuments = allDocuments.filter(d => d.deletedAt !== null);

  // ---------------------------------------------------------------------------
  // Document operations
  // ---------------------------------------------------------------------------

  const createDocument = useCallback((
    title: string,
    folderId: string | null,
    templateId: string,
    createdBy: string
  ): MyloDocument => {
    const timestamp = nowISO();
    const doc: MyloDocument = {
      id: generateId(),
      title,
      folderId,
      content: {},       // empty object signals EditorPanel to load the welcome sample
      templateId,
      templateUpdatedAtSeen: templates.find((template) => template.id === templateId)?.updatedAt,
      createdAt: timestamp,
      updatedAt: timestamp,
      createdBy,
      deletedAt: null,
    };
    const updated = [...allDocuments, doc];
    setAllDocuments(updated);
    saveToStorage(DOCUMENTS_KEY, updated);
    return doc;
  }, [allDocuments, templates]);

  const updateDocument = useCallback((
    id: string,
    updates: Partial<Pick<MyloDocument, 'title' | 'content' | 'templateId' | 'templateUpdatedAtSeen' | 'folderId'>>
  ): void => {
    const updated = allDocuments.map(d =>
      d.id === id ? { ...d, ...updates, updatedAt: nowISO() } : d
    );
    setAllDocuments(updated);
    saveToStorage(DOCUMENTS_KEY, updated);
  }, [allDocuments]);

  const deleteDocument = useCallback((id: string): void => {
    const updated = allDocuments.map(d =>
      d.id === id ? { ...d, deletedAt: nowISO() } : d
    );
    setAllDocuments(updated);
    saveToStorage(DOCUMENTS_KEY, updated);
  }, [allDocuments]);

  const restoreDocument = useCallback((id: string): void => {
    const updated = allDocuments.map(d =>
      d.id === id ? { ...d, deletedAt: null } : d
    );
    setAllDocuments(updated);
    saveToStorage(DOCUMENTS_KEY, updated);
  }, [allDocuments]);

  const permanentDeleteDocument = useCallback((id: string): void => {
    const updated = allDocuments.filter(d => d.id !== id);
    setAllDocuments(updated);
    saveToStorage(DOCUMENTS_KEY, updated);
  }, [allDocuments]);

  // ---------------------------------------------------------------------------
  // Folder operations
  // ---------------------------------------------------------------------------

  const createFolder = useCallback((
    name: string,
    parentId: string | null,
    createdBy: string
  ): Folder => {
    const folder: Folder = {
      id: generateId(),
      name,
      parentId,
      createdAt: nowISO(),
      createdBy,
    };
    const updated = [...folders, folder];
    setFolders(updated);
    saveToStorage(FOLDERS_KEY, updated);
    return folder;
  }, [folders]);

  const updateFolder = useCallback((id: string, name: string): void => {
    const updated = folders.map(f =>
      f.id === id ? { ...f, name } : f
    );
    setFolders(updated);
    saveToStorage(FOLDERS_KEY, updated);
  }, [folders]);

  const deleteFolder = useCallback((id: string): void => {
    // Collect the target folder and all descendants recursively
    const toDelete = new Set<string>();
    const collectDescendants = (folderId: string): void => {
      toDelete.add(folderId);
      folders
        .filter(f => f.parentId === folderId)
        .forEach(child => collectDescendants(child.id));
    };
    collectDescendants(id);

    // Hard-delete the folder subtree
    const updatedFolders = folders.filter(f => !toDelete.has(f.id));
    setFolders(updatedFolders);
    saveToStorage(FOLDERS_KEY, updatedFolders);

    // Orphan documents whose folder was deleted — move them to root
    const updatedDocs = allDocuments.map(d =>
      d.folderId !== null && toDelete.has(d.folderId)
        ? { ...d, folderId: null, updatedAt: nowISO() }
        : d
    );
    setAllDocuments(updatedDocs);
    saveToStorage(DOCUMENTS_KEY, updatedDocs);
  }, [folders, allDocuments]);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <DocumentContext.Provider value={{
      documents,
      trashedDocuments,
      createDocument,
      updateDocument,
      deleteDocument,
      restoreDocument,
      permanentDeleteDocument,
      folders,
      createFolder,
      updateFolder,
      deleteFolder,
    }}>
      {children}
    </DocumentContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * useDocuments — access document and folder state and actions.
 * Must be called within a DocumentProvider subtree.
 */
export function useDocuments(): DocumentContextType {
  const ctx = useContext(DocumentContext);
  if (!ctx) {
    throw new Error('useDocuments must be used within a DocumentProvider');
  }
  return ctx;
}
