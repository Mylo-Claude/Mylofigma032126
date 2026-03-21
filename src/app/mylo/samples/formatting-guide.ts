import type { SampleDocument } from './types';

/**
 * Formatting Guide - Font specimen style demonstration
 */
export const formattingGuide: SampleDocument = {
  id: 'formatting-guide',
  name: 'Formatting Guide',
  description: 'Comprehensive demonstration of all formatting types',
  content: [
    {
      type: 'heading1',
      content: [{ text: 'Heading 1' }],
    },
    {
      type: 'heading2',
      content: [{ text: 'Heading 2' }],
    },
    {
      type: 'heading3',
      content: [{ text: 'Heading 3' }],
    },
    {
      type: 'body',
      content: [{ text: 'Body paragraph' }],
    },
    {
      type: 'body',
      content: [{ text: 'Bold', marks: [{ type: 'bold' }] }],
    },
    {
      type: 'body',
      content: [{ text: 'Italic', marks: [{ type: 'italic' }] }],
    },
    {
      type: 'body',
      content: [{ text: 'Underline', marks: [{ type: 'underline' }] }],
    },
    {
      type: 'body',
      content: [{ text: 'Bold Italic', marks: [{ type: 'bold' }, { type: 'italic' }] }],
    },
    {
      type: 'body',
      content: [{ text: 'Bold Italic Underline', marks: [{ type: 'bold' }, { type: 'italic' }, { type: 'underline' }] }],
    },
    {
      type: 'body',
      content: [{ text: 'Link', marks: [{ type: 'link', href: 'https://example.com' }] }],
    },
    {
      type: 'body',
      content: [
        { text: 'Super' },
        { text: 'script', marks: [{ type: 'superscript' }] },
      ],
    },
    {
      type: 'body',
      content: [
        { text: 'Sub' },
        { text: 'script', marks: [{ type: 'subscript' }] },
      ],
    },
    {
      type: 'body',
      content: [{ text: 'Lists' }],
    },
    {
      type: 'bulletedList',
      items: [
        { content: [{ text: 'Bullet item 1' }] },
        { content: [{ text: 'Bullet item 2' }] },
        { content: [{ text: 'Bullet item 3' }] },
      ],
    },
    {
      type: 'bulletedList',
      items: [
        {
          content: [{ text: 'Nested bullet level 1' }],
          children: [
            {
              content: [{ text: 'Nested bullet level 2' }],
              children: [
                { content: [{ text: 'Nested bullet level 3' }] },
              ],
            },
          ],
        },
      ],
    },
    {
      type: 'orderedList',
      items: [
        { content: [{ text: 'Ordered item 1' }] },
        { content: [{ text: 'Ordered item 2' }] },
        { content: [{ text: 'Ordered item 3' }] },
      ],
    },
    {
      type: 'orderedList',
      items: [
        {
          content: [{ text: 'Nested ordered level 1' }],
          children: [
            {
              content: [{ text: 'Nested ordered level 2' }],
              children: [
                { content: [{ text: 'Nested ordered level 3' }] },
              ],
            },
          ],
        },
      ],
    },
  ],
};