/**
 * @file types/index.ts
 * @role Canonical domain type definitions
 * @owns Session, Folder, MyloDocument — all persisted data shapes for the Mylo platform.
 *       Role — the single source of truth for the governance role type.
 * @does-not-own Component types, template structure (mylo/template.ts),
 *               UI state, editor state, ProseMirror types, rendering types.
 *
 * These types map directly to localStorage keys:
 *   Session      → mylo_session
 *   MyloDocument → mylo_documents[]
 *   Folder       → mylo_folders[]
 *
 * @see RoleContext.tsx — imports Role from here
 * @see SessionContext.tsx — owns Session persistence
 * @see DocumentContext.tsx — owns Document + Folder persistence
 */

/**
 * User roles in the Mylo governance hierarchy.
 * Roles are cumulative: Admin > Template Editor > Contributor.
 *
 * - contributor:      Writes content, applies structural markers. Cannot author templates.
 * - template-editor:  Inherits contributor. Creates, edits, publishes, and deletes templates.
 * - admin:            Inherits template-editor. Manages users, roles, and governance policies.
 */
export type Role = 'contributor' | 'template-editor' | 'admin';

/**
 * Active browser session. Persisted to localStorage (mylo_session).
 * Not a user account — Mylo POC uses mock login with no backend auth.
 * Session survives page refresh; absence of session requires re-login.
 */
export interface Session {
  name: string;
  role: Role;
}

/**
 * A named container for organizing documents. Supports unlimited nesting via parentId.
 *
 * Deletion policy: hard delete only (no soft delete for folders).
 * When a folder is deleted, all descendant folders are removed and their
 * documents are orphaned to root (folderId → null).
 */
export interface Folder {
  id: string;
  name: string;
  parentId: string | null; // null = root level
  createdAt: string;       // ISO 8601
  createdBy: string;       // session.name at creation time
}

/**
 * A Mylo document. Content is the ProseMirror document tree (doc.toJSON()).
 *
 * Deletion policy: soft delete via deletedAt.
 * - deletedAt === null  → active document (visible in document list)
 * - deletedAt !== null  → in trash (restorable or permanently deletable)
 *
 * templateId references a template by its canonical ID (e.g. 'default-template-v1').
 * The reference is stable across Phase 1–4; Phase 5 migrates templates to localStorage
 * under these same IDs.
 */
export interface MyloDocument {
  id: string;
  title: string;
  folderId: string | null;  // null = root level; folder may be independently deleted
  content: object;          // ProseMirror doc.toJSON() — opaque to the context layer
  templateId: string;       // e.g. 'default-template-v1'
  templateUpdatedAtSeen?: string; // assigned template.updatedAt last acknowledged
  createdAt: string;        // ISO 8601
  updatedAt: string;        // ISO 8601
  createdBy: string;        // session.name at creation time
  deletedAt: string | null; // null = active; ISO 8601 string = soft deleted
}
