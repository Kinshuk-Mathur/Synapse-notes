import type { Editor } from "@tiptap/react";

export function createBlockId(prefix = "block") {
  const value =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2);

  return `${prefix}-${value}`;
}

export function assignMissingBlockIds(editor: Editor) {
  const { state, view } = editor;
  const transaction = state.tr;
  let changed = false;

  state.doc.descendants((node, position) => {
    if (
      (node.type.name === "heading" || node.type.name === "paragraph") &&
      !node.attrs.id
    ) {
      transaction.setNodeMarkup(position, undefined, {
        ...node.attrs,
        id: createBlockId(node.type.name)
      });
      changed = true;
    }
  });

  if (changed) {
    transaction.setMeta("addToHistory", false);
    view.dispatch(transaction);
  }
}
