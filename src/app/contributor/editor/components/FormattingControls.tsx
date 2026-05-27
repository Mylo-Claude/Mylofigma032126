import { EditorView } from "prosemirror-view";
import { toggleMark } from "prosemirror-commands";
import type { Mark } from "prosemirror-model";
import { 
  Bold, 
  Italic, 
  Underline, 
  Superscript,
  Subscript,
  RemoveFormatting,
  CaseSensitive,
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
 * FormattingControls - Character Formatting Control Group
 * 
 * Governance: Contributors apply character-level markers only
 * Responsibility: 
 *   - Bold, Italic, Underline: Semantic markers
 *   - Superscript, Subscript: Structural markers (mutually exclusive)
 *   - Case transformation: UPPERCASE, lowercase, Title Case
 *   - Clear Formatting: Remove character markers, reset to Body structure
 * Role: Contributor (character markers)
 * 
 * These are intent markers. Templates control rendering in Preview.
 * 
 * State: Document content state (character markers persist)
 * 
 * @see Mylo Governance: Character level structure
 * @see Mylo Governance: Text formatting and emphasis
 */

interface FormattingControlsProps {
  view: EditorView;
}

export function FormattingControls({ view }: FormattingControlsProps) {
  const [casePopoverOpen, setCasePopoverOpen] = useState(false);

  const state = view.state;
  const { from, to } = state.selection;

  // Check active marks
  const isBold = state.doc.rangeHasMark(from, to, myloSchema.marks.bold);
  const isItalic = state.doc.rangeHasMark(from, to, myloSchema.marks.italic);
  const isUnderline = state.doc.rangeHasMark(from, to, myloSchema.marks.underline);
  const isSuperscript = state.doc.rangeHasMark(from, to, myloSchema.marks.superscript);
  const isSubscript = state.doc.rangeHasMark(from, to, myloSchema.marks.subscript);

  const toggleMarkCommand = (markType: string) => {
    const mark = myloSchema.marks[markType];
    if (mark) {
      const command = toggleMark(mark);
      command(state, view.dispatch);
      view.focus();
    }
  };

  const clearFormatting = () => {
    const { from, to } = state.selection;
    let tr = state.tr;
    
    // Remove all character marks (bold, italic, underline, links, superscript, subscript)
    const marks = [
      myloSchema.marks.bold,
      myloSchema.marks.italic,
      myloSchema.marks.underline,
      myloSchema.marks.link,
      myloSchema.marks.superscript,
      myloSchema.marks.subscript,
    ];
    
    marks.forEach(mark => {
      if (mark) {
        tr = tr.removeMark(from, to, mark);
      }
    });
    
    // Collect complete list structures and paragraphs that need to be converted
    const nodesToReplace: Array<{ pos: number; node: any; type: 'list' | 'heading' }> = [];
    
    tr.doc.nodesBetween(from, to, (node, pos) => {
      if (node.type.name === "bullet_list" || node.type.name === "ordered_list") {
        nodesToReplace.push({ pos, node, type: 'list' });
        return false; // Don't descend into list
      } else if (node.type.name === "paragraph" && node.attrs.type !== "body") {
        nodesToReplace.push({ pos, node, type: 'heading' });
      }
    });
    
    // Process in reverse order to maintain correct positions
    for (let i = nodesToReplace.length - 1; i >= 0; i--) {
      const { pos, node, type } = nodesToReplace[i];
      
      if (type === 'list') {
        // Extract all text content from all list items and create body paragraphs
        const bodyParagraphs: any[] = [];
        
        node.forEach((listItem: any) => {
          // Each list item may contain one or more paragraphs
          listItem.forEach((childNode: any) => {
            if (childNode.type.name === "paragraph") {
              // Create a body paragraph with the same content
              const bodyParagraph = myloSchema.nodes.paragraph.create(
                { type: "body" },
                childNode.content
              );
              bodyParagraphs.push(bodyParagraph);
            }
          });
        });
        
        // Replace the entire list structure with body paragraphs
        if (bodyParagraphs.length > 0) {
          tr = tr.replaceWith(pos, pos + node.nodeSize, bodyParagraphs);
        }
      } else if (type === 'heading') {
        // Just update paragraph type to body
        tr = tr.setNodeMarkup(pos, undefined, { type: "body" });
      }
    }
    
    view.dispatch(tr);
    view.focus();
  };

  const transformCase = (caseType: 'upper' | 'lower' | 'title' | 'sentence') => {
    const { from, to } = state.selection;
    
    // Don't transform if no selection
    if (from === to) return;
    
    let tr = state.tr;
    
    // Collect text fragments with their marks and positions
    const fragments: Array<{ text: string; marks: readonly Mark[]; startPos: number; endPos: number }> = [];
    
    state.doc.nodesBetween(from, to, (node, pos) => {
      if (node.isText) {
        const start = Math.max(from, pos);
        const end = Math.min(to, pos + node.nodeSize);
        const text = node.text?.slice(start - pos, end - pos) || '';
        fragments.push({ 
          text, 
          marks: node.marks,
          startPos: start,
          endPos: end
        });
      }
    });
    
    // Concatenate all text for transformation
    const selectedText = fragments.map(f => f.text).join('');
    
    // Don't transform if selection is empty or only whitespace
    if (!selectedText || selectedText.trim().length === 0) return;
    
    // Transform the text
    let transformedText = '';
    switch (caseType) {
      case 'upper':
        transformedText = selectedText.toUpperCase();
        break;
      case 'lower':
        transformedText = selectedText.toLowerCase();
        break;
      case 'title':
        transformedText = selectedText.replace(/\w\S*/g, (txt) => 
          txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase()
        );
        break;
      case 'sentence':
        transformedText = selectedText.toLowerCase()
          .replace(/(^\w|\.\s+\w)/g, (match) => match.toUpperCase());
        break;
    }
    
    // Don't dispatch if text didn't actually change
    if (transformedText === selectedText) return;
    
    // Build new text nodes preserving marks
    let offset = 0;
    const newNodes: any[] = [];
    
    fragments.forEach(fragment => {
      const originalLength = fragment.text.length;
      const transformedFragment = transformedText.substring(offset, offset + originalLength);
      
      if (transformedFragment) {
        // Create text node with preserved marks (including links)
        const textNode = myloSchema.text(transformedFragment, fragment.marks);
        newNodes.push(textNode);
      }
      
      offset += originalLength;
    });
    
    // Replace selection with transformed text, preserving all marks
    if (newNodes.length > 0) {
      tr.replaceWith(from, to, newNodes);
      view.dispatch(tr);
    }
    
    view.focus();
  };

  return (
    <>
      {/* Character formatting */}
      <Button
        variant={isBold ? "secondary" : "ghost"}
        size="sm"
        onClick={() => toggleMarkCommand("bold")}
        title="Bold"
      >
        <Bold className="h-4 w-4" />
      </Button>
      
      <Button
        variant={isItalic ? "secondary" : "ghost"}
        size="sm"
        onClick={() => toggleMarkCommand("italic")}
        title="Italic"
      >
        <Italic className="h-4 w-4" />
      </Button>
      
      <Button
        variant={isUnderline ? "secondary" : "ghost"}
        size="sm"
        onClick={() => toggleMarkCommand("underline")}
        title="Underline"
      >
        <Underline className="h-4 w-4" />
      </Button>

      {/* Superscript/Subscript */}
      <Button
        variant={isSuperscript ? "secondary" : "ghost"}
        size="sm"
        onClick={() => toggleMarkCommand("superscript")}
        title="Superscript"
      >
        <Superscript className="h-4 w-4" />
      </Button>
      
      <Button
        variant={isSubscript ? "secondary" : "ghost"}
        size="sm"
        onClick={() => toggleMarkCommand("subscript")}
        title="Subscript"
      >
        <Subscript className="h-4 w-4" />
      </Button>

      {/* Clear Formatting */}
      <Button
        variant="ghost"
        size="sm"
        onClick={clearFormatting}
        title="Clear Formatting - Removes all character marks and resets to Body"
      >
        <RemoveFormatting className="h-4 w-4" />
      </Button>

      {/* Case Transformation */}
      <Popover open={casePopoverOpen} onOpenChange={setCasePopoverOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" title="Transform Case">
            <CaseSensitive className="h-5 w-5 scale-150" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-1">
          <div className="flex flex-col gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="justify-start px-3"
              onClick={() => {
                transformCase("upper");
                setCasePopoverOpen(false);
              }}
            >
              ALL CAPS
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="justify-start px-3"
              onClick={() => {
                transformCase("title");
                setCasePopoverOpen(false);
              }}
            >
              Title Case
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="justify-start px-3"
              onClick={() => {
                transformCase("lower");
                setCasePopoverOpen(false);
              }}
            >
              lowercase
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="justify-start px-3"
              onClick={() => {
                transformCase("sentence");
                setCasePopoverOpen(false);
              }}
            >
              Sentence case
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </>
  );
}
