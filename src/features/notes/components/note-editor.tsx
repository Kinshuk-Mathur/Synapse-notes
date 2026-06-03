"use client";

import { EditorContent, useEditor } from "@tiptap/react";
import { motion } from "framer-motion";
import {
  Bold,
  BookMarked,
  BookmarkPlus,
  Check,
  Code2,
  Eye,
  Heading1,
  Heading2,
  Heading3,
  Italic,
  Link2,
  List,
  ListOrdered,
  Loader2,
  Minus,
  Pencil,
  Quote,
  RotateCcw,
  Star,
  Strikethrough,
  Table2,
  Trash2,
  Underline as UnderlineIcon,
  X
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { assignMissingBlockIds, createBlockId } from "../lib/block-ids";
import {
  EMPTY_NOTE_CONTENT,
  sanitizeContent
} from "../lib/content";
import { getEditorExtensions } from "../lib/editor-extensions";
import type {
  CreateBookmarkInput,
  Note,
  UpdateNoteInput
} from "../types/note";

interface NoteEditorProps {
  note: Note;
  readMode: boolean;
  onReadModeChange: (readMode: boolean) => void;
  onSave: (input: UpdateNoteInput) => Promise<void>;
  onToggleFavorite: () => void | Promise<void>;
  onDelete: () => void | Promise<void>;
  onRestore: () => void | Promise<void>;
  onPermanentDelete: () => void | Promise<void>;
  onCreateBookmark: (bookmark: CreateBookmarkInput) => Promise<void>;
}

type SaveState = "saved" | "saving" | "error";

const highlightOptions = [
  { label: "Yellow highlight", color: "#facc15" },
  { label: "Green highlight", color: "#4ade80" },
  { label: "Purple highlight", color: "#c084fc" },
  { label: "Blue highlight", color: "#60a5fa" }
];

export function NoteEditor({
  note,
  onCreateBookmark,
  onDelete,
  onPermanentDelete,
  onReadModeChange,
  onRestore,
  onSave,
  onToggleFavorite,
  readMode
}: NoteEditorProps) {
  const [title, setTitle] = useState(note.title || "Untitled Note");
  const [draftContent, setDraftContent] = useState(
    sanitizeContent(note.content || EMPTY_NOTE_CONTENT)
  );
  const [dirty, setDirty] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>("saved");
  const [editorMessage, setEditorMessage] = useState<string | null>(null);
  const [selectionToolbar, setSelectionToolbar] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const lastSavedHash = useRef(getSaveHash(note.title, note.content));
  const readModeRef = useRef(readMode);
  const deletedRef = useRef(note.deleted);

  useEffect(() => {
    readModeRef.current = readMode;
  }, [readMode]);

  useEffect(() => {
    deletedRef.current = note.deleted;
  }, [note.deleted]);

  const updateSelectionToolbar = useCallback(() => {
    if (!readModeRef.current || deletedRef.current || typeof window === "undefined") {
      setSelectionToolbar(null);
      return;
    }

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
      setSelectionToolbar(null);
      return;
    }

    const rect = selection.getRangeAt(0).getBoundingClientRect();
    if (!rect.width && !rect.height) {
      setSelectionToolbar(null);
      return;
    }

    setSelectionToolbar({
      top: Math.max(84, rect.top - 54),
      left: Math.min(
        window.innerWidth - 180,
        Math.max(180, rect.left + rect.width / 2)
      )
    });
  }, []);

  const editor = useEditor({
    content: note.content || EMPTY_NOTE_CONTENT,
    editable: !readMode && !note.deleted,
    editorProps: {
      attributes: {
        class:
          "tiptap mx-auto w-full max-w-4xl px-8 pb-24 pt-8 text-[1.02rem] md:px-12"
      }
    },
    extensions: getEditorExtensions(),
    immediatelyRender: false,
    onCreate: ({ editor: createdEditor }) => {
      assignMissingBlockIds(createdEditor);
    },
    onSelectionUpdate: updateSelectionToolbar,
    onUpdate: ({ editor: updatedEditor }) => {
      assignMissingBlockIds(updatedEditor);
      const nextContent = sanitizeContent(updatedEditor.getJSON());
      setDraftContent(nextContent);
      setDirty(true);
      setSaveState("saving");
    }
  });

  useEffect(() => {
    setTitle(note.title || "Untitled Note");
    const nextContent = sanitizeContent(note.content || EMPTY_NOTE_CONTENT);
    setDraftContent(nextContent);
    setDirty(false);
    setSaveState("saved");
    setEditorMessage(null);
    lastSavedHash.current = getSaveHash(note.title, nextContent);

    if (editor) {
      editor.commands.setContent(nextContent, false);
      requestAnimationFrame(() => assignMissingBlockIds(editor));
    }
  }, [editor, note.id, note.title, note.content]);

  useEffect(() => {
    if (!editor) {
      return;
    }

    editor.setEditable(!readMode && !note.deleted);
    setSelectionToolbar(null);
  }, [editor, note.deleted, readMode]);

  useEffect(() => {
    if (!dirty || note.deleted) {
      return;
    }

    setSaveState("saving");
    const autosave = window.setTimeout(async () => {
      const nextHash = getSaveHash(title, draftContent);

      if (nextHash === lastSavedHash.current) {
        setDirty(false);
        setSaveState("saved");
        return;
      }

      try {
        await onSave({
          title,
          content: draftContent
        });
        lastSavedHash.current = nextHash;
        setDirty(false);
        setSaveState("saved");
      } catch (saveError) {
        setSaveState("error");
        setEditorMessage(
          saveError instanceof Error ? saveError.message : "Autosave failed."
        );
      }
    }, 3000);

    return () => window.clearTimeout(autosave);
  }, [dirty, draftContent, note.deleted, onSave, title]);

  const canEdit = !readMode && !note.deleted;

  const toolbarItems = useMemo(
    () => [
      {
        title: "Heading 1",
        icon: Heading1,
        active: editor?.isActive("heading", { level: 1 }),
        action: () => editor?.chain().focus().toggleHeading({ level: 1 }).run()
      },
      {
        title: "Heading 2",
        icon: Heading2,
        active: editor?.isActive("heading", { level: 2 }),
        action: () => editor?.chain().focus().toggleHeading({ level: 2 }).run()
      },
      {
        title: "Heading 3",
        icon: Heading3,
        active: editor?.isActive("heading", { level: 3 }),
        action: () => editor?.chain().focus().toggleHeading({ level: 3 }).run()
      },
      {
        title: "Bold",
        icon: Bold,
        active: editor?.isActive("bold"),
        action: () => editor?.chain().focus().toggleBold().run()
      },
      {
        title: "Italic",
        icon: Italic,
        active: editor?.isActive("italic"),
        action: () => editor?.chain().focus().toggleItalic().run()
      },
      {
        title: "Underline",
        icon: UnderlineIcon,
        active: editor?.isActive("underline"),
        action: () => editor?.chain().focus().toggleUnderline().run()
      },
      {
        title: "Strikethrough",
        icon: Strikethrough,
        active: editor?.isActive("strike"),
        action: () => editor?.chain().focus().toggleStrike().run()
      },
      {
        title: "Bullet list",
        icon: List,
        active: editor?.isActive("bulletList"),
        action: () => editor?.chain().focus().toggleBulletList().run()
      },
      {
        title: "Numbered list",
        icon: ListOrdered,
        active: editor?.isActive("orderedList"),
        action: () => editor?.chain().focus().toggleOrderedList().run()
      },
      {
        title: "Quote",
        icon: Quote,
        active: editor?.isActive("blockquote"),
        action: () => editor?.chain().focus().toggleBlockquote().run()
      },
      {
        title: "Code block",
        icon: Code2,
        active: editor?.isActive("codeBlock"),
        action: () => editor?.chain().focus().toggleCodeBlock().run()
      },
      {
        title: "Divider",
        icon: Minus,
        active: false,
        action: () => editor?.chain().focus().setHorizontalRule().run()
      },
      {
        title: "Table",
        icon: Table2,
        active: editor?.isActive("table"),
        action: () =>
          editor
            ?.chain()
            .focus()
            .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
            .run()
      },
      {
        title: "Link",
        icon: Link2,
        active: editor?.isActive("link"),
        action: () => setLink(editor)
      }
    ],
    [editor]
  );

  function markDirtyTitle(nextTitle: string) {
    setTitle(nextTitle);
    setDirty(true);
    setSaveState("saving");
  }

  async function applyHighlight(color: string) {
    if (!editor) {
      return;
    }

    const wasEditable = editor.isEditable;
    if (!wasEditable) {
      editor.setEditable(true);
    }

    editor.chain().focus().setHighlight({ color }).run();
    assignMissingBlockIds(editor);
    const nextContent = sanitizeContent(editor.getJSON());
    setDraftContent(nextContent);
    setDirty(true);
    setSaveState("saving");

    if (!wasEditable) {
      editor.setEditable(false);
    }
    setSelectionToolbar(null);
  }

  async function addBookmark() {
    if (!editor) {
      return;
    }

    const bookmark = getCurrentBlockBookmark(editor);
    if (!bookmark) {
      return;
    }

    await onCreateBookmark(bookmark);
    setSelectionToolbar(null);
  }

  return (
    <motion.section
      animate={{ opacity: 1, y: 0 }}
      className="flex h-full min-h-0 flex-col"
      exit={{ opacity: 0, y: -12 }}
      initial={{ opacity: 0, y: 12 }}
      transition={{ duration: 0.24 }}
    >
      <header className="shrink-0 border-b border-white/10 bg-black/25 px-6 py-4 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-5xl items-center gap-4">
          <div className="min-w-0 flex-1">
            {readMode || note.deleted ? (
              <h2 className="truncate text-2xl font-semibold tracking-normal text-white">
                {title || "Untitled Note"}
              </h2>
            ) : (
              <input
                className="w-full bg-transparent text-2xl font-semibold tracking-normal text-white outline-none placeholder:text-muted-foreground"
                onChange={(event) => markDirtyTitle(event.target.value)}
                placeholder="Untitled Note"
                value={title}
              />
            )}
            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <SaveStatus state={saveState} />
              {editorMessage ? <span>{editorMessage}</span> : null}
            </div>
          </div>

          {note.deleted ? (
            <div className="flex items-center gap-2">
              <Button onClick={onRestore} size="sm" variant="outline">
                <RotateCcw className="size-4" />
                Restore
              </Button>
              <Button onClick={onPermanentDelete} size="sm" variant="destructive">
                <X className="size-4" />
                Delete
              </Button>
            </div>
          ) : readMode ? (
            <Button onClick={() => onReadModeChange(false)} size="sm" variant="outline">
              <Pencil className="size-4" />
              Edit
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                onClick={onToggleFavorite}
                size="icon-sm"
                title={note.favorite ? "Remove favorite" : "Add favorite"}
                variant="ghost"
              >
                <Star
                  className={cn(
                    "size-4",
                    note.favorite && "fill-fuchsia-200 text-fuchsia-200"
                  )}
                />
              </Button>
              <Button
                onClick={() => addBookmark()}
                size="icon-sm"
                title="Bookmark current section"
                variant="ghost"
              >
                <BookMarked className="size-4" />
              </Button>
              <Button
                onClick={() => onReadModeChange(true)}
                size="sm"
                variant="outline"
              >
                <Eye className="size-4" />
                Read
              </Button>
              <Button
                onClick={onDelete}
                size="icon-sm"
                title="Move to trash"
                variant="ghost"
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          )}
        </div>
      </header>

      {canEdit ? (
        <div className="sticky top-0 z-20 border-b border-white/10 bg-[#090812]/90 px-6 py-2 backdrop-blur-2xl">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-1">
            {toolbarItems.map((item) => {
              const Icon = item.icon;
              return (
                <Button
                  className={cn(item.active && "bg-primary/20 text-white")}
                  key={item.title}
                  onClick={item.action}
                  size="icon-sm"
                  title={item.title}
                  type="button"
                  variant="ghost"
                >
                  <Icon className="size-4" />
                </Button>
              );
            })}
          </div>
        </div>
      ) : null}

      {readMode && selectionToolbar ? (
        <div
          className="fixed z-50 flex -translate-x-1/2 items-center gap-1 rounded-md border border-white/10 bg-[#090812]/95 p-1 shadow-glow backdrop-blur-xl"
          style={{
            left: selectionToolbar.left,
            top: selectionToolbar.top
          }}
        >
          {highlightOptions.map((option) => (
            <button
              className="size-7 rounded-md border border-white/10 transition hover:scale-105"
              key={option.color}
              onClick={() => void applyHighlight(option.color)}
              style={{ backgroundColor: option.color }}
              title={option.label}
              type="button"
            />
          ))}
          <Button
            onClick={() => void addBookmark()}
            size="icon-sm"
            title="Bookmark selection section"
            type="button"
            variant="ghost"
          >
            <BookmarkPlus className="size-4" />
          </Button>
        </div>
      ) : null}

      <div className="min-h-0 flex-1 overflow-y-auto synapse-scrollbar">
        <EditorContent editor={editor} />
      </div>
    </motion.section>
  );
}

function SaveStatus({ state }: { state: SaveState }) {
  if (state === "saved") {
    return (
      <span className="inline-flex items-center gap-1 text-emerald-200">
        <Check className="size-3.5" />
        Saved
      </span>
    );
  }

  if (state === "error") {
    return <span className="text-red-200">Autosave needs attention</span>;
  }

  return (
    <span className="inline-flex items-center gap-1 text-fuchsia-100">
      <Loader2 className="size-3.5 animate-spin" />
      Saving...
    </span>
  );
}

function getSaveHash(title: string, content: unknown) {
  return JSON.stringify({
    title: title.trim() || "Untitled Note",
    content
  });
}

function setLink(editor: ReturnType<typeof useEditor>) {
  if (!editor) {
    return;
  }

  const previousUrl = editor.getAttributes("link").href as string | undefined;
  const url = window.prompt("Paste link", previousUrl || "https://");

  if (url === null) {
    return;
  }

  if (url.trim() === "") {
    editor.chain().focus().extendMarkRange("link").unsetLink().run();
    return;
  }

  editor
    .chain()
    .focus()
    .extendMarkRange("link")
    .setLink({ href: url.trim() })
    .run();
}

function getCurrentBlockBookmark(
  editor: NonNullable<ReturnType<typeof useEditor>>
): CreateBookmarkInput | null {
  const { state, view } = editor;
  const { $from } = state.selection;

  for (let depth = $from.depth; depth > 0; depth -= 1) {
    const node = $from.node(depth);

    if (node.type.name !== "heading" && node.type.name !== "paragraph") {
      continue;
    }

    const position = $from.before(depth);
    let anchor = typeof node.attrs.id === "string" ? node.attrs.id : "";

    if (!anchor) {
      anchor = createBlockId(node.type.name);
      const transaction = state.tr.setNodeMarkup(position, undefined, {
        ...node.attrs,
        id: anchor
      });
      view.dispatch(transaction);
    }

    return {
      anchor,
      label:
        node.textContent.trim().slice(0, 90) ||
        (node.type.name === "heading" ? "Bookmarked heading" : "Bookmarked paragraph")
    };
  }

  return null;
}
