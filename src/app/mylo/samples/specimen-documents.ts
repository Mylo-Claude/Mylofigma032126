/**
 * @file samples/specimen-documents.ts
 * @role Specimen documents for Template Editor preview
 * @owns Four fixed SampleDocument objects that exercise every style level
 *       simultaneously so Template Editors can see all styles while editing.
 * @does-not-own Sample documents shown to contributors (those live in the existing
 *               samples barrel — welcome, formattingGuide, longDocument, blankDocument).
 *
 * Each specimen is written to render a representative page at print scale:
 * - All four paragraph types (H1, H2, H3, body)
 * - Bold and italic character marks
 * - Bulleted list with nested items
 * - Numbered list
 *
 * @governance Template Editor only — not imported into the Contributor editor
 * @see mylo/samples/types.ts — SampleDocument interface
 * @see templates/TemplateEditorPage.tsx — primary consumer
 */

import type { SampleDocument } from './types';

// ---------------------------------------------------------------------------
// 1. Typography Specimen — one of each style, default specimen
// ---------------------------------------------------------------------------

const typographySpecimen: SampleDocument = {
  id: 'specimen-typography',
  name: 'Typography Specimen',
  description: 'One of each style level — shows all paragraph and character styles simultaneously.',
  content: [
    {
      type: 'heading1',
      content: [{ text: 'Heading One — Document Title' }],
    },
    {
      type: 'body',
      content: [
        { text: 'This is a body paragraph. It demonstrates the base text style — ' },
        { text: 'font family', marks: [{ type: 'bold' }] },
        { text: ', size, line height, and tracking all apply here. ' },
        { text: 'Italic text', marks: [{ type: 'italic' }] },
        { text: ' appears inline alongside regular text to show the character style contrast.' },
      ],
    },
    {
      type: 'heading2',
      content: [{ text: 'Heading Two — Section Title' }],
    },
    {
      type: 'body',
      content: [
        { text: 'The paragraph spacing is controlled by Space Before and Space After. ' },
        { text: 'Bold text', marks: [{ type: 'bold' }] },
        { text: ' draws attention to key terms. The template defines whether bold changes ' },
        { text: 'color', marks: [{ type: 'bold' }] },
        { text: ', weight, or both.' },
      ],
    },
    {
      type: 'heading3',
      content: [{ text: 'Heading Three — Subsection' }],
    },
    {
      type: 'body',
      content: [
        { text: 'A second body paragraph follows the heading. First line indent and left ' },
        { text: 'indent control the paragraph inset. This line is long enough to wrap ' },
        { text: 'across two lines at typical page widths so line height is visible.' },
      ],
    },
    {
      type: 'heading2',
      content: [{ text: 'Lists and Enumeration' }],
    },
    {
      type: 'bulletedList',
      items: [
        {
          content: [
            { text: 'First bullet item — ' },
            { text: 'bold inline text', marks: [{ type: 'bold' }] },
          ],
          children: [
            {
              content: [{ text: 'Nested child item — indentation and marker change at depth two' }],
            },
            {
              content: [{ text: 'Second nested child' }],
            },
          ],
        },
        {
          content: [
            { text: 'Second bullet item with ' },
            { text: 'italic text', marks: [{ type: 'italic' }] },
            { text: ' included' },
          ],
        },
        {
          content: [{ text: 'Third bullet item — no inline marks' }],
        },
      ],
    },
    {
      type: 'orderedList',
      items: [
        {
          content: [{ text: 'First numbered item' }],
        },
        {
          content: [
            { text: 'Second numbered item with ' },
            { text: 'bold', marks: [{ type: 'bold' }] },
            { text: ' text' },
          ],
        },
        {
          content: [{ text: 'Third numbered item' }],
        },
      ],
    },
    {
      type: 'body',
      content: [{ text: 'A closing paragraph after the lists shows the space-after value in context.' }],
    },
  ],
};

// ---------------------------------------------------------------------------
// 2. Report Specimen — multi-section corporate report structure
// ---------------------------------------------------------------------------

const reportSpecimen: SampleDocument = {
  id: 'specimen-report',
  name: 'Report',
  description: 'Multi-section report — tests H1 and H2 cadence across a longer layout.',
  content: [
    {
      type: 'heading1',
      content: [{ text: 'Annual Performance Review' }],
    },
    {
      type: 'body',
      content: [
        { text: 'This report summarises the key findings from the annual review cycle. ' },
        { text: 'Prepared by the Strategy team', marks: [{ type: 'italic' }] },
        { text: ' for executive review.' },
      ],
    },
    {
      type: 'heading2',
      content: [{ text: 'Executive Summary' }],
    },
    {
      type: 'body',
      content: [
        { text: 'Overall performance exceeded targets in three of five categories. ' },
        { text: 'Revenue grew by 14% year-over-year', marks: [{ type: 'bold' }] },
        { text: ', driven primarily by expansion in the enterprise segment.' },
      ],
    },
    {
      type: 'body',
      content: [
        { text: 'Customer satisfaction scores reached an all-time high of 4.7 out of 5.0 ' },
        { text: 'across all product lines. Operational costs remained within budget.' },
      ],
    },
    {
      type: 'heading2',
      content: [{ text: 'Key Metrics' }],
    },
    {
      type: 'heading3',
      content: [{ text: 'Revenue Performance' }],
    },
    {
      type: 'bulletedList',
      items: [
        { content: [{ text: 'Enterprise revenue: +22% YoY' }] },
        { content: [{ text: 'SMB revenue: +8% YoY' }] },
        { content: [{ text: 'Recurring revenue: 68% of total (up from 61%)' }] },
      ],
    },
    {
      type: 'heading3',
      content: [{ text: 'Operational Highlights' }],
    },
    {
      type: 'orderedList',
      items: [
        { content: [{ text: 'Reduced average time-to-close by 18 days' }] },
        { content: [{ text: 'Onboarded 3 strategic partnerships' }] },
        { content: [{ text: 'Launched new self-serve portal in Q3' }] },
      ],
    },
    {
      type: 'heading2',
      content: [{ text: 'Outlook' }],
    },
    {
      type: 'body',
      content: [
        { text: 'The coming year presents both challenges and opportunities. The team is ' },
        { text: 'well-positioned to deliver continued growth', marks: [{ type: 'bold' }] },
        { text: ' provided market conditions remain stable.' },
      ],
    },
  ],
};

// ---------------------------------------------------------------------------
// 3. Letter Specimen — short single-page formal letter
// ---------------------------------------------------------------------------

const letterSpecimen: SampleDocument = {
  id: 'specimen-letter',
  name: 'Letter',
  description: 'Single-page formal letter — tests body text at scale with minimal heading use.',
  content: [
    {
      type: 'heading1',
      content: [{ text: 'Formal Correspondence' }],
    },
    {
      type: 'body',
      content: [{ text: '29 March 2026' }],
    },
    {
      type: 'body',
      content: [
        { text: 'Dear Selection Committee,' },
      ],
    },
    {
      type: 'body',
      content: [
        { text: 'I write to express my strong support for the proposed initiative. ' },
        { text: 'The programme addresses a long-standing gap', marks: [{ type: 'bold' }] },
        { text: ' in the current offering and aligns well with the strategic goals ' },
        { text: 'outlined in the annual plan.' },
      ],
    },
    {
      type: 'body',
      content: [
        { text: 'The proposed timeline is ' },
        { text: 'ambitious but achievable', marks: [{ type: 'italic' }] },
        { text: '. I recommend the committee consider the following priorities when ' },
        { text: 'allocating resources:' },
      ],
    },
    {
      type: 'orderedList',
      items: [
        { content: [{ text: 'Secure stakeholder alignment before the end of Q2' }] },
        { content: [{ text: 'Confirm vendor selection no later than 15 April' }] },
        { content: [{ text: 'Schedule a mid-point review at the 90-day mark' }] },
      ],
    },
    {
      type: 'body',
      content: [
        { text: 'I remain available to discuss any aspects of this submission at your convenience.' },
      ],
    },
    {
      type: 'body',
      content: [
        { text: 'Yours sincerely,' },
      ],
    },
    {
      type: 'heading3',
      content: [{ text: 'The Authors' }],
    },
    {
      type: 'body',
      content: [{ text: 'Strategy & Planning Division' }],
    },
  ],
};

// ---------------------------------------------------------------------------
// 4. Press Release Specimen — heading-heavy formal announcement structure
// ---------------------------------------------------------------------------

const pressReleaseSpecimen: SampleDocument = {
  id: 'specimen-press-release',
  name: 'Press Release',
  description: 'Heading-heavy formal announcement — tests H1/H2/H3 density and bold emphasis.',
  content: [
    {
      type: 'heading1',
      content: [{ text: 'FOR IMMEDIATE RELEASE' }],
    },
    {
      type: 'heading2',
      content: [{ text: 'Company Announces Record Growth and Strategic Expansion Plans' }],
    },
    {
      type: 'body',
      content: [
        { text: 'City, Date — ' },
        { text: 'Acme Corporation', marks: [{ type: 'bold' }] },
        { text: ' today announced record revenue of $2.4 billion for fiscal year 2025, ' },
        { text: 'representing a 31% increase', marks: [{ type: 'bold' }] },
        { text: ' over the prior year.' },
      ],
    },
    {
      type: 'heading3',
      content: [{ text: 'Financial Highlights' }],
    },
    {
      type: 'bulletedList',
      items: [
        {
          content: [
            { text: 'Full-year revenue: ' },
            { text: '$2.4 billion', marks: [{ type: 'bold' }] },
            { text: ' (up 31% YoY)' },
          ],
        },
        { content: [{ text: 'Operating margin: 22% (up from 17%)' }] },
        { content: [{ text: 'Net new customers: 4,200 enterprise accounts' }] },
      ],
    },
    {
      type: 'heading3',
      content: [{ text: 'Strategic Initiatives' }],
    },
    {
      type: 'body',
      content: [
        { text: 'The company will invest heavily in ' },
        { text: 'international expansion', marks: [{ type: 'italic' }] },
        { text: ' over the next 24 months, targeting the European and Asia-Pacific markets.' },
      ],
    },
    {
      type: 'heading2',
      content: [{ text: 'About Acme Corporation' }],
    },
    {
      type: 'body',
      content: [
        { text: 'Acme Corporation is a global leader in enterprise software. ' },
        { text: 'Founded in 2001', marks: [{ type: 'italic' }] },
        { text: ', the company serves over 15,000 customers across 60 countries.' },
      ],
    },
    {
      type: 'body',
      content: [{ text: '### END ###' }],
    },
  ],
};

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

/**
 * All four specimen documents.
 * The default (index 0) is displayed when the Template Editor first opens.
 */
export const specimenDocuments: SampleDocument[] = [
  typographySpecimen,
  reportSpecimen,
  letterSpecimen,
  pressReleaseSpecimen,
];

/** Default specimen — Typography Specimen, shows every style simultaneously. */
export const defaultSpecimen: SampleDocument = typographySpecimen;
