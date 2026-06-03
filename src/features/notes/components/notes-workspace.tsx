"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Plus } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/auth-context";
import {
  collectHeadings,
  countWords,
  extractTextFromContent,
  isRecentlyUpdated
} from "../lib/content";
import { DEFAULT_NOTEBOOKS } from "../lib/default-notebooks";
import {
  useNoteBookmarks,
  useNotesWorkspace
} from "../hooks/use-notes-workspace";
import type {
  CreateBookmarkInput,
  Note,
  UpdateNoteInput,
  WorkspaceView
} from "../types/note";
import { LeftSidebar } from "./left-sidebar";
import { NoteEditor } from "./note-editor";
import { RightPanel } from "./right-panel";

export function NotesWorkspace() {
  const { user, signOut } = useAuth();
  const [activeView, setActiveView] = useState<WorkspaceView>("all");
  const [activeNotebookId, setActiveNotebookId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [readMode, setReadMode] = useState(false);

  const { notes, notebooks, loading, error, actions } = useNotesWorkspace(
    user?.uid
  );

  const selectedNote = useMemo(
    () => notes.find((note) => note.id === selectedNoteId) ?? null,
    [notes, selectedNoteId]
  );
  const { bookmarks } = useNoteBookmarks(user?.uid, selectedNote?.id);

  const filteredNotes = useMemo(() => {
    const search = searchQuery.trim().toLowerCase();
    let scopedNotes = notes;

    if (activeView === "trash") {
      scopedNotes = scopedNotes.filter((note) => note.deleted);
    } else {
      scopedNotes = scopedNotes.filter((note) => !note.deleted);
    }

    if (activeView === "favorites") {
      scopedNotes = scopedNotes.filter((note) => note.favorite);
    }

    if (activeView === "recent") {
      scopedNotes = scopedNotes.filter((note) =>
        isRecentlyUpdated(note.updatedAt)
      );
    }

    if (activeNotebookId) {
      scopedNotes = scopedNotes.filter(
        (note) => note.notebookId === activeNotebookId
      );
    }

    if (search) {
      scopedNotes = scopedNotes.filter((note) => {
        const haystack = `${note.title} ${extractTextFromContent(
          note.content
        )}`.toLowerCase();
        return haystack.includes(search);
      });
    }

    return scopedNotes;
  }, [activeNotebookId, activeView, notes, searchQuery]);

  useEffect(() => {
    if (selectedNote && filteredNotes.some((note) => note.id === selectedNote.id)) {
      return;
    }

    setSelectedNoteId(filteredNotes[0]?.id ?? null);
  }, [filteredNotes, selectedNote]);

  const createNewNote = useCallback(async () => {
    if (!actions) {
      return;
    }

    const notebookId =
      activeNotebookId || notebooks[0]?.id || DEFAULT_NOTEBOOKS[0].id;
    const noteId = await actions.createNote(notebookId);
    setActiveView("all");
    setSelectedNoteId(noteId);
    setReadMode(false);
  }, [actions, activeNotebookId, notebooks]);

  const handleSave = useCallback(
    async (input: UpdateNoteInput) => {
      if (!actions || !selectedNote) {
        return;
      }

      await actions.updateNote(selectedNote.id, input);
    },
    [actions, selectedNote]
  );

  const handleCreateBookmark = useCallback(
    async (bookmark: CreateBookmarkInput) => {
      if (!actions || !selectedNote) {
        return;
      }

      await actions.createBookmark(selectedNote.id, bookmark);
    },
    [actions, selectedNote]
  );

  const handlePermanentDelete = useCallback(
    async (note: Note) => {
      if (!actions) {
        return;
      }

      const confirmed = window.confirm(
        `Permanently delete "${note.title || "Untitled Note"}"?`
      );

      if (!confirmed) {
        return;
      }

      await actions.permanentlyDeleteNote(note.id);
      setSelectedNoteId(null);
    },
    [actions]
  );

  const outline = useMemo(
    () => collectHeadings(selectedNote?.content),
    [selectedNote?.content]
  );
  const wordCount = useMemo(
    () => countWords(selectedNote?.content),
    [selectedNote?.content]
  );

  return (
    <motion.div
      animate={{ opacity: 1 }}
      className="flex h-screen overflow-hidden bg-black/10 text-foreground"
      initial={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
    >
      <LeftSidebar
        activeNotebookId={activeNotebookId}
        activeView={activeView}
        filteredNotes={filteredNotes}
        notebooks={notebooks}
        notes={notes}
        onCreateNote={createNewNote}
        onCreateNotebook={(name) => actions?.createNotebook(name)}
        onDeleteNote={(noteId) => actions?.softDeleteNote(noteId)}
        onPermanentDeleteNote={(note) => handlePermanentDelete(note)}
        onRestoreNote={(noteId) => actions?.restoreNote(noteId)}
        onSelectNotebook={(notebookId) => {
          setActiveNotebookId(notebookId);
          setActiveView("all");
        }}
        onSelectNote={(noteId) => {
          setSelectedNoteId(noteId);
          setReadMode(false);
        }}
        onSelectView={(view) => {
          setActiveView(view);
          setActiveNotebookId(null);
        }}
        onSignOut={signOut}
        onToggleFavorite={(note) =>
          actions?.updateNote(note.id, { favorite: !note.favorite })
        }
        searchQuery={searchQuery}
        selectedNoteId={selectedNoteId}
        setSearchQuery={setSearchQuery}
        userEmail={user?.email ?? "Student"}
      />

      <main className="flex min-w-0 flex-1 flex-col border-x border-white/10 bg-black/20">
        {error ? (
          <div className="border-b border-destructive/30 bg-destructive/10 px-5 py-3 text-sm text-red-100">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="grid h-full place-items-center">
            <div className="glass-panel flex items-center gap-3 rounded-lg px-5 py-4 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin text-primary" />
              Syncing workspace
            </div>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {selectedNote ? (
              <NoteEditor
                key={selectedNote.id}
                note={selectedNote}
                onCreateBookmark={handleCreateBookmark}
                onDelete={() => actions?.softDeleteNote(selectedNote.id)}
                onPermanentDelete={() => handlePermanentDelete(selectedNote)}
                onReadModeChange={setReadMode}
                onRestore={() => actions?.restoreNote(selectedNote.id)}
                onSave={handleSave}
                onToggleFavorite={() =>
                  actions?.updateNote(selectedNote.id, {
                    favorite: !selectedNote.favorite
                  })
                }
                readMode={readMode}
              />
            ) : (
              <EmptyWorkspace onCreateNote={createNewNote} />
            )}
          </AnimatePresence>
        )}
      </main>

      <RightPanel
        bookmarks={bookmarks}
        note={selectedNote}
        notebooks={notebooks}
        onBookmarkClick={(anchor) =>
          document.getElementById(anchor)?.scrollIntoView({
            behavior: "smooth",
            block: "center"
          })
        }
        onChangeNotebook={(notebookId) =>
          selectedNote && actions?.updateNote(selectedNote.id, { notebookId })
        }
        onDeleteBookmark={(bookmarkId) =>
          selectedNote && actions?.deleteBookmark(selectedNote.id, bookmarkId)
        }
        outline={outline}
        wordCount={wordCount}
      />
    </motion.div>
  );
}

function EmptyWorkspace({ onCreateNote }: { onCreateNote: () => void }) {
  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className="grid h-full place-items-center px-8"
      exit={{ opacity: 0, y: -10 }}
      initial={{ opacity: 0, y: 10 }}
    >
      <div className="max-w-md text-center">
        <div className="mx-auto mb-5 grid size-14 place-items-center rounded-md bg-primary/20 text-primary shadow-glow">
          <Plus className="size-6" />
        </div>
        <h2 className="text-2xl font-semibold tracking-normal">
          Start a study note
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Capture class ideas, build references, and keep every subject in one
          fast workspace.
        </p>
        <Button className="mt-6" onClick={onCreateNote}>
          <Plus className="size-4" />
          New Note
        </Button>
      </div>
    </motion.div>
  );
}
