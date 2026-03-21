import { keymap } from "prosemirror-keymap";
import { toggleMark } from "prosemirror-commands";
import { myloSchema } from "./schema";
import { undo, redo } from "prosemirror-history";
import { splitListItem, liftListItem, sinkListItem } from "prosemirror-schema-list";

/**
 * Mylo keyboard shortcuts
 */
export function myloKeymap() {
  const listItem = myloSchema.nodes.list_item;
  
  return keymap({
    // Character formatting
    "Mod-b": toggleMark(myloSchema.marks.bold),
    "Mod-i": toggleMark(myloSchema.marks.italic),
    "Mod-u": toggleMark(myloSchema.marks.underline),
    
    // Undo/Redo
    "Mod-z": undo,
    "Mod-y": redo,
    "Mod-Shift-z": redo,
    
    // List editing
    "Enter": splitListItem(listItem),
    "Tab": sinkListItem(listItem),
    "Shift-Tab": liftListItem(listItem),
  });
}