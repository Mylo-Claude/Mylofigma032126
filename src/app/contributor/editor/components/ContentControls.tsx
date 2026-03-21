import { EditorView } from "prosemirror-view";
import { Link as LinkIcon } from "lucide-react";
import { Button } from "../../../components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../../components/ui/popover";
import { Input } from "../../../components/ui/input";
import { useState } from "react";
import { myloSchema } from "../../../mylo/schema";

/**
 * ContentControls - Content Element Control Group
 * 
 * Governance: Contributors insert content elements (links)
 * Responsibility: 
 *   - Link insertion: Add hyperlinks to selected text
 * Role: Contributor (content elements)
 * 
 * Links are structural markers. Templates may control rendering in Preview.
 * 
 * State: Document content state (links persist with href attribute)
 * 
 * @see Mylo Governance: Links
 */

interface ContentControlsProps {
  view: EditorView;
}

export function ContentControls({ view }: ContentControlsProps) {
  const [linkPopoverOpen, setLinkPopoverOpen] = useState(false);
  const [linkHref, setLinkHref] = useState("");

  const state = view.state;

  const insertLink = () => {
    if (!linkHref) return;
    
    const { from, to } = state.selection;
    const mark = myloSchema.marks.link.create({ href: linkHref });
    
    const tr = state.tr.addMark(from, to, mark);
    view.dispatch(tr);
    view.focus();
    
    setLinkHref("");
    setLinkPopoverOpen(false);
  };

  return (
    <>
      {/* Link */}
      <Popover open={linkPopoverOpen} onOpenChange={setLinkPopoverOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" title="Insert Link">
            <LinkIcon className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80">
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Insert Link</h4>
            <Input
              placeholder="https://example.com"
              value={linkHref}
              onChange={(e) => setLinkHref(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  insertLink();
                }
              }}
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setLinkHref("");
                  setLinkPopoverOpen(false);
                }}
              >
                Cancel
              </Button>
              <Button size="sm" onClick={insertLink}>
                Insert
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </>
  );
}