import type { JSONContent } from "@tiptap/react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
  type DocumentData
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { db, storage } from "@/lib/firebase/client";
import { DEFAULT_NOTEBOOKS } from "../lib/default-notebooks";
import { EMPTY_NOTE_CONTENT, sanitizeContent } from "../lib/content";
import type {
  CreateBookmarkInput,
  Note,
  NoteBookmark,
  Notebook,
  UpdateNoteInput
} from "../types/note";

function requireDb() {
  if (!db) {
    throw new Error("Firestore is not configured.");
  }

  return db;
}

function requireStorage() {
  if (!storage) {
    throw new Error("Firebase Storage is not configured.");
  }

  return storage;
}

function userCollection(userId: string, name: "notes" | "notebooks") {
  return collection(requireDb(), "users", userId, name);
}

function noteDocument(userId: string, noteId: string) {
  return doc(requireDb(), "users", userId, "notes", noteId);
}

function bookmarkCollection(userId: string, noteId: string) {
  return collection(requireDb(), "users", userId, "notes", noteId, "bookmarks");
}

function mapNote(id: string, data: DocumentData): Note {
  return {
    id,
    title: typeof data.title === "string" ? data.title : "Untitled Note",
    content: (data.content as JSONContent | undefined) ?? EMPTY_NOTE_CONTENT,
    notebookId:
      typeof data.notebookId === "string"
        ? data.notebookId
        : DEFAULT_NOTEBOOKS[0].id,
    favorite: Boolean(data.favorite),
    deleted: Boolean(data.deleted),
    createdAt: data.createdAt ?? null,
    updatedAt: data.updatedAt ?? null
  };
}

function mapNotebook(id: string, data: DocumentData): Notebook {
  return {
    id,
    name: typeof data.name === "string" ? data.name : "Notebook",
    color: typeof data.color === "string" ? data.color : "#a78bfa",
    createdAt: data.createdAt ?? null
  };
}

function mapBookmark(id: string, noteId: string, data: DocumentData): NoteBookmark {
  return {
    id,
    noteId,
    anchor: typeof data.anchor === "string" ? data.anchor : "",
    label: typeof data.label === "string" ? data.label : "Bookmarked section",
    createdAt: data.createdAt ?? null
  };
}

export async function ensureDefaultNotebooks(userId: string) {
  const notebooksRef = userCollection(userId, "notebooks");
  const existing = await getDocs(notebooksRef);

  if (!existing.empty) {
    return;
  }

  const batch = writeBatch(requireDb());

  DEFAULT_NOTEBOOKS.forEach((notebook) => {
    batch.set(doc(notebooksRef, notebook.id), {
      name: notebook.name,
      color: notebook.color,
      createdAt: serverTimestamp()
    });
  });

  await batch.commit();
}

export function subscribeToNotes(
  userId: string,
  onNext: (notes: Note[]) => void,
  onError: (error: Error) => void
) {
  const notesQuery = query(userCollection(userId, "notes"), orderBy("updatedAt", "desc"));

  return onSnapshot(
    notesQuery,
    (snapshot) => {
      onNext(snapshot.docs.map((note) => mapNote(note.id, note.data())));
    },
    onError
  );
}

export function subscribeToNotebooks(
  userId: string,
  onNext: (notebooks: Notebook[]) => void,
  onError: (error: Error) => void
) {
  const notebooksQuery = query(
    userCollection(userId, "notebooks"),
    orderBy("createdAt", "asc")
  );

  return onSnapshot(
    notebooksQuery,
    (snapshot) => {
      onNext(snapshot.docs.map((item) => mapNotebook(item.id, item.data())));
    },
    onError
  );
}

export function subscribeToBookmarks(
  userId: string,
  noteId: string,
  onNext: (bookmarks: NoteBookmark[]) => void,
  onError: (error: Error) => void
) {
  const bookmarkQuery = query(
    bookmarkCollection(userId, noteId),
    orderBy("createdAt", "asc")
  );

  return onSnapshot(
    bookmarkQuery,
    (snapshot) => {
      onNext(
        snapshot.docs.map((bookmark) =>
          mapBookmark(bookmark.id, noteId, bookmark.data())
        )
      );
    },
    onError
  );
}

export async function createNotebook(userId: string, name: string) {
  const notebookName = name.trim();

  if (!notebookName) {
    return null;
  }

  const notebookRef = await addDoc(userCollection(userId, "notebooks"), {
    name: notebookName,
    color: "#c084fc",
    createdAt: serverTimestamp()
  });

  return notebookRef.id;
}

export async function createNote(userId: string, notebookId?: string) {
  const noteRef = await addDoc(userCollection(userId, "notes"), {
    title: "Untitled Note",
    content: EMPTY_NOTE_CONTENT,
    notebookId: notebookId || DEFAULT_NOTEBOOKS[0].id,
    favorite: false,
    deleted: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });

  return noteRef.id;
}

export async function updateNote(
  userId: string,
  noteId: string,
  input: UpdateNoteInput
) {
  const payload: Record<string, unknown> = {
    updatedAt: serverTimestamp()
  };

  if (typeof input.title === "string") {
    payload.title = input.title.trim() || "Untitled Note";
  }

  if (input.content) {
    payload.content = sanitizeContent(input.content);
  }

  if (typeof input.notebookId === "string") {
    payload.notebookId = input.notebookId;
  }

  if (typeof input.favorite === "boolean") {
    payload.favorite = input.favorite;
  }

  if (typeof input.deleted === "boolean") {
    payload.deleted = input.deleted;
  }

  await updateDoc(noteDocument(userId, noteId), payload);
}

export async function softDeleteNote(userId: string, noteId: string) {
  await updateNote(userId, noteId, {
    deleted: true,
    favorite: false
  });
}

export async function restoreNote(userId: string, noteId: string) {
  await updateNote(userId, noteId, {
    deleted: false
  });
}

export async function permanentlyDeleteNote(userId: string, noteId: string) {
  const bookmarks = await getDocs(bookmarkCollection(userId, noteId));
  const batch = writeBatch(requireDb());

  bookmarks.docs.forEach((bookmark) => {
    batch.delete(bookmark.ref);
  });
  batch.delete(noteDocument(userId, noteId));

  await batch.commit();
}

export async function createBookmark(
  userId: string,
  noteId: string,
  bookmark: CreateBookmarkInput
) {
  await addDoc(bookmarkCollection(userId, noteId), {
    anchor: bookmark.anchor,
    label: bookmark.label,
    createdAt: serverTimestamp()
  });
}

export async function deleteBookmark(
  userId: string,
  noteId: string,
  bookmarkId: string
) {
  await deleteDoc(
    doc(requireDb(), "users", userId, "notes", noteId, "bookmarks", bookmarkId)
  );
}

export async function uploadNoteImage(
  userId: string,
  file: File
): Promise<string> {
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
  const fileId =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2);
  const imageRef = ref(
    requireStorage(),
    `notes/${userId}/images/${fileId}-${safeName}`
  );

  await uploadBytes(imageRef, file, {
    contentType: file.type
  });

  return getDownloadURL(imageRef);
}

export async function markUserInitialized(userId: string) {
  await setDoc(
    doc(requireDb(), "users", userId),
    {
      updatedAt: serverTimestamp()
    },
    { merge: true }
  );
}
