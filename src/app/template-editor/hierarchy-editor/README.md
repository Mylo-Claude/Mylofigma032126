# Hierarchy Editor

**Status**: Placeholder - Not Yet Implemented  
**Role**: Template Editor  
**Governance Tier**: Template Controlled

---

## Purpose

This directory will contain components for Template Editors to configure the fixed style hierarchy and inheritance relationships.

**Future Responsibilities**:
- Visualize fixed style hierarchy tree
- Configure style inheritance from base roots
- Manage paragraph spacing governance
- Define global template rules vs. style-level overrides
- Display mandatory root enforcement

---

## Governance Alignment

**Fixed Style Hierarchy Rules** (from Governance):

### Fixed Multiple Roots
Roots are fixed and immutable:
- Body Base
- Headings Base
- Lists Base

Roots cannot be created, deleted, renamed, or disabled.

### Mandatory Root Enforcement
Every template must contain:
- Body Base with child: Body
- Headings Base with children: Heading 1, Heading 2, Heading 3
- Lists Base with children: Bulleted List, Numbered List

Templates cannot be saved or published if required roots or required children are missing.

### Naming Enforcement
- Body must be named exactly "Body" and cannot be renamed or deleted
- Heading 1, Heading 2, Heading 3 cannot be renamed or deleted
- Bulleted List and Numbered List cannot be renamed or deleted

### Heading Expansion Policy
- System must support future expansion to Heading 4-6
- New heading levels must be system-defined and non-renamable
- Expansion must preserve backward compatibility

---

## Paragraph Spacing Governance Model

**Conflict Resolution Order** (from Governance):

1. Resolve style inheritance
2. Apply style-level properties
3. Apply global template rules only where style does not define the property
4. Render final output

**Hierarchy Editor Must**:
- Visualize this resolution order
- Prevent configurations that violate it
- Show which properties are inherited vs. overridden

---

## Future Components

Expected components when this feature is implemented:

- **HierarchyEditor.tsx**: Main hierarchy visualization and editing interface
- **HierarchyTree.tsx**: Visual tree showing roots and children
- **InheritancePanel.tsx**: Configure inheritance relationships
- **SpacingGovernance.tsx**: Manage paragraph spacing conflict resolution
- **MandatoryEnforcement.tsx**: Show required roots and validate template
- **ExpansionPlanner.tsx**: Preview future Heading 4-6 support

---

## State Model

**Per Template State**:
- Style hierarchy configuration
- Inheritance relationships
- Spacing governance rules

**Session State**:
- Expanded/collapsed tree nodes
- Selected style for editing

**Validation State**:
- Missing required roots or children
- Naming violations
- Inheritance conflicts

---

## Validation Requirements

Before template save/publish, Hierarchy Editor must validate:

- [x] All three base roots exist (Body Base, Headings Base, Lists Base)
- [x] Body Base has exactly one child named "Body"
- [x] Headings Base has children: Heading 1, Heading 2, Heading 3
- [x] Lists Base has children: Bulleted List, Numbered List
- [x] No root renaming or deletion
- [x] No required child renaming or deletion
- [x] Inheritance relationships are valid (no circular dependencies)
- [x] Spacing governance rules are consistent

**Error Handling**:
- Block save/publish if validation fails
- Provide clear, actionable error messages
- Suggest fixes where possible

---

## List Configuration Integration

**From Governance**:
- Indentation depth is unlimited
- Indentation is controlled via list configuration rules, not typography hierarchy
- Rendering engine computes indentation dynamically

**Hierarchy Editor Must**:
- Separate list marker configuration from hierarchy
- Do not create typography styles per indentation level
- Delegate list marker rendering to template configuration

---

## References

- **Governance**: `/Guidelines.md` - Fixed style hierarchy system
- **Template Types**: `/src/app/mylo/template.ts`
- **Paragraph Spacing**: Governance conflict resolution model
- **Role Context**: `/src/app/contexts/RoleContext.tsx`

---

## Implementation Notes

When implementing:

1. **Start with read-only visualization** of existing hierarchy
2. **Use tree component** from ShadCN or build custom with clear hierarchy
3. **Show inheritance visually** with arrows or indentation
4. **Highlight violations** in red with tooltip explanations
5. **Prevent invalid operations** (e.g., disable rename button for Body)
6. **Validate on every change** before allowing template save
7. **Document all constraints** in error messages and help text

---

## Deferred Items

From governance "Deferred Decisions":

- **Block system and semantic roles**: Template-defined block creation and block behavior configuration remain deferred
- **Widow and orphan control**: Deferred layout controls

These should remain out of scope until explicitly promoted.

---

**Next Steps**: Deferred until Template Editor features are designed and governance model is validated.
