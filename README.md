# Mylo - Document Collaboration Platform

A document collaboration platform prototype implementing a governance framework that separates content creation from presentation control.

## Overview

Mylo features:
- **Split-pane interface**: Editor (ProseMirror) and Preview (Paged.js)
- **Role-based governance**: Distinct capabilities for Contributors, Template Editors, and Admins
- **Template-driven rendering**: Preview applies governed styling through templates
- **Template-based styling**: Template definitions govern preview presentation

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
├── templates/          # Template Editor routes and panels
├── admin/              # Admin documentation scaffolding
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

**Templates** (`/templates/`)
- `TemplateListPage.tsx`: Template browser for template-editor and admin roles
- `TemplateEditorPage.tsx`: Template editing surface for `/templates/new` and `/templates/:id`

#### Admin Role

**Administration** (`/admin/`)
- Documentation scaffolding exists, but admin app routes/pages are not wired into the current router

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
- **Admins**: Publish templates and enforce governance policies

## Development Setup

This project runs as a local React/Vite app with npm-based development commands.

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

- `guidelines/Guidelines.md`: Full governance framework and collaboration prompt
- `docs/DesignSystemRules.md`: Current design system guidance
- `docs/EDITOR_REFACTORING_ANALYSIS.md`: Current editor architecture analysis
- `docs/archive/`: Historical completed-work documents
- Role-specific READMEs in each directory

## Governance Alignment

This structure enforces the governance model defined in `guidelines/Guidelines.md`:
- **Contributor structure authority**: All Editor controls respect structural markers only
- **Template enforcement**: Preview applies template rules to structure
- **No hybrid formatting authority**: Contributors cannot override Preview typography
- **Clean role separation**: Each role directory isolates its capabilities
