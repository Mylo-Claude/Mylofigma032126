import { inputRules, wrappingInputRule } from "prosemirror-inputrules";
import { myloSchema } from "./schema";

const bulletListRule = wrappingInputRule(
  /^-\s$/,
  myloSchema.nodes.bullet_list,
);

const orderedListRule = wrappingInputRule(
  /^(\d+)\.\s$/,
  myloSchema.nodes.ordered_list,
  (match) => ({ start: Number(match[1]) }),
  (match, node) => node.attrs.start + node.childCount === Number(match[1]),
);

export function myloInputRules() {
  return inputRules({
    rules: [bulletListRule, orderedListRule],
  });
}
