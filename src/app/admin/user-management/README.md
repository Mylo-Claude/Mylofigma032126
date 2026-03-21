# User Management

**Status**: Placeholder - Not Yet Implemented  
**Role**: Admin  
**Governance Tier**: Admin Controlled

---

## Purpose

This directory will contain components for Admins to manage users, roles, and permissions across the organization.

**Future Responsibilities**:
- Manage user accounts and roles
- Assign roles (Contributor, Template Editor, Admin)
- Configure org-level permissions
- Manage teams and groups
- Control feature access and governance policies
- Monitor user activity

---

## Governance Alignment

**Admin Authority** (from Governance Rules):
- Can configure org-level permissions
- Can enforce governance policies
- Can assign user roles

**Role Hierarchy** (from Governance):
- Contributor: Base capabilities
- Template Editor: Inherits Contributor + template authoring
- Admin: Inherits Template Editor + publishing/governance

**Role Assignment Rules**:
- Admins can assign any role to any user
- Role changes take effect immediately (session-scoped)
- Role changes are logged to audit logs
- Users cannot self-assign higher roles

---

## Future Components

Expected components when this feature is implemented:

- **UserManagement.tsx**: Main user management dashboard
- **UserList.tsx**: List all users with roles and status
- **UserEditor.tsx**: Edit user details and role assignment
- **RoleAssignment.tsx**: Bulk role assignment interface
- **TeamManagement.tsx**: Create and manage teams/groups
- **PermissionConfig.tsx**: Configure org-level permissions
- **UserActivityMonitor.tsx**: View user activity and engagement

---

## State Model

**Per Org State**:
- User accounts and roles
- Team/group definitions
- Org-level permission policies
- Feature flags and governance settings

**Per User State**:
- Assigned role (contributor | template-editor | admin)
- Team memberships
- Custom permissions (if applicable)
- Account status (active | suspended | archived)

**Session State**:
- User management UI state
- Filters and search queries

**Does Not Export**:
- Admin UI preferences
- Session filters

---

## User Role Assignment Model

**Role Types**:
1. **Contributor**
   - Can author content and use Editor/Preview
   - Can apply structure markers
   - Cannot access Template Editor or Admin features

2. **Template Editor**
   - Inherits all Contributor capabilities
   - Can create and edit templates
   - Can configure hierarchy and styles
   - Cannot publish templates (requires Admin approval)

3. **Admin**
   - Inherits all Template Editor capabilities
   - Can publish and assign templates
   - Can manage users and roles
   - Can access audit logs and analytics

**Default Role**:
- New users default to Contributor role
- Admins can configure org-wide default role

---

## Permission Policies (Future Design)

**Org-Level Permissions** (future):
- Allow/disallow template switching mid-document
- Require specific templates for specific document types
- Lock formatting options for compliance
- Enable/disable features (e.g., manual page breaks, advanced formatting)

**Team-Based Permissions** (future):
- Assign templates by team
- Restrict template creation to specific teams
- Configure team-level defaults

**Custom Permissions** (deferred):
- Granular permission overrides per user
- Exception-based access control
- Requires permission matrix design

---

## User Activity Monitoring

**Metrics to Track** (future):
- Active users per role
- Template Editor activity (templates created/edited)
- Document creation rate
- Feature adoption (e.g., % using lists, page breaks)

**Use Cases**:
- Identify inactive accounts
- Understand role distribution
- Guide training and onboarding
- Report to stakeholders

---

## Governance Policy Configuration

**Enforceable Policies** (future design):

1. **Template Enforcement**
   - Require specific templates for all documents
   - Prevent template switching after creation
   - Lock template selection for compliance

2. **Formatting Restrictions**
   - Disable manual page breaks
   - Restrict link protocols (e.g., only https)
   - Limit heading levels

3. **Content Policies**
   - Require document titles (block save if untitled)
   - Enforce metadata completion
   - Require spell check before export

**Policy Application**:
- Policies apply org-wide or per team
- Policies are enforced in Editor and Preview
- Policy violations block save/export

---

## References

- **Governance**: `/Guidelines.md` - Admin authority model and role hierarchy
- **Role Context**: `/src/app/contexts/RoleContext.tsx`
- **Template Management**: `/src/app/admin/template-management/README.md`
- **Audit Logs**: `/src/app/admin/audit-logs/README.md`

---

## Implementation Notes

When implementing:

1. **Use Role Context**
   ```tsx
   import { useRole } from '../../contexts/RoleContext';
   
   function UserRoleAssignment() {
     const { role } = useRole();
     
     if (role !== 'admin') {
       return <AccessDenied />;
     }
     
     // Admin-only UI
   }
   ```

2. **Validate Role Changes**
   - Cannot demote the last Admin
   - Cannot self-demote
   - Cannot assign roles outside hierarchy
   - Log all role changes to audit logs

3. **Use ShadCN Components**
   - Table for user list with sorting/filtering
   - Dialog for role assignment confirmation
   - Select for role picker
   - Badge for role display

4. **Implement Confirmation Dialogs**
   - Role changes affect user capabilities
   - Use clear language: "Assign Admin role to Jane Doe?"
   - Show role hierarchy and inherited capabilities

5. **Document JSDoc Headers**
   ```tsx
   /**
    * RoleAssignment
    * 
    * **Role**: Admin
    * **Governance**: Admin Controlled (Tier 3)
    * 
    * Allows Admins to assign roles to users within the role hierarchy.
    * Enforces role assignment rules (no self-demotion, preserve last admin).
    * Logs all role changes to audit logs.
    * 
    * **State**: Per org (user role assignments)
    * **Undo**: Not applicable (use audit logs for history)
    * 
    * @see /Guidelines.md - Role hierarchy and admin authority
    * @see /src/app/contexts/RoleContext.tsx - Role management
    */
   ```

---

## Security Considerations

**Access Control**:
- Admin UI must validate role on every request
- Use backend validation (not just frontend checks)
- Prevent privilege escalation

**Audit Logging**:
- Log all user management actions
- Include who performed action, target user, old/new values
- Immutable logs (cannot be edited or deleted)

**Data Privacy**:
- Display only necessary user information
- Mask sensitive data where appropriate
- Comply with privacy regulations

---

**Next Steps**: Deferred until Admin features are designed and role hierarchy is validated.
