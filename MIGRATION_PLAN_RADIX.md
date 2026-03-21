# Migration Plan: Native Dropdowns to Radix (ShadCN Select)

## Overview

Migrate Preview panel native HTML `<select>` dropdowns to ShadCN Select components (Radix UI based) to achieve visual consistency across Editor and Preview panels per Design System Rules.

## Current State

**Preview.tsx contains 2 native dropdowns:**
1. **Template selector** (lines 195-209): Allows switching between available templates
2. **Zoom mode selector** (lines 216-223): Allows switching between 'fit-width' and 'fit-page' modes

## Target State

Both dropdowns will use ShadCN `Select`, `SelectTrigger`, `SelectContent`, and `SelectItem` components with:
- `size="sm"` variant for toolbar controls
- Theme tokens instead of hardcoded colors
- Consistent styling with EditorToolbar components

## Migration Steps

---

### Step 1: Add ShadCN Select imports to Preview.tsx

**Objective:** Import required ShadCN Select components

**Changes:**
- Add import statement for Select, SelectTrigger, SelectValue, SelectContent, SelectItem from `./ui/select`

**Test criteria:**
- [ ] File imports successfully without TypeScript errors
- [ ] Application builds without errors
- [ ] No runtime errors on page load
- [ ] Both native dropdowns still function correctly (no behavioral change yet)

**Rollback:** Remove import statement

---

### Step 2: Migrate template selector dropdown to ShadCN Select

**Objective:** Replace native template selector with ShadCN Select component

**Changes:**
- Replace native `<select>` element (lines 195-209) with ShadCN Select components
- Use `value={selectedTemplate.id}` and `onValueChange={(value) => {...}}`
- Apply `size="sm"` to SelectTrigger
- Wrap each template option in `<SelectItem>` components
- Preserve all existing functionality: template switching, current selection display

**Test criteria:**
- [ ] Template dropdown renders with correct styling
- [ ] All templates appear in dropdown menu
- [ ] Current template is correctly displayed in trigger
- [ ] Clicking dropdown opens menu with all template options
- [ ] Selecting a template switches the preview rendering
- [ ] Template selection state persists correctly
- [ ] Visual consistency with Editor toolbar controls
- [ ] Keyboard navigation works (arrow keys, enter, escape)
- [ ] Dropdown closes after selection
- [ ] No console errors or warnings

**Rollback:** Revert to native select element

---

### Step 3: Migrate zoom mode dropdown to ShadCN Select

**Objective:** Replace native zoom mode selector with ShadCN Select component

**Changes:**
- Replace native `<select>` element (lines 216-223) with ShadCN Select components
- Use `value={zoomMode}` and `onValueChange={(value) => setZoomMode(value as ZoomMode)}`
- Apply `size="sm"` to SelectTrigger
- Wrap 'fit-width' and 'fit-page' options in `<SelectItem>` components
- Preserve all existing functionality: zoom mode switching, scale recalculation

**Test criteria:**
- [ ] Zoom mode dropdown renders with correct styling
- [ ] Both zoom options appear in dropdown menu ('Fit Width', 'Fit Page')
- [ ] Current zoom mode is correctly displayed in trigger
- [ ] Clicking dropdown opens menu with both zoom options
- [ ] Selecting 'Fit Width' correctly scales pages to fit width
- [ ] Selecting 'Fit Page' correctly scales pages to fit entire page
- [ ] Scale calculation triggers properly on zoom mode change
- [ ] Visual consistency with template selector and Editor toolbar
- [ ] Keyboard navigation works (arrow keys, enter, escape)
- [ ] Dropdown closes after selection
- [ ] No console errors or warnings

**Rollback:** Revert to native select element

---

### Step 4: Verify visual consistency across panels

**Objective:** Ensure both Preview dropdowns match Editor toolbar styling

**Changes:**
- No code changes, verification only
- Compare Preview dropdown styling against EditorToolbar components
- Verify both use same size variants, spacing, borders, and theme tokens

**Test criteria:**
- [ ] Preview dropdowns use `size="sm"` consistently
- [ ] Trigger heights match Editor toolbar button heights
- [ ] Border colors match across panels (no hardcoded values)
- [ ] Font sizes match across panels
- [ ] Padding and spacing match across panels
- [ ] Hover states match across panels
- [ ] Focus states match across panels
- [ ] Dropdown menu styling is consistent
- [ ] No visual regressions in either panel

**Rollback:** N/A (verification only)

---

### Step 5: Remove unused native select styling

**Objective:** Clean up any native select CSS classes no longer needed

**Changes:**
- Verify no references to `.text-xs.border.border-gray-300.rounded.px-2.py-1.bg-white` pattern for dropdowns
- Check for any orphaned CSS related to native selects
- Remove any unused imports or utilities

**Test criteria:**
- [ ] No unused CSS classes in Preview.tsx
- [ ] No unused imports in Preview.tsx
- [ ] Bundle size does not increase unnecessarily
- [ ] All dropdowns still function correctly
- [ ] No visual regressions
- [ ] No console warnings about unused code

**Rollback:** N/A (cleanup only)

---

### Step 6: Cross-browser and accessibility testing

**Objective:** Ensure ShadCN Select components work across environments and meet accessibility standards

**Changes:**
- No code changes, testing only
- Test on Chrome, Firefox, Safari, Edge (if available)
- Test keyboard navigation (Tab, Arrow keys, Enter, Escape)
- Test screen reader announcements (if available)

**Test criteria:**
- [ ] Dropdowns render correctly in Chrome
- [ ] Dropdowns render correctly in Firefox  
- [ ] Dropdowns render correctly in Safari (if available)
- [ ] Dropdowns render correctly in Edge (if available)
- [ ] Tab key moves focus to dropdown triggers
- [ ] Arrow keys navigate dropdown options
- [ ] Enter key selects highlighted option
- [ ] Escape key closes dropdown without selection
- [ ] Screen readers announce dropdown label and current value
- [ ] Screen readers announce available options when opened
- [ ] Screen readers announce selection changes
- [ ] Focus indicator is visible on keyboard navigation
- [ ] No functionality loss compared to native selects

**Rollback:** N/A (testing only)

---

## Success Criteria

Migration is complete when:

1. ✅ Both native dropdowns replaced with ShadCN Select components
2. ✅ All existing functionality preserved (template switching, zoom mode switching)
3. ✅ Visual consistency achieved across Editor and Preview panels
4. ✅ `size="sm"` variant used for all toolbar controls
5. ✅ No hardcoded colors (theme tokens only)
6. ✅ Keyboard navigation works correctly
7. ✅ Accessibility standards maintained or improved
8. ✅ No console errors or warnings
9. ✅ No visual regressions
10. ✅ Cross-browser compatibility verified

## Rollback Strategy

Each step is independently reversible:
- **Step 1:** Remove imports
- **Step 2:** Revert template selector to native select
- **Step 3:** Revert zoom selector to native select
- **Steps 4-6:** No code changes (verification/testing only)

## Notes

- ShadCN Select components are already available at `/src/app/components/ui/select.tsx`
- EditorToolbar.tsx already uses ShadCN components as reference implementation
- Migration aligns with Design System Rules in Guidelines.md
- No changes to state management or business logic required
- Focus is purely on UI component replacement
