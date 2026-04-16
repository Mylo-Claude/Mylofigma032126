# Editor Code Refactoring Analysis
**Mylo Document System - Component Extraction Strategy**  
**Generated:** March 2, 2026  
**Status:** Analysis Only - No Changes Made

---

## Executive Summary

This analysis examines the current Mylo editor codebase to identify opportunities for extracting reusable components using best practices. The codebase consists of **1,202 lines** across 3 main components with additional supporting files for schema, keymap, and templates.

### Current Architecture

```
/src/app/
├── App.tsx (37 lines) - Main application shell
├── components/
│   ├── Editor.tsx (121 lines) - ProseMirror editor wrapper
│   ├── EditorToolbar.tsx (526 lines) - Toolbar with all formatting controls
│   └── Preview.tsx (555 lines) - Template-governed preview with pagination
├── mylo/
│   ├── schema.ts (122 lines) - ProseMirror schema definition
│   ├── keymap.ts (29 lines) - Keyboard shortcuts
│   └── template.ts (287 lines) - Template system and default templates
```

### Key Findings

1. ✅ **Good separation of concerns**: Editor, Toolbar, Preview are distinct
2. ⚠️ **Large monolithic components**: EditorToolbar (526 lines), Preview (555 lines)
3. ⚠️ **Mixed responsibilities**: Toolbar handles both UI and command logic
4. ⚠️ **Tight coupling**: Preview combines rendering, pagination, and zoom logic
5. ✅ **Clean data flow**: Props-based communication between components
6. ⚠️ **Limited reusability**: Components are specific to Mylo, not generic

---

## Component Analysis

### 1. Editor.tsx (121 lines)

**Current Responsibilities:**
- ProseMirror EditorView initialization
- Sample content loading
- State management (EditorState)
- Transaction dispatching
- Toolbar integration
- Layout structure

**Assessment:**
- ✅ Well-scoped component
- ✅ Clean separation of layout and logic
- ✅ Proper use of refs and lifecycle hooks
- ⚠️ Sample content hardcoded (could be externalized)
- ⚠️ ProseMirror initialization could be extracted

**Reusability Opportunities:**
- Extract ProseMirror initialization logic
- Extract sample content loading
- Create generic ProseMirror wrapper

---

### 2. EditorToolbar.tsx (526 lines) ⚠️ NEEDS REFACTORING

**Current Responsibilities:**
- Paragraph type controls (Body, H1-H3)
- Character formatting (bold, italic, underline)
- List controls (bullet, numbered, indent, outdent)
- Link insertion
- Super/subscript
- Clear formatting
- Case transformation
- Active state detection
- Command execution
- UI state management (popovers)

**Problems:**
1. **Too many responsibilities** - violates Single Responsibility Principle
2. **526 lines is too large** - hard to maintain and test
3. **Mixed UI and logic** - command logic embedded in UI component
4. **Repetitive code** - similar patterns for each button
5. **Hard to extend** - adding new controls requires editing large file
6. **No separation between button groups**

**Complexity Metrics:**
- 10+ distinct features
- 8+ state variables
- 15+ helper functions
- 40+ UI components in JSX

**Refactoring Priority:** 🔴 **HIGH**

---

### 3. Preview.tsx (555 lines) ⚠️ NEEDS REFACTORING

**Current Responsibilities:**
- Template selection
- Zoom management (fit-to-width, calculations)
- Scroll position management
- Page tracking (current page, total pages)
- Pagination logic
- Block rendering
- Inline text rendering
- List rendering (nested)
- Style application
- DOM measurement
- ResizeObserver handling

**Problems:**
1. **Multiple concerns mixed together** - zoom, pagination, rendering
2. **555 lines is too large** - difficult to test in isolation
3. **Complex state management** - 7+ useState, 3+ useRef, 5+ useEffect
4. **Hidden measurement div** - complexity for pagination
5. **Tightly coupled zoom and pagination**
6. **Difficult to swap rendering strategies**

**Complexity Metrics:**
- 4 major components nested in one file
- 7+ state variables
- 10+ helper functions
- Complex useEffect dependencies

**Refactoring Priority:** 🔴 **HIGH**

---

### 4. Supporting Files

#### schema.ts (122 lines) ✅ Well-Structured
- Clean ProseMirror schema definition
- No refactoring needed

#### keymap.ts (29 lines) ✅ Well-Structured
- Simple keyboard shortcut mapping
- No refactoring needed

#### template.ts (287 lines) ✅ Well-Structured
- Clear type definitions
- Well-organized template definitions
- Could benefit from splitting templates into separate files

---

## Refactoring Strategy

### Phase 1: EditorToolbar Extraction (HIGH PRIORITY)

#### Problem
526-line monolithic component with 10+ distinct features mixed together.

#### Proposed Component Structure

```
/src/app/components/editor-toolbar/
├── EditorToolbar.tsx (50-80 lines) - Main toolbar orchestrator
├── toolbar-groups/
│   ├── ParagraphTypeControls.tsx - Body/Heading selector
│   ├── CharacterFormatControls.tsx - Bold/Italic/Underline
│   ├── ListControls.tsx - Lists and Indent/Outdent
│   ├── LinkControl.tsx - Link insertion
│   ├── ScriptControls.tsx - Super/Subscript
│   ├── ClearFormattingControl.tsx - Clear formatting
│   └── CaseTransformControl.tsx - Case transformation
├── hooks/
│   ├── useEditorState.ts - Hook for reading EditorView state
│   ├── useMarkActive.ts - Hook for detecting active marks
│   └── useCurrentParagraphType.ts - Hook for paragraph type
├── commands/
│   ├── paragraphCommands.ts - Paragraph type commands
│   ├── markCommands.ts - Character mark commands
│   ├── listCommands.ts - List manipulation commands
│   ├── linkCommands.ts - Link insertion/removal
│   └── clearFormatting.ts - Clear formatting logic
└── types.ts - Shared types
```

#### Benefits
- ✅ Each button group becomes a focused component (50-80 lines each)
- ✅ Command logic separated into pure functions
- ✅ Hooks provide clean state access
- ✅ Easy to test individual controls
- ✅ Easy to add new controls without touching existing code
- ✅ Toolbar orchestrator is simple composition

#### Implementation Approach

**Step 1: Extract Commands (Pure Functions)**
```typescript
// commands/markCommands.ts
export function toggleBoldCommand(view: EditorView) {
  const { state, dispatch } = view;
  const mark = myloSchema.marks.bold;
  const command = toggleMark(mark);
  if (command(state)) {
    command(state, dispatch);
    view.focus();
  }
}
```

**Step 2: Create Custom Hooks**
```typescript
// hooks/useMarkActive.ts
export function useMarkActive(view: EditorView | null, markName: string): boolean {
  const [isActive, setIsActive] = useState(false);
  
  useEffect(() => {
    if (!view) return;
    
    const { from, to } = view.state.selection;
    const mark = myloSchema.marks[markName];
    const active = view.state.doc.rangeHasMark(from, to, mark);
    setIsActive(active);
  }, [view, markName]);
  
  return isActive;
}
```

**Step 3: Extract Button Groups**
```typescript
// toolbar-groups/CharacterFormatControls.tsx
export function CharacterFormatControls({ view }: { view: EditorView | null }) {
  const isBold = useMarkActive(view, 'bold');
  const isItalic = useMarkActive(view, 'italic');
  const isUnderline = useMarkActive(view, 'underline');
  
  return (
    <>
      <ToolbarButton
        variant={isBold ? "secondary" : "ghost"}
        onClick={() => view && toggleBoldCommand(view)}
        icon={<Bold className="h-4 w-4" />}
        title="Bold"
      />
      {/* ... other buttons */}
    </>
  );
}
```

**Step 4: Compose Main Toolbar**
```typescript
// EditorToolbar.tsx (now 50-80 lines)
export function EditorToolbar({ view }: EditorToolbarProps) {
  if (!view) return null;
  
  return (
    <div className="border-b border-gray-200 p-2 flex items-center gap-0.5 bg-white">
      <ParagraphTypeControls view={view} />
      <CharacterFormatControls view={view} />
      <ListControls view={view} />
      <LinkControl view={view} />
      <ScriptControls view={view} />
      <ClearFormattingControl view={view} />
      <CaseTransformControl view={view} />
    </div>
  );
}
```

#### Estimated Effort
- **Time:** 8-12 hours
- **Risk:** Low (preserves existing functionality)
- **Impact:** High (massive improvement in maintainability)

---

### Phase 2: Preview Component Extraction (HIGH PRIORITY)

#### Problem
555-line component mixing zoom, pagination, rendering, and measurement logic.

#### Proposed Component Structure

```
/src/app/components/preview/
├── Preview.tsx (80-120 lines) - Main orchestrator
├── PreviewChrome.tsx - Zoom controls, page navigation, template selector
├── PreviewCanvas.tsx - Scrollable canvas with zoom
├── pagination/
│   ├── PaginationEngine.ts - Core pagination logic
│   ├── PageMeasurer.tsx - Hidden measurement component
│   └── usePagination.ts - Pagination hook
├── rendering/
│   ├── DocumentRenderer.tsx - Orchestrates block rendering
│   ├── BlockRenderer.tsx - Renders individual blocks
│   ├── InlineRenderer.tsx - Renders inline content
│   ├── ListRenderer.tsx - Renders lists with nesting
│   └── renderingUtils.ts - Style conversion utilities
├── zoom/
│   ├── useZoom.ts - Zoom state management
│   ├── useFitToWidth.ts - Fit-to-width calculation
│   └── useScrollRestoration.ts - Scroll position management
└── types.ts - Shared types
```

#### Benefits
- ✅ Pagination logic can be tested independently
- ✅ Rendering logic can be swapped (e.g., for PDF export)
- ✅ Zoom management is isolated and reusable
- ✅ Each component has a single clear responsibility
- ✅ Easy to optimize individual pieces
- ✅ Can mock measurement for testing

#### Implementation Approach

**Step 1: Extract Zoom Logic**
```typescript
// zoom/useZoom.ts
export function useZoom(containerRef: RefObject<HTMLDivElement>) {
  const [zoomLevel, setZoomLevel] = useState(1.0);
  const prevZoomRef = useRef(1.0);
  
  const setZoom = useCallback((zoom: number) => {
    const clamped = Math.max(ZOOM.min, Math.min(zoom, ZOOM.max));
    setZoomLevel(clamped);
    prevZoomRef.current = clamped;
  }, []);
  
  return { zoomLevel, setZoom, prevZoom: prevZoomRef.current };
}
```

**Step 2: Extract Pagination Logic**
```typescript
// pagination/PaginationEngine.ts
export class PaginationEngine {
  static paginateBlocks(
    blocks: HTMLElement[],
    pageHeight: number
  ): number[][] {
    const pages: number[][] = [];
    let currentPage: number[] = [];
    let currentHeight = 0;
    
    blocks.forEach((block, index) => {
      const blockHeight = block.offsetHeight;
      
      if (currentHeight + blockHeight > pageHeight && currentPage.length > 0) {
        pages.push(currentPage);
        currentPage = [];
        currentHeight = 0;
      }
      
      currentPage.push(index);
      currentHeight += blockHeight;
    });
    
    if (currentPage.length > 0) {
      pages.push(currentPage);
    }
    
    return pages;
  }
}
```

**Step 3: Extract Rendering Components**
```typescript
// rendering/BlockRenderer.tsx
export function BlockRenderer({ node, template }: BlockRendererProps) {
  if (node.type.name === "paragraph") {
    return <ParagraphRenderer node={node} template={template} />;
  }
  
  if (node.type.name === "bullet_list") {
    return <ListRenderer node={node} template={template} listType="bullet" />;
  }
  
  if (node.type.name === "ordered_list") {
    return <ListRenderer node={node} template={template} listType="ordered" />;
  }
  
  return null;
}
```

**Step 4: Compose Main Preview**
```typescript
// Preview.tsx (now 80-120 lines)
export function Preview({ editorState, template }: PreviewProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { zoomLevel, setZoom } = useZoom(scrollContainerRef);
  const { currentPage, totalPages } = usePageTracking(scrollContainerRef, zoomLevel);
  
  return (
    <div className="h-full flex flex-col">
      <PreviewChrome 
        template={template}
        currentPage={currentPage}
        totalPages={totalPages}
        zoomLevel={zoomLevel}
        onZoomChange={setZoom}
      />
      
      <PreviewCanvas
        ref={scrollContainerRef}
        editorState={editorState}
        template={template}
        zoomLevel={zoomLevel}
      />
    </div>
  );
}
```

#### Estimated Effort
- **Time:** 12-20 hours
- **Risk:** Medium (complex state management)
- **Impact:** Very High (enables testing, future features)

---

### Phase 3: Create Reusable Primitives (MEDIUM PRIORITY)

#### Extract Generic ProseMirror Wrapper

```
/src/lib/prosemirror/
├── ProseMirrorEditor.tsx - Generic ProseMirror wrapper
├── useProseMirrorEditor.ts - Hook for editor instance
├── types.ts - Common ProseMirror types
└── utils.ts - Common utilities
```

**Benefits:**
- ✅ Can be used in other parts of the app
- ✅ Encapsulates ProseMirror complexity
- ✅ Easier to test editor logic

#### Extract Toolbar Button Components

```
/src/app/components/editor-toolbar/primitives/
├── ToolbarButton.tsx - Consistent button styling
├── ToolbarSeparator.tsx - Visual separator
├── ToolbarPopover.tsx - Popover wrapper
└── ToolbarButtonGroup.tsx - Group of related buttons
```

**Benefits:**
- ✅ Consistent styling across toolbar
- ✅ Easy to create new buttons
- ✅ Reduces duplication

#### Estimated Effort
- **Time:** 4-6 hours
- **Risk:** Low
- **Impact:** Medium (improves developer experience)

---

## Best Practices Applied

### 1. Single Responsibility Principle (SRP)
**Before:** EditorToolbar handles UI + state + commands + layout  
**After:** Separate components for UI, hooks for state, functions for commands

### 2. Separation of Concerns
**Before:** Preview mixes zoom + pagination + rendering  
**After:** Dedicated modules for each concern

### 3. Custom Hooks for State Logic
**Before:** useEffect and useState scattered in components  
**After:** Reusable hooks like useZoom, useMarkActive, usePagination

### 4. Pure Functions for Commands
**Before:** Command logic embedded in event handlers  
**After:** Testable pure functions in separate modules

### 5. Component Composition
**Before:** Large monolithic components  
**After:** Small focused components composed together

### 6. Testability
**Before:** Hard to test due to mixed concerns  
**After:** Each piece can be tested in isolation

### 7. Type Safety
**Before:** Some inline types  
**After:** Shared type definitions in types.ts files

### 8. Code Organization
**Before:** Flat structure with large files  
**After:** Nested folders with focused files

---

## Testing Strategy

### Unit Tests

**Toolbar Commands:**
```typescript
describe('markCommands', () => {
  it('should toggle bold mark', () => {
    const view = createMockEditorView();
    toggleBoldCommand(view);
    expect(view.state.doc.rangeHasMark(...)).toBe(true);
  });
});
```

**Pagination Logic:**
```typescript
describe('PaginationEngine', () => {
  it('should split blocks across pages', () => {
    const blocks = [mockBlock(100), mockBlock(200), mockBlock(150)];
    const pages = PaginationEngine.paginateBlocks(blocks, 250);
    expect(pages).toEqual([[0, 1], [2]]);
  });
});
```

**Hooks:**
```typescript
describe('useMarkActive', () => {
  it('should detect active bold mark', () => {
    const { result } = renderHook(() => useMarkActive(mockView, 'bold'));
    expect(result.current).toBe(true);
  });
});
```

### Integration Tests

**Toolbar Integration:**
```typescript
describe('EditorToolbar', () => {
  it('should apply bold when button clicked', () => {
    const { getByTitle } = render(<EditorToolbar view={view} />);
    fireEvent.click(getByTitle('Bold'));
    expect(view.state.doc.textAt(0)).toContain('<strong>');
  });
});
```

**Preview Integration:**
```typescript
describe('Preview', () => {
  it('should paginate long documents', () => {
    const { getAllByRole } = render(<Preview editorState={longDoc} />);
    const pages = getAllByRole('article');
    expect(pages.length).toBeGreaterThan(1);
  });
});
```

---

## Migration Path

### Step-by-Step Implementation

#### Week 1: EditorToolbar Refactoring
- [ ] Day 1-2: Extract command functions
- [ ] Day 3: Create custom hooks
- [ ] Day 4-5: Extract button group components
- [ ] Day 6: Compose main toolbar
- [ ] Day 7: Write tests

#### Week 2: Preview Refactoring
- [ ] Day 1-2: Extract zoom logic
- [ ] Day 3-4: Extract pagination logic
- [ ] Day 5-6: Extract rendering components
- [ ] Day 7: Integration and testing

#### Week 3: Polish and Documentation
- [ ] Day 1-2: Create reusable primitives
- [ ] Day 3-4: Write documentation
- [ ] Day 5: Code review and refinement
- [ ] Day 6-7: Final testing and deployment

### Risk Mitigation

1. **Feature Flags**
   - Use feature flags to gradually roll out refactored components
   - Easy rollback if issues arise

2. **Side-by-Side Testing**
   - Keep old components temporarily
   - Run both implementations and compare output

3. **Incremental Approach**
   - Refactor one toolbar group at a time
   - Refactor one Preview concern at a time

4. **Comprehensive Testing**
   - Write tests before refactoring
   - Ensure 100% behavior preservation

---

## Expected Outcomes

### Code Quality Metrics

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Average Component Size | 400 lines | 80 lines | 80% reduction |
| Max Component Size | 555 lines | 120 lines | 78% reduction |
| Test Coverage | 0% | 85%+ | N/A |
| Cyclomatic Complexity | High | Low | Significant |
| Code Duplication | Moderate | Low | 70% reduction |

### Maintainability Improvements

1. ✅ **Easier to understand** - small focused components
2. ✅ **Easier to test** - isolated logic
3. ✅ **Easier to extend** - add new features without touching existing code
4. ✅ **Easier to debug** - clear separation of concerns
5. ✅ **Easier to optimize** - profile and improve individual pieces

### Developer Experience

1. ✅ **Faster onboarding** - clear structure, small files
2. ✅ **Faster feature development** - reusable components and hooks
3. ✅ **Fewer bugs** - comprehensive testing
4. ✅ **Better collaboration** - clear ownership of components

---

## Alignment with Mylo Governance

This refactoring preserves all Mylo governance rules:

### ✅ Editor and Preview Separation
- Commands remain in Editor domain
- Rendering remains in Preview domain
- No role boundary violations

### ✅ Role Authority
- Contributor controls remain in toolbar commands
- Template controls remain in Preview rendering
- No hybrid authority

### ✅ Structure vs. Rendering
- Toolbar applies structure markers
- Preview applies template rendering
- Clean separation maintained

### ✅ Hard Constraints
- No template rules in Editor
- No structure markers in Preview rendering
- Governance remains enforceable

---

## Recommendations

### Priority 1: EditorToolbar (IMMEDIATE)
**Why:** Largest maintainability win with lowest risk  
**Effort:** 8-12 hours  
**Impact:** Massive improvement in code quality

### Priority 2: Preview Pagination (HIGH)
**Why:** Enables future features (PDF export, compilation)  
**Effort:** 12-20 hours  
**Impact:** Unblocks strategic initiatives

### Priority 3: Reusable Primitives (MEDIUM)
**Why:** Improves developer experience  
**Effort:** 4-6 hours  
**Impact:** Long-term productivity gain

### Total Estimated Effort
- **Total Time:** 24-38 hours (3-5 weeks part-time)
- **Total Risk:** Low-Medium
- **Total Impact:** Very High

---

## Conclusion

The current Mylo editor codebase is functional but suffers from typical growing pains:
- Components that started small have grown too large
- Responsibilities are mixed within components
- Testing is difficult due to tight coupling

The proposed refactoring addresses these issues systematically:
1. **Extract commands** - pure, testable functions
2. **Extract hooks** - reusable state logic
3. **Extract components** - focused, composable UI
4. **Extract engines** - isolated business logic

This approach follows industry best practices and aligns perfectly with Mylo's governance framework. The incremental migration path minimizes risk while delivering immediate value.

**Recommendation: Proceed with Phase 1 (EditorToolbar) immediately.**

---

**Report Status:** ✅ Analysis Complete - Awaiting Approval to Implement  
**Next Step:** Review recommendations and approve refactoring plan
