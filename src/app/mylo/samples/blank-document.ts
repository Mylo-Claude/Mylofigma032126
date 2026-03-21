import type { SampleDocument } from './types';

/**
 * Blank Document - Empty canvas for users to start typing
 */
export const blankDocument: SampleDocument = {
  id: 'blank-document',
  name: 'Blank Document',
  description: 'Start with a clean slate',
  content: [
    {
      type: 'body',
      content: [{ text: 'Start typing here...' }],
    },
  ],
};
