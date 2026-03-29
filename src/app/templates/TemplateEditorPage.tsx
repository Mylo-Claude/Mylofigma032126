/**
 * @file templates/TemplateEditorPage.tsx
 * @role Template Editor authoring surface
 * @owns Three-zone template editor: style list (left), property panel (left — on
 *       style selection), and live specimen preview (right). Used for both
 *       /templates/new and /templates/:id routes.
 * @does-not-own Template persistence (TemplateContext), Paged.js rendering pipeline
 *               (PaginatedDocumentRenderer — reused as-is), serializer, pagination
 *               service, pageLayoutUtils. None of these may be modified here.
 *
 * State model:
 *   savedTemplate  — snapshot of the last explicitly-saved version (frozen until Save)
 *   draftTemplate  — local working copy; updated live on every panel field change
 *   bodyDraft      — property panel form state for the Body style; kept in sync with
 *                    draftTemplate via handleBodyDraftChange
 *   isDirty        — true when draftTemplate differs from savedTemplate
 *   showPreview    — when true: renderer uses draftTemplate (live A/B toggle)
 *                    when false: renderer uses savedTemplate (see saved state)
 *
 * Mutations:
 *   Field change  — calls updateDraftBodyStyle (styleConversions.ts), immediately
 *                   writes bodyDraft → draftTemplate.contentStyles.body (live preview)
 *   Save (panel)  — same as top-bar Save; persists draftTemplate to TemplateContext
 *   Save (topbar) — persists draftTemplate to TemplateContext; updates savedTemplate
 *   Revert        — restores draftTemplate from savedTemplate; clears isDirty
 *   Cancel        — closes property panel; draftTemplate retains live changes
 *   Publish/Unpublish — calls TemplateContext directly; also updates local draft status
 *
 * @governance Template Editor + Admin
 * @see TemplateContext.tsx — template CRUD
 * @see TemplateListPage.tsx — navigates here on create / edit
 * @see PaginatedDocumentRenderer.tsx — reused for the live specimen preview
 * @see mylo/samples/specimen-documents.ts — specimen content
 * @see templates/utils/styleConversions.ts — Template ↔ BodyStyleDraft conversion
 * @see router.tsx — /templates/new and /templates/:id routes (role-gated)
 */

import {
  useState,
  useCallback,
  useMemo,
  useEffect,
  useRef,
} from 'react';
import type { ReactNode, KeyboardEvent, ChangeEvent } from 'react';
import { useParams, useNavigate } from 'react-router';
import {
  ChevronLeft,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

import { useTemplates } from '../contexts/TemplateContext';
import type { Template } from '../mylo/template';
import { myloSchema } from '../mylo/schema';
import { sampleToEditorState } from '../mylo/samples/converter';
import { specimenDocuments, defaultSpecimen } from '../mylo/samples/specimen-documents';
import type { SampleDocument } from '../mylo/samples/types';

import { PaginatedDocumentRenderer } from '../contributor/preview/PaginatedDocumentRenderer';
import { usePreviewZoom } from '../contributor/preview/hooks/usePreviewZoom';

import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Checkbox } from '../components/ui/checkbox';
import { Label } from '../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/ui/alert-dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../components/ui/tooltip';

import type { BodyStyleDraft } from './types/styleEditor';
import {
  templateBodyToStyleDraft,
  styleDraftToTemplateBody,
  updateDraftBodyStyle,
} from './utils/styleConversions';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const FONT_WEIGHT_OPTIONS = [
  { value: '100', label: 'Thin (100)' },
  { value: '200', label: 'Extra Light (200)' },
  { value: '300', label: 'Light (300)' },
  { value: '400', label: 'Regular (400)' },
  { value: '500', label: 'Medium (500)' },
  { value: '600', label: 'Semi Bold (600)' },
  { value: '700', label: 'Bold (700)' },
  { value: '800', label: 'Extra Bold (800)' },
  { value: '900', label: 'Black (900)' },
] as const;

/**
 * Temporary affordance shown below the Font Family input until the Google
 * Fonts picker is added in Step 5. Remove this constant and its usage when
 * the picker replaces the text input.
 */
const FONT_FAMILY_HELPER_TEXT = 'Type any system font or font name. Google Fonts picker coming soon.' as const;

// ---------------------------------------------------------------------------
// StyleListView — left panel view 1 (style tree)
// ---------------------------------------------------------------------------

interface StyleListViewProps {
  template: Template;
  onBodyClick: () => void;
}

function StyleListView({ template, onBodyClick }: StyleListViewProps) {
  const margins = template.pageStyles;
  const stripEmpty = template.documentSettings?.stripEmptyParagraphs ?? true;

  return (
    <TooltipProvider>
      <div className="flex flex-col h-full overflow-y-auto">
        {/* Paragraph Styles */}
        <div className="px-4 pt-4 pb-2">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-mylo-text-tertiary mb-1">
            Paragraph Styles
          </p>

          {/* Non-interactive heading styles */}
          {(['Heading 1', 'Heading 2', 'Heading 3'] as const).map((label) => (
            <Tooltip key={label}>
              <TooltipTrigger asChild>
                <div className="flex items-center justify-between px-2 py-1.5 rounded text-sm text-mylo-text-tertiary cursor-default opacity-60 select-none">
                  <span>{label}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p className="text-xs">Coming soon</p>
              </TooltipContent>
            </Tooltip>
          ))}

          {/* Body — clickable */}
          <button
            type="button"
            onClick={onBodyClick}
            className="w-full flex items-center justify-between px-2 py-1.5 rounded text-sm text-mylo-text-primary hover:bg-mylo-surface-subtle font-medium transition-colors"
          >
            <span>Body</span>
            <span className="text-xs text-mylo-text-tertiary">paragraph</span>
          </button>
        </div>

        {/* Character Styles */}
        <div className="px-4 py-2">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-mylo-text-tertiary mb-1">
            Character Styles
          </p>
          {(['Bold', 'Italic', 'Underline'] as const).map((label) => (
            <Tooltip key={label}>
              <TooltipTrigger asChild>
                <div className="flex items-center px-2 py-1.5 rounded text-sm text-mylo-text-tertiary cursor-default opacity-60 select-none">
                  {label}
                </div>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p className="text-xs">Coming soon</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>

        {/* List Styles */}
        <div className="px-4 py-2">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-mylo-text-tertiary mb-1">
            List Styles
          </p>
          {(['Bulleted List', 'Numbered List'] as const).map((label) => (
            <Tooltip key={label}>
              <TooltipTrigger asChild>
                <div className="flex items-center px-2 py-1.5 rounded text-sm text-mylo-text-tertiary cursor-default opacity-60 select-none">
                  {label}
                </div>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p className="text-xs">Coming soon</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>

        {/* Other */}
        <div className="px-4 py-2">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-mylo-text-tertiary mb-1">
            Other
          </p>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center px-2 py-1.5 rounded text-sm text-mylo-text-tertiary cursor-default opacity-60 select-none">
                Link
              </div>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p className="text-xs">Coming soon</p>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Divider */}
        <div className="mx-4 my-2 border-t border-mylo-border-light" />

        {/* Page Setup */}
        <div className="px-4 py-2">
          <div className="flex items-center justify-between mb-1">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-mylo-text-tertiary">
              Page Setup
            </p>
            <Button variant="ghost" size="sm" disabled className="h-5 px-1 text-xs text-mylo-text-tertiary">
              Edit
            </Button>
          </div>
          <div className="px-2 space-y-0.5 text-xs text-mylo-text-secondary">
            <p>Size: {margins.size ?? 'Letter'}</p>
            {margins.marginTop !== undefined && (
              <p>
                Margins: {margins.marginTop}"&nbsp;{margins.marginRight}"&nbsp;
                {margins.marginBottom}"&nbsp;{margins.marginLeft}"
              </p>
            )}
          </div>
        </div>

        {/* Document Settings */}
        <div className="px-4 py-2">
          <div className="flex items-center justify-between mb-1">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-mylo-text-tertiary">
              Document Settings
            </p>
            <Button variant="ghost" size="sm" disabled className="h-5 px-1 text-xs text-mylo-text-tertiary">
              Edit
            </Button>
          </div>
          <div className="px-2 text-xs text-mylo-text-secondary">
            <p>Strip empty paragraphs: {stripEmpty ? 'On' : 'Off'}</p>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}

// ---------------------------------------------------------------------------
// LabeledField — reusable layout for property panel rows
// ---------------------------------------------------------------------------

function LabeledField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-mylo-text-secondary w-24 shrink-0">{label}</span>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// DimensionInput — number input with "pt" unit label
// ---------------------------------------------------------------------------

function DimensionInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="flex items-center gap-1">
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? '—'}
        className="h-7 text-xs w-16"
        inputMode="decimal"
      />
      <span className="text-xs text-mylo-text-tertiary">pt</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// BodyPropertyPanel — left panel view 2 (Body style property panel)
// ---------------------------------------------------------------------------

interface BodyPropertyPanelProps {
  bodyDraft: BodyStyleDraft;
  onChange: (draft: BodyStyleDraft) => void;
  activeTab: 'typography' | 'spacing' | 'rules';
  onTabChange: (tab: 'typography' | 'spacing' | 'rules') => void;
  /** Persists current draftTemplate to TemplateContext. Same action as top-bar Save. */
  onSave: () => void;
  /** Close the panel; draft changes are retained in draftTemplate. */
  onCancel: () => void;
  /** When true, specimen renders from draftTemplate (live changes). When false, from savedTemplate. */
  showPreview: boolean;
  onShowPreviewChange: (showPreview: boolean) => void;
}

function BodyPropertyPanel({
  bodyDraft,
  onChange,
  activeTab,
  onTabChange,
  onSave,
  onCancel,
  showPreview,
  onShowPreviewChange,
}: BodyPropertyPanelProps) {
  const colorInputRef = useRef<HTMLInputElement>(null);
  const [advancedExpanded, setAdvancedExpanded] = useState(false);

  /**
   * Produce a new draft with a single field updated, using the pure
   * updateDraftBodyStyle helper from styleConversions.ts.
   */
  const set = useCallback(
    <K extends keyof BodyStyleDraft>(key: K, value: BodyStyleDraft[K]) => {
      onChange(updateDraftBodyStyle(bodyDraft, { [key]: value }));
    },
    [bodyDraft, onChange]
  );

  return (
    <div className="flex flex-col h-full">
      {/* Panel header */}
      <div className="px-4 pt-3 pb-2 border-b border-mylo-border-light">
        <button
          type="button"
          onClick={onCancel}
          className="flex items-center gap-1 text-xs text-mylo-text-secondary hover:text-mylo-text-primary mb-2 transition-colors"
        >
          <ChevronLeft className="size-3" />
          All Styles
        </button>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-mylo-text-primary">Body</span>
            <span className="text-xs text-mylo-text-tertiary">paragraph</span>
          </div>
          {/* Preview checkbox — toggle A/B comparison */}
          <div className="flex items-center gap-1.5">
            <Checkbox
              id="preview-toggle"
              checked={showPreview}
              onCheckedChange={(checked) => onShowPreviewChange(checked === true)}
            />
            <Label
              htmlFor="preview-toggle"
              className="text-xs text-muted-foreground font-normal cursor-pointer"
            >
              Preview
            </Label>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex-1 overflow-y-auto">
        <Tabs value={activeTab} onValueChange={(v) => onTabChange(v as typeof activeTab)}>
          <TabsList className="w-full rounded-none border-b border-mylo-border-light h-8 px-3 bg-transparent justify-start gap-0">
            {(['typography', 'spacing', 'rules'] as const).map((tab) => (
              <TabsTrigger
                key={tab}
                value={tab}
                className="h-7 px-2 text-xs capitalize rounded-none border-b-2 border-transparent data-[state=active]:border-mylo-text-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Typography tab */}
          <TabsContent value="typography" className="mt-0 px-4 py-3 space-y-3">
            {/* Font Family */}
            <div className="flex flex-col gap-1">
              <span className="text-xs text-mylo-text-secondary">Font Family</span>
              <Input
                value={bodyDraft.fontFamily}
                onChange={(e) => set('fontFamily', e.target.value)}
                placeholder="e.g. Gill Sans, sans-serif"
                className="h-7 text-xs"
              />
              <p className="text-xs text-muted-foreground mt-1 leading-snug">
                {FONT_FAMILY_HELPER_TEXT}
              </p>
            </div>

            {/* Weight */}
            <LabeledField label="Weight">
              <Select
                value={bodyDraft.fontWeight}
                onValueChange={(v) => set('fontWeight', v)}
              >
                <SelectTrigger className="h-7 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FONT_WEIGHT_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value} className="text-xs">
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </LabeledField>

            {/* Style */}
            <LabeledField label="Style">
              <Select
                value={bodyDraft.fontStyle}
                onValueChange={(v) => set('fontStyle', v as BodyStyleDraft['fontStyle'])}
              >
                <SelectTrigger className="h-7 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal" className="text-xs">Normal</SelectItem>
                  <SelectItem value="italic" className="text-xs">Italic</SelectItem>
                </SelectContent>
              </Select>
            </LabeledField>

            {/* Size */}
            <LabeledField label="Size">
              <DimensionInput
                value={bodyDraft.fontSize}
                onChange={(v) => set('fontSize', v)}
              />
            </LabeledField>

            {/* Line Height */}
            <LabeledField label="Line Height">
              <DimensionInput
                value={bodyDraft.lineHeight}
                onChange={(v) => set('lineHeight', v)}
              />
            </LabeledField>

            {/* Tracking */}
            <LabeledField label="Tracking">
              <DimensionInput
                value={bodyDraft.letterSpacing}
                onChange={(v) => set('letterSpacing', v)}
              />
            </LabeledField>

            {/* Alignment */}
            <LabeledField label="Alignment">
              <div className="flex gap-0.5">
                {(
                  [
                    { value: 'left', Icon: AlignLeft },
                    { value: 'center', Icon: AlignCenter },
                    { value: 'right', Icon: AlignRight },
                    { value: 'justify', Icon: AlignJustify },
                  ] as const
                ).map(({ value, Icon }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => set('textAlign', value)}
                    className={`p-1 rounded transition-colors ${
                      bodyDraft.textAlign === value
                        ? 'bg-mylo-text-primary text-white'
                        : 'text-mylo-text-secondary hover:bg-mylo-surface-subtle'
                    }`}
                  >
                    <Icon className="size-3.5" />
                  </button>
                ))}
              </div>
            </LabeledField>

            {/* Color */}
            <LabeledField label="Color">
              <div className="flex items-center gap-2">
                {/* Color swatch — opens native color picker */}
                <button
                  type="button"
                  className="size-6 rounded border border-mylo-border-light shrink-0"
                  style={{ backgroundColor: bodyDraft.color }}
                  onClick={() => colorInputRef.current?.click()}
                  aria-label="Open color picker"
                />
                {/* Hidden native color input */}
                <input
                  ref={colorInputRef}
                  type="color"
                  className="sr-only"
                  value={bodyDraft.color}
                  onChange={(e) => set('color', e.target.value)}
                />
                {/* Hex text input */}
                <Input
                  value={bodyDraft.color}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => {
                    const val = e.target.value;
                    if (/^#[0-9a-fA-F]{0,6}$/.test(val)) {
                      set('color', val);
                    }
                  }}
                  className="h-7 text-xs font-mono w-24"
                  maxLength={7}
                />
              </div>
            </LabeledField>

            {/* Advanced CSS — collapsible */}
            <div className="pt-1">
              <button
                type="button"
                className="flex items-center gap-1 text-xs text-mylo-text-secondary hover:text-mylo-text-primary w-full mb-1 transition-colors"
                onClick={() => setAdvancedExpanded((x) => !x)}
              >
                {advancedExpanded ? (
                  <ChevronUp className="size-3" />
                ) : (
                  <ChevronDown className="size-3" />
                )}
                Advanced CSS
              </button>
              {advancedExpanded && (
                <div className="space-y-1">
                  <textarea
                    value={bodyDraft.advancedCss}
                    onChange={(e) => set('advancedCss', e.target.value)}
                    placeholder={'textTransform: uppercase\nborderBottom: 1px solid #000'}
                    rows={4}
                    className="w-full text-xs font-mono rounded border border-mylo-border-light bg-mylo-surface p-2 resize-y focus:outline-none focus:ring-1 focus:ring-mylo-border"
                    spellCheck={false}
                  />
                  <p className="text-[10px] text-mylo-text-tertiary leading-snug">
                    Advanced CSS is applied directly. Verify in the specimen before saving.
                  </p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Spacing tab */}
          <TabsContent value="spacing" className="mt-0 px-4 py-3 space-y-3">
            <LabeledField label="Space Before">
              <DimensionInput
                value={bodyDraft.marginTop}
                onChange={(v) => set('marginTop', v)}
              />
            </LabeledField>
            <LabeledField label="Space After">
              <DimensionInput
                value={bodyDraft.marginBottom}
                onChange={(v) => set('marginBottom', v)}
              />
            </LabeledField>
            <LabeledField label="Left Indent">
              <DimensionInput
                value={bodyDraft.paddingLeft}
                onChange={(v) => set('paddingLeft', v)}
              />
            </LabeledField>
            <LabeledField label="Right Indent">
              <DimensionInput
                value={bodyDraft.paddingRight}
                onChange={(v) => set('paddingRight', v)}
              />
            </LabeledField>
            <LabeledField label="First Line">
              <DimensionInput
                value={bodyDraft.textIndent}
                onChange={(v) => set('textIndent', v)}
              />
            </LabeledField>
          </TabsContent>

          {/* Rules tab — placeholder */}
          <TabsContent value="rules" className="mt-0 px-4 py-4">
            <p className="text-xs text-mylo-text-secondary leading-relaxed">
              Paragraph rules coming in a future update.
            </p>
          </TabsContent>
        </Tabs>
      </div>

      {/* Pinned action bar */}
      <div className="px-4 py-3 border-t border-mylo-border-light flex items-center gap-2">
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

// ---------------------------------------------------------------------------
// StatusBadge
// ---------------------------------------------------------------------------

function StatusBadge({ status }: { status: 'draft' | 'published' | undefined }) {
  const resolved = status ?? 'published';
  return resolved === 'published' ? (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
      Published
    </span>
  ) : (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-mylo-surface-subtle text-mylo-text-secondary border border-mylo-border-light">
      Draft
    </span>
  );
}

// ---------------------------------------------------------------------------
// TemplateEditorPage
// ---------------------------------------------------------------------------

export function TemplateEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    templates,
    createTemplate,
    updateTemplate,
    publishTemplate,
    unpublishTemplate,
  } = useTemplates();

  // When route is /templates/new, create a template and redirect immediately
  useEffect(() => {
    if (!id) {
      const t = createTemplate();
      navigate(`/templates/${t.id}`, { replace: true });
    }
    // createTemplate and navigate are stable; only run once when id is missing
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Resolve the current template from context (re-derives on every context update).
  // Used only for: initialising state on mount, not-found redirect.
  const contextTemplate = id ? templates.find((t) => t.id === id) ?? null : null;

  // savedTemplate — frozen snapshot of the last explicitly-saved version.
  // Only updated by handleSave. Drives the "Preview off" state in the renderer
  // and is the restore point for Revert.
  const [savedTemplate, setSavedTemplate] = useState<Template | null>(contextTemplate);

  // draftTemplate — local working copy. Updated live on every panel field change.
  const [draftTemplate, setDraftTemplate] = useState<Template | null>(contextTemplate);

  const [isDirty, setIsDirty] = useState(false);

  // showPreview — when true: renderer shows draftTemplate (live changes).
  // When false: renderer shows savedTemplate (A/B comparison).
  const [showPreview, setShowPreview] = useState(true);

  // Sync local state when navigating to a different template (id change only).
  const prevIdRef = useRef(id);
  useEffect(() => {
    if (id !== prevIdRef.current) {
      prevIdRef.current = id;
      const template = id ? templates.find((t) => t.id === id) ?? null : null;
      setDraftTemplate(template);
      setSavedTemplate(template);
      setIsDirty(false);
      setShowPreview(true);
      setActiveView('styleList');
      setBodyDraft(null);
    }
  }, [id, templates]);

  // Template name inline editing
  const [isEditingName, setIsEditingName] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditingName) nameInputRef.current?.select();
  }, [isEditingName]);

  // Left panel view state
  const [activeView, setActiveView] = useState<'styleList' | 'bodyPanel'>('styleList');

  // Body style property panel state (null = not yet initialised)
  const [bodyDraft, setBodyDraft] = useState<BodyStyleDraft | null>(null);
  const [activeTab, setActiveTab] = useState<'typography' | 'spacing' | 'rules'>('typography');

  // Specimen selection
  const [selectedSpecimen, setSelectedSpecimen] = useState<SampleDocument>(defaultSpecimen);

  // Unsaved changes guard dialog
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const pendingNavigationRef = useRef<(() => void) | null>(null);

  // Preview zoom
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [measuredPageWidth, setMeasuredPageWidth] = useState<number | null>(null);
  const [measuredPageHeight, setMeasuredPageHeight] = useState<number | null>(null);

  const { scale, shouldCenterContent } = usePreviewZoom({
    containerRef: scrollContainerRef,
    measuredPageWidth,
    measuredPageHeight,
    zoomMode: 'fit-page',
  });

  const handlePageMeasured = useCallback((width: number, height: number) => {
    setMeasuredPageWidth(width);
    setMeasuredPageHeight(height);
  }, []);

  // Page count is not displayed in the Template Editor; callback required by PaginatedDocumentRenderer
  const handlePagedJsComplete = useCallback((_pageCount: number) => { /* no-op */ }, []);

  // Stable specimen doc — recomputed only when selected specimen changes
  const specimenDoc = useMemo(() => {
    return sampleToEditorState(selectedSpecimen, myloSchema).doc;
  }, [selectedSpecimen]);

  // ---------------------------------------------------------------------------
  // Redirect if template not found (after loading)
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (id && templates.length > 0 && !contextTemplate) {
      navigate('/templates', { replace: true });
    }
  }, [id, templates, contextTemplate, navigate]);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  /**
   * Called by BodyPropertyPanel whenever any field changes.
   * Immediately writes the new bodyDraft to draftTemplate for live preview.
   * Deps: empty — only uses stable setters and imported pure functions.
   */
  const handleBodyDraftChange = useCallback((draft: BodyStyleDraft) => {
    setBodyDraft(draft);
    setDraftTemplate((prev) =>
      prev
        ? {
            ...prev,
            contentStyles: {
              ...prev.contentStyles,
              body: styleDraftToTemplateBody(draft),
            },
          }
        : prev
    );
    setIsDirty(true);
  }, []);

  const handleBodyClick = useCallback(() => {
    if (!draftTemplate) return;
    setBodyDraft(templateBodyToStyleDraft(draftTemplate));
    setActiveTab('typography');
    setActiveView('bodyPanel');
  }, [draftTemplate]);

  /**
   * Persists draftTemplate to TemplateContext and updates savedTemplate.
   * Called by both the top-bar Save button and the panel Save button.
   */
  const handleSave = useCallback(() => {
    if (!draftTemplate) return;
    updateTemplate(draftTemplate.id, draftTemplate);
    setSavedTemplate(draftTemplate);
    setIsDirty(false);
  }, [draftTemplate, updateTemplate]);

  /**
   * Close the property panel and return to the style list.
   * Does NOT revert draft changes — draftTemplate retains live edits.
   */
  const handleCancel = useCallback(() => {
    setActiveView('styleList');
    setBodyDraft(null);
  }, []);

  /**
   * Restore draftTemplate to the last saved state (savedTemplate).
   * Also resets bodyDraft if the panel is open.
   */
  const handleRevert = useCallback(() => {
    if (!savedTemplate) return;
    setDraftTemplate(savedTemplate);
    setIsDirty(false);
    if (activeView === 'bodyPanel') {
      setBodyDraft(templateBodyToStyleDraft(savedTemplate));
    }
  }, [savedTemplate, activeView]);

  const handlePublishToggle = useCallback(() => {
    if (!draftTemplate) return;
    if (draftTemplate.status === 'published') {
      unpublishTemplate(draftTemplate.id);
      setDraftTemplate((prev) => prev ? { ...prev, status: 'draft' } : prev);
    } else {
      publishTemplate(draftTemplate.id);
      setDraftTemplate((prev) => prev ? { ...prev, status: 'published' } : prev);
    }
  }, [draftTemplate, publishTemplate, unpublishTemplate]);

  const handleNameBlur = useCallback(() => {
    setIsEditingName(false);
  }, []);

  const handleNameKeyDown = useCallback((e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === 'Escape') {
      setIsEditingName(false);
    }
  }, []);

  const handleNameChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setDraftTemplate((prev) => prev ? { ...prev, name: e.target.value } : prev);
    setIsDirty(true);
  }, []);

  /** Navigate back to /templates, showing the unsaved changes guard if needed. */
  const handleBack = useCallback(() => {
    if (isDirty) {
      pendingNavigationRef.current = () => navigate('/templates');
      setShowLeaveDialog(true);
    } else {
      navigate('/templates');
    }
  }, [isDirty, navigate]);

  const handleLeaveConfirm = useCallback(() => {
    setShowLeaveDialog(false);
    pendingNavigationRef.current?.();
    pendingNavigationRef.current = null;
  }, []);

  const handleLeaveCancel = useCallback(() => {
    setShowLeaveDialog(false);
    pendingNavigationRef.current = null;
  }, []);

  // ---------------------------------------------------------------------------
  // Loading / not found states
  // ---------------------------------------------------------------------------

  if (!id || !draftTemplate) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-mylo-surface">
        <p className="text-sm text-mylo-text-secondary">Loading…</p>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  const templateName = draftTemplate.name || 'Untitled Template';
  const isPublished = draftTemplate.status === 'published';

  // Renderer template: draft for live preview, saved for A/B comparison
  const rendererTemplate = showPreview ? draftTemplate : (savedTemplate ?? draftTemplate);

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-mylo-surface-subtle">

      {/* ────────────────────── Top bar ────────────────────── */}
      <div className="h-12 shrink-0 bg-mylo-surface border-b border-mylo-border-light flex items-center gap-3 px-4">

        {/* Back button */}
        <button
          type="button"
          onClick={handleBack}
          className="flex items-center gap-1 text-xs text-mylo-text-secondary hover:text-mylo-text-primary transition-colors shrink-0"
        >
          <ChevronLeft className="size-3.5" />
          Templates
        </button>

        <span className="text-mylo-border-light text-sm shrink-0">/</span>

        {/* Template name — editable inline */}
        {isEditingName ? (
          <input
            ref={nameInputRef}
            type="text"
            value={draftTemplate.name}
            onChange={handleNameChange}
            onBlur={handleNameBlur}
            onKeyDown={handleNameKeyDown}
            className="text-sm font-medium text-mylo-text-primary bg-transparent border-b border-mylo-border focus:outline-none min-w-0 flex-1 max-w-xs"
          />
        ) : (
          <button
            type="button"
            onClick={() => setIsEditingName(true)}
            className="text-sm font-medium text-mylo-text-primary hover:text-mylo-text-primary truncate max-w-xs min-w-0 flex-1 text-left"
          >
            {templateName}
          </button>
        )}

        {/* Specimen dropdown */}
        <Select
          value={selectedSpecimen.id}
          onValueChange={(sid) => {
            const doc = specimenDocuments.find((d) => d.id === sid);
            if (doc) setSelectedSpecimen(doc);
          }}
        >
          <SelectTrigger className="h-7 text-xs w-44 shrink-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {specimenDocuments.map((doc) => (
              <SelectItem key={doc.id} value={doc.id} className="text-xs">
                {doc.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Status badge */}
        <StatusBadge status={draftTemplate.status} />

        {/* Spacer */}
        <div className="flex-1" />

        {/* Revert */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRevert}
          disabled={!isDirty}
          className="h-7 px-2 text-xs"
        >
          Revert
        </Button>

        {/* Save */}
        <Button
          size="sm"
          onClick={handleSave}
          className="h-7 px-3 text-xs"
        >
          Save
        </Button>

        {/* Publish / Unpublish */}
        <Button
          variant={isPublished ? 'outline' : 'default'}
          size="sm"
          onClick={handlePublishToggle}
          className="h-7 px-3 text-xs shrink-0"
        >
          {isPublished ? 'Unpublish' : 'Publish'}
        </Button>
      </div>

      {/* ────────────────────── Body (two columns) ────────────────────── */}
      <div className="flex-1 flex overflow-hidden">

        {/* Left column (300px): style list or property panel */}
        <div className="w-[300px] shrink-0 bg-mylo-surface border-r border-mylo-border-light flex flex-col overflow-hidden">
          {activeView === 'styleList' ? (
            <StyleListView
              template={draftTemplate}
              onBodyClick={handleBodyClick}
            />
          ) : bodyDraft !== null ? (
            <BodyPropertyPanel
              bodyDraft={bodyDraft}
              onChange={handleBodyDraftChange}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              onSave={handleSave}
              onCancel={handleCancel}
              showPreview={showPreview}
              onShowPreviewChange={setShowPreview}
            />
          ) : null}
        </div>

        {/* Right column: specimen preview */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-auto p-8 bg-mylo-canvas"
        >
          <PaginatedDocumentRenderer
            doc={specimenDoc}
            template={rendererTemplate}
            onPagedJsComplete={handlePagedJsComplete}
            onPageMeasured={handlePageMeasured}
            scale={scale}
            shouldCenter={shouldCenterContent}
          />
        </div>
      </div>

      {/* ────────────────────── Unsaved changes guard ────────────────────── */}
      <AlertDialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved changes</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes to{' '}
              <strong>{templateName}</strong>. Leave without saving?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleLeaveCancel}>Stay</AlertDialogCancel>
            <AlertDialogAction onClick={handleLeaveConfirm}>
              Leave without saving
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
