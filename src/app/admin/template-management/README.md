# Template Management

**Status**: Placeholder - Not Yet Implemented  
**Role**: Admin  
**Governance Tier**: Admin Controlled

---

## Purpose

This directory will contain components for Admins to publish, assign, and manage templates across the organization.

**Future Responsibilities**:
- Publish templates created by Template Editors
- Assign templates to users, teams, or projects
- Configure template availability and default selection
- Manage template versions and rollback
- Archive or deprecate templates
- Monitor template usage and adoption

---

## Governance Alignment

**Admin Authority** (from Governance Rules):
- Can publish and assign templates
- Can enforce governance policies
- Can configure org-level permissions
- Can access audit logging

**Template Publishing Workflow**:
1. Template Editor creates/edits template
2. Template Editor submits for publishing (or auto-publishes if permitted)
3. Admin reviews template (validation passed)
4. Admin publishes template to org
5. Admin assigns template to users/groups
6. Template becomes available in Contributor template selector

---

## Future Components

Expected components when this feature is implemented:

- **TemplateManagement.tsx**: Main template management dashboard
- **TemplateList.tsx**: List all templates with status (draft, published, archived)
- **TemplatePublisher.tsx**: Publish/unpublish templates with confirmation
- **TemplateAssignment.tsx**: Assign templates to users, teams, projects
- **TemplateVersioning.tsx**: View version history and rollback
- **TemplateUsageAnalytics.tsx**: Track template adoption and usage
- **TemplateArchive.tsx**: Archive or restore templates

---

## State Model

**Per Org State**:
- Published templates and their assignments
- Default template configuration
- Template publishing policies
- Template version history

**Per Template State**:
- Publishing status (draft | published | archived)
- Assignment rules (who can use this template)
- Version number and changelog
- Last published date and by whom

**Session State**:
- Template management UI state
- Filters and search queries

**Does Not Export**:
- Admin UI preferences
- Session filters

---

## Template Assignment Model

**Assignment Scopes** (future design):
- **Org-wide**: All users can use this template
- **Team-based**: Specific teams can use this template
- **Project-based**: Specific projects must use this template
- **User-based**: Individual users can use this template

**Default Template Policy**:
- Admins can set a default template for new documents
- Contributors can override default if multiple templates are assigned
- If no template is assigned, system default is used

**Enforcement Levels** (future design):
- **Recommended**: Suggested but not required
- **Required**: Must use assigned template (no override)
- **Locked**: Cannot change template after document creation

---

## Template Publishing Validation

Before publishing, system must validate:

- [x] Template passes all hierarchy validation (from Template Editor)
- [x] All required roots and children exist
- [x] No naming violations
- [x] Advanced CSS does not violate hard constraints
- [x] Template metadata is complete (name, description, version)

**On Validation Failure**:
- Block publishing
- Display validation errors to Admin
- Suggest fixes or notify Template Editor

**Validation Source**:
- Reuse validation logic from Template Editor
- Admin cannot override validation failures
- Governance rules are non-negotiable

---

## Template Versioning Strategy

**Version Numbering** (future design):
- Semantic versioning (major.minor.patch)
- Auto-increment on publish
- Manual version tagging allowed

**Version History**:
- Track all published versions
- Show changelog/release notes
- Allow rollback to previous version

**Backward Compatibility**:
- Documents created with older template versions continue to work
- Template updates do not break existing documents
- Heading 4-6 expansion must preserve compatibility

---

## Usage Analytics (Future)

**Metrics to Track**:
- Template adoption rate (how many users/documents use each template)
- Most popular templates
- Template switching frequency
- Documents per template

**Use Cases**:
- Identify unused templates for archival
- Understand template preferences
- Guide template design decisions
- Report to stakeholders

---

## References

- **Governance**: `/Guidelines.md` - Admin authority model
- **Template Types**: `/src/app/mylo/template.ts`
- **Template Editor**: `/src/app/template-editor/README.md`
- **Role Context**: `/src/app/contexts/RoleContext.tsx`

---

## Implementation Notes

When implementing:

1. **Reuse Template Editor Validation**
   - Import validation logic from Template Editor
   - Do not duplicate validation rules
   - Admin UI should display validation results, not reimplement checks

2. **Use ShadCN Components**
   - Consistent with rest of application
   - Tables, Dialogs, Select, Button, etc.
   - Use `size="sm"` for controls

3. **Implement Confirmation Dialogs**
   - Publishing templates affects all users
   - Archiving templates may impact documents
   - Use clear, non-technical language

4. **Track Admin Actions**
   - Log all publishing actions to audit logs
   - Include who, what, when
   - Support compliance and accountability

5. **Document JSDoc Headers**
   ```tsx
   /**
    * TemplatePublisher
    * 
    * **Role**: Admin
    * **Governance**: Admin Controlled (Tier 3)
    * 
    * Allows Admins to publish templates to the organization.
    * Validates templates before publishing (non-overridable).
    * Logs all publishing actions to audit logs.
    * 
    * **State**: Per org (template publishing status)
    * **Undo**: Not applicable (use version rollback)
    * 
    * @see /Guidelines.md - Admin authority model
    * @see /src/app/admin/audit-logs/ - Audit logging
    */
   ```

---

**Next Steps**: Deferred until Admin features are designed and Template Editor is production-ready.
