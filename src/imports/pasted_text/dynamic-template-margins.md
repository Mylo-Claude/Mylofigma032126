Step-by-Step Plan: Connect Template Margins to Paged.js (Dynamic, Not Hardcoded)
Step 1: Verify Template Margin Data Exists
Goal: Confirm all templates have pageLayout.margins defined
Actions:
•	Add console.log in PaginatedDocumentRenderer.tsx to log template.pageLayout.margins before pagination
•	Check that Default, Modern, Traditional, and Legal templates all log their margin values
Test:
•	Open app, switch between templates
•	Browser console should show margin objects for each template
•	Example: { top: 1.0, right: 1.0, bottom: 1.0, left: 1.0 }
 
Step 2: Create Margin-to-CSS Utility Function
Goal: Convert template margin object to Paged.js @page CSS rule
Actions:
•	Create /src/app/services/pageLayoutUtils.ts
•	Write function: generatePageMarginCSS(margins: PageMargins, templateId: string): string
•	Function returns CSS string like: @page template-abc { margin: 1in 1in 1in 1in; }
Test:
•	Write inline test in console or temporary component
•	Call function with mock margins: { top: 1.5, right: 2, bottom: 1, left: 1.25 }
•	Verify output: @page { margin: 1.5in 2in 1in 1.25in; }
 
Step 3: Update PaginationService Interface
Goal: Accept margin CSS as parameter
Actions:
•	Update PaginationOptions interface in /src/app/services/pagination.ts
•	Add optional field: customPageCSS?: string
•	Log received CSS inside paginate() method
Test:
•	Pass test CSS string: @page { margin: 2in; }
•	Verify console log shows received CSS
 
Step 4: Inject Dynamic Margins into Paged.js
Goal: Apply template margins dynamically via Paged.js
Actions:
•	In pagination.ts, create dynamic <style> element with customPageCSS
•	Inject style element before calling new Previewer()
•	Remove after pagination completes (cleanup)
Test:
•	Manually change Modern template's left margin to 2.0 in modern.ts
•	Reload app, select Modern template
•	Success: Preview shows visibly wider left margin (2 inches vs 1 inch)
 
Step 5: Wire Template Margins Through the Chain
Goal: Connect template object → utility function → pagination service
Actions:
•	In PaginatedDocumentRenderer.tsx, before calling paginationService.paginate():
•	Call generatePageMarginCSS(template.pageLayout.margins, template.id)
•	Pass result as customPageCSS parameter
•	Remove old templateName mapping logic (lines 62-70)
Test:
•	Change Default template margins to { top: 2, right: 1.5, bottom: 1, left: 1 }
•	Reload app
•	Success: Default template shows 2-inch top margin, 1.5-inch right margin
 
Step 6: Remove Hardcoded CSS Margins
Goal: Clean up /src/styles/paged-media.css
Actions:
•	Remove template-specific @page rules (lines 28-44):
•	Delete @page default-template { ... }
•	Delete @page traditional-template { ... }
•	Delete @page legal-template { ... }
•	Keep base @page { size: 8.5in 11in; margin: 0; } as fallback
•	Remove .template-default, .template-traditional, .template-legal class selectors (lines 54-64)
Test:
•	Verify all four templates still render with correct margins
•	Margins should come from TypeScript files only, not CSS
 
Step 7: Add Fallback Safety
Goal: Handle missing or invalid margin data gracefully
Actions:
•	In generatePageMarginCSS(), add validation
•	If margins is undefined, return default: @page { margin: 1in; }
•	Add TypeScript type guard
Test:
•	Temporarily delete pageLayout.margins from Modern template
•	Success: App doesn't crash, falls back to 1-inch margins
•	Restore margins, verify it works again
 
Step 8: Test All Templates with Different Values
Goal: Verify complete system integration
Actions:
•	Modify each template with distinct margins:
•	Default: { top: 1, right: 1, bottom: 1, left: 1 }
•	Modern: { top: 0.75, right: 1.5, bottom: 1, left: 2 }
•	Traditional: { top: 1.25, right: 1.5, bottom: 1.25, left: 1.5 }
•	Legal: { top: 1.5, right: 1, bottom: 1, left: 1 }
Test:
•	Load long document sample
•	Switch between templates
•	Success: Each template shows visibly different page margins matching the values above
 
Step 9: Remove Unused Template Mapping Code
Goal: Clean up obsolete code
Actions:
•	In PaginatedDocumentRenderer.tsx, remove the templateName variable (lines 62-70)
•	Remove templateName parameter from paginationService.paginate() call
•	Update PaginationOptions interface to remove templateName: 'default' | 'traditional' | 'legal'
Test:
•	App still works
•	No TypeScript errors
•	All templates render correctly
 
Step 10: Final Verification
Goal: Confirm dynamic margin system works end-to-end
Actions:
•	For Modern template, change left: 2.0 to left: 3.0 in modern.ts
•	Save file, reload app
•	Measure or visually verify left margin increased
Test:
•	Success: Preview immediately reflects new 3-inch left margin
•	No CSS file edits required
•	Template TypeScript is now single source of truth for margins

