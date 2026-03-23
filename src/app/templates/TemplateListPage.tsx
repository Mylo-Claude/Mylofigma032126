/**
 * @file templates/TemplateListPage.tsx
 * @role Template library dashboard
 * @owns Grid of available templates, create-new-template action, role-gated access UI.
 * @does-not-own Template data (TemplateContext), template authoring UI
 *               (TemplateEditorPage), session/role state.
 *
 * @governance Accessible to template-editor and admin roles only.
 *             The router enforces this via ProtectedRoute; this page may
 *             additionally surface role context for display purposes.
 *
 * @stub Phase 5 — full implementation pending.
 *
 * @see TemplateContext.tsx — template CRUD (Phase 5)
 * @see TemplateEditorPage.tsx — the authoring surface
 * @see router.tsx — /templates route (role-gated: template-editor, admin)
 */

export function TemplateListPage() {
  return (
    <div className="h-screen w-screen flex items-center justify-center bg-mylo-surface">
      <div className="text-center text-mylo-text-secondary">
        <p className="text-lg font-medium">Templates</p>
        <p className="text-sm mt-1">Template library — Phase 5</p>
      </div>
    </div>
  );
}
