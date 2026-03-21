/**
 * Sample document type system
 * Defines a simplified structure that maps to Mylo's content model
 */

/**
 * Character-level formatting marks
 */
export type Mark =
  | { type: 'bold' }
  | { type: 'italic' }
  | { type: 'underline' }
  | { type: 'superscript' }
  | { type: 'subscript' }
  | { type: 'link'; href: string };

/**
 * Text with optional formatting marks
 */
export interface TextRun {
  text: string;
  marks?: Mark[];
}

/**
 * List item with support for nesting
 */
export interface ListItem {
  content: TextRun[];
  children?: ListItem[]; // For nested lists
}

/**
 * Content block types that map to Mylo paragraph structures
 */
export type ContentBlock =
  | { type: 'heading1'; content: TextRun[] }
  | { type: 'heading2'; content: TextRun[] }
  | { type: 'heading3'; content: TextRun[] }
  | { type: 'body'; content: TextRun[] }
  | { type: 'bulletedList'; items: ListItem[] }
  | { type: 'orderedList'; items: ListItem[] };

/**
 * A complete sample document
 */
export interface SampleDocument {
  id: string;
  name: string;
  description?: string;
  content: ContentBlock[];
}
