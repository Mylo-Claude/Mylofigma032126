# Refactoring Migration Guide

**Status**: Complete (Phases 2-4 of 7-phase plan)  
**Date**: March 8, 2026  
**Breaking Changes**: None

---

## Overview

This document explains the codebase reorganization completed in Steps 2.1 through 4.3 of the refactoring plan. The goal was to organize components by user role to enforce governance boundaries and improve maintainability.

**Key Principle**: The directory structure now mirrors Mylo's governance model—Contributors, Template Editors, and Admins have distinct capabilities that must not blur.

---

## What Changed

### 1. Preview Components Extracted (Steps 2.1-2.3)

**Before**:
```
/src/app/
  PreviewPanel.tsx
  PreviewToolbar.tsx
  PaginatedDocumentRenderer.tsx
  usePreviewZoom.ts
  usePageTracking.ts
```

**After**:
```
/src/app/contributor/preview/
  PreviewPanel.tsx
  PreviewToolbar.tsx
  PaginatedDocumentRenderer.tsx
  hooks/
    usePreviewZoom.ts
    usePageTracking.ts
  README.md
```

**Why**: Preview is a Contributor-facing surface. It renders template-governed output but doesn't grant Contributors control over Preview styling. Grouping Preview components together makes this boundary explicit.

**Governance Alignment**:
- Preview is authoritative for pagination (not Editor)
- Contributors select templates but don't author them
- Zoom and navigation are per-document view state

---

### 2. Editor Components Extracted (Steps 3.1-3.3)

**Before**:
```
/src/app/
  EditorPanel.tsx
  EditorToolbar.tsx
  (various toolbar components scattered)
```

**After**:
```
/src/app/contributor/editor/
  EditorPanel.tsx
  EditorToolbar.tsx
  components/
    StructureControls.tsx
    FormattingControls.tsx
    ContentControls.tsx
  hooks/
    README.md (placeholder for future hooks)
  README.md
```

**Why**: Editor is a Contributor-facing surface for applying structural markers. The toolbar was reorganized by governance responsibility:
- **StructureControls**: Paragraph-level structure (Body, Headings, Lists, Indent/Outdent)
- **FormattingControls**: Character-level markers (Bold, Italic, Underline, Super/Subscript, Case, Clear)
- **ContentControls**: Content elements (Links)

**Governance Alignment**:
- Contributors apply structure markers (not raw styling)
- Editor uses drafting typography (not brand-accurate)
- Templates control Preview rendering

---

### 3. RoleContext Created (Step 4.1-4.2)

**Before**:
No role management system.

**After**:
```
/src/app/contexts/
  RoleContext.tsx
```

**Why**: Future phases will require role-based UI switching. This context provides infrastructure for:
- Current user role state (contributor | template-editor | admin)
- Role hierarchy enforcement (cumulative permissions)
- Session-scoped role state

**Governance Alignment**:
- Roles remain cumulative and isolated
- Template Editor inherits Contributor capabilities
- Admin inherits Template Editor capabilities

---

### 4. Documentation Added (Step 5.1-5.2)

**New Files**:
- `/README.md`: Top-level project documentation
- `/src/app/contributor/preview/README.md`: Preview panel overview
- `/src/app/contributor/editor/README.md`: Editor panel overview
- `/src/app/template-editor/README.md`: Placeholder for future phase
- `/src/app/admin/README.md`: Placeholder for future phase

**Enhanced Files**:
All components now have JSDoc headers documenting:
- Governance alignment
- Responsibilities
- Role boundaries
- State persistence model
- References to governance rules

---

## Before/After Structure Comparison

### Before (Phase 1)

```
/src/app/
├── App.tsx
├── PreviewPanel.tsx
├── PreviewToolbar.tsx
├── PaginatedDocumentRenderer.tsx
├── EditorPanel.tsx
├── EditorToolbar.tsx
├── usePreviewZoom.ts
├── usePageTracking.ts
├── components/
│   ├── ui/ (ShadCN)
│   └── figma/
├── mylo/
│   ├── schema.ts
│   ├── keymap.ts
│   └── template.ts
└── services/
    ├── pagination.ts
    └── serializer.ts
```

### After (Phase 4)

```
/src/app/
├── App.tsx
├── contributor/
│   ├── editor/
│   │   ├── EditorPanel.tsx
│   │   ├── EditorToolbar.tsx
│   │   ├── components/
│   │   │   ├── StructureControls.tsx
│   │   │   ├── FormattingControls.tsx
│   │   │   └── ContentControls.tsx
│   │   ├── hooks/
│   │   │   └── README.md
│   │   └── README.md
│   └── preview/
│       ├── PreviewPanel.tsx
│       ├── PreviewToolbar.tsx
│       ├── PaginatedDocumentRenderer.tsx
│       ├── hooks/
│       │   ├── usePreviewZoom.ts
│       │   └── usePageTracking.ts
│       └── README.md
├── template-editor/
│   └── README.md (placeholder)
├── admin/
│   └── README.md (placeholder)
├── contexts/
│   └── RoleContext.tsx
├── components/
│   ├── ui/ (ShadCN)
│   └── figma/
├── mylo/
│   ├── schema.ts
│   ├── keymap.ts
│   └── template.ts
└── services/
    ├── pagination.ts
    └── serializer.ts
```

---

## Import Path Changes

### Components Using Preview

**Before**:
```tsx
import { PreviewPanel } from './PreviewPanel';
import { PreviewToolbar } from './PreviewToolbar';
```

**After**:
```tsx
import { PreviewPanel } from './contributor/preview/PreviewPanel';
import { PreviewToolbar } from './contributor/preview/PreviewToolbar';
```

### Components Using Editor

**Before**:
```tsx
import { EditorPanel } from './EditorPanel';
```

**After**:
```tsx
import { EditorPanel } from './contributor/editor/EditorPanel';
```

### Toolbar Components

**Before**:
Individual toolbar components were in `/src/app/` or scattered.

**After**:
```tsx
// Inside EditorToolbar.tsx
import { StructureControls } from './components/StructureControls';
import { FormattingControls } from './components/FormattingControls';
import { ContentControls } from './components/ContentControls';
```

---

## Breaking Changes

**None**. All changes are internal reorganization. The public API (if any) remains unchanged.

**Verification**:
- App.tsx correctly imports from new paths
- All components compile without errors
- Application functions identically to pre-refactoring state

---

## Governance Benefits

### 1. **Role Boundary Enforcement**

The directory structure now enforces governance rules:
- Contributor components cannot access Template Editor logic (separate directories)
- Template Editor components will inherit Contributor capabilities (via shared imports)
- Admin components will inherit both (via shared imports)

### 2. **Clear Responsibility Assignment**

Each component has a single governance responsibility:
- `StructureControls.tsx`: Paragraph structure markers only
- `FormattingControls.tsx`: Character markers only
- `ContentControls.tsx`: Content elements only
- `PreviewPanel.tsx`: Template-governed rendering only

### 3. **State Model Clarity**

Documentation now explicitly identifies state persistence:
- **Document content state**: Structure markers, text, links (exports)
- **Per-document view state**: Zoom, template selection (does not export)
- **Session state**: Scroll position, undo stack (resets on reload)

### 4. **Future-Proof Architecture**

Role-based directories make it clear where new features belong:
- Template authoring UI → `/template-editor/`
- Template publishing UI → `/admin/`
- Contributor features → `/contributor/`

---

## Migration Checklist

✅ **Phase 2: Preview Extraction**
- [x] Created `/contributor/preview/` directory
- [x] Moved PreviewPanel, PreviewToolbar, PaginatedDocumentRenderer
- [x] Created `/contributor/preview/hooks/` and moved zoom/tracking hooks
- [x] Updated import paths in App.tsx
- [x] Added README.md

✅ **Phase 3: Editor Extraction**
- [x] Created `/contributor/editor/` directory
- [x] Moved EditorPanel, EditorToolbar
- [x] Created `/contributor/editor/components/` and organized toolbar controls
- [x] Created `/contributor/editor/hooks/` placeholder
- [x] Updated import paths in App.tsx
- [x] Added README.md

✅ **Phase 4: Role Context**
- [x] Created `/contexts/RoleContext.tsx`
- [x] Defined role hierarchy (contributor | template-editor | admin)
- [x] Exported RoleProvider and useRole hook

✅ **Phase 5: Documentation**
- [x] Created top-level README.md
- [x] Added JSDoc comments to all components
- [x] Created this migration guide

---

## Next Phases (Deferred)

**Phase 6**: Template Editor scaffolding (not yet implemented)
**Phase 7**: Dead code removal (not yet implemented)

These phases are deferred until Template Editor features are designed and the governance model is further validated.

---

## Questions & Answers

**Q: Why separate `editor/` and `preview/` instead of keeping them together?**  
A: They serve different governance purposes. Editor captures structure intent; Preview enforces template rendering. Separation prevents accidental coupling and makes role boundaries explicit.

**Q: Why organize toolbar by governance responsibility?**  
A: To prevent scope creep. `StructureControls` must never grant character-level styling, and `FormattingControls` must never grant Preview typography control. Separate files enforce this.

**Q: Why create RoleContext now if role switching isn't implemented?**  
A: To establish the infrastructure early. Future Template Editor UI will need role state, and retrofitting it later would be harder.

**Q: Can I add Contributor features outside `/contributor/`?**  
A: No. The governance model requires strict role boundaries. All Contributor-facing features belong in `/contributor/`.

---

## References

- **Refactoring Plan**: `/REFACTORING_PLAN.md`
- **Governance Framework**: `/guidelines/Guidelines.md`
- **Component READMEs**:
  - `/src/app/contributor/preview/README.md`
  - `/src/app/contributor/editor/README.md`
  - `/src/app/template-editor/README.md`
  - `/src/app/admin/README.md`

---

## Conclusion

This refactoring establishes a role-based architecture that mirrors Mylo's governance model. The codebase is now organized to:
1. **Enforce role boundaries** through directory structure
2. **Clarify component responsibilities** through governance-aligned organization
3. **Document state models** explicitly in JSDoc headers
4. **Support future expansion** with Template Editor and Admin scaffolding

**Result**: The codebase is more maintainable, governance-aligned, and ready for future role-based features.
