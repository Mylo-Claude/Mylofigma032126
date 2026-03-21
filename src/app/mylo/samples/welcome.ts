import type { SampleDocument } from './types';

/**
 * Welcome to Mylo - Initial sample document
 * Conversational introduction guiding users through first interactions
 */
export const welcome: SampleDocument = {
  id: 'welcome',
  name: 'Welcome to Mylo',
  description: 'Introduction to the Mylo document system',
  content: [
    {
      type: 'heading1',
      content: [{ text: 'Welcome to Mylo' }],
    },
    {
      type: 'body',
      content: [
        {
          text: 'Mylo is a document platform where you write in the Editor (left) and see template-governed output in the Preview (right). The template controls how your content looks—you focus on structure and writing.',
        },
      ],
    },
    {
      type: 'heading2',
      content: [{ text: 'Getting Started' }],
    },
    {
      type: 'body',
      content: [{ text: 'Try these to explore how Mylo works:' }],
    },
    {
      type: 'bulletedList',
      items: [
        {
          content: [
            { text: 'Switch between templates using the dropdown in the Preview panel toolbar' },
          ],
        },
        {
          content: [{ text: 'Load sample documents from the Sample Text menu in the Editor toolbar' }],
        },
        {
          content: [{ text: 'Start typing here and watch the Preview update in real-time' }],
        },
        {
          content: [{ text: 'Select text to see formatting options like bold, italic, and headings' }],
        },
        {
          content: [{ text: 'Insert manual page breaks to control pagination in the Preview' }],
        },
      ],
    },
    {
      type: 'body',
      content: [
        { text: 'Notice how the Editor uses simple drafting typography while the Preview shows the template\'s professional styling. This separation means you can focus on content while the template ensures consistent formatting.' },
      ],
    },
  ],
};