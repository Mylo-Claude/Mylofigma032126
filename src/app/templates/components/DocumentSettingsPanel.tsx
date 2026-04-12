/**
 * @file templates/components/DocumentSettingsPanel.tsx
 * @role Left panel — document settings editor
 * @owns Renders the Document Settings panel with controls for global document
 *       behaviour (currently: strip empty paragraphs toggle).
 *       Follows the same Option C architecture as the style panels: no internal
 *       draft state, all changes propagate to the parent via onChange.
 *
 *       Layout:
 *         • Breadcrumb header  (← All Styles / Document Settings)
 *         • Settings section with a labelled Switch
 *         • Save / Cancel footer
 *
 * @does-not-own Template persistence, draft ownership, governance enforcement.
 *
 * @governance Template Editor only
 * @see TemplateEditorPage.tsx — orchestrator; owns draft and handlers
 * @see templates/types/pageSetup.ts — DocumentSettingsDraft interface
 * @see templates/utils/pageSetupConversions.ts — draftToDocumentSettings
 * @see services/governanceEnforcement.ts — consumes stripEmptyParagraphs (read-only)
 */

import { Button } from '../../components/ui/button';
import { Switch } from '../../components/ui/switch';
import { Label } from '../../components/ui/label';

import type { DocumentSettingsDraft } from '../types/pageSetup';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface DocumentSettingsPanelProps {
  /** Current draft state. Parent owns this; all changes call onChange. */
  draft: DocumentSettingsDraft;
  onChange: (draft: DocumentSettingsDraft) => void;
  /** Persists the current draftTemplate to TemplateContext. */
  onSave: () => void;
  /** Close the panel; draft changes are retained in draftTemplate. */
  onCancel: () => void;
}

// ---------------------------------------------------------------------------
// DocumentSettingsPanel
// ---------------------------------------------------------------------------

export function DocumentSettingsPanel({
  draft,
  onChange,
  onSave,
  onCancel,
}: DocumentSettingsPanelProps) {
  const switchId = 'doc-settings-strip-empty';

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* ── Breadcrumb header ── */}
      <div className="px-4 py-2.5 border-b border-mylo-border-light shrink-0 flex items-center gap-1.5">
        <button
          type="button"
          onClick={onCancel}
          className="flex items-center gap-0.5 text-xs text-mylo-text-secondary hover:text-mylo-text-primary transition-colors"
        >
          ← All Styles
        </button>
        <span className="text-xs text-mylo-text-tertiary">/</span>
        <span className="text-xs font-semibold text-mylo-text-primary">Document Settings</span>
      </div>

      {/* ── Settings body ── */}
      <div className="flex-1 overflow-y-auto scrollbar-none">
        <div className="px-4 py-4 space-y-4">

          {/* Strip empty paragraphs */}
          <div className="flex items-start gap-3">
            <Switch
              id={switchId}
              checked={draft.stripEmptyParagraphs}
              onCheckedChange={(checked) =>
                onChange({ ...draft, stripEmptyParagraphs: checked })
              }
              className="mt-0.5 shrink-0"
            />
            <div className="flex flex-col gap-0.5">
              <Label htmlFor={switchId} className="text-xs font-medium text-mylo-text-primary cursor-pointer">
                Strip empty paragraphs
              </Label>
              <p className="text-[10px] text-muted-foreground leading-snug">
                When enabled, all empty paragraphs are removed in Preview. Spacing is controlled by the template.
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* ── Footer ── */}
      <div className="px-4 py-3 border-t border-mylo-border-light shrink-0 flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onCancel} className="flex-1 h-7 text-xs">
          Cancel
        </Button>
        <Button size="sm" onClick={onSave} className="flex-1 h-7 text-xs">
          Save
        </Button>
      </div>

    </div>
  );
}
