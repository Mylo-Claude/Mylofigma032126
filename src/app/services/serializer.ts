import { Node as PMNode } from 'prosemirror-model';
import { Template, isTemplateV2 } from '../mylo/template';
import { generateTemplateStylesheet } from './pageLayoutUtils';

/**
 * Serializer Service
 * 
 * Converts ProseMirror document to HTML for Paged.js pagination.
 * 
 * TWO RENDERING PATHS:
 * 1. OLD PATH (with template): Applies inline styles during serialization (backward compatible)
 * 2. NEW PATH (no template): Generates semantic HTML only, styles via CSS injection
 * 
 * TEMPLATE FORMAT COMPATIBILITY:
 * - V1 templates: Use `styles` property for paragraph styles
 * - V2 templates: Use `contentStyles` property for paragraph styles
 * - Serializer automatically detects and adapts to both formats
 * 
 * This is a pure transformation:
 * - Old: ProseMirror Doc + Template → HTML String with inline styles
 * - New: ProseMirror Doc → Semantic HTML (styles applied separately via <style> tag)
 * 
 * No Preview rendering logic here - just serialization with optional template application.
 */

/**
 * Helper: Get styles object from template (handles V1 and V2 formats)
 */
function getTemplateStyles(template: Template | undefined) {
  if (!template) return undefined;
  
  // V2 format uses contentStyles
  if (isTemplateV2(template)) {
    return template.contentStyles;
  }
  
  // V1 format uses styles
  return (template as any).styles;
}

/**
 * Main entry point: serialize ProseMirror document to HTML
 * 
 * @param doc - ProseMirror document
 * @param template - Optional template for backward compatibility (generates inline styles if provided)
 * @returns HTML string
 */
export function serializeToHTML(doc: PMNode, template?: Template): string {
  const useInlineStyles = !!template;
  
  // Validation logging for Phase 3A
  if (useInlineStyles) {
    console.log('[Serializer] Using OLD path (inline styles) - template provided');
  } else {
    console.log('[Serializer] Using NEW path (semantic HTML only) - no template');
  }
  
  const container = document.createElement('div');
  
  doc.forEach((node) => {
    const element = nodeToHTML(node, template, 0, useInlineStyles);
    if (element) {
      container.appendChild(element);
    }
  });
  
  return container.innerHTML;
}

/**
 * Generate stylesheet CSS from template (for NEW path CSS injection)
 * 
 * @param template - Template configuration
 * @returns CSS string with @page rules and content styles
 */
export function generateStylesheetFromTemplate(template: Template): string {
  console.log('[Serializer] Generating stylesheet CSS for template:', template.id);
  return generateTemplateStylesheet(template);
}

// ============================================================================
// VALIDATION EXPORTS (Phase 3A)
// ============================================================================

/**
 * Re-export for validation testing
 */
export { runCSSGeneratorTests } from './pageLayoutUtils';

/**
 * Convert a single ProseMirror node to HTML element
 */
function nodeToHTML(node: PMNode, template: Template | undefined, listDepth: number, useInlineStyles: boolean): HTMLElement | Text | null {
  // Handle text nodes
  if (node.isText) {
    return applyMarks(node, template);
  }
  
  // Handle block nodes
  switch (node.type.name) {
    case 'paragraph':
      return createParagraph(node, template, useInlineStyles);
      
    case 'bullet_list':
      return createList(node, 'ul', template, listDepth, useInlineStyles);
      
    case 'ordered_list':
      return createList(node, 'ol', template, listDepth, node.attrs.start, useInlineStyles);
      
    case 'list_item':
      // Fallback for orphaned list items (shouldn't normally occur)
      return createListItem(node, template, listDepth, 'ul', useInlineStyles);
      
    default:
      console.warn(`[Serializer] Unknown node type: ${node.type.name}`);
      return null;
  }
}

/**
 * Create paragraph or heading element with template styles
 */
function createParagraph(node: PMNode, template: Template | undefined, useInlineStyles: boolean): HTMLElement {
  const paragraphType = node.attrs.type || 'body';
  
  // Map paragraph type to HTML tag and template style
  let tag: string;
  let style: any;
  
  switch (paragraphType) {
    case 'heading1':
      tag = 'h1';
      style = getTemplateStyles(template)?.heading1;
      break;
    case 'heading2':
      tag = 'h2';
      style = getTemplateStyles(template)?.heading2;
      break;
    case 'heading3':
      tag = 'h3';
      style = getTemplateStyles(template)?.heading3;
      break;
    case 'body':
    default:
      tag = 'p';
      style = getTemplateStyles(template)?.body;
      break;
  }
  
  const element = document.createElement(tag);
  element.setAttribute('data-type', paragraphType);
  
  // Apply template paragraph styles
  if (useInlineStyles && style) {
    applyStyleToElement(element, style);
  }
  
  // Add text content with marks
  node.forEach((child) => {
    const childEl = nodeToHTML(child, template, 0, useInlineStyles);
    if (childEl) {
      element.appendChild(childEl);
    }
  });
  
  // If paragraph is empty, add a zero-width space to prevent rendering issues
  if (element.childNodes.length === 0) {
    element.appendChild(document.createTextNode('\u200B'));
  }
  
  return element;
}

/**
 * Create list element (ul or ol) with template styles
 */
function createList(node: PMNode, tag: 'ul' | 'ol', template: Template | undefined, listDepth: number, start?: number, useInlineStyles?: boolean): HTMLElement {
  const element = document.createElement(tag);
  
  // Apply template list styles
  const listStyle = tag === 'ul' ? template?.listStyles.bulletedList : template?.listStyles.orderedList;
  
  // Calculate marker type
  let markerType: string;
  if (tag === 'ul') {
    markerType = listStyle?.markerType || 'disc';
  } else {
    // Ordered lists vary by depth
    const listStyleTypes = ['decimal', 'lower-alpha', 'lower-roman'];
    markerType = listStyleTypes[listDepth % listStyleTypes.length];
  }
  
  // Set list style type
  element.style.listStyleType = markerType;
  
  if (listStyle?.indentSize) {
    element.style.paddingLeft = listStyle.indentSize;
  }
  element.style.marginTop = '0';
  
  // Nested lists (depth > 0) should not have bottom margin to prevent gaps
  const isNested = listDepth > 0;
  element.style.marginBottom = isNested ? '0' : '16px';
  
  // Apply advanced properties, but skip marginBottom for nested lists
  if (listStyle?.advanced) {
    Object.entries(listStyle.advanced).forEach(([key, value]) => {
      // For nested lists, skip marginBottom from advanced properties
      if (isNested && key === 'marginBottom') {
        return;
      }
      (element.style as any)[key] = value;
    });
  }
  
  // For ordered lists, set start attribute if not 1
  if (tag === 'ol' && start && start !== 1) {
    element.setAttribute('start', String(start));
  }
  
  // Add list items
  node.forEach((child) => {
    if (child.type.name === 'list_item') {
      const li = createListItem(child, template, listDepth, tag, useInlineStyles);
      if (li) {
        element.appendChild(li);
      }
    } else {
      // Handle other node types through generic dispatcher
      const childEl = nodeToHTML(child, template, listDepth, useInlineStyles);
      if (childEl) {
        element.appendChild(childEl);
      }
    }
  });
  
  return element;
}

/**
 * Create list item element with template styles
 */
function createListItem(node: PMNode, template: Template | undefined, listDepth: number, parentListType: 'ul' | 'ol', useInlineStyles?: boolean): HTMLElement {
  const element = document.createElement('li');
  
  // Apply body font styles to list items
  const bodyStyle = getTemplateStyles(template)?.body;
  element.style.fontFamily = bodyStyle?.fontFamily || '';
  element.style.fontSize = bodyStyle?.fontSize || '';
  element.style.fontWeight = String(bodyStyle?.fontWeight || '');
  element.style.lineHeight = String(bodyStyle?.lineHeight || '');
  element.style.color = bodyStyle?.color || '';
  
  // Use correct listStyle based on parent list type
  const listStyle = parentListType === 'ul' ? template?.listStyles.bulletedList : template?.listStyles.orderedList;
  element.style.marginTop = '0';
  if (listStyle?.itemSpacing) {
    element.style.marginBottom = listStyle.itemSpacing;
  }
  
  // Process child nodes (paragraphs, nested lists)
  node.forEach((child) => {
    if (child.type.name === 'paragraph') {
      // For paragraphs inside list items, render content without paragraph wrapper
      // to avoid inheriting body paragraph margins
      const contentWrapper = document.createElement('div');
      contentWrapper.style.margin = '0';
      
      // Add text content with marks
      child.forEach((textNode) => {
        const textEl = nodeToHTML(textNode, template, listDepth + 1, useInlineStyles);
        if (textEl) {
          contentWrapper.appendChild(textEl);
        }
      });
      
      element.appendChild(contentWrapper);
    } else {
      // Nested lists
      const childEl = nodeToHTML(child, template, listDepth + 1, useInlineStyles);
      if (childEl) {
        element.appendChild(childEl);
      }
    }
  });
  
  return element;
}

/**
 * Check if a mark should be rendered based on template rules.
 * 
 * NEW PATH (no template): Always render marks
 * OLD PATH (with template): Only render if enabled in template
 */
function shouldRenderMark(markName: string, template: Template | undefined): boolean {
  // NEW PATH: No template means always render semantic HTML
  if (!template) {
    return true;
  }
  
  // OLD PATH: Check if mark is enabled in template
  const characterRules = template.characterRules;
  
  switch (markName) {
    case 'bold':
      return characterRules.bold.enabled;
    case 'italic':
      return characterRules.italic.enabled;
    case 'underline':
      return characterRules.underline.enabled;
    case 'superscript':
      return characterRules.superscript.enabled;
    case 'subscript':
      return characterRules.subscript.enabled;
    case 'link':
      return true; // Links are always rendered
    default:
      return true;
  }
}

/**
 * Apply marks (bold, italic, underline, links, etc.) to text node with template rules
 */
function applyMarks(node: PMNode, template: Template | undefined): HTMLElement | Text {
  if (!node.marks || node.marks.length === 0) {
    return document.createTextNode(node.text || '');
  }
  
  // Start with text node
  let element: HTMLElement | Text = document.createTextNode(node.text || '');
  
  // Wrap in mark elements from innermost to outermost
  node.marks.forEach((mark) => {
    // Skip marks that shouldn't be rendered based on template rules
    if (!shouldRenderMark(mark.type.name, template)) {
      return;
    }
    
    const wrapper = document.createElement(getMarkTag(mark.type.name));
    
    // Apply template-specific mark styles
    if (mark.type.name === 'bold') {
      if (template?.characterRules.bold.fontWeight) {
        (wrapper as HTMLElement).style.fontWeight = String(template.characterRules.bold.fontWeight);
      }
      if (template?.characterRules.bold.color) {
        (wrapper as HTMLElement).style.color = template.characterRules.bold.color;
      }
      // Apply advanced properties last to override defaults
      if (template?.characterRules.bold.advanced) {
        Object.entries(template.characterRules.bold.advanced).forEach(([key, value]) => {
          (wrapper.style as any)[key] = value;
        });
      }
    }
    
    if (mark.type.name === 'italic') {
      // Apply advanced properties for italic
      if (template?.characterRules.italic.advanced) {
        Object.entries(template.characterRules.italic.advanced).forEach(([key, value]) => {
          (wrapper.style as any)[key] = value;
        });
      }
    }
    
    if (mark.type.name === 'underline') {
      if (template?.characterRules.underline.style) {
        (wrapper as HTMLElement).style.textDecorationStyle = template.characterRules.underline.style;
      }
      if (template?.characterRules.underline.color) {
        (wrapper as HTMLElement).style.textDecorationColor = template.characterRules.underline.color;
      }
      // Apply advanced properties last to override defaults
      if (template?.characterRules.underline.advanced) {
        Object.entries(template.characterRules.underline.advanced).forEach(([key, value]) => {
          (wrapper.style as any)[key] = value;
        });
      }
    }
    
    if (mark.type.name === 'superscript' && template?.characterRules.superscript.fontSize) {
      (wrapper as HTMLElement).style.fontSize = template.characterRules.superscript.fontSize;
    }
    
    if (mark.type.name === 'subscript' && template?.characterRules.subscript.fontSize) {
      (wrapper as HTMLElement).style.fontSize = template.characterRules.subscript.fontSize;
    }
    
    // Handle link marks specially (need href attribute and template link styles)
    if (mark.type.name === 'link') {
      (wrapper as HTMLAnchorElement).href = mark.attrs.href;
      if (mark.attrs.title) {
        (wrapper as HTMLAnchorElement).title = mark.attrs.title;
      }
      
      // Apply template link styles
      if (template?.linkRules.color) {
        (wrapper as HTMLElement).style.color = template.linkRules.color;
      }
      if (template?.linkRules.underline) {
        (wrapper as HTMLElement).style.textDecoration = 'underline';
      } else {
        (wrapper as HTMLElement).style.textDecoration = 'none';
      }
    }
    
    wrapper.appendChild(element);
    element = wrapper;
  });
  
  return element;
}

/**
 * Map mark type to HTML tag
 */
function getMarkTag(markName: string): string {
  switch (markName) {
    case 'bold':
      return 'strong';
    case 'italic':
      return 'em';
    case 'underline':
      return 'u';
    case 'link':
      return 'a';
    case 'superscript':
      return 'sup';
    case 'subscript':
      return 'sub';
    default:
      console.warn(`[Serializer] Unknown mark type: ${markName}`);
      return 'span';
  }
}

/**
 * Apply template style object to HTML element
 */
function applyStyleToElement(element: HTMLElement, style: any): void {
  if (style.fontFamily) element.style.fontFamily = style.fontFamily;
  if (style.fontSize) element.style.fontSize = style.fontSize;
  if (style.fontWeight) element.style.fontWeight = String(style.fontWeight);
  if (style.lineHeight) element.style.lineHeight = String(style.lineHeight);
  if (style.color) element.style.color = style.color;
  if (style.marginTop) element.style.marginTop = style.marginTop;
  if (style.marginBottom) element.style.marginBottom = style.marginBottom;
  if (style.textAlign) element.style.textAlign = style.textAlign;
  if (style.letterSpacing) element.style.letterSpacing = style.letterSpacing;
  if (style.textTransform) element.style.textTransform = style.textTransform;
  if (style.textDecoration) element.style.textDecoration = style.textDecoration;
  if (style.borderTop) element.style.borderTop = style.borderTop;
  if (style.borderBottom) element.style.borderBottom = style.borderBottom;
  if (style.padding) element.style.padding = style.padding;
  
  // Apply advanced properties last to override defaults
  if (style.advanced) {
    Object.entries(style.advanced).forEach(([key, value]) => {
      (element.style as any)[key] = value;
    });
  }
}