import { EditorView } from "prosemirror-view";
import { FormattingControls } from "./components/FormattingControls";
import { StructureControls } from "./components/StructureControls";
import { ContentControls } from "./components/ContentControls";
import { LoadSampleMenu } from "./LoadSampleMenu";

/**
 * EditorToolbar - Contributor Editor Controls Container
 * 
 * Governance: Organizes controls by governance responsibility
 * Responsibility: Compose toolbar control groups
 * Role: Contributor (structure and content authoring)
 * 
 * Control Groups:
 * - StructureControls: Paragraph structure (Body, Headings, Lists, Indent/Outdent)
 * - FormattingControls: Character markers (Bold, Italic, Underline, Super/Subscript, Case, Clear)
 * - ContentControls: Content elements (Links)
 * - LoadSampleMenu: Sample document loader
 * 
 * @see Mylo Governance: Contributor structure authority model
 */

interface EditorToolbarProps {
  view: EditorView | null;
  isModified?: boolean;
  onModifiedChange?: (isModified: boolean) => void;
}

export function EditorToolbar({ view, isModified, onModifiedChange }: EditorToolbarProps) {
  if (!view) return null;

  return (
    <div className="border-b border-mylo-border-light p-2 flex items-center gap-1 bg-mylo-surface flex-wrap">
      <StructureControls view={view} />
      <FormattingControls view={view} />
      <ContentControls view={view} />
      <div className="w-px h-6 bg-mylo-border-light mx-1" />
      <LoadSampleMenu view={view} isModified={isModified} onModifiedChange={onModifiedChange} />
    </div>
  );
}