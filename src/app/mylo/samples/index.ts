/**
 * Sample documents barrel export
 */

export * from './types';
export { welcome } from './welcome';
export { formattingGuide } from './formatting-guide';
export { longDocument } from './long-document';
export { blankDocument } from './blank-document';
export { sampleToEditorState } from './converter';

import { welcome } from './welcome';
import { formattingGuide } from './formatting-guide';
import { longDocument } from './long-document';
import { blankDocument } from './blank-document';

/**
 * Array of all available sample documents
 */
export const sampleDocuments = [welcome, formattingGuide, longDocument, blankDocument];