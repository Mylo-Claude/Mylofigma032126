import { Schema, Node as ProseMirrorNode } from 'prosemirror-model';
import { EditorState } from 'prosemirror-state';
import type { SampleDocument, ContentBlock, TextRun, ListItem, Mark } from './types';

/**
 * Converts a SampleDocument to a ProseMirror EditorState
 * 
 * @param sample - The sample document to convert
 * @param schema - The ProseMirror schema to use
 * @returns A valid EditorState ready for the editor
 */
export function sampleToEditorState(
  sample: SampleDocument,
  schema: Schema
): EditorState {
  const blocks = sample.content.map((block) => convertBlock(block, schema));
  const doc = schema.node('doc', null, blocks);

  return EditorState.create({
    doc,
    schema,
  });
}

/**
 * Converts a ContentBlock to a ProseMirror node
 */
function convertBlock(block: ContentBlock, schema: Schema): ProseMirrorNode {
  switch (block.type) {
    case 'heading1':
      return schema.node('paragraph', { type: 'heading1' }, convertTextRuns(block.content, schema));

    case 'heading2':
      return schema.node('paragraph', { type: 'heading2' }, convertTextRuns(block.content, schema));

    case 'heading3':
      return schema.node('paragraph', { type: 'heading3' }, convertTextRuns(block.content, schema));

    case 'body':
      return schema.node('paragraph', { type: 'body' }, convertTextRuns(block.content, schema));

    case 'bulletedList':
      return schema.node(
        'bullet_list',
        null,
        block.items.map((item) => convertListItem(item, schema))
      );

    case 'orderedList':
      return schema.node(
        'ordered_list',
        { start: 1 },
        block.items.map((item) => convertListItem(item, schema))
      );

    default:
      // TypeScript exhaustiveness check
      const _exhaustive: never = block;
      throw new Error(`Unknown block type: ${(_exhaustive as ContentBlock).type}`);
  }
}

/**
 * Converts a ListItem to a ProseMirror list_item node
 */
function convertListItem(item: ListItem, schema: Schema): ProseMirrorNode {
  const content: ProseMirrorNode[] = [];

  // Add the main paragraph content
  content.push(schema.node('paragraph', { type: 'body' }, convertTextRuns(item.content, schema)));

  // Add nested lists if present
  if (item.children && item.children.length > 0) {
    // Determine if this is a nested bullet or ordered list
    // For now, assume bullet list for nested items (can be enhanced later)
    const nestedList = schema.node(
      'bullet_list',
      null,
      item.children.map((child) => convertListItem(child, schema))
    );
    content.push(nestedList);
  }

  return schema.node('list_item', null, content);
}

/**
 * Converts an array of TextRuns to ProseMirror text nodes with marks
 */
function convertTextRuns(runs: TextRun[], schema: Schema): ProseMirrorNode[] {
  return runs.map((run) => {
    const marks = run.marks ? run.marks.map((mark) => convertMark(mark, schema)) : [];
    return schema.text(run.text, marks);
  });
}

/**
 * Converts a Mark to a ProseMirror mark
 */
function convertMark(mark: Mark, schema: Schema) {
  switch (mark.type) {
    case 'bold':
      return schema.marks.bold.create();

    case 'italic':
      return schema.marks.italic.create();

    case 'underline':
      return schema.marks.underline.create();

    case 'superscript':
      return schema.marks.superscript.create();

    case 'subscript':
      return schema.marks.subscript.create();

    case 'link':
      return schema.marks.link.create({ href: mark.href, title: null });

    default:
      // TypeScript exhaustiveness check
      const _exhaustive: never = mark;
      throw new Error(`Unknown mark type: ${(_exhaustive as Mark).type}`);
  }
}
