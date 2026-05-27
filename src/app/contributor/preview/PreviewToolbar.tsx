/**
 * @file contributor/preview/PreviewToolbar.tsx
 * @role Preview panel toolbar controls
 * @owns Template selector (published templates only), zoom mode selector.
 * @does-not-own Template data (TemplateContext), zoom calculation (usePreviewZoom),
 *               preview rendering (PaginatedDocumentRenderer).
 *
 * Template selector behaviour:
 * - Shows only published templates from TemplateContext.publishedTemplates.
 * - If no published templates exist, the dropdown is disabled with placeholder text.
 * - Template selection fires onTemplateChange; the parent (PreviewPanel → EditorPage)
 *   persists the new templateId to DocumentContext.
 *
 * @governance Contributor role — view state control only.
 * @see TemplateContext.tsx — publishedTemplates source
 * @see Mylo Governance: Preview enforcement model
 */

import type { Template } from "../../mylo/template";
import { useTemplates } from "../../contexts/TemplateContext";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "../../components/ui/select";
import type { ZoomMode } from "./types";

interface PreviewToolbarProps {
  selectedTemplate: Template;
  onTemplateChange: (template: Template) => void;
  zoomMode: ZoomMode;
  onZoomChange: (mode: ZoomMode) => void;
}

export function PreviewToolbar({
  selectedTemplate,
  onTemplateChange,
  zoomMode,
  onZoomChange,
}: PreviewToolbarProps) {
  const { publishedTemplates } = useTemplates();
  const hasPublished = publishedTemplates.length > 0;

  return (
    <>
      {/* Template selector */}
      <div className="flex items-center gap-3">
        <Select
          value={hasPublished ? selectedTemplate.id : undefined}
          onValueChange={(value) => {
            const template = publishedTemplates.find((t) => t.id === value);
            if (template) onTemplateChange(template);
          }}
          disabled={!hasPublished}
        >
          <SelectTrigger
            size="sm"
            id="template-select"
            className="focus:ring-0 focus:ring-offset-0 min-w-[120px]"
          >
            <SelectValue
              placeholder={hasPublished ? selectedTemplate.name : 'No templates'}
            />
          </SelectTrigger>
          <SelectContent>
            {publishedTemplates.map((template) => (
              <SelectItem key={template.id} value={template.id}>
                {template.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Zoom selector */}
      <Select
        value={zoomMode}
        onValueChange={(value) => onZoomChange(value as ZoomMode)}
      >
        <SelectTrigger
          size="sm"
          className="w-[120px] focus:ring-0 focus:ring-offset-0"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="fit-width">Fit Width</SelectItem>
          <SelectItem value="fit-page">Fit Page</SelectItem>
          <SelectItem value="100%">100%</SelectItem>
        </SelectContent>
      </Select>
    </>
  );
}
