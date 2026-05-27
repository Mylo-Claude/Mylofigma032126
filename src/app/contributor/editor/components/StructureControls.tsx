import { Fragment, type Node as PMNode } from "prosemirror-model";
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
  const getAffectedListSegments = () => {
    if (state.selection.empty) return [];

    const segments: Array<
      | {
          kind: "list";
          listNode: NonNullable<ReturnType<typeof state.doc.nodeAt>>;
          listPos: number;
          firstIndex: number;
          lastIndex: number;
        }
      | {
          kind: "paragraph";
          paragraphNode: NonNullable<ReturnType<typeof state.doc.nodeAt>>;
          paragraphPos: number;
        }
    > = [];
    const { from, to } = state.selection;

    state.doc.nodesBetween(from, to, (node, pos, parent) => {
      const isListNode =
        node.type === myloSchema.nodes.bullet_list ||
        node.type === myloSchema.nodes.ordered_list;
      const isNestedList = parent?.type === myloSchema.nodes.list_item;
      const isDocParagraph =
        node.type === myloSchema.nodes.paragraph && parent?.type === state.doc.type;

      if (isDocParagraph) {
        const paragraphStart = pos;
        const paragraphEnd = paragraphStart + node.nodeSize;
        const overlapsSelection = paragraphEnd > from && paragraphStart < to;

        if (overlapsSelection) {
          segments.push({
            kind: "paragraph",
            paragraphNode: node,
            paragraphPos: pos,
          });
        }

        return false;
      }

      if (!isListNode || isNestedList) return;

      let firstIndex: number | null = null;
      let lastIndex: number | null = null;
      let childPos = pos + 1;

      for (let i = 0; i < node.childCount; i++) {
        const child = node.child(i);
        const childStart = childPos;
        const childEnd = childStart + child.nodeSize;
        const overlapsSelection = childEnd > from && childStart < to;

        if (overlapsSelection) {
          if (firstIndex === null) firstIndex = i;
          lastIndex = i;
        }

        childPos = childEnd;
      }

      if (firstIndex !== null && lastIndex !== null) {
        segments.push({
          kind: "list",
          listNode: node,
          listPos: pos,
          firstIndex,
          lastIndex,
        });
      }

      return false;
    });

    return segments;
  };

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
    const convertListSegmentsToTargetList = (
      targetType: "bullet_list" | "ordered_list",
      segments: Array<
        | {
            kind: "list";
            listNode: NonNullable<ReturnType<typeof state.doc.nodeAt>>;
            listPos: number;
            firstIndex: number;
            lastIndex: number;
          }
        | {
            kind: "paragraph";
            paragraphNode: NonNullable<ReturnType<typeof state.doc.nodeAt>>;
            paragraphPos: number;
          }
      >
    ) => {
      const targetListType = myloSchema.nodes[targetType];
      const listItemType = myloSchema.nodes.list_item;
      const tr = state.tr;
      const targetListPositions: number[] = [];
      const descendingSegments = [...segments].sort((a, b) => {
        const aPos = a.kind === "list" ? a.listPos : a.paragraphPos;
        const bPos = b.kind === "list" ? b.listPos : b.paragraphPos;
        return bPos - aPos;
      });

      for (const segment of descendingSegments) {
        const segmentPos = segment.kind === "list" ? segment.listPos : segment.paragraphPos;
        const segmentNode = segment.kind === "list" ? segment.listNode : segment.paragraphNode;
        const mappedStart = tr.mapping.map(segmentPos);
        const mappedEnd = tr.mapping.map(segmentPos + segmentNode.nodeSize);

        let replacementNodes: PMNode[] = [];
        let targetListPos = mappedStart;

        if (segment.kind === "list") {
          const sourceListType = segment.listNode.type;
          const beforeItems = [];
          const selectedItems = [];
          const afterItems = [];

          for (let i = 0; i < segment.firstIndex; i++) {
            beforeItems.push(segment.listNode.child(i));
          }
          for (let i = segment.firstIndex; i <= segment.lastIndex; i++) {
            selectedItems.push(segment.listNode.child(i));
          }
          for (let i = segment.lastIndex + 1; i < segment.listNode.childCount; i++) {
            afterItems.push(segment.listNode.child(i));
          }

          if (beforeItems.length > 0) {
            replacementNodes.push(
              sourceListType.create(segment.listNode.attrs, Fragment.fromArray(beforeItems))
            );
          }

          replacementNodes.push(
            targetListType.create(null, Fragment.fromArray(selectedItems))
          );

          if (afterItems.length > 0) {
            replacementNodes.push(
              sourceListType.create(segment.listNode.attrs, Fragment.fromArray(afterItems))
            );
          }

          targetListPos =
            mappedStart + (beforeItems.length > 0 ? replacementNodes[0].nodeSize : 0);
        } else {
          const listItemNode = listItemType.create(null, segment.paragraphNode.content);
          replacementNodes = [
            targetListType.create(null, Fragment.from(listItemNode)),
          ];
        }

        const replacementFragment = Fragment.fromArray(replacementNodes);
        const delta = replacementFragment.size - (mappedEnd - mappedStart);

        for (let i = 0; i < targetListPositions.length; i++) {
          if (targetListPositions[i] > mappedStart) {
            targetListPositions[i] += delta;
          }
        }

        tr.replaceWith(mappedStart, mappedEnd, replacementFragment);
        targetListPositions.push(targetListPos);
      }

      targetListPositions.sort((a, b) => a - b);

      const mergeAdjacentTargetLists = () => {
        if (targetListPositions.length === 0) return;

        let scanStart = targetListPositions[0];
        let lastTargetPos = targetListPositions[targetListPositions.length - 1];
        let lastTargetNode = tr.doc.nodeAt(lastTargetPos);
        let scanEnd = lastTargetNode ? lastTargetPos + lastTargetNode.nodeSize : lastTargetPos;

        let changed = true;
        while (changed) {
          changed = false;
          let pos = 0;

          while (pos < tr.doc.content.size) {
            const node = tr.doc.nodeAt(pos);
            if (!node) break;

            const nextPos = pos + node.nodeSize;
            const nextNode = tr.doc.nodeAt(nextPos);
            const touchesScanWindow = nextPos >= scanStart && pos <= scanEnd;

            if (
              touchesScanWindow &&
              node.type === targetListType &&
              nextNode?.type === targetListType &&
              canJoin(tr.doc, nextPos)
            ) {
              tr.join(nextPos);
              scanEnd -= 2;
              changed = true;
              continue;
            }

            pos = nextPos;
          }
        }
      };

      mergeAdjacentTargetLists();

      const selectionPos =
        targetListPositions.length > 0
          ? Math.min(targetListPositions[0] + 2, tr.doc.content.size)
          : state.selection.from;
      tr.setSelection(TextSelection.near(tr.doc.resolve(selectionPos)));
      view.dispatch(tr);
    };

    if (state.selection.empty && listCtx.inList && listCtx.listType === listType) {
      const liftCommand = liftListItem(myloSchema.nodes.list_item);
      if (liftCommand(state)) {
        liftCommand(state, view.dispatch);
      }
    } else if (!state.selection.empty) {
      const affectedSegments = getAffectedListSegments();
      const hasListSegments = affectedSegments.some((segment) => segment.kind === "list");
      if (hasListSegments) {
        convertListSegmentsToTargetList(listType, affectedSegments);
      } else {
        const wrapCommand = wrapInList(myloSchema.nodes[listType]);
        if (wrapCommand(state)) {
          wrapCommand(state, view.dispatch);
        }
      }
    } else if (!listCtx.inList) {
      const wrapCommand = wrapInList(myloSchema.nodes[listType]);
      if (wrapCommand(state)) {
        wrapCommand(state, view.dispatch);
      }
    } else {
      convertListSegmentsToTargetList(listType, [
        {
          kind: "list",
          listNode: state.doc.nodeAt(listCtx.listPos)!,
          listPos: listCtx.listPos,
          firstIndex: state.selection.$from.index(listCtx.listDepth),
          lastIndex: state.selection.$from.index(listCtx.listDepth),
        },
      ]);
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
