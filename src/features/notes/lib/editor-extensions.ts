import Heading from "@tiptap/extension-heading";
import Highlight from "@tiptap/extension-highlight";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Paragraph from "@tiptap/extension-paragraph";
import Placeholder from "@tiptap/extension-placeholder";
import Table from "@tiptap/extension-table";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import TableRow from "@tiptap/extension-table-row";
import Underline from "@tiptap/extension-underline";
import StarterKit from "@tiptap/starter-kit";

const SynapseHeading = Heading.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      id: {
        default: null,
        parseHTML: (element) => element.getAttribute("id"),
        renderHTML: (attributes) =>
          attributes.id
            ? {
                id: attributes.id
              }
            : {}
      }
    };
  }
});

const SynapseParagraph = Paragraph.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      id: {
        default: null,
        parseHTML: (element) => element.getAttribute("id"),
        renderHTML: (attributes) =>
          attributes.id
            ? {
                id: attributes.id
              }
            : {}
      }
    };
  }
});

export function getEditorExtensions() {
  return [
    StarterKit.configure({
      heading: false,
      paragraph: false,
      codeBlock: {
        HTMLAttributes: {
          class: "synapse-code-block"
        }
      }
    }),
    SynapseHeading.configure({
      levels: [1, 2, 3]
    }),
    SynapseParagraph,
    Underline,
    Link.configure({
      autolink: true,
      defaultProtocol: "https",
      openOnClick: false,
      HTMLAttributes: {
        rel: "noopener noreferrer nofollow",
        target: "_blank"
      }
    }),
    Image.configure({
      allowBase64: false
    }),
    Table.configure({
      resizable: true
    }),
    TableRow,
    TableHeader,
    TableCell,
    Highlight.configure({
      multicolor: true
    }),
    Placeholder.configure({
      placeholder: "Start writing..."
    })
  ];
}
