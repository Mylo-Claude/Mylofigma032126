# Preview Panel Zoom Implementation - Steps Checklist

## Step 1: Add Zoom State Management
- [ ] Open `/src/app/components/Preview.tsx`
- [ ] Add zoom state: `const [zoomLevel, setZoomLevel] = useState(1.0);`
- [ ] Add fit state: `const [fitToWidth, setFitToWidth] = useState(false);`
- [ ] Define preset levels: `const ZOOM_PRESETS = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];`

## Step 2: Add Zoom UI Controls to Header
- [ ] Import icons: `import { Minus, Plus } from "lucide-react";`
- [ ] Add zoom controls div to Preview header (after Go to Page controls)
- [ ] Add minus button
- [ ] Add percentage display showing `{Math.round(zoomLevel * 100)}%`
- [ ] Add plus button

## Step 3: Implement Zoom In/Out Logic
- [ ] Create `handleZoomIn()` function
- [ ] Create `handleZoomOut()` function
- [ ] Wire up onClick handlers to buttons
- [ ] Add disabled prop to minus button: `disabled={zoomLevel <= ZOOM_PRESETS[0]}`
- [ ] Add disabled prop to plus button: `disabled={zoomLevel >= ZOOM_PRESETS[ZOOM_PRESETS.length - 1]}`

## Step 4: Apply CSS Transform to Pages
- [ ] Pass `zoomLevel` prop to `PaginatedDocumentRenderer`
- [ ] Update `PaginatedDocumentRenderer` function signature to accept `zoomLevel`
- [ ] Add transform style to pages container div: `transform: scale(${zoomLevel})`
- [ ] Add `transformOrigin: 'top center'` to style

## Step 5: Adjust Current Page Calculation for Zoom
- [ ] Find `handleScroll` function inside first useEffect
- [ ] Add line: `const adjustedScrollTop = scrollTop / zoomLevel;`
- [ ] Change page calculation to use `adjustedScrollTop` instead of `scrollTop`
- [ ] Add `zoomLevel` to useEffect dependency array

## Step 6: Adjust "Go To Page" Navigation for Zoom
- [ ] Find `goToPage` function
- [ ] Multiply targetScroll by zoomLevel: `const targetScroll = (page - 1) * totalPageHeight * zoomLevel;`

## Step 7: Add "Fit to Width" Mode UI
- [ ] Import Maximize icon: `import { Minus, Plus, Maximize2 } from "lucide-react";`
- [ ] Add "Fit" button after zoom controls
- [ ] Set variant based on fitToWidth state: `variant={fitToWidth ? "default" : "ghost"}`
- [ ] Add onClick handler: `onClick={() => setFitToWidth(!fitToWidth)}`

## Step 8: Implement "Fit to Width" Logic
- [ ] Add containerWidth state: `const [containerWidth, setContainerWidth] = useState(0);`
- [ ] Add useEffect to measure container width using ResizeObserver
- [ ] Add useEffect to calculate fit-to-width zoom based on containerWidth
- [ ] Clamp calculated zoom between min and max presets
- [ ] Ensure zoom handlers disable Fit mode (already done in Step 3)

## Step 9: Polish and Edge Cases
- [ ] Add `fitToWidth ||` to zoom button disabled conditions
- [ ] Add title="Zoom out" to minus button
- [ ] Add title="Zoom in" to plus button
- [ ] Add title="Fit to width" to Fit button
- [ ] Add useEffect to maintain scroll position on zoom changes

## Step 10: Final Testing and Validation
- [ ] Test manual zoom at all levels (50% to 200%)
- [ ] Test Fit to Width mode
- [ ] Test with window resize
- [ ] Test Go To Page at different zooms
- [ ] Test current page indicator at different zooms
- [ ] Test with single page document
- [ ] Test with multi-page document
- [ ] Verify no console errors
- [ ] Verify session state only (resets on refresh)
- [ ] Verify no impact on Editor or document content
