# Preview Panel Zoom Implementation Plan
**Version:** 1.0  
**Created:** 2024-02-28  
**Status:** Ready for Implementation  
**Approach:** CSS Transform Scale with Fit to Width

## Overview

Implement zoom functionality for the Preview panel only, using CSS transform scale for performance and simplicity. Includes preset zoom levels and an automatic "Fit to Width" mode.

### Goals
- Add zoom controls to Preview panel
- Support preset zoom levels (50% to 200%)
- Add "Fit to Width" automatic mode
- Maintain accurate page navigation at all zoom levels
- Zero impact on document content or pagination logic
- Session state only (resets on reload)

### Principles
- Each step is independently testable
- No breaking changes between steps
- Preview remains functional after every step
- Zoom is view-only, doesn't affect export

---

## Step 1: Add Zoom State Management

**Duration:** 15 minutes  
**Priority:** High  
**Risk:** Low

### Objective
Add zoom state to the Preview component without any visual changes yet.

### Actions
1. Open `/src/app/components/Preview.tsx`
2. Add zoom state after existing state declarations:
   ```typescript
   const [zoomLevel, setZoomLevel] = useState(1.0);
   const [fitToWidth, setFitToWidth] = useState(false);
   ```
3. Define preset zoom levels as a constant:
   ```typescript
   const ZOOM_PRESETS = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];
   ```

### Files Modified
- `/src/app/components/Preview.tsx`

### Testing Checklist
- [ ] File compiles without errors
- [ ] Preview renders unchanged
- [ ] Can add `console.log(zoomLevel)` and see `1.0` in console
- [ ] No TypeScript errors
- [ ] No runtime errors

### Success Criteria
✅ State variables added  
✅ App runs unchanged  
✅ No console errors  
✅ State is accessible (test with console.log)

### Rollback Plan
Simply remove the two new state lines and the ZOOM_PRESETS constant.

---

## Step 2: Add Zoom UI Controls to Header

**Duration:** 30 minutes  
**Priority:** High  
**Risk:** Low

### Objective
Add zoom controls (-, percentage, +) to the Preview header without functional behavior yet.

### Actions
1. Import needed components at top of file:
   ```typescript
   import { Minus, Plus } from "lucide-react";
   ```
2. In the Preview header, after the "Go to page" controls, add zoom controls:
   ```typescript
   <div className="flex items-center gap-1 border-l pl-2 ml-2">
     <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
       <Minus className="h-4 w-4" />
     </Button>
     <span className="text-xs font-medium text-gray-600 w-12 text-center">
       {Math.round(zoomLevel * 100)}%
     </span>
     <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
       <Plus className="h-4 w-4" />
     </Button>
   </div>
   ```

### Files Modified
- `/src/app/components/Preview.tsx`

### Testing Checklist
- [ ] Two new buttons (- and +) appear in Preview header
- [ ] Percentage displays "100%" by default
- [ ] Buttons have hover states but don't do anything yet
- [ ] Layout doesn't break, header items fit properly
- [ ] Page navigation controls still work
- [ ] No console errors

### Success Criteria
✅ Zoom controls visible in header  
✅ Shows "100%" by default  
✅ Buttons render correctly  
✅ No layout issues  
✅ Existing functionality unchanged

### Rollback Plan
Remove the new div with zoom controls from the header.

---

## Step 3: Implement Zoom In/Out Logic

**Duration:** 20 minutes  
**Priority:** High  
**Risk:** Low

### Objective
Make zoom buttons functional with preset level changes.

### Actions
1. Add zoom handler functions before the return statement:
   ```typescript
   const handleZoomIn = () => {
     setFitToWidth(false);
     const currentIndex = ZOOM_PRESETS.findIndex(z => z >= zoomLevel);
     const nextIndex = Math.min(currentIndex + 1, ZOOM_PRESETS.length - 1);
     setZoomLevel(ZOOM_PRESETS[nextIndex]);
   };

   const handleZoomOut = () => {
     setFitToWidth(false);
     const currentIndex = ZOOM_PRESETS.findIndex(z => z >= zoomLevel);
     const prevIndex = Math.max(currentIndex - 1, 0);
     setZoomLevel(ZOOM_PRESETS[prevIndex]);
   };
   ```

2. Wire up the buttons:
   ```typescript
   <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={handleZoomOut}>
     <Minus className="h-4 w-4" />
   </Button>
   ```
   ```typescript
   <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={handleZoomIn}>
     <Plus className="h-4 w-4" />
   </Button>
   ```

3. Disable buttons at limits:
   ```typescript
   <Button 
     size="sm" 
     variant="ghost" 
     className="h-8 w-8 p-0" 
     onClick={handleZoomOut}
     disabled={zoomLevel <= ZOOM_PRESETS[0]}
   >
   ```
   ```typescript
   <Button 
     size="sm" 
     variant="ghost" 
     className="h-8 w-8 p-0" 
     onClick={handleZoomIn}
     disabled={zoomLevel >= ZOOM_PRESETS[ZOOM_PRESETS.length - 1]}
   >
   ```

### Files Modified
- `/src/app/components/Preview.tsx`

### Testing Checklist
- [ ] Click "+" button - percentage increases (100% → 125% → 150% → 175% → 200%)
- [ ] Click "-" button - percentage decreases (200% → 150% → 125% → 100% → 75% → 50%)
- [ ] "-" button disabled at 50%
- [ ] "+" button disabled at 200%
- [ ] Percentage display updates correctly
- [ ] Pages don't visually change yet (this is expected)
- [ ] No console errors

### Success Criteria
✅ Zoom buttons functional  
✅ Percentage cycles through preset values  
✅ Buttons disable at limits  
✅ State updates correctly  
✅ No visual page changes yet (expected)

### Rollback Plan
Remove the handler functions and disabled props from buttons.

---

## Step 4: Apply CSS Transform to Pages

**Duration:** 25 minutes  
**Priority:** High  
**Risk:** Medium

### Objective
Actually scale the pages visually based on zoom level.

### Actions
1. Find the `PaginatedDocumentRenderer` component's return statement
2. Locate the outer `<div className="flex flex-col gap-8">` that wraps the pages
3. Add transform style to this container:
   ```typescript
   <div 
     className="flex flex-col gap-8"
     style={{
       transform: `scale(${zoomLevel})`,
       transformOrigin: 'top center',
     }}
   >
   ```

4. Need to pass `zoomLevel` prop to `PaginatedDocumentRenderer`:
   ```typescript
   // In Preview component's return:
   <PaginatedDocumentRenderer 
     doc={editorState.doc} 
     template={template} 
     onPaginationComplete={handlePaginationComplete}
     zoomLevel={zoomLevel}
   />
   ```

5. Update `PaginatedDocumentRenderer` function signature:
   ```typescript
   function PaginatedDocumentRenderer({ 
     doc, 
     template, 
     onPaginationComplete,
     zoomLevel 
   }: { 
     doc: PMNode; 
     template: Template; 
     onPaginationComplete: (pageCount: number) => void;
     zoomLevel: number;
   })
   ```

### Files Modified
- `/src/app/components/Preview.tsx`

### Testing Checklist
- [ ] At 100%, pages look normal
- [ ] Click "+" - pages visually scale up (get bigger)
- [ ] Click "-" - pages visually scale down (get smaller)
- [ ] Pages scale from top-center (top stays in place)
- [ ] Content remains readable at all zoom levels
- [ ] At 200%, page is twice as big
- [ ] At 50%, page is half size
- [ ] No layout breaking or content clipping
- [ ] Scroll still works (though page indicator will be wrong - that's next step)

### Success Criteria
✅ Pages scale visually  
✅ Transform origin at top center  
✅ Content remains readable  
✅ All zoom levels work (50% - 200%)  
✅ No breaking layout issues  
⚠️ Page indicator may be inaccurate (expected, will fix next)

### Rollback Plan
Remove the `style` prop from the pages container div and remove `zoomLevel` prop from PaginatedDocumentRenderer.

---

## Step 5: Adjust Current Page Calculation for Zoom

**Duration:** 20 minutes  
**Priority:** High  
**Risk:** Medium

### Objective
Fix the current page indicator to account for zoom level.

### Actions
1. Find the `handleScroll` function inside the first `useEffect` in Preview component
2. Adjust the scroll calculation to divide by zoom:
   ```typescript
   const handleScroll = () => {
     const scrollTop = container.scrollTop;
     const pageHeight = 11 * 96; // 11 inches * 96 DPI
     const gap = 32; // Gap between pages
     const totalPageHeight = pageHeight + gap;
     
     // Adjust for zoom level
     const adjustedScrollTop = scrollTop / zoomLevel;
     const page = Math.floor(adjustedScrollTop / totalPageHeight) + 1;
     setCurrentPage(Math.min(page, totalPages));
   };
   ```

3. Add `zoomLevel` to the useEffect dependency array:
   ```typescript
   }, [totalPages, zoomLevel]);
   ```

### Files Modified
- `/src/app/components/Preview.tsx`

### Testing Checklist
- [ ] At 100% zoom, page indicator shows correct page while scrolling
- [ ] At 200% zoom, page indicator shows correct page while scrolling
- [ ] At 50% zoom, page indicator shows correct page while scrolling
- [ ] Page 1 indicator appears at the top
- [ ] Scrolling through all pages updates indicator correctly
- [ ] Changing zoom level updates indicator appropriately
- [ ] No console errors

### Success Criteria
✅ Page indicator accurate at 100%  
✅ Page indicator accurate at 200%  
✅ Page indicator accurate at 50%  
✅ All intermediate zoom levels work correctly  
✅ Scrolling updates indicator smoothly

### Rollback Plan
Revert the `adjustedScrollTop` calculation back to just using `scrollTop` directly, and remove `zoomLevel` from dependencies.

---

## Step 6: Adjust "Go To Page" Navigation for Zoom

**Duration:** 20 minutes  
**Priority:** High  
**Risk:** Medium

### Objective
Fix the "Go To Page" feature to scroll correctly at all zoom levels.

### Actions
1. Find the `goToPage` function
2. Adjust the scroll target to multiply by zoom:
   ```typescript
   const goToPage = (pageNum: number) => {
     const container = scrollContainerRef.current;
     if (!container) return;

     const page = Math.max(1, Math.min(pageNum, totalPages));
     const pageHeight = 11 * 96; // 11 inches * 96 DPI
     const gap = 32;
     const totalPageHeight = pageHeight + gap;
     
     // Multiply by zoom level for correct scroll position
     const targetScroll = (page - 1) * totalPageHeight * zoomLevel;
     
     container.scrollTo({
       top: targetScroll,
       behavior: 'smooth'
     });
   };
   ```

### Files Modified
- `/src/app/components/Preview.tsx`

### Testing Checklist
- [ ] At 100%, "Go to page 3" scrolls to page 3 correctly
- [ ] At 200%, "Go to page 3" scrolls to page 3 correctly
- [ ] At 50%, "Go to page 3" scrolls to page 3 correctly
- [ ] Test with page 1, middle page, and last page
- [ ] Test at all zoom levels
- [ ] After navigation, current page indicator shows correct page
- [ ] Smooth scroll animation works
- [ ] No console errors

### Success Criteria
✅ "Go to page" works at 100%  
✅ "Go to page" works at 200%  
✅ "Go to page" works at 50%  
✅ All zoom levels navigate correctly  
✅ Page indicator updates after navigation

### Rollback Plan
Remove the `* zoomLevel` multiplication from targetScroll calculation.

---

## Step 7: Add "Fit to Width" Mode UI

**Duration:** 25 minutes  
**Priority:** Medium  
**Risk:** Low

### Objective
Add a "Fit to Width" button that automatically calculates optimal zoom.

### Actions
1. Import the Maximize icon:
   ```typescript
   import { Minus, Plus, Maximize2 } from "lucide-react";
   ```

2. Add "Fit to Width" button after the zoom controls:
   ```typescript
   <Button 
     size="sm" 
     variant={fitToWidth ? "default" : "ghost"}
     className="h-8 px-2 ml-1"
     onClick={() => setFitToWidth(!fitToWidth)}
   >
     <Maximize2 className="h-4 w-4 mr-1" />
     <span className="text-xs">Fit</span>
   </Button>
   ```

### Files Modified
- `/src/app/components/Preview.tsx`

### Testing Checklist
- [ ] "Fit" button appears after zoom controls
- [ ] Button has ghost style by default
- [ ] Clicking toggles the button state (ghost ↔ default style)
- [ ] fitToWidth state toggles (check with console.log)
- [ ] Button doesn't affect zoom yet (expected)
- [ ] Layout looks good, button fits in header
- [ ] No console errors

### Success Criteria
✅ "Fit" button visible  
✅ Button toggles visual state  
✅ State updates correctly  
✅ No layout issues  
✅ No functional changes yet (expected)

### Rollback Plan
Remove the "Fit" button and Maximize2 import.

---

## Step 8: Implement "Fit to Width" Logic

**Duration:** 30 minutes  
**Priority:** Medium  
**Risk:** Medium

### Objective
Calculate and apply zoom level to fit page width to container when Fit mode is active.

### Actions
1. Add a ref for the scroll container dimensions tracking:
   ```typescript
   const [containerWidth, setContainerWidth] = useState(0);
   ```

2. Add useEffect to measure container width:
   ```typescript
   useEffect(() => {
     const container = scrollContainerRef.current;
     if (!container) return;

     const updateWidth = () => {
       const width = container.clientWidth;
       setContainerWidth(width);
     };

     updateWidth();
     const resizeObserver = new ResizeObserver(updateWidth);
     resizeObserver.observe(container);

     return () => resizeObserver.disconnect();
   }, []);
   ```

3. Add useEffect to calculate fit-to-width zoom:
   ```typescript
   useEffect(() => {
     if (!fitToWidth || containerWidth === 0) return;

     const pageWidth = 8.5 * 96; // 8.5 inches * 96 DPI
     const padding = 64; // Account for scroll container padding (8 * 8px)
     const availableWidth = containerWidth - padding;
     const calculatedZoom = availableWidth / pageWidth;
     
     // Clamp between min and max zoom
     const clampedZoom = Math.max(
       ZOOM_PRESETS[0], 
       Math.min(calculatedZoom, ZOOM_PRESETS[ZOOM_PRESETS.length - 1])
     );
     
     setZoomLevel(clampedZoom);
   }, [fitToWidth, containerWidth]);
   ```

4. Update zoom button handlers to disable "Fit" mode:
   ```typescript
   const handleZoomIn = () => {
     setFitToWidth(false); // Already there
     // ... rest of function
   };
   ```

### Files Modified
- `/src/app/components/Preview.tsx`

### Testing Checklist
- [ ] Click "Fit" button - page scales to fit container width
- [ ] Resize browser window - page rescales automatically when Fit is active
- [ ] Fit mode respects min zoom (50%) and max zoom (200%)
- [ ] Click zoom buttons - disables Fit mode and uses preset zoom
- [ ] Re-enable Fit - recalculates based on current container width
- [ ] Zoom percentage updates to show calculated zoom (e.g., 137%)
- [ ] Wide window = larger zoom, narrow window = smaller zoom
- [ ] Pages remain centered
- [ ] No horizontal scrollbar appears
- [ ] No console errors

### Success Criteria
✅ Fit to Width calculates correct zoom  
✅ Page fits container width perfectly  
✅ Responds to window resize  
✅ Manual zoom disables Fit mode  
✅ Zoom clamped to min/max  
✅ No horizontal scroll  
✅ Percentage display shows actual zoom

### Rollback Plan
Remove the two new useEffect blocks and the containerWidth state.

---

## Step 9: Polish and Edge Cases

**Duration:** 20 minutes  
**Priority:** Low  
**Risk:** Low

### Objective
Handle edge cases and improve user experience.

### Actions
1. Disable zoom buttons when Fit to Width is active:
   ```typescript
   <Button 
     size="sm" 
     variant="ghost" 
     className="h-8 w-8 p-0" 
     onClick={handleZoomOut}
     disabled={fitToWidth || zoomLevel <= ZOOM_PRESETS[0]}
   >
   ```
   ```typescript
   <Button 
     size="sm" 
     variant="ghost" 
     className="h-8 w-8 p-0" 
     onClick={handleZoomIn}
     disabled={fitToWidth || zoomLevel >= ZOOM_PRESETS[ZOOM_PRESETS.length - 1]}
   >
   ```

2. Add tooltip/title attributes for clarity:
   ```typescript
   <Button 
     size="sm" 
     variant="ghost" 
     className="h-8 w-8 p-0" 
     onClick={handleZoomOut}
     disabled={fitToWidth || zoomLevel <= ZOOM_PRESETS[0]}
     title="Zoom out"
   >
   ```
   ```typescript
   <Button 
     size="sm" 
     variant="ghost" 
     className="h-8 w-8 p-0" 
     onClick={handleZoomIn}
     disabled={fitToWidth || zoomLevel >= ZOOM_PRESETS[ZOOM_PRESETS.length - 1]}
     title="Zoom in"
   >
   ```
   ```typescript
   <Button 
     size="sm" 
     variant={fitToWidth ? "default" : "ghost"}
     className="h-8 px-2 ml-1"
     onClick={() => setFitToWidth(!fitToWidth)}
     title="Fit to width"
   >
   ```

3. Ensure scroll position stays reasonable on zoom changes:
   ```typescript
   // Add this useEffect to maintain scroll position
   useEffect(() => {
     const container = scrollContainerRef.current;
     if (!container) return;
     
     // Get current center page
     const centerPage = currentPage;
     
     // After zoom changes, try to keep roughly the same page visible
     requestAnimationFrame(() => {
       const pageHeight = 11 * 96;
       const gap = 32;
       const totalPageHeight = pageHeight + gap;
       const targetScroll = (centerPage - 1) * totalPageHeight * zoomLevel;
       container.scrollTop = targetScroll;
     });
   }, [zoomLevel]);
   ```

### Files Modified
- `/src/app/components/Preview.tsx`

### Testing Checklist
- [ ] Zoom buttons disabled when Fit mode active
- [ ] Tooltips appear on hover
- [ ] Zoom change maintains approximate scroll position
- [ ] No jarring jumps when zooming in/out
- [ ] All previous functionality still works
- [ ] Clean, professional appearance
- [ ] No console warnings or errors

### Success Criteria
✅ Zoom buttons disabled in Fit mode  
✅ Helpful tooltips present  
✅ Smooth zoom transitions  
✅ Good scroll position maintenance  
✅ Professional UX

### Rollback Plan
Remove the disabled conditions, title attributes, and scroll position useEffect.

---

## Step 10: Final Testing and Validation

**Duration:** 20 minutes  
**Priority:** High  
**Risk:** N/A

### Objective
Comprehensive testing of all zoom functionality.

### Testing Scenarios

**Manual Zoom Testing:**
- [ ] Zoom from 50% to 200% in steps
- [ ] Pages scale correctly at each level
- [ ] Buttons disable at limits
- [ ] Percentage displays correctly

**Fit to Width Testing:**
- [ ] Enable Fit mode - page fits width
- [ ] Resize window narrower - zoom decreases
- [ ] Resize window wider - zoom increases
- [ ] Disable Fit mode - zoom stays at last calculated value
- [ ] Re-enable Fit mode - recalculates

**Navigation Testing:**
- [ ] Go To Page works at 50% zoom
- [ ] Go To Page works at 100% zoom
- [ ] Go To Page works at 200% zoom
- [ ] Go To Page works in Fit mode
- [ ] Current page indicator accurate at all zooms

**Scroll Testing:**
- [ ] Manual scroll updates page indicator at all zooms
- [ ] Scrolling smooth at all zoom levels
- [ ] No horizontal scroll appears (except maybe at 200%+)
- [ ] Pages remain centered

**Edge Cases:**
- [ ] Single page document works
- [ ] Multi-page document works
- [ ] Very zoomed out (50%) - all content visible
- [ ] Very zoomed in (200%) - content doesn't break
- [ ] Rapid zoom changes don't cause errors
- [ ] Page navigation during Fit mode

**Integration Testing:**
- [ ] Editor changes update Preview at all zooms
- [ ] Typing in Editor reflects in Preview at all zooms
- [ ] Pagination still works correctly
- [ ] Template rendering unaffected
- [ ] No performance degradation

**Governance Validation:**
- [ ] Zoom is Preview only (doesn't affect Editor)
- [ ] Document content unchanged
- [ ] Export would be unaffected (no export in prototype, but zoom doesn't touch document state)
- [ ] Session state only (refresh resets to 100%)

### Success Criteria
✅ All manual tests pass  
✅ All fit-to-width tests pass  
✅ All navigation tests pass  
✅ All edge cases handled  
✅ No console errors  
✅ No performance issues  
✅ Governance principles maintained

### Issues Found
Document any issues found and create follow-up tasks if needed.

---

## Expected Results

After completing all 10 steps:
- **Zoom Range:** 50% to 200% in preset increments
- **Fit to Width:** Automatic calculation with window resize response
- **Performance:** Zero impact on pagination or rendering
- **Governance:** Session state only, no document impact
- **UX:** Smooth, professional zoom controls with clear feedback
- **Compatibility:** Works with all existing Preview features

## Governance Decision Record

**Surface:** Preview  
**Category:** Preview Panel Features  
**Rule statement:**
- Preview supports zoom levels from 50% to 200%
- Zoom uses CSS transform scale for performance
- Fit to Width mode automatically scales to container width
- Zoom is session state only, resets on reload
- Zoom does not affect document content or export output

**Scope:** Preview panel only  
**Persistence:** Session state  
**Undo:** N/A (not part of document state)  
**Supersedes:** None (new feature)

**Acceptance criteria:**
- Zoom controls visible in Preview header
- Manual zoom works from 50% to 200%
- Fit to Width calculates correct zoom
- Page navigation accurate at all zoom levels
- Current page indicator accurate at all zoom levels
- Window resize updates Fit to Width zoom
- No impact on Editor or document state
- Session state only (resets on page reload)

---

## Rollback Strategy

If major issues occur:
1. **Complete rollback:** Revert all changes to Preview.tsx
2. **Partial rollback:** Complete steps 1-3 for UI only (no functional zoom)
3. **Issue-specific:** Use individual step rollback plans

Each step is independently reversible using the rollback plan provided.

---

**Total Estimated Time:** 3.5 - 4 hours  
**Steps:** 10  
**Can be completed:** In a single session or across 2-3 sessions
