"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createBookmark,
  createNote,
  createNotebook,
  deleteBookmark,
  ensureDefaultNotebooks,
  markUserInitialized,
  permanentlyDeleteNote,
  restoreNote,
  softDeleteNote,
  subscribeToBookmarks,
  subscribeToNotebooks,
  subscribeToNotes,
  updateNote,
  uploadNoteImage
} from "../services/note-repository";
import type {
  CreateBookmarkInput,
  Note,
  NoteBookmark,
  Notebook,
  UpdateNoteInput
} from "../types/note";

export function useNotesWorkspace(userId?: string) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setNotes([]);
      setNotebooks([]);
      setLoading(false);
      return;
    }

    const currentUserId = userId;
    let mounted = true;
    setLoading(true);
    setError(null);

    async function initialize() {
      try {
        await markUserInitialized(currentUserId);
        await ensureDefaultNotebooks(currentUserId);
      } catch (initError) {
        if (mounted) {
          setError(
            initError instanceof Error
              ? initError.message
              : "Unable to initialize workspace."
          );
        }
      }
    }

    void initialize();

    const unsubscribeNotes = subscribeToNotes(
      currentUserId,
      (nextNotes) => {
        setNotes(nextNotes);
        setLoading(false);
      },
      (snapshotError) => {
        setError(snapshotError.message);
        setLoading(false);
      }
    );

    const unsubscribeNotebooks = subscribeToNotebooks(
      currentUserId,
      setNotebooks,
      (snapshotError) => setError(snapshotError.message)
    );

    return () => {
      mounted = false;
      unsubscribeNotes();
      unsubscribeNotebooks();
    };
  }, [userId]);

  const actions = useMemo(() => {
    if (!userId) {
      return null;
    }

    return {
      createNote: (notebookId?: string) => createNote(userId, notebookId),
      createNotebook: (name: string) => createNotebook(userId, name),
      updateNote: (noteId: string, input: UpdateNoteInput) =>
        updateNote(userId, noteId, input),
      softDeleteNote: (noteId: string) => softDeleteNote(userId, noteId),
      restoreNote: (noteId: string) => restoreNote(userId, noteId),
      permanentlyDeleteNote: (noteId: string) =>
        permanentlyDeleteNote(userId, noteId),
      createBookmark: (noteId: string, bookmark: CreateBookmarkInput) =>
        createBookmark(userId, noteId, bookmark),
      deleteBookmark: (noteId: string, bookmarkId: string) =>
        deleteBookmark(userId, noteId, bookmarkId),
      uploadNoteImage: (file: File) => uploadNoteImage(userId, file)
    };
  }, [userId]);

  return {
    notes,
    notebooks,
    loading,
    error,
    actions
  };
}

export function useNoteBookmarks(userId?: string, noteId?: string) {
  const [bookmarks, setBookmarks] = useState<NoteBookmark[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId || !noteId) {
      setBookmarks([]);
      return;
    }

    return subscribeToBookmarks(userId, noteId, setBookmarks, (snapshotError) => {
      setError(snapshotError.message);
    });
  }, [noteId, userId]);

  const clearError = useCallback(() => setError(null), []);

  return {
    bookmarks,
    error,
    clearError
  };
}
