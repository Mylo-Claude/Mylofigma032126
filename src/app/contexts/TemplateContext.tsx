/**
 * @file contexts/TemplateContext.tsx
 * @role Template state management and localStorage persistence
 * @owns Template CRUD lifecycle (create, update, delete), publish/unpublish
 *       transitions, localStorage persistence under mylo_templates, and
 *       first-run seeding from the three hardcoded templates.
 * @does-not-own Template authoring UI (TemplateEditorPage), template rendering
 *               (serializer, pagination services), session/auth state,
 *               document state (DocumentContext).
 *
 * Seeding: On first load, if mylo_templates is empty or absent, the three
 * hardcoded templates (default, modern, formal) are written to localStorage
 * with status='published' and updatedAt=now. Their IDs are preserved exactly:
 *   - default-template-v1
 *   - modern-template-v1
 *   - formal-template-v1
 *
 * The hardcoded template files (default.ts, modern.ts, traditional.ts) and
 * templates/index.ts are the seed source ONLY — they are never modified.
 *
 * Status model:
 *   - 'published' — available in the contributor preview template selector.
 *   - 'draft'     — visible to template-editor and admin only; hidden from
 *                   contributors. New templates start as draft.
 *
 * State scope: localStorage (mylo_templates). In-memory state is derived from
 * localStorage on mount and kept in sync by every mutating operation.
 *
 * @see mylo/template.ts — Template interface (status, updatedAt added here)
 * @see mylo/templates/index.ts — availableTemplates used as seed source
 * @see templates/TemplateListPage.tsx — primary consumer for management UI
 * @see contributor/preview/PreviewToolbar.tsx — consumes publishedTemplates
 */

import { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { Template } from '../mylo/template';
import { availableTemplates } from '../mylo/templates';
import { defaultTemplate } from '../mylo/templates';

const STORAGE_KEY = 'mylo_templates';

// ---------------------------------------------------------------------------
// Storage helpers
// ---------------------------------------------------------------------------

function saveToStorage(templates: Template[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
}

function nowISO(): string {
  return new Date().toISOString();
}

/**
 * loadOrSeed — load mylo_templates from localStorage.
 * If the key is absent or the stored array is empty, seeds from availableTemplates
 * with status='published' and updatedAt=now, persists to localStorage, and returns
 * the seeded array. The hardcoded template objects are never mutated.
 */
function loadOrSeed(): Template[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as Template[];
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // Fall through to seed on parse error
  }

  const now = nowISO();
  const seeded: Template[] = availableTemplates.map((t) => ({
    ...t,
    status: 'published' as const,
    updatedAt: now,
  }));
  saveToStorage(seeded);
  return seeded;
}

// ---------------------------------------------------------------------------
// Context shape
// ---------------------------------------------------------------------------

interface TemplateContextType {
  /** All templates — drafts and published. Visible to template-editor and admin. */
  templates: Template[];

  /**
   * Templates with status === 'published'.
   * This is the only list contributors should see (e.g. in the preview toolbar).
   */
  publishedTemplates: Template[];

  /**
   * Create a blank draft template. Uses the default template as the structural
   * blueprint with a new UUID, name 'Untitled Template', status 'draft'.
   * Persists to localStorage and returns the new template.
   */
  createTemplate: () => Template;

  /**
   * Update mutable fields on an existing template.
   * Always sets updatedAt to the current timestamp.
   */
  updateTemplate: (id: string, updates: Partial<Template>) => void;

  /** Permanently remove a template from localStorage. Irreversible. */
  deleteTemplate: (id: string) => void;

  /** Set status to 'published'. Makes the template available to all roles. */
  publishTemplate: (id: string) => void;

  /** Set status to 'draft'. Hides the template from contributors. */
  unpublishTemplate: (id: string) => void;
}

const TemplateContext = createContext<TemplateContextType | null>(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function TemplateProvider({ children }: { children: ReactNode }) {
  const [templates, setTemplates] = useState<Template[]>(loadOrSeed);

  // Derived — computed each render
  const publishedTemplates = templates.filter((t) => t.status === 'published');

  // ---------------------------------------------------------------------------
  // Mutations
  // ---------------------------------------------------------------------------

  const createTemplate = useCallback((): Template => {
    const now = nowISO();
    const blank: Template = {
      // Structural blueprint from defaultTemplate — guarantees all required
      // Template fields are populated with valid values for the renderer.
      ...defaultTemplate,
      id: crypto.randomUUID(),
      name: 'Untitled Template',
      status: 'draft',
      updatedAt: now,
    };
    const updated = [...templates, blank];
    setTemplates(updated);
    saveToStorage(updated);
    return blank;
  }, [templates]);

  const updateTemplate = useCallback((id: string, updates: Partial<Template>): void => {
    const updated = templates.map((t) =>
      t.id === id ? { ...t, ...updates, updatedAt: nowISO() } : t
    );
    setTemplates(updated);
    saveToStorage(updated);
  }, [templates]);

  const deleteTemplate = useCallback((id: string): void => {
    const updated = templates.filter((t) => t.id !== id);
    setTemplates(updated);
    saveToStorage(updated);
  }, [templates]);

  const publishTemplate = useCallback((id: string): void => {
    const updated = templates.map((t) =>
      t.id === id ? { ...t, status: 'published' as const, updatedAt: nowISO() } : t
    );
    setTemplates(updated);
    saveToStorage(updated);
  }, [templates]);

  const unpublishTemplate = useCallback((id: string): void => {
    const updated = templates.map((t) =>
      t.id === id ? { ...t, status: 'draft' as const, updatedAt: nowISO() } : t
    );
    setTemplates(updated);
    saveToStorage(updated);
  }, [templates]);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <TemplateContext.Provider value={{
      templates,
      publishedTemplates,
      createTemplate,
      updateTemplate,
      deleteTemplate,
      publishTemplate,
      unpublishTemplate,
    }}>
      {children}
    </TemplateContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * useTemplates — access template state and actions.
 * Must be called within a TemplateProvider subtree.
 */
export function useTemplates(): TemplateContextType {
  const ctx = useContext(TemplateContext);
  if (!ctx) {
    throw new Error('useTemplates must be used within a TemplateProvider');
  }
  return ctx;
}
