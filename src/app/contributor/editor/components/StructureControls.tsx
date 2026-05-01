import { Fragment } from "prosemirror-model";
import { TextSelection } from "prosemirror-state";
import { canJoin } from "prosemirror-transform";
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
  const getListContext = (): (
    | {
        inList: true;
        listType: "bullet_list" | "ordered_list";
        listDepth: number;
        listItemDepth: number;
        listPos: number;
        listItemPos: number;
      }
    | { inList: false }
  ) => {
    const { $from } = state.selection;
    let listItemDepth: number | null = null;

    for (let d = $from.depth; d > 0; d--) {
      const node = $from.node(d);
      if (node.type === myloSchema.nodes.list_item && listItemDepth === null) {
        listItemDepth = d;
      }
      if (node.type === myloSchema.nodes.bullet_list && listItemDepth !== null) {
        return {
          inList: true,
          listType: "bullet_list",
          listDepth: d,
          listItemDepth,
          listPos: $from.before(d),
          listItemPos: $from.before(listItemDepth),
        };
      }
      if (node.type === myloSchema.nodes.ordered_list && listItemDepth !== null) {
        return {
          inList: true,
          listType: "ordered_list",
          listDepth: d,
          listItemDepth,
          listPos: $from.before(d),
          listItemPos: $from.before(listItemDepth),
        };
      }
    }
    return { inList: false };
  };
  const listCtx = getListContext();

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
    if (type === "body" && listCtx.inList) {
      const liftCommand = liftListItem(myloSchema.nodes.list_item);
      if (liftCommand(state)) {
        liftCommand(state, view.dispatch);
      }
      view.focus();
      setHeadingPopoverOpen(false);
      return;
    }

    const command = setBlockType(myloSchema.nodes.paragraph, { type });
    if (command(state)) {
      command(state, view.dispatch);
    }
    view.focus();
    setHeadingPopoverOpen(false);
  };

  const toggleList = (listType: "bullet_list" | "ordered_list") => {
    const convertItemToTargetList = (
      targetType: "bullet_list" | "ordered_list",
      firstIndex: number,
      lastIndex: number
    ) => {
      if (!listCtx.inList) return;

      const sourceListType = myloSchema.nodes[listCtx.listType];
      const targetListType = myloSchema.nodes[targetType];
      const listNode = state.doc.nodeAt(listCtx.listPos);
      if (!listNode) return;

      const beforeItems = [];
      const selectedItems = [];
      const afterItems = [];

      for (let i = 0; i < firstIndex; i++) {
        beforeItems.push(listNode.child(i));
      }
      for (let i = firstIndex; i <= lastIndex; i++) {
        selectedItems.push(listNode.child(i));
      }
      for (let i = lastIndex + 1; i < listNode.childCount; i++) {
        afterItems.push(listNode.child(i));
      }

      const replacementNodes: Parameters<typeof Fragment.fromArray>[0] = [];
      if (beforeItems.length > 0) {
        replacementNodes.push(
          sourceListType.create(listNode.attrs, Fragment.fromArray(beforeItems))
        );
      }

      replacementNodes.push(
        targetListType.create(null, Fragment.fromArray(selectedItems))
      );

      if (afterItems.length > 0) {
        replacementNodes.push(
          sourceListType.create(listNode.attrs, Fragment.fromArray(afterItems))
        );
      }

      const tr = state.tr.replaceWith(
        listCtx.listPos,
        listCtx.listPos + listNode.nodeSize,
        Fragment.fromArray(replacementNodes)
      );

      let targetListPos =
        listCtx.listPos +
        (beforeItems.length > 0 ? replacementNodes[0].nodeSize : 0);

      const joinAtBoundary = (direction: "before" | "after") => {
        const currentList = tr.doc.nodeAt(targetListPos);
        if (!currentList || currentList.type !== targetListType) return false;

        const boundaryPos =
          direction === "before"
            ? targetListPos
            : targetListPos + currentList.nodeSize;
        const $boundaryPos = tr.doc.resolve(boundaryPos);
        const adjacentNode =
          direction === "before" ? $boundaryPos.nodeBefore : $boundaryPos.nodeAfter;

        if (adjacentNode?.type !== targetListType) return false;
        if (!canJoin(tr.doc, boundaryPos)) return false;

        const adjacentNodeSize = adjacentNode.nodeSize;
        tr.join(boundaryPos);
        if (direction === "before") {
          targetListPos -= adjacentNodeSize;
        }
        return true;
      };

      while (joinAtBoundary("before")) {
        // Continue until there is no same-type target list immediately above.
      }

      while (joinAtBoundary("after")) {
        // Continue until there is no same-type target list immediately below.
      }

      const selectionPos = Math.min(targetListPos + 2, tr.doc.content.size);
      tr.setSelection(TextSelection.near(tr.doc.resolve(selectionPos)));
      view.dispatch(tr);
    };

    if (listCtx.inList && listCtx.listType === listType) {
      const liftCommand = liftListItem(myloSchema.nodes.list_item);
      if (liftCommand(state)) {
        liftCommand(state, view.dispatch);
      }
    } else if (!listCtx.inList) {
      const wrapCommand = wrapInList(myloSchema.nodes[listType]);
      if (wrapCommand(state)) {
        wrapCommand(state, view.dispatch);
      }
    } else {
      const firstIndex = state.selection.$from.index(listCtx.listDepth);
      let lastIndex = firstIndex;
      const currentListNode = state.doc.nodeAt(listCtx.listPos);

      if (!state.selection.empty) {
        const { $to } = state.selection;
        let sameListAtTo = false;

        for (let d = $to.depth; d > 0; d--) {
          const node = $to.node(d);
          if (
            (node.type === myloSchema.nodes.bullet_list ||
              node.type === myloSchema.nodes.ordered_list) &&
            $to.before(d) === listCtx.listPos
          ) {
            sameListAtTo = true;
            break;
          }
        }

        if (sameListAtTo) {
          lastIndex = $to.index(listCtx.listDepth);

          const isAtNextItemBoundary =
            $to.depth >= listCtx.listItemDepth &&
            $to.before(listCtx.listItemDepth) > listCtx.listItemPos &&
            $to.pos === $to.before(listCtx.listItemDepth) + 1;

          if (isAtNextItemBoundary) {
            lastIndex = Math.max(firstIndex, lastIndex - 1);
          }

          lastIndex = Math.min(
            lastIndex,
            currentListNode ? currentListNode.childCount - 1 : lastIndex
          );
        }
      }

      convertItemToTargetList(listType, firstIndex, lastIndex);
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
        variant={currentType === "body" && !listCtx.inList ? "secondary" : "outline"}
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
        variant={listCtx.inList && listCtx.listType === "bullet_list" ? "secondary" : "ghost"}
        size="sm"
        onClick={() => toggleList("bullet_list")}
        title="Bullet List"
      >
        <List className="h-4 w-4" />
      </Button>
      
      <Button
        variant={listCtx.inList && listCtx.listType === "ordered_list" ? "secondary" : "ghost"}
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
