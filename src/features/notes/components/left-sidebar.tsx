"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  BookOpen,
  Clock3,
  Folder,
  LogOut,
  Plus,
  RotateCcw,
  Search,
  Sparkles,
  Star,
  Trash2,
  X
} from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { extractTextFromContent, formatDate } from "../lib/content";
import type { Note, Notebook, WorkspaceView } from "../types/note";

interface LeftSidebarProps {
  activeView: WorkspaceView;
  activeNotebookId: string | null;
  filteredNotes: Note[];
  notes: Note[];
  notebooks: Notebook[];
  searchQuery: string;
  selectedNoteId: string | null;
  userEmail: string;
  setSearchQuery: (query: string) => void;
  onCreateNote: () => void;
  onCreateNotebook: (name: string) => Promise<string | null> | undefined;
  onDeleteNote: (noteId: string) => void | Promise<void> | undefined;
  onPermanentDeleteNote: (note: Note) => void | Promise<void>;
  onRestoreNote: (noteId: string) => void | Promise<void> | undefined;
  onSelectNotebook: (notebookId: string) => void;
  onSelectNote: (noteId: string) => void;
  onSelectView: (view: WorkspaceView) => void;
  onSignOut: () => void | Promise<void>;
  onToggleFavorite: (note: Note) => void | Promise<void> | undefined;
}

const navItems: Array<{
  id: WorkspaceView;
  label: string;
  icon: typeof BookOpen;
}> = [
  { id: "all", label: "All Notes", icon: BookOpen },
  { id: "recent", label: "Recent", icon: Clock3 },
  { id: "favorites", label: "Favorites", icon: Star },
  { id: "trash", label: "Trash", icon: Trash2 }
];

export function LeftSidebar({
  activeNotebookId,
  activeView,
  filteredNotes,
  notebooks,
  notes,
  onCreateNote,
  onCreateNotebook,
  onDeleteNote,
  onPermanentDeleteNote,
  onRestoreNote,
  onSelectNotebook,
  onSelectNote,
  onSelectView,
  onSignOut,
  onToggleFavorite,
  searchQuery,
  selectedNoteId,
  setSearchQuery,
  userEmail
}: LeftSidebarProps) {
  const [creatingNotebook, setCreatingNotebook] = useState(false);
  const [notebookName, setNotebookName] = useState("");

  const counts = useMemo(() => {
    const activeNotes = notes.filter((note) => !note.deleted);
    return {
      all: activeNotes.length,
      recent: activeNotes.filter((note) => {
        const updatedAt =
          note.updatedAt instanceof Date
            ? note.updatedAt.getTime()
            : note.updatedAt?.toDate?.().getTime();
        return updatedAt ? Date.now() - updatedAt <= 1000 * 60 * 60 * 24 * 7 : false;
      }).length,
      favorites: activeNotes.filter((note) => note.favorite).length,
      trash: notes.filter((note) => note.deleted).length
    };
  }, [notes]);

  async function handleCreateNotebook(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const createdId = await onCreateNotebook(notebookName);
    setNotebookName("");
    setCreatingNotebook(false);

    if (createdId) {
      onSelectNotebook(createdId);
    }
  }

  return (
    <aside className="hidden h-screen w-[320px] shrink-0 flex-col border-r border-white/10 bg-black/25 p-4 backdrop-blur-2xl lg:flex">
      <div className="mb-5 flex items-center gap-3">
        <div className="grid size-11 place-items-center rounded-md bg-primary/20 text-primary shadow-glow">
          <Sparkles className="size-5" />
        </div>
        <div className="min-w-0">
          <h1 className="truncate text-lg font-semibold tracking-normal">
            SYNAPSE NOTES
          </h1>
          <p className="truncate text-xs text-muted-foreground">{userEmail}</p>
        </div>
      </div>

      <Button className="mb-4 w-full" onClick={onCreateNote}>
        <Plus className="size-4" />
        New Note
      </Button>

      <label className="relative mb-4 block">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Search notes"
          value={searchQuery}
        />
      </label>

      <nav className="space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = activeView === item.id && !activeNotebookId;

          return (
            <button
              className={cn(
                "flex h-9 w-full items-center gap-3 rounded-md px-3 text-left text-sm transition",
                active
                  ? "bg-primary/15 text-white shadow-pink-glow"
                  : "text-muted-foreground hover:bg-white/10 hover:text-white"
              )}
              key={item.id}
              onClick={() => onSelectView(item.id)}
              type="button"
            >
              <Icon className="size-4" />
              <span className="min-w-0 flex-1 truncate">{item.label}</span>
              <Badge className="border-white/10 bg-white/5 px-1.5 py-0.5">
                {counts[item.id]}
              </Badge>
            </button>
          );
        })}
      </nav>

      <Separator className="my-4" />

      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase text-muted-foreground">
          Notebooks
        </span>
        <Button
          onClick={() => setCreatingNotebook((current) => !current)}
          size="icon-sm"
          title="Create notebook"
          type="button"
          variant="ghost"
        >
          <Plus className="size-4" />
        </Button>
      </div>

      <AnimatePresence initial={false}>
        {creatingNotebook ? (
          <motion.form
            animate={{ opacity: 1, height: "auto" }}
            className="mb-3 overflow-hidden"
            exit={{ opacity: 0, height: 0 }}
            initial={{ opacity: 0, height: 0 }}
            onSubmit={handleCreateNotebook}
          >
            <Input
              autoFocus
              onChange={(event) => setNotebookName(event.target.value)}
              placeholder="Notebook name"
              value={notebookName}
            />
          </motion.form>
        ) : null}
      </AnimatePresence>

      <div className="max-h-48 space-y-1 overflow-y-auto pr-1 synapse-scrollbar">
        {notebooks.map((notebook) => (
          <button
            className={cn(
              "flex h-9 w-full items-center gap-3 rounded-md px-3 text-left text-sm transition",
              activeNotebookId === notebook.id
                ? "bg-white/10 text-white"
                : "text-muted-foreground hover:bg-white/10 hover:text-white"
            )}
            key={notebook.id}
            onClick={() => onSelectNotebook(notebook.id)}
            type="button"
          >
            <span
              className="size-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: notebook.color }}
            />
            <Folder className="size-4 opacity-70" />
            <span className="min-w-0 flex-1 truncate">{notebook.name}</span>
          </button>
        ))}
      </div>

      <Separator className="my-4" />

      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase text-muted-foreground">
          Notes
        </span>
        <Badge>{filteredNotes.length}</Badge>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto pr-1 synapse-scrollbar">
        <AnimatePresence initial={false}>
          {filteredNotes.map((note) => (
            <motion.button
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "mb-2 w-full rounded-md border p-3 text-left transition",
                selectedNoteId === note.id
                  ? "border-primary/40 bg-primary/10 shadow-glow"
                  : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"
              )}
              exit={{ opacity: 0, y: -8 }}
              initial={{ opacity: 0, y: 8 }}
              key={note.id}
              layout
              onClick={() => onSelectNote(note.id)}
              type="button"
            >
              <div className="flex items-start gap-2">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-white">
                    {note.title || "Untitled Note"}
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">
                    {extractTextFromContent(note.content) || "No content yet"}
                  </p>
                </div>
                {activeView !== "trash" ? (
                  <button
                    className={cn(
                      "rounded-md p-1 transition hover:bg-white/10",
                      note.favorite ? "text-fuchsia-200" : "text-muted-foreground"
                    )}
                    onClick={(event) => {
                      event.stopPropagation();
                      void onToggleFavorite(note);
                    }}
                    title={note.favorite ? "Remove favorite" : "Add favorite"}
                    type="button"
                  >
                    <Star
                      className={cn("size-4", note.favorite && "fill-current")}
                    />
                  </button>
                ) : null}
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                <span>{formatDate(note.updatedAt)}</span>
                {activeView === "trash" ? (
                  <span className="flex items-center gap-1">
                    <button
                      className="rounded-md p-1 transition hover:bg-white/10 hover:text-white"
                      onClick={(event) => {
                        event.stopPropagation();
                        void onRestoreNote(note.id);
                      }}
                      title="Restore note"
                      type="button"
                    >
                      <RotateCcw className="size-3.5" />
                    </button>
                    <button
                      className="rounded-md p-1 transition hover:bg-destructive/20 hover:text-red-100"
                      onClick={(event) => {
                        event.stopPropagation();
                        void onPermanentDeleteNote(note);
                      }}
                      title="Delete permanently"
                      type="button"
                    >
                      <X className="size-3.5" />
                    </button>
                  </span>
                ) : (
                  <button
                    className="rounded-md p-1 transition hover:bg-destructive/20 hover:text-red-100"
                    onClick={(event) => {
                      event.stopPropagation();
                      void onDeleteNote(note.id);
                    }}
                    title="Move to trash"
                    type="button"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                )}
              </div>
            </motion.button>
          ))}
        </AnimatePresence>
      </div>

      <Button className="mt-4 w-full" onClick={onSignOut} variant="outline">
        <LogOut className="size-4" />
        Sign Out
      </Button>
    </aside>
  );
}
