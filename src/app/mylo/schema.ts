import { Schema } from "prosemirror-model";

/**
 * Mylo ProseMirror Schema
 * 
 * Defines the document structure with:
 * - Paragraph types: body, heading (levels 1-3)
 * - List structures: bullet_list, ordered_list, list_item
 * - Character marks: bold, italic, underline, link, superscript, subscript
 */

export const myloSchema = new Schema({
  nodes: {
    doc: {
      content: "block+"
    },
    paragraph: {
      attrs: {
        type: { default: "body" }, // body, heading1, heading2, heading3
      },
      content: "inline*",
      group: "block",
      parseDOM: [
        { tag: "p", attrs: { type: "body" } },
        { tag: "h1", attrs: { type: "heading1" } },
        { tag: "h2", attrs: { type: "heading2" } },
        { tag: "h3", attrs: { type: "heading3" } },
      ],
      toDOM(node) {
        const tag = node.attrs.type === "body" ? "p" :
                    node.attrs.type === "heading1" ? "h1" :
                    node.attrs.type === "heading2" ? "h2" :
                    node.attrs.type === "heading3" ? "h3" : "p";
        return [tag, { "data-type": node.attrs.type }, 0];
      }
    },
    bullet_list: {
      content: "list_item+",
      group: "block",
      parseDOM: [{ tag: "ul" }],
      toDOM() { return ["ul", 0]; }
    },
    ordered_list: {
      content: "list_item+",
      group: "block",
      attrs: {
        start: { default: 1 }
      },
      parseDOM: [{ tag: "ol" }],
      toDOM(node) { 
        return ["ol", { start: node.attrs.start }, 0]; 
      }
    },
    list_item: {
      content: "paragraph block*",
      parseDOM: [{ tag: "li" }],
      toDOM() { return ["li", 0]; },
      defining: true
    },
    text: {
      group: "inline"
    }
  },
  marks: {
    bold: {
      parseDOM: [
        { tag: "strong" },
        { tag: "b" },
        { style: "font-weight", getAttrs: (value) => /^(bold(er)?|[5-9]\d{2,})$/.test(value as string) && null }
      ],
      toDOM() { return ["strong", 0]; }
    },
    italic: {
      parseDOM: [
        { tag: "i" },
        { tag: "em" },
        { style: "font-style=italic" }
      ],
      toDOM() { return ["em", 0]; }
    },
    underline: {
      parseDOM: [
        { tag: "u" },
        { style: "text-decoration=underline" }
      ],
      toDOM() { return ["u", 0]; }
    },
    link: {
      attrs: {
        href: {},
        title: { default: null }
      },
      inclusive: false,
      parseDOM: [
        {
          tag: "a[href]",
          getAttrs(dom) {
            return {
              href: (dom as HTMLElement).getAttribute("href"),
              title: (dom as HTMLElement).getAttribute("title")
            };
          }
        }
      ],
      toDOM(node) {
        const { href, title } = node.attrs;
        return ["a", { href, title }, 0];
      }
    },
    superscript: {
      excludes: "subscript",
      parseDOM: [{ tag: "sup" }],
      toDOM() { return ["sup", 0]; }
    },
    subscript: {
      excludes: "superscript",
      parseDOM: [{ tag: "sub" }],
      toDOM() { return ["sub", 0]; }
    }
  }
});
