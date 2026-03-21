# Style Editor

**Status**: Placeholder - Not Yet Implemented  
**Role**: Template Editor  
**Governance Tier**: Template Controlled

---

## Purpose

This directory will contain components for Template Editors to author and configure template styles.

**Future Responsibilities**:
- Define paragraph styles (Body, Headings, Lists)
- Configure character marker rendering rules
- Set typography (font family, size, weight, color)
- Configure advanced CSS properties via `advanced?: React.CSSProperties`
- Manage style inheritance from base roots
- Define template-governed option tokens (emphasis colors, highlights)

---

## Governance Alignment

**Template Editor Authority** (from Governance Rules):
- Can define template styles and mappings
- Can define allowed option tokens
- Can define list marker systems and numbering schemes
- Can define link rendering rules
- Can define metadata injection rules

**Cannot**:
- Grant Contributors raw styling control in Preview
- Override hard constraints (e.g., strikethrough exclusion)
- Break paragraph spacing governance model

---

## Future Components

Expected components when this feature is implemented:

- **StyleEditor.tsx**: Main style authoring interface
- **StylePanel.tsx**: Style configuration panel
- **FontSelector.tsx**: Font family selection with system/custom fonts
- **TypographyControls.tsx**: Font size, weight, line height, letter spacing
- **AdvancedCSSEditor.tsx**: Advanced CSS properties editor
- **StylePreview.tsx**: Live preview of style changes
- **InheritanceVisualizer.tsx**: Show style inheritance from base roots

---

## State Model

**Per Template State**:
- Style definitions and configurations
- Allowed option tokens
- Advanced CSS properties

**Session State**:
- Style editor UI state (e.g., selected style, expanded panels)
- Unsaved changes indicator

**Does Not Export**:
- Template Editor UI preferences

---

## Fixed Style Hierarchy Integration

This editor must enforce the fixed style hierarchy:

**Fixed Roots** (immutable):
- Body Base → Body
- Headings Base → Heading 1, Heading 2, Heading 3
- Lists Base → Bulleted List, Numbered List

**Style Editor Constraints**:
- Cannot create, delete, rename, or disable roots
- Cannot rename Body, Heading 1-3, Bulleted List, Numbered List
- Must support future expansion to Heading 4-6
- Must preserve backward compatibility

---

## References

- **Governance**: `/Guidelines.md` - Template Editor authority model
- **Template Types**: `/src/app/mylo/template.ts`
- **Hierarchy System**: Fixed style hierarchy rules in governance
- **Role Context**: `/src/app/contexts/RoleContext.tsx`

---

## Implementation Notes

When implementing:

1. **Check existing template types** in `/src/app/mylo/template.ts` for current structure
2. **Use ShadCN components** for UI consistency (Select, Input, Popover, etc.)
3. **Respect size variants**: Use `size="sm"` for toolbar controls
4. **Document governance alignment** in JSDoc headers
5. **Validate against fixed hierarchy** constraints before saving
6. **Provide clear error messages** when constraints are violated

---

**Next Steps**: Deferred until Template Editor features are designed and governance model is validated.
