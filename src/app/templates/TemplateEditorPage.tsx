/**
 * @file templates/TemplateEditorPage.tsx
 * @role Template authoring surface
 * @owns The three-zone template editor: style panel (left), property panel (center),
 *       live specimen preview (right). Used for both /templates/new and /templates/:id.
 * @does-not-own Template persistence (TemplateContext), Paged.js rendering pipeline
 *               (PaginatedDocumentRenderer — reused as-is for the specimen preview),
 *               serializer, pagination service, pageConfigAdapter.
 *               None of these may be modified for this surface.
 *
 * @governance Accessible to template-editor and admin roles only.
 *             Typographic vocabulary (leading, tracking, space before/after,
 *             paragraph rules) maps to CSS internally — never exposed as raw CSS
 *             to contributors. The 'advanced' property remains available as the
 *             power escape hatch for template editors.
 *
 * @stub Phase 5 — full implementation pending.
 *       Phase 5 builds the full InDesign-style authoring surface with:
 *       - Style tree (paragraph, character, list, link, page setup styles)
 *       - Property panel (font, spacing, alignment, color, rules, advanced)
 *       - Live specimen preview via PaginatedDocumentRenderer
 *       - Template lifecycle (draft → published)
 *
 * @see TemplateContext.tsx — template CRUD (Phase 5)
 * @see TemplateListPage.tsx — navigates here on create/edit
 * @see PaginatedDocumentRenderer.tsx — reused for live specimen preview
 * @see mylo/template.ts — Template interface, advanced property
 * @see router.tsx — /templates/new and /templates/:id routes (role-gated)
 */

export function TemplateEditorPage() {
  return (
    <div className="h-screen w-screen flex items-center justify-center bg-mylo-surface">
      <div className="text-center text-mylo-text-secondary">
        <p className="text-lg font-medium">Template Editor</p>
        <p className="text-sm mt-1">Template authoring surface — Phase 5</p>
      </div>
    </div>
  );
}
