# Mylo - Document Collaboration Platform

A document collaboration platform prototype implementing a governance framework that separates content creation from presentation control.

## Overview

Mylo features:
- **Split-pane interface**: Editor (ProseMirror) and Preview (Paged.js)
- **Role-based governance**: Distinct capabilities for Contributors, Template Editors, and Admins
- **Template-driven rendering**: Preview applies governed styling through templates
- **Advanced CSS control**: Template Editors have unlimited CSS flexibility via `advanced` properties

## Architecture

### Role-Based Organization

The codebase is organized by user role to enforce governance boundaries:

```
/src/app/
├── contributor/         # Contributor role functionality
│   ├── editor/         # Editor panel and controls
│   │   ├── components/ # Toolbar control groups
│   │   └── hooks/      # Editor-specific hooks
│   └── preview/        # Preview panel and rendering
│       └── hooks/      # Preview-specific hooks
├── template-editor/    # Template Editor role (future)
├── admin/              # Admin role (future)
├── contexts/           # Shared contexts (RoleContext)
├── components/         # Shared UI components (ShadCN)
├── mylo/               # Core Mylo schema and keymap
└── services/           # Shared services (pagination, serialization)
```

### Component Responsibility Map

#### Contributor Role

**Editor Panel** (`/contributor/editor/`)
- **EditorPanel.tsx**: Main ProseMirror editor container
- **EditorToolbar.tsx**: Toolbar composition
- **components/**:
  - `FormattingControls.tsx`: Character-level formatting (bold, italic, underline, super/subscript, case transformation, clear formatting)
  - `StructureControls.tsx`: Paragraph structure (body, headings, lists, indent/outdent)
  - `ContentControls.tsx`: Content elements (links)

**Preview Panel** (`/contributor/preview/`)
- **PreviewPanel.tsx**: Template-governed rendering surface
- **PreviewToolbar.tsx**: Zoom and navigation controls
- **PaginatedDocumentRenderer.tsx**: Paged.js integration
- **hooks/**:
  - `usePreviewZoom.ts`: Zoom state management
  - `usePageTracking.ts`: Page navigation tracking

#### Template Editor Role

**Templates** (`/template-editor/`)
- Not yet implemented (future phase)

#### Admin Role

**Administration** (`/admin/`)
- Not yet implemented (future phase)

#### Shared Systems

**Contexts** (`/contexts/`)
- `RoleContext.tsx`: Current user role state

**Core Mylo** (`/mylo/`)
- `schema.ts`: ProseMirror document schema
- `keymap.ts`: Editor keyboard bindings
- `template.ts`: Template interface definitions

**Services** (`/services/`)
- `pagination.ts`: Paged.js pagination service
- `serializer.ts`: Document serialization utilities

**UI Components** (`/components/ui/`)
- ShadCN components with consistent sizing and theming

## Governance Framework

### Core Principles

1. **Editor and Preview are decoupled**: Editor captures structure; Preview governs rendering
2. **Template rules override Contributor typography**: Preview applies template-defined styles
3. **Roles remain cumulative and isolated**: Template Editor inherits Contributor; Admin inherits Template Editor
4. **Governance is enforceable, not advisory**: Rules are validated and enforced

### Authority Boundaries

- **Contributors**: Apply structural markers (headings, lists, bold, italic), author content
- **Template Editors**: Define template styles, mappings, and allowed options
- **Admins**: Publish templates, enforce governance policies, access audit logging

## Development Setup

This project runs in Figma Make environment. No npm commands are available.

### Key Dependencies

- React 18
- ProseMirror (editor)
- Paged.js (pagination)
- Tailwind CSS v4
- ShadCN UI components

### File Editing Guidelines

1. **Use role-based imports**: Import from role directories (`./contributor/editor/`, `./contributor/preview/`)
2. **Maintain governance separation**: Don't blur role boundaries in components
3. **Follow ShadCN patterns**: Use existing UI components with size variants
4. **Respect protected files**: Never modify `/src/app/components/figma/ImageWithFallback.tsx`

## Testing

Testing instructions:
1. Load the application
2. Verify Editor panel (left) shows ProseMirror with toolbar
3. Verify Preview panel (right) shows paginated output
4. Test structural controls: Body, H1-H3, lists, indent/outdent
5. Test formatting controls: bold, italic, underline, super/subscript
6. Test content controls: links
7. Test Preview controls: zoom, page navigation
8. Verify template governance: Preview renders with template-defined typography

## Documentation

- `Guidelines.md`: Full governance framework and collaboration prompt
- `REFACTORING_PLAN.md`: 7-phase refactoring plan
- Role-specific READMEs in each directory

## Governance Alignment

This structure enforces the governance model defined in `Guidelines.md`:
- **Contributor structure authority**: All Editor controls respect structural markers only
- **Template enforcement**: Preview applies template rules to structure
- **No hybrid formatting authority**: Contributors cannot override Preview typography
- **Clean role separation**: Each role directory isolates its capabilities
