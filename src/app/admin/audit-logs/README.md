# Audit Logs

**Status**: Placeholder - Not Yet Implemented  
**Role**: Admin  
**Governance Tier**: Admin Controlled

---

## Purpose

This directory will contain components for Admins to view and analyze audit logs tracking all governance-relevant actions across the organization.

**Future Responsibilities**:
- Display comprehensive audit log entries
- Filter and search logs by user, action type, date range
- Export logs for compliance reporting
- Monitor security-relevant events
- Track template publishing and role changes
- Support accountability and forensics

---

## Governance Alignment

**Admin Authority** (from Governance Rules):
- Can access audit logging
- Audit logs support governance enforcement
- Logs are immutable (cannot be edited or deleted)

**Audit Logging Purpose**:
- Accountability: Track who did what and when
- Compliance: Support regulatory requirements
- Security: Monitor suspicious activity
- Forensics: Investigate issues and incidents
- Analytics: Understand usage patterns

---

## What Gets Logged

**Template Actions**:
- Template created (who, when, template name)
- Template edited (who, when, what changed)
- Template published (who, when, template name, version)
- Template unpublished/archived (who, when, reason)
- Template assigned/unassigned (who, when, to whom, template name)
- Template version rollback (who, when, from version, to version)

**User Management Actions**:
- Role assigned/changed (who, when, target user, old role, new role)
- User created/suspended/reactivated (who, when, target user)
- Permission policy changed (who, when, policy name, old/new values)
- Team created/modified (who, when, team name, changes)

**Governance Policy Actions**:
- Org-level policy changed (who, when, policy name, old/new values)
- Feature flag toggled (who, when, feature name, enabled/disabled)
- Template enforcement setting changed (who, when, old/new enforcement)

**Document Actions** (future):
- Document exported (who, when, document title, template used)
- Template switched mid-document (who, when, document title, old/new template)
- Governance violation attempted (who, when, document title, violation type)

**Security Events** (future):
- Failed login attempts
- Unauthorized access attempts
- Suspicious activity patterns

---

## Future Components

Expected components when this feature is implemented:

- **AuditLogs.tsx**: Main audit log viewer dashboard
- **AuditLogTable.tsx**: Paginated, filterable log table
- **AuditLogFilters.tsx**: Filter by user, action type, date range, entity
- **AuditLogDetail.tsx**: Detailed view of single log entry
- **AuditLogExport.tsx**: Export logs for compliance (CSV, JSON)
- **AuditLogSearch.tsx**: Search logs by keywords, user, entity
- **AuditLogTimeline.tsx**: Visual timeline of events for an entity

---

## State Model

**Per Org State**:
- Audit log entries (immutable)
- Log retention policy
- Export history

**Session State**:
- Current filters and search query
- Selected log entry for detail view
- Pagination state

**Does Not Export**:
- Admin UI preferences
- Session filters

---

## Audit Log Entry Schema

**Required Fields**:
```typescript
interface AuditLogEntry {
  id: string;                    // Unique log entry ID
  timestamp: string;             // ISO 8601 timestamp
  actor: {                       // Who performed the action
    userId: string;
    userName: string;
    role: 'contributor' | 'template-editor' | 'admin';
  };
  action: string;                // What action was performed (e.g., "template_published")
  category: 'template' | 'user' | 'policy' | 'document' | 'security';
  target?: {                     // What entity was affected (optional)
    type: 'template' | 'user' | 'document' | 'policy';
    id: string;
    name: string;
  };
  changes?: {                    // What changed (optional)
    field: string;
    oldValue: any;
    newValue: any;
  }[];
  metadata?: Record<string, any>; // Additional context (optional)
  ipAddress?: string;            // Actor IP address (optional, for security)
}
```

**Example Entry**:
```json
{
  "id": "log_001",
  "timestamp": "2026-03-08T14:32:15Z",
  "actor": {
    "userId": "user_123",
    "userName": "Jane Doe",
    "role": "admin"
  },
  "action": "template_published",
  "category": "template",
  "target": {
    "type": "template",
    "id": "template_456",
    "name": "Legal Contract v2.0"
  },
  "changes": [
    {
      "field": "status",
      "oldValue": "draft",
      "newValue": "published"
    },
    {
      "field": "version",
      "oldValue": "1.9",
      "newValue": "2.0"
    }
  ],
  "metadata": {
    "publishNote": "Updated heading styles per brand guidelines"
  }
}
```

---

## Filtering and Search

**Filter Dimensions**:
- **Date Range**: Last 7 days, 30 days, 90 days, custom range
- **Actor**: Specific user or role
- **Action Type**: Template actions, user actions, policy changes, etc.
- **Category**: Template, user, policy, document, security
- **Target Entity**: Specific template, user, or document

**Search**:
- Full-text search across action descriptions, actor names, target names
- Keyword search in metadata fields
- Support for partial matches

**Sorting**:
- Default: Most recent first
- Sort by actor, action type, target entity
- Reverse chronological and chronological

---

## Retention and Export

**Retention Policy** (future design):
- Default: Keep logs indefinitely
- Configurable: 1 year, 3 years, 7 years (compliance requirements)
- Archived logs moved to cold storage
- Cannot delete logs (immutability guarantee)

**Export Formats**:
- CSV: For spreadsheet analysis
- JSON: For programmatic processing
- PDF: For compliance reports (formatted, read-only)

**Export Use Cases**:
- Compliance audits (e.g., SOC 2, ISO 27001)
- Incident investigation
- Usage analytics
- Legal discovery

---

## References

- **Governance**: `/Guidelines.md` - Audit logging requirements
- **Role Context**: `/src/app/contexts/RoleContext.tsx`
- **Template Management**: `/src/app/admin/template-management/README.md`
- **User Management**: `/src/app/admin/user-management/README.md`

---

## Implementation Notes

When implementing:

1. **Immutability Guarantee**
   - Audit logs must be append-only
   - No edit or delete operations
   - Use backend validation to enforce immutability
   - Consider write-once storage or blockchain for high-security environments

2. **Performance Considerations**
   - Audit logs grow indefinitely
   - Use pagination (default 50 entries per page)
   - Index on timestamp, actor, action, category
   - Consider separate database or service for logs

3. **Use ShadCN Components**
   - Table with sorting and pagination
   - DateRangePicker for date filters
   - Select for category/action filters
   - Dialog for log detail view
   - Button for export

4. **Real-Time Updates** (optional)
   - Use WebSockets or polling for live log updates
   - Show notification badge when new logs arrive
   - Auto-refresh option

5. **Document JSDoc Headers**
   ```tsx
   /**
    * AuditLogs
    * 
    * **Role**: Admin
    * **Governance**: Admin Controlled (Tier 3)
    * 
    * Displays immutable audit logs for all governance-relevant actions.
    * Supports filtering, search, and export for compliance.
    * Logs cannot be edited or deleted (immutability guarantee).
    * 
    * **State**: Per org (audit log entries, immutable)
    * **Undo**: Not applicable (logs are immutable)
    * 
    * @see /Guidelines.md - Audit logging requirements
    * @see /src/app/admin/template-management/ - Template actions logging
    */
   ```

---

## Security and Privacy

**Access Control**:
- Only Admins can view audit logs
- Backend validates role on every request
- Sensitive fields (e.g., IP addresses) may be masked based on policy

**Data Retention**:
- Comply with GDPR, CCPA, and other privacy regulations
- Support "right to be forgotten" with user pseudonymization (keep logs, anonymize user data)
- Retain logs per org policy and legal requirements

**Tamper Detection** (future):
- Cryptographic signatures on log entries
- Blockchain or Merkle tree for tamper-proof logs
- Detect and alert on log tampering attempts

---

## Analytics and Insights (Future)

**Derived Metrics**:
- Most active Admins
- Most frequently edited templates
- Role change frequency
- Template publishing velocity
- Policy change rate

**Visualizations**:
- Timeline view of actions
- Heatmap of activity by hour/day
- Pie chart of actions by category
- Bar chart of top actors

**Alerting** (future):
- Notify on suspicious patterns (e.g., bulk role changes)
- Alert on policy violations
- Warn on unusual activity (e.g., weekend template publishes)

---

**Next Steps**: Deferred until Admin features are designed and logging infrastructure is in place.
