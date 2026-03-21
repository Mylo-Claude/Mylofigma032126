# Admin Role

**Status**: Placeholder - Not Yet Implemented  
**Role**: Admin (inherits Template Editor and Contributor)  
**Governance Tier**: Admin Controlled

---

## Purpose

This directory will contain all Admin-facing features and components. Admins have authority to publish templates, manage users, configure governance policies, and access audit logs—the highest level of control in Mylo.

**Future Role Responsibilities**:
- Publish and assign templates
- Manage user accounts and roles
- Configure org-level permissions and governance policies
- Access audit logs for accountability and compliance
- Monitor usage and analytics
- Enforce governance across the organization

**Role Inheritance**:
Admins inherit all Template Editor and Contributor capabilities. They can:
- Author content in Editor (Contributor)
- Apply structure markers (Contributor)
- Use Preview with template selection (Contributor)
- Create and edit templates (Template Editor)
- Configure styles and hierarchy (Template Editor)
- Access all Contributor and Template Editor features

---

## Directory Structure

```
/src/app/admin/
├── template-management/   # Publish, assign, version templates
│   └── README.md
├── user-management/       # Manage users, roles, permissions
│   └── README.md
├── audit-logs/            # View and export audit logs
│   └── README.md
└── README.md             # This file
```

**Future Directories** (not yet created):
- `governance-config/`: Configure org-level governance policies
- `analytics/`: Usage analytics and reporting
- `org-settings/`: Organization-wide settings and preferences
- `shared/`: Shared Admin utilities and components

---

## Governance Alignment

### Admin Authority (from Governance Rules)

**Can**:
- Publish and assign templates
- Enforce governance policies
- Configure org-level permissions
- Access audit logging

**Cannot**:
- Override template validation failures (governance is non-negotiable)
- Violate hard constraints (e.g., no strikethrough)
- Grant capabilities outside role hierarchy

### Role Hierarchy

**Contributor** (Base):
- Author content
- Apply structure markers
- Use Editor and Preview

**Template Editor** (Inherits Contributor):
- Create and edit templates
- Configure styles and hierarchy
- Define allowed option tokens

**Admin** (Inherits Template Editor):
- Publish and assign templates
- Manage users and roles
- Access audit logs
- Configure governance policies

**Cumulative Permissions**:
- Admins can do everything Template Editors and Contributors can do
- Template Editors can do everything Contributors can do
- No role can exceed Admin capabilities

---

## Admin Capabilities by Area

### 1. Template Management

**Publish Templates**:
- Review templates created by Template Editors
- Validate templates against governance rules
- Publish templates to org (make available to Contributors)
- Unpublish or archive templates

**Assign Templates**:
- Assign templates to users, teams, or projects
- Set default templates for new documents
- Configure template enforcement (recommended | required | locked)

**Version Templates**:
- Manage template version history
- Rollback to previous versions
- Track template changes over time

**See**: `/src/app/admin/template-management/README.md`

---

### 2. User Management

**Manage Users**:
- Create and suspend user accounts
- Assign roles (Contributor, Template Editor, Admin)
- Manage teams and groups

**Configure Permissions**:
- Set org-level permission policies
- Configure feature access and restrictions
- Define team-based permissions

**Monitor Activity**:
- View user activity and engagement
- Identify inactive accounts
- Understand role distribution

**See**: `/src/app/admin/user-management/README.md`

---

### 3. Audit Logs

**View Logs**:
- Access comprehensive, immutable audit logs
- Filter and search logs by user, action, date range
- View detailed log entries with full context

**Export Logs**:
- Export logs for compliance reporting (CSV, JSON, PDF)
- Support regulatory requirements (SOC 2, ISO 27001, GDPR)

**Monitor Events**:
- Track template publishing and changes
- Monitor role assignments and user management
- Detect security-relevant events

**See**: `/src/app/admin/audit-logs/README.md`

---

### 4. Governance Configuration (Future)

**Policy Enforcement**:
- Require specific templates for all documents
- Prevent template switching after creation
- Lock formatting options for compliance

**Feature Flags**:
- Enable/disable features org-wide (e.g., manual page breaks, advanced formatting)
- Configure default behaviors

**Compliance Settings**:
- Require document titles before save
- Enforce metadata completion
- Require spell check before export

**See**: Future `/src/app/admin/governance-config/README.md`

---

### 5. Analytics and Reporting (Future)

**Usage Metrics**:
- Active users per role
- Template adoption and usage
- Document creation rate
- Feature adoption

**Template Analytics**:
- Most popular templates
- Template switching patterns
- Template version usage

**Compliance Reporting**:
- Export audit logs for audits
- Generate compliance reports
- Track policy violations

**See**: Future `/src/app/admin/analytics/README.md`

---

## State Model

**Per Org State**:
- Published templates and assignments
- User accounts and roles
- Governance policies and feature flags
- Audit logs (immutable)
- Analytics and usage data

**Session State**:
- Admin UI state (filters, selections, expanded panels)
- Unsaved changes (e.g., draft policy configurations)

**Does Not Export**:
- Admin UI preferences
- Session state

---

## Role Context Integration

Admin role is managed via `RoleContext`:

```tsx
import { useRole } from '../contexts/RoleContext';

function AdminFeature() {
  const { role, setRole } = useRole();
  
  // Admins inherit all Template Editor and Contributor capabilities
  const canEditContent = role === 'contributor' || role === 'template-editor' || role === 'admin';
  const canEditTemplates = role === 'template-editor' || role === 'admin';
  const canPublishTemplates = role === 'admin';
  const canManageUsers = role === 'admin';
  const canAccessAuditLogs = role === 'admin';
  
  if (role !== 'admin') {
    return <AccessDenied />;
  }
  
  return (
    // Admin-only UI
  );
}
```

**Role Hierarchy Enforcement**:
- Check role on every Admin feature access
- Validate role on backend (not just frontend)
- Prevent privilege escalation

---

## Governance Policy Enforcement

**Hard Constraints** (from Governance):
1. Editor and Preview remain decoupled
2. Template rules override Contributor typography in Preview
3. Roles remain cumulative and isolated
4. Governance is enforceable, not advisory
5. No hybrid formatting authority
6. Template governed options must be explicitly enabled by Template Editor
7. Options must map to structural or semantic markers, not raw styling
8. Contributor may use arbitrary color/highlight in Editor, but Preview renders only template enabled tokens
9. If exactly one allowed option exists, Preview auto-applies it
10. Every design must identify data impact, permission impact, and rendering impact

**Admin Responsibility**:
- Enforce these constraints org-wide
- Configure policies that strengthen (not weaken) governance
- Monitor compliance via audit logs

---

## Implementation Guidelines

When implementing Admin features:

1. **Check Role Context First**
   ```tsx
   const { role } = useRole();
   if (role !== 'admin') {
     return <AccessDenied />;
   }
   ```

2. **Use ShadCN Components**
   - Consistent with Contributor and Template Editor UI
   - Tables, Dialogs, Select, Button, etc.
   - Use `size="sm"` for toolbar controls

3. **Validate Against Governance**
   - Admins cannot override template validation
   - Admins cannot violate hard constraints
   - Provide clear error messages when constraints are violated

4. **Log All Admin Actions**
   - Every template publish, role assignment, policy change must be logged
   - Include who, what, when, old/new values
   - Logs are immutable (cannot be edited or deleted)

5. **Implement Confirmation Dialogs**
   - Admin actions affect all users
   - Use clear, non-technical language
   - Show impact of action (e.g., "Publishing this template will make it available to 150 users")

6. **Document JSDoc Headers**
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

## Validation Requirements

Admin actions must validate before execution:

**Template Publishing**:
- [x] Template passes all hierarchy validation
- [x] All required roots and children exist
- [x] No naming violations
- [x] Advanced CSS does not violate hard constraints
- [x] Template metadata is complete

**Role Assignment**:
- [x] Cannot demote the last Admin
- [x] Cannot self-demote
- [x] Cannot assign roles outside hierarchy
- [x] Target user exists and is active

**Policy Configuration**:
- [x] Policy does not violate hard constraints
- [x] Policy does not weaken governance
- [x] Policy is enforceable (testable)

**On Validation Failure**:
- Block action
- Display clear error message
- Suggest fixes where possible

---

## Security and Compliance

**Access Control**:
- Admin UI must validate role on every request
- Use backend validation (not just frontend checks)
- Prevent privilege escalation
- Log all access attempts (successful and failed)

**Audit Logging**:
- Log all Admin actions (template publishing, role changes, policy updates)
- Logs are immutable (append-only)
- Support compliance requirements (SOC 2, ISO 27001, GDPR)

**Data Privacy**:
- Display only necessary user information
- Mask sensitive data where appropriate
- Comply with privacy regulations
- Support "right to be forgotten" with user pseudonymization

---

## References

- **Governance**: `/Guidelines.md` - Admin authority model and constraints
- **Role Context**: `/src/app/contexts/RoleContext.tsx`
- **Template Editor**: `/src/app/template-editor/README.md`
- **Template Management**: `/src/app/admin/template-management/README.md`
- **User Management**: `/src/app/admin/user-management/README.md`
- **Audit Logs**: `/src/app/admin/audit-logs/README.md`

---

## Next Steps

**Deferred Until**:
1. Admin features are designed
2. Template Editor is production-ready
3. Governance model is validated
4. Audit logging infrastructure is in place

**When Ready**:
1. Implement Template Management (publish, assign, version)
2. Implement User Management (roles, permissions, teams)
3. Implement Audit Logs (view, filter, export)
4. Implement Governance Configuration (policies, feature flags)
5. Implement Analytics and Reporting
6. Add Admin role switching in UI
7. Create Admin-specific documentation and training

---

**Current Status**: Scaffolding complete. Ready for future development when Admin features are designed.