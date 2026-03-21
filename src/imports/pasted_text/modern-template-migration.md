Phase 4: Migrate Modern Template
Objective
Convert Modern template to new format, test in isolation.
Files to Change
•	/src/app/mylo/templates/modern.ts
Changes
4.1: Convert to new format
Before:
export const modernTemplate: Template = {
  id: 'modern-template-v1',
  name: 'Modern',
  version: '1.0.0',
  
  styles: {
    body: {
      fontFamily: 'Times New Roman',
      fontSize: '13px',
      // ...
    },
    heading1: {
      fontFamily: 'Gill Sans',
      fontSize: '24px',
      // ...
    },
    // ...
  },
  
  pageLayout: {
    margins: {
      top: 1.0,
      right: 1.0,
      bottom: 1.0,
      left: 2.0,
    },
  },
  
  // ... rest unchanged ...
};
After:
export const modernTemplate: Template = {
  id: 'modern-template-v1',
  name: 'Modern',
  version: '1.0.0',
  
  // NEW FORMAT
  contentStyles: {
    body: {
      fontFamily: 'Times New Roman',
      fontSize: '13px',
      lineHeight: '1.6',
      color: '#1A1A1A',
      advanced: {
        // Keep any advanced properties
      },
    },
    heading1: {
      fontFamily: 'Gill Sans',
      fontSize: '24px',
      fontWeight: '600',
      color: '#25408E',
      lineHeight: '1.2',
      advanced: {
        marginTop: '24px',
        marginBottom: '12px',
      },
    },
    heading2: {
      fontFamily: 'Gill Sans',
      fontSize: '18px',
      fontWeight: '600',
      color: '#25408E',
      lineHeight: '1.3',
      advanced: {
        marginTop: '18px',
        marginBottom: '8px',
      },
    },
    heading3: {
      fontFamily: 'Gill Sans',
      fontSize: '14px',
      fontWeight: '600',
      color: '#25408E',
      lineHeight: '1.4',
      advanced: {
        marginTop: '14px',
        marginBottom: '6px',
      },
    },
  },
  
  pageStyles: {
    size: 'letter',
    marginTop: 1.0,
    marginRight: 1.0,
    marginBottom: 1.0,
    marginLeft: 2.0, // Distinctive left margin
  },
  
  // UNCHANGED: listStyles, characterRules, linkRules stay the same
  listStyles: {
    // ... keep existing ...
  },
  
  characterRules: {
    // ... keep existing ...
  },
  
  linkRules: {
    // ... keep existing ...
  },
};
Validation Checkpoint 4.1
Tests:
Test 1: Type checking
// Should compile without errors
import { modernTemplate } from './templates/modern';
import { isTemplateV2 } from './types';

console.log('Is V2:', isTemplateV2(modernTemplate)); // Should be true
Test 2: CSS generation
import { generateTemplateStylesheet } from '../services/pageLayoutUtils';
import { modernTemplate } from './templates/modern';

const css = generateTemplateStylesheet(modernTemplate);
console.log('Generated CSS:');
console.log(css);

// Verify:
// - Contains @page with size: letter
// - Contains margin: 1in 1in 1in 2in (distinctive 2in left)
// - Contains .mylo-preview h1 rule
// - Contains .mylo-preview p rule
Test 3: Rendering with new path
// In PaginatedDocumentRenderer.tsx:
const USE_NEW_CSS_PATH = true;

// Open app, select Modern template
// Should see:
// - "[Renderer] Using NEW path"
// - "[CSS Generation] Using new format (contentStyles + pageStyles)"
// - Preview renders correctly
// - Left margin is 2in (distinctive)
// - Heading fonts are Gill Sans
// - Body font is Times New Roman
// - NO inline style attributes on elements
Test 4: Still works with old path (feature flag)
// In PaginatedDocumentRenderer.tsx:
const USE_NEW_CSS_PATH = false;

// Open app, select Modern template
// Should still work via old path logic
// (This validates backward compatibility during transition)
Checklist:
•	 Template file compiles
•	 isTemplateV2(modernTemplate) returns true
•	 CSS generation uses new format directly (no adapter)
•	 Preview renders correctly with new path
•	 Left margin is 2in (distinctive feature visible)
•	 Content styles apply correctly (fonts, colors)
•	 No inline style attributes in rendered HTML
•	 Old path still works if flag is disabled
Success Criteria:
•	✅ Modern template migrated successfully
•	✅ Renders correctly via new path
•	✅ First template validated
•	✅ Can proceed to migrate others
