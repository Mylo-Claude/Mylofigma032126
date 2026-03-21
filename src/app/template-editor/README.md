# Template Editor Role

**Status**: Placeholder - Not Yet Implemented  
**Role**: Template Editor (inherits Contributor)  
**Governance Tier**: Template Controlled

---

## Purpose

This directory will contain all Template Editor-facing features and components. Template Editors have authority to define template styles, configure hierarchy, and govern Preview rendering—but cannot grant Contributors raw styling control.

**Future Role Responsibilities**:
- Author and configure template styles
- Define allowed option tokens (emphasis colors, highlights)
- Configure list marker systems and numbering schemes
- Define link rendering rules
- Manage fixed style hierarchy
- Configure metadata injection

**Role Inheritance**:
Template Editors inherit all Contributor capabilities. They can:
- Author content in Editor
- Apply structure markers
- Use Preview with template selection
- Access all Contributor features

---

## Directory Structure

```
/src/app/template-editor/
├── style-editor/          # Style authoring and configuration
│   └── README.md
├── hierarchy-editor/      # Fixed hierarchy management
│   └── README.md
└── README.md             # This file
```

**Future Directories** (not yet created):
- `template-manager/`: Template CRUD, publishing, metadata
- `option-tokens/`: Configure allowed emphasis/highlight tokens
- `list-config/`: List marker systems and numbering schemes
- `link-config/`: Link rendering rules
- `shared/`: Shared Template Editor utilities and components

---

## Governance Alignment

### Template Editor Authority (from Governance Rules)

**Can**:
- Define template styles and mappings
- Define allowed option tokens
- Define list marker systems and numbering schemes
- Define link rendering rules
- Define metadata injection rules

**Cannot**:
- Grant Contributors raw styling control in Preview
- Create custom paragraph or character styles outside fixed hierarchy
- Override hard constraints (e.g., no strikethrough)
- Violate mandatory root enforcement

### Fixed Style Hierarchy Constraints

**Fixed Roots** (immutable):
- Body Base → Body
- Headings Base → Heading 1, Heading 2, Heading 3
- Lists Base → Bulleted List, Numbered List

**Naming Enforcement**:
- Body must be named exactly "Body"
- Heading 1-3 cannot be renamed
- Bulleted List and Numbered List cannot be renamed
- Roots cannot be created, deleted, renamed, or disabled

**Future Expansion**:
- System must support Heading 4-6
- New levels are system-defined and non-renamable
- Backward compatibility required

---

## Template Governed Contributor Options

From Governance "Template governed contributor options layer":

### Purpose
Convert common formatting intent into approved, template-governed options without weakening enforcement.

**This is not free formatting. It is a constrained option set controlled by the Template Editor.**

### Color and Highlight Behavior

**Editor Freedom**:
- Contributors may choose any text color or highlight color in the Editor
- These choices are intent signals, not authoritative styling

**Preview Governance**:
- Preview does not render arbitrary colors
- Preview renders only emphasis color tokens and highlight tokens explicitly enabled by the Template Editor for the active template
- If the template enables no emphasis tokens, Preview ignores color intent

**Option Surfacing**:
- If exactly one enabled option matches the intent, Preview auto-applies it
- If two or more options exist, Preview presents options for selection

**Template Editor Responsibility**:
- Define which color/highlight tokens are available
- Configure how tokens render in Preview
- Control token availability per template

---

## State Model

**Per Template State**:
- Template metadata (name, description, version)
- Style definitions and inheritance
- Allowed option tokens
- List marker configurations
- Link rendering rules
- Advanced CSS properties

**Per Org State**:
- Template publishing and assignment
- Governance policies

**Session State**:
- Template Editor UI state
- Unsaved changes
- Validation errors

**Does Not Export**:
- Template Editor UI preferences
- Preview state within Template Editor role

---

## Role Context Integration

Template Editor role is managed via `RoleContext`:

```tsx
import { useRole } from '../contexts/RoleContext';

function TemplateEditorFeature() {
  const { role, setRole } = useRole();
  
  // Template Editors inherit Contributor capabilities
  const canEditContent = role === 'contributor' || role === 'template-editor' || role === 'admin';
  const canEditTemplates = role === 'template-editor' || role === 'admin';
  
  return (
    // Template Editor UI
  );
}
```

**Role Hierarchy**:
- Contributor: Base capabilities
- Template Editor: Inherits Contributor + template authoring
- Admin: Inherits Template Editor + publishing/governance

---

## Validation Requirements

Before template save/publish, must validate:

- [x] All required roots and children exist
- [x] No naming violations (Body, Heading 1-3, Bulleted/Numbered List)
- [x] Style inheritance is valid (no circular dependencies)
- [x] Advanced CSS does not violate hard constraints
- [x] Allowed option tokens are properly defined
- [x] List marker systems are valid

**On Validation Failure**:
- Block save/publish
- Display clear error messages
- Suggest fixes where possible

---

## Advanced CSS Properties

Template Editors have access to `advanced?: React.CSSProperties` on all template interfaces:

```typescript
interface BodyStyle {
  fontFamily: string;
  fontSize: string;
  lineHeight: string;
  color: string;
  marginBottom?: string;
  advanced?: React.CSSProperties; // Full CSS control
}
```

**Governance Rule**:
Advanced properties provide flexibility within the governance framework. Template Editors can use any valid CSS, but must not:
- Break accessibility (e.g., contrast ratios)
- Violate hard constraints (e.g., no strikethrough via text-decoration)
- Create hybrid formatting authority

---

## Implementation Guidelines

When implementing Template Editor features:

1. **Check Role Context First**
   ```tsx
   const { role } = useRole();
   if (role !== 'template-editor' && role !== 'admin') {
     return <AccessDenied />;
   }
   ```

2. **Use ShadCN Components**
   - Consistent with Contributor UI
   - Use `size="sm"` for toolbar controls
   - Share theme tokens

3. **Validate Against Governance**
   - Every change must pass validation
   - Document which governance rule is enforced
   - Provide clear error messages

4. **Document JSDoc Headers**
   ```tsx
   /**
    * StyleEditor
    * 
    * **Role**: Template Editor
    * **Governance**: Template Controlled (Tier 3)
    * 
    * Allows Template Editors to define template styles within fixed hierarchy.
    * Cannot grant Contributors raw Preview styling control.
    * 
    * **State**: Per template (exports with template)
    * **Undo**: Grouped (all style changes in one edit session)
    * 
    * @see /Guidelines.md - Template Editor authority model
    * @see /src/app/mylo/template.ts - Template type definitions
    */
   ```

5. **Test Role Boundaries**
   - Ensure Contributors cannot access Template Editor UI
   - Verify Template Editors inherit Contributor features
   - Confirm Admins inherit Template Editor features

---

## References

- **Governance**: `/Guidelines.md` - Template Editor authority and constraints
- **Template Types**: `/src/app/mylo/template.ts`
- **Role Context**: `/src/app/contexts/RoleContext.tsx`
- **Style Editor**: `/src/app/template-editor/style-editor/README.md`
- **Hierarchy Editor**: `/src/app/template-editor/hierarchy-editor/README.md`

---

## Next Steps

**Deferred Until**:
1. Template Editor features are designed
2. Governance model is further validated
3. Contributor role is production-ready

**When Ready**:
1. Implement Template Manager (CRUD, metadata)
2. Implement Style Editor (style authoring)
3. Implement Hierarchy Editor (visualization and validation)
4. Implement Option Tokens configuration
5. Implement List Configuration
6. Implement Link Configuration
7. Add Template Editor role switching in UI
8. Create Template Editor-specific documentation

---

**Current Status**: Scaffolding complete. Ready for future development when Template Editor features are designed.