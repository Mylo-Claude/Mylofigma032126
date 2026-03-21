import type { SampleDocument } from './types';

/**
 * Long Document - 2026 Annual Market Analysis (~3+ pages)
 */
export const longDocument: SampleDocument = {
  id: 'long-document',
  name: 'Long Document',
  description: 'Extended document to test pagination and scrolling',
  content: [
    {
      type: 'heading1',
      content: [{ text: '2026 Annual Market Analysis' }],
    },
    {
      type: 'heading2',
      content: [{ text: 'Executive Summary' }],
    },
    {
      type: 'body',
      content: [
        { text: 'This report provides an overview of current market conditions, key growth drivers, and emerging challenges in the software-as-a-service (SaaS) sector. Over the past year, the industry has experienced significant expansion, driven by the adoption of cloud-based solutions, AI integration, and demand for remote collaboration tools.' },
      ],
    },
    {
      type: 'body',
      content: [
        { text: 'The following sections outline market performance, notable trends, and strategic recommendations for stakeholders.' },
      ],
    },
    {
      type: 'heading2',
      content: [{ text: 'Market Overview' }],
    },
    {
      type: 'heading3',
      content: [{ text: 'Industry Growth' }],
    },
    {
      type: 'body',
      content: [
        { text: 'The SaaS market grew by ' },
        { text: '18%', marks: [{ type: 'bold' }] },
        { text: ' year-over-year, reaching a total valuation of ' },
        { text: '$253 billion', marks: [{ type: 'bold' }] },
        { text: '. This growth is attributed to:' },
      ],
    },
    {
      type: 'bulletedList',
      items: [
        { content: [{ text: 'Increased digital transformation initiatives' }] },
        { content: [{ text: 'Wider acceptance of subscription-based pricing models' }] },
        { content: [{ text: 'Rapid deployment of AI-enhanced productivity software' }] },
      ],
    },
    {
      type: 'heading3',
      content: [{ text: 'Competitive Landscape' }],
    },
    {
      type: 'body',
      content: [
        { text: 'Key players in the industry continue to consolidate market share through scale, distribution, and brand dominance, but meaningful opportunities still exist for niche solutions that offer highly specialized features, serve underserved segments, or differentiate themselves through strong branding, tailored experiences, or deep domain expertise.' },
      ],
    },
    {
      type: 'heading3',
      content: [{ text: 'Regional Performance' }],
    },
    {
      type: 'body',
      content: [
        { text: 'Regional market dynamics varied significantly across key territories:' },
      ],
    },
    {
      type: 'bulletedList',
      items: [
        {
          content: [
            { text: 'North America', marks: [{ type: 'bold' }] },
            { text: ' maintained its position as the largest market with 42% share, driven by enterprise adoption' },
          ],
        },
        {
          content: [
            { text: 'Europe', marks: [{ type: 'bold' }] },
            { text: ' showed strong growth at 22% year-over-year, particularly in regulated industries' },
          ],
        },
        {
          content: [
            { text: 'Asia-Pacific', marks: [{ type: 'bold' }] },
            { text: ' emerged as the fastest-growing region with 31% expansion, led by SMB adoption' },
          ],
        },
      ],
    },
    {
      type: 'heading2',
      content: [{ text: 'Key Drivers of Growth' }],
    },
    {
      type: 'heading3',
      content: [{ text: 'Cloud Adoption' }],
    },
    {
      type: 'body',
      content: [
        { text: 'Organizations of all sizes are moving infrastructure to the cloud, seeking scalability, security, and cost efficiency.' },
      ],
    },
    {
      type: 'body',
      content: [
        { text: 'Migration patterns indicate that mid-market companies are now adopting cloud solutions at rates previously seen only in enterprise segments. This democratization of cloud infrastructure has created new opportunities for vendors offering streamlined onboarding experiences and simplified pricing structures.' },
      ],
    },
    {
      type: 'heading3',
      content: [{ text: 'AI-Powered Features' }],
    },
    {
      type: 'body',
      content: [
        { text: 'AI tools that automate workflows and provide predictive insights are becoming a standard expectation in modern SaaS offerings.' },
      ],
    },
    {
      type: 'body',
      content: [
        { text: 'Key applications include:' },
      ],
    },
    {
      type: 'orderedList',
      items: [
        { content: [{ text: 'Automated data analysis and reporting' }] },
        { content: [{ text: 'Natural language processing for customer support' }] },
        { content: [{ text: 'Predictive maintenance and anomaly detection' }] },
        { content: [{ text: 'Intelligent workflow automation and optimization' }] },
      ],
    },
    {
      type: 'heading3',
      content: [{ text: 'Remote Collaboration Demand' }],
    },
    {
      type: 'body',
      content: [
        { text: 'The sustained shift to hybrid work models has created ongoing demand for collaboration platforms that enable distributed teams to work effectively across time zones and locations.' },
      ],
    },
    {
      type: 'body',
      content: [
        { text: 'Tools that integrate communication, project management, and document collaboration into unified experiences continue to gain market share, while point solutions face increasing pressure to demonstrate clear differentiation or integration capabilities.' },
      ],
    },
    {
      type: 'heading2',
      content: [{ text: 'Emerging Challenges' }],
    },
    {
      type: 'heading3',
      content: [{ text: 'Market Saturation' }],
    },
    {
      type: 'body',
      content: [
        { text: 'Many product categories now feature dozens of competing solutions, making customer acquisition increasingly expensive and differentiation more critical. Vendors must identify clear positioning strategies to stand out in crowded markets.' },
      ],
    },
    {
      type: 'heading3',
      content: [{ text: 'Economic Headwinds' }],
    },
    {
      type: 'body',
      content: [
        { text: 'Budget scrutiny has intensified across enterprise and SMB segments. Purchasing decisions now involve:' },
      ],
    },
    {
      type: 'bulletedList',
      items: [
        { content: [{ text: 'Longer evaluation cycles with more stakeholders' }] },
        { content: [{ text: 'Greater emphasis on demonstrated ROI and clear business outcomes' }] },
        { content: [{ text: 'Preference for consolidation over point solutions' }] },
        { content: [{ text: 'Increased price sensitivity and negotiation pressure' }] },
      ],
    },
    {
      type: 'heading3',
      content: [{ text: 'Security and Compliance Requirements' }],
    },
    {
      type: 'body',
      content: [
        { text: 'Regulatory frameworks continue to evolve across jurisdictions, requiring vendors to maintain compliance with:' },
      ],
    },
    {
      type: 'bulletedList',
      items: [
        {
          content: [{ text: 'Data residency and sovereignty requirements' }],
          children: [
            { content: [{ text: 'Regional data center infrastructure' }] },
            { content: [{ text: 'Cross-border data transfer mechanisms' }] },
          ],
        },
        {
          content: [{ text: 'Industry-specific regulations' }],
          children: [
            { content: [{ text: 'Healthcare (HIPAA, GDPR)' }] },
            { content: [{ text: 'Financial services (SOC 2, PCI-DSS)' }] },
            { content: [{ text: 'Government (FedRAMP, ITAR)' }] },
          ],
        },
        {
          content: [{ text: 'Privacy and data protection standards' }],
        },
      ],
    },
    {
      type: 'heading2',
      content: [{ text: 'Strategic Recommendations' }],
    },
    {
      type: 'heading3',
      content: [{ text: 'Expand Product Offerings' }],
    },
    {
      type: 'body',
      content: [
        { text: 'Introduce complementary features that seamlessly integrate with existing customer workflows, enhancing day-to-day usability and delivering added value, in order to increase customer retention, drive deeper product engagement, and create more effective upsell and cross-sell opportunities over time.' },
      ],
    },
    {
      type: 'body',
      content: [
        { text: 'Priority areas for feature development:' },
      ],
    },
    {
      type: 'bulletedList',
      items: [
        { content: [{ text: 'API integrations with popular business platforms' }] },
        { content: [{ text: 'Advanced analytics and reporting capabilities' }] },
        { content: [{ text: 'Workflow automation and customization tools' }] },
        { content: [{ text: 'Mobile-first experiences for field teams' }] },
      ],
    },
    {
      type: 'heading3',
      content: [{ text: 'Invest in Customer Success' }],
    },
    {
      type: 'body',
      content: [
        { text: 'With acquisition costs rising and retention becoming paramount, dedicated customer success programs deliver measurable impact on net revenue retention and customer lifetime value.' },
      ],
    },
    {
      type: 'body',
      content: [
        { text: 'Recommended initiatives include:' },
      ],
    },
    {
      type: 'orderedList',
      items: [
        { content: [{ text: 'Proactive onboarding programs with clear success milestones' }] },
        { content: [{ text: 'Regular business reviews and optimization recommendations' }] },
        { content: [{ text: 'In-product guidance and contextual help resources' }] },
        { content: [{ text: 'Community forums and peer learning opportunities' }] },
      ],
    },
    {
      type: 'heading3',
      content: [{ text: 'Strengthen Security Posture' }],
    },
    {
      type: 'body',
      content: [
        { text: 'Security capabilities increasingly influence purchase decisions, particularly in enterprise segments. Organizations should prioritize:' },
      ],
    },
    {
      type: 'bulletedList',
      items: [
        { content: [{ text: 'SOC 2 Type II and ISO 27001 certifications' }] },
        { content: [{ text: 'Advanced encryption for data at rest and in transit' }] },
        { content: [{ text: 'Granular access controls and audit logging' }] },
        { content: [{ text: 'Regular third-party security assessments' }] },
      ],
    },
    {
      type: 'heading2',
      content: [{ text: 'Market Outlook' }],
    },
    {
      type: 'body',
      content: [
        { text: 'Looking ahead to 2027, the SaaS market is projected to maintain strong growth momentum, albeit at a moderated pace of 14-16% year-over-year. Success will favor vendors who demonstrate clear value propositions, maintain operational discipline, and continue innovating in response to customer needs.' },
      ],
    },
    {
      type: 'body',
      content: [
        { text: 'Key factors that will shape the competitive landscape include:' },
      ],
    },
    {
      type: 'bulletedList',
      items: [
        { content: [{ text: 'AI integration becoming table stakes rather than differentiator' }] },
        { content: [{ text: 'Platform consolidation creating both threats and partnership opportunities' }] },
        { content: [{ text: 'Vertical-specific solutions gaining traction over horizontal platforms' }] },
        { content: [{ text: 'Usage-based pricing models becoming more prevalent' }] },
      ],
    },
    {
      type: 'heading2',
      content: [{ text: 'Conclusion' }],
    },
    {
      type: 'body',
      content: [
        { text: 'The SaaS industry continues to offer substantial opportunities for growth and innovation. While competitive pressures and economic uncertainties present real challenges, organizations that focus on customer outcomes, product excellence, and operational efficiency are well-positioned to capture market share and build sustainable businesses.' },
      ],
    },
    {
      type: 'body',
      content: [
        { text: 'This analysis suggests that success in 2027 will require balancing investment in innovation with disciplined go-to-market execution, maintaining a clear focus on solving real customer problems, and building differentiated capabilities that are difficult for competitors to replicate.' },
      ],
    },
    {
      type: 'body',
      content: [
        { text: 'For questions or additional analysis, please contact the research team at ' },
        { text: 'research@example.com', marks: [{ type: 'link', href: 'mailto:research@example.com' }] },
        { text: '.' },
      ],
    },
  ],
};
