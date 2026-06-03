import type { JSONContent } from "@tiptap/react";
import type { Timestamp } from "firebase/firestore";

export type WorkspaceView = "all" | "recent" | "favorites" | "trash";

export interface Notebook {
  id: string;
  name: string;
  color: string;
  createdAt: Timestamp | Date | null;
}

export interface Note {
  id: string;
  title: string;
  content: JSONContent;
  notebookId: string;
  favorite: boolean;
  deleted: boolean;
  createdAt: Timestamp | Date | null;
  updatedAt: Timestamp | Date | null;
}

export interface NoteBookmark {
  id: string;
  noteId: string;
  anchor: string;
  label: string;
  createdAt: Timestamp | Date | null;
}

export interface NoteHeading {
  id: string;
  text: string;
  level: number;
}

export interface CreateBookmarkInput {
  anchor: string;
  label: string;
}

export interface UpdateNoteInput {
  title?: string;
  content?: JSONContent;
  notebookId?: string;
  favorite?: boolean;
  deleted?: boolean;
}
