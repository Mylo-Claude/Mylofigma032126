3B: Update Pagination Integration
Files to Change
•	/src/app/services/pagination.ts
•	/src/app/contributor/preview/PaginatedDocumentRenderer.tsx
Changes to pagination.ts
3B.1: Extend PaginationOptions interface
/**
 * Options for pagination service.
 * 
 * MIGRATION: Supports both old and new rendering paths.
 */
interface PaginationOptions {
  content: string;
  
  // OLD PATH: Named template with wrapper class
  templateName?: 'default' | 'traditional' | 'legal' | 'modern';
  customPageCSS?: string;
  
  // NEW PATH: Complete stylesheet, no wrapper
  stylesheet?: string;
  
  onProgress?: (currentPage: number) => void;
}
3B.2: Update paginate function to support both paths
async paginate(options: PaginationOptions): Promise<PaginationResult> {
  const { content, templateName, customPageCSS, stylesheet, onProgress } = options;
  
  // Determine which path to use
  const useNewPath = !!stylesheet;
  
  if (useNewPath) {
    console.log('[Pagination] Using NEW path (stylesheet)');
  } else {
    console.log('[Pagination] Using OLD path (templateName + customPageCSS)');
  }
  
  // ... existing cancellation and container setup ...
  
  // Prepare content
  let preparedContent: string;
  
  if (useNewPath) {
    // NEW PATH: Content already prepared, just wrap for scoping
    preparedContent = `<div class="mylo-preview">${content}</div>`;
    console.log('[Pagination] Wrapped content with .mylo-preview');
  } else {
    // OLD PATH: Wrap with template class
    preparedContent = `<div class="template-${templateName}">${content}</div>`;
    console.log('[Pagination] Wrapped content with .template-${templateName}');
  }
  
  // Create DocumentFragment
  const template = document.createElement('template');
  template.innerHTML = preparedContent;
  const contentFragment = template.content;
  
  // Prepare stylesheets array
  const stylesheets: string[] = [];
  
  if (useNewPath && stylesheet) {
    // NEW PATH: Pass generated stylesheet
    stylesheets.push(stylesheet);
    console.log('[Pagination] Passing stylesheet to Paged.js, length:', stylesheet.length);
  } else {
    // OLD PATH: Empty array (CSS in <head>)
    console.log('[Pagination] Using empty stylesheets (old path)');
  }
  
  // Run Paged.js
  const paged = new Previewer();
  const flow = await paged.preview(
    contentFragment,
    stylesheets,
    renderContainer
  );
  
  // OLD PATH: Inject custom CSS into <head> if provided
  if (!useNewPath && customPageCSS) {
    console.log('[Pagination] Injecting customPageCSS into <head> (old path)');
    const existingStyle = document.getElementById('mylo-page-styles');
    if (existingStyle) {
      existingStyle.remove();
    }
    
    const styleElement = document.createElement('style');
    styleElement.id = 'mylo-page-styles';
    styleElement.textContent = customPageCSS;
    document.head.appendChild(styleElement);
  }
  
  // ... rest of pagination logic ...
  
  return {
    pageCount: flow.total,
    success: true,
  };
}
Changes to PaginatedDocumentRenderer.tsx
3B.3: Add feature flag and path selection logic
// At top of file, after imports:

/**
 * Feature flag: Use new CSS generation path.
 * 
 * false = OLD path (inline styles, named @page rules)
 * true = NEW path (generated CSS, semantic HTML)
 * 
 * Change this to test new path with migrated templates.
 */
const USE_NEW_CSS_PATH = false;
3B.4: Update imports
import { generateTemplateStylesheet } from '../../services/pageLayoutUtils';
import { generatePageMarginCSS } from '../../services/pageLayoutUtils'; // Keep for old path
import { isTemplateV2 } from '../../mylo/types';
3B.5: Update pagination effect with dual path logic
useEffect(() => {
  // ... existing setup ...
  
  const runPagination = async () => {
    try {
      // Determine which path to use
      const shouldUseNewPath = USE_NEW_CSS_PATH && isTemplateV2(template);
      
      if (shouldUseNewPath) {
        console.log('[Renderer] Using NEW path for template:', template.id);
        
        // NEW PATH
        // 1. Generate complete stylesheet
        const stylesheet = generateTemplateStylesheet(template);
        
        // 2. Serialize to semantic HTML (no template param)
        const html = serializeToHTML(doc);
        
        // 3. Paginate with stylesheet
        const result = await paginationService.paginate({
          content: html,
          stylesheet,
          onProgress: (currentPage) => {
            console.log('[Pagination] Progress:', currentPage);
          },
        });
        
        setPageCount(result.pageCount);
        
      } else {
        console.log('[Renderer] Using OLD path for template:', template.id);
        
        // OLD PATH (existing logic)
        // 1. Generate margin CSS
        let customPageCSS: string | undefined = undefined;
        if (template.pageLayout?.margins) {
          customPageCSS = generatePageMarginCSS(
            template.pageLayout.margins,
            template.id
          );
        }
        
        // 2. Map template ID to name
        let templateName: 'default' | 'traditional' | 'legal' | 'modern';
        if (template.id.includes('legal')) {
          templateName = 'legal';
        } else if (template.id.includes('traditional')) {
          templateName = 'traditional';
        } else if (template.id.includes('modern')) {
          templateName = 'modern';
        } else {
          templateName = 'default';
        }
        
        // 3. Serialize with template (inline styles)
        const html = serializeToHTML(doc, template);
        
        // 4. Paginate with old options
        const result = await paginationService.paginate({
          content: html,
          templateName,
          customPageCSS,
          onProgress: (currentPage) => {
            console.log('[Pagination] Progress:', currentPage);
          },
        });
        
        setPageCount(result.pageCount);
      }
      
    } catch (error) {
      console.error('[Pagination] Error:', error);
      setError(error as Error);
    }
  };
  
  runPagination();
  
}, [doc, template]);
