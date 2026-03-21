Phase 3: Update Rendering Pipeline (Dual Path)
Objective
Modify serializer and pagination to support both old and new rendering paths.
3A: Update Serializer
Files to Change
•	/src/app/contributor/preview/serializer.ts
Changes
3A.1: Make template parameter optional
/**
 * Serialize ProseMirror document to HTML.
 * 
 * MIGRATION: Template parameter is optional.
 * - If provided: generates HTML with inline styles (old path)
 * - If omitted: generates semantic HTML only (new path)
 * 
 * @param doc - ProseMirror document
 * @param template - Optional template for inline styles (old path)
 * @returns HTML string
 */
export function serializeToHTML(doc: Node, template?: Template): string {
  const useInlineStyles = !!template;
  
  if (useInlineStyles) {
    console.log('[Serializer] Using OLD path (inline styles)');
  } else {
    console.log('[Serializer] Using NEW path (semantic HTML only)');
  }
  
  let html = '';
  
  // ... existing serialization logic ...
  
  return html;
}
3A.2: Update heading serialization
// Inside heading serialization logic:

if (node.type.name === 'heading') {
  const level = node.attrs.level || 1;
  
  if (useInlineStyles && template) {
    // OLD PATH: Apply inline styles
    const styleKey = `heading${level}` as 'heading1' | 'heading2' | 'heading3';
    const style = template.styles?.[styleKey];
    
    if (style) {
      const styleAttr = Object.entries(style)
        .map(([key, value]) => `${camelToKebab(key)}: ${value}`)
        .join('; ');
      html += `<h${level} style="${styleAttr}">`;
    } else {
      html += `<h${level}>`;
    }
  } else {
    // NEW PATH: Semantic HTML only
    html += `<h${level}>`;
  }
  
  // ... serialize content ...
  
  html += `</h${level}>`;
}
3A.3: Update paragraph serialization
// Inside paragraph serialization logic:

if (node.type.name === 'paragraph') {
  if (useInlineStyles && template?.styles?.body) {
    // OLD PATH: Apply inline styles
    const style = template.styles.body;
    const styleAttr = Object.entries(style)
      .map(([key, value]) => `${camelToKebab(key)}: ${value}`)
      .join('; ');
    html += `<p style="${styleAttr}">`;
  } else {
    // NEW PATH: Semantic HTML only
    html += `<p>`;
  }
  
  // ... serialize content ...
  
  html += `</p>`;
}
3A.4: Helper function for camelToKebab (if not already present)
/**
 * Convert camelCase to kebab-case for CSS properties.
 */
function camelToKebab(str: string): string {
  return str.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);
}
Validation Checkpoint 3A.1
Tests:
import { serializeToHTML } from './serializer';
import { modernTemplate } from '../mylo/templates/modern';

// Create test document
const testDoc = /* ProseMirror doc with h1 and p */;

// Test OLD path (with template)
console.log('=== Testing OLD path ===');
const htmlOld = serializeToHTML(testDoc, modernTemplate);
console.log(htmlOld);
console.assert(htmlOld.includes('style='), 'Should contain inline styles');

// Test NEW path (without template)
console.log('\n=== Testing NEW path ===');
const htmlNew = serializeToHTML(testDoc);
console.log(htmlNew);
console.assert(!htmlNew.includes('style='), 'Should NOT contain inline styles');
console.assert(htmlNew.includes('<h1>'), 'Should contain semantic h1');
console.assert(htmlNew.includes('<p>'), 'Should contain semantic p');
Checklist:
•	 Serializer accepts optional template parameter
•	 With template: generates inline styles (old behavior)
•	 Without template: generates semantic HTML only
•	 Both paths produce valid HTML
•	 Existing code still works (passes template)
Success Criteria:
•	✅ Old path still works (backward compatible)
•	✅ New path works (semantic HTML)
•	✅ Can switch between paths
•	✅ System still runs normally
