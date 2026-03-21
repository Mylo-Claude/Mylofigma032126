import { EditorView } from "prosemirror-view";
import { setBlockType } from "prosemirror-commands";
import { wrapInList, liftListItem, sinkListItem } from "prosemirror-schema-list";
import { 
  List,
  ListOrdered,
  Indent,
  Outdent,
} from "lucide-react";
import { Button } from "../../../components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../../components/ui/popover";
import { useState } from "react";
import { myloSchema } from "../../../mylo/schema";

/**
 * StructureControls - Paragraph Structure Control Group
 * 
 * Governance: Contributors control paragraph-level structure only
 * Responsibility: 
 *   - Body button: Convert paragraphs to Body structure
 *   - Heading popover: H1, H2, H3 structural markers
 *   - List buttons: Bulleted and Numbered lists
 *   - Indent/Outdent: List nesting
 * Role: Contributor (structure markers)
 * 
 * These controls apply structural markers. Templates govern rendering.
 * 
 * State: Document content state (structure markers persist)
 * 
 * @see Mylo Governance: Paragraph level structure
 * @see Mylo Governance: Lists and structural transformations
 */

interface StructureControlsProps {
  view: EditorView;
}

export function StructureControls({ view }: StructureControlsProps) {
  const [headingPopoverOpen, setHeadingPopoverOpen] = useState(false);

  const state = view.state;

  // Get current paragraph type
  const getCurrentParagraphType = (): string => {
    const $from = state.selection.$from;
    const node = $from.node($from.depth);
    if (node && node.type.name === "paragraph") {
      return node.attrs.type || "body";
    }
    return "body";
  };

  const currentType = getCurrentParagraphType();

  const setParagraphType = (type: string) => {
    const command = setBlockType(myloSchema.nodes.paragraph, { type });
    command(state, view.dispatch);
    view.focus();
    setHeadingPopoverOpen(false);
  };

  const toggleList = (listType: "bullet_list" | "ordered_list") => {
    const nodeType = myloSchema.nodes[listType];
    const itemType = myloSchema.nodes.list_item;
    
    // Try to wrap in list
    const wrapCommand = wrapInList(nodeType);
    if (wrapCommand(state)) {
      wrapCommand(state, view.dispatch);
    } else {
      // Try to lift from list
      const liftCommand = liftListItem(itemType);
      liftCommand(state, view.dispatch);
    }
    
    view.focus();
  };

  const getHeadingLabel = () => {
    switch (currentType) {
      case "heading1": return "H1";
      case "heading2": return "H2";
      case "heading3": return "H3";
      default: return "H1";
    }
  };

  const handleIndent = () => {
    const itemType = myloSchema.nodes.list_item;
    const command = sinkListItem(itemType);
    if (command(state)) {
      command(state, view.dispatch);
      view.focus();
    }
  };

  const handleOutdent = () => {
    const itemType = myloSchema.nodes.list_item;
    const command = liftListItem(itemType);
    if (command(state)) {
      command(state, view.dispatch);
      view.focus();
    }
  };

  return (
    <>
      {/* Body button */}
      <Button
        variant={currentType === "body" ? "secondary" : "outline"}
        size="sm"
        onClick={() => setParagraphType("body")}
        title="Body"
      >
        Body
      </Button>

      {/* Heading selector */}
      <Popover open={headingPopoverOpen} onOpenChange={setHeadingPopoverOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="justify-start text-[14px]">
            {getHeadingLabel()}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-1">
          <div className="flex flex-col gap-1">
            <Button
              variant={currentType === "heading1" ? "secondary" : "ghost"}
              size="sm"
              className="justify-start text-xl font-bold px-3"
              onClick={() => setParagraphType("heading1")}
            >
              H1
            </Button>
            <Button
              variant={currentType === "heading2" ? "secondary" : "ghost"}
              size="sm"
              className="justify-start text-lg font-semibold px-3"
              onClick={() => setParagraphType("heading2")}
            >
              H2
            </Button>
            <Button
              variant={currentType === "heading3" ? "secondary" : "ghost"}
              size="sm"
              className="justify-start text-base font-semibold px-3"
              onClick={() => setParagraphType("heading3")}
            >
              H3
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      {/* Lists and Indent/Outdent */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => toggleList("bullet_list")}
        title="Bullet List"
      >
        <List className="h-4 w-4" />
      </Button>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={() => toggleList("ordered_list")}
        title="Numbered List"
      >
        <ListOrdered className="h-4 w-4" />
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={handleIndent}
        title="Indent"
        className="text-foreground"
      >
        <Indent className="h-4 w-4" />
      </Button>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={handleOutdent}
        title="Outdent"
        className="text-foreground"
      >
        <Outdent className="h-4 w-4" />
      </Button>
    </>
  );
}