import { Template, availableTemplates } from "../../mylo/templates";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "../../components/ui/select";

/**
 * PreviewToolbar - Preview Panel Controls
 * 
 * Governance: Allows Contributor to select template and zoom level for preview
 * Responsibility: Template selection and zoom controls
 * Role: Contributor (view state control only)
 * 
 * Controls:
 * - Template selector: Switches between available templates
 * - Zoom selector: Fit Width, Fit Page, 100%
 * 
 * State: Per-document view state (does not export)
 * 
 * @see Mylo Governance: Preview enforcement model
 */

type ZoomMode = 'fit-width' | 'fit-page' | '100%';

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
  return (
    <>
      <div className="flex items-center gap-3">
        <div>
          <Select
            value={selectedTemplate.id}
            onValueChange={(value) => {
              const template = availableTemplates.find(t => t.id === value);
              if (template) onTemplateChange(template);
            }}
          >
            <SelectTrigger size="sm" id="template-select" className="focus:ring-0 focus:ring-offset-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableTemplates.map((template) => (
                <SelectItem key={template.id} value={template.id}>
                  {template.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <Select
        value={zoomMode}
        onValueChange={(value) => onZoomChange(value as ZoomMode)}
      >
        <SelectTrigger size="sm" className="w-[120px] focus:ring-0 focus:ring-offset-0">
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