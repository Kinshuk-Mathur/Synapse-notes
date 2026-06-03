"use client";

import {
  Bookmark,
  CalendarDays,
  Hash,
  ListTree,
  NotebookTabs,
  Trash2
} from "lucide-react";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { formatDate } from "../lib/content";
import type { Note, NoteBookmark, NoteHeading, Notebook } from "../types/note";

interface RightPanelProps {
  note: Note | null;
  notebooks: Notebook[];
  outline: NoteHeading[];
  bookmarks: NoteBookmark[];
  wordCount: number;
  onBookmarkClick: (anchor: string) => void;
  onChangeNotebook: (notebookId: string) => void;
  onDeleteBookmark: (bookmarkId: string) => void;
}

export function RightPanel({
  bookmarks,
  note,
  notebooks,
  onBookmarkClick,
  onChangeNotebook,
  onDeleteBookmark,
  outline,
  wordCount
}: RightPanelProps) {
  return (
    <aside className="hidden h-screen w-[320px] shrink-0 flex-col bg-black/20 p-4 backdrop-blur-2xl xl:flex">
      <div className="mb-5">
        <h2 className="text-sm font-semibold uppercase text-muted-foreground">
          Note Outline
        </h2>
        <p className="mt-1 text-xs text-muted-foreground/80">
          Table of Contents
        </p>
      </div>

      {!note ? (
        <div className="rounded-md border border-white/10 bg-white/5 p-4 text-sm text-muted-foreground">
          No note selected.
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto pr-1 synapse-scrollbar">
          <section>
            <div className="mb-3 flex items-center gap-2 text-sm font-medium text-white">
              <ListTree className="size-4 text-primary" />
              Sections
            </div>
            {outline.length ? (
              <div className="space-y-1">
                {outline.map((heading) => (
                  <button
                    className={cn(
                      "block w-full rounded-md px-3 py-2 text-left text-sm text-muted-foreground transition hover:bg-white/10 hover:text-white",
                      heading.level === 2 && "pl-6",
                      heading.level === 3 && "pl-9"
                    )}
                    key={`${heading.id}-${heading.text}`}
                    onClick={() => onBookmarkClick(heading.id)}
                    type="button"
                  >
                    <span className="line-clamp-2">{heading.text}</span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="rounded-md border border-white/10 bg-white/5 p-3 text-sm text-muted-foreground">
                Add H1-H3 headings to build an outline.
              </p>
            )}
          </section>

          <Separator className="my-5" />

          <section>
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-medium text-white">
                <Bookmark className="size-4 text-fuchsia-200" />
                Bookmarks
              </div>
              <Badge>{bookmarks.length}</Badge>
            </div>
            {bookmarks.length ? (
              <div className="space-y-2">
                {bookmarks.map((bookmark) => (
                  <div
                    className="rounded-md border border-white/10 bg-white/5 p-3"
                    key={bookmark.id}
                  >
                    <button
                      className="line-clamp-2 w-full text-left text-sm text-white transition hover:text-fuchsia-100"
                      onClick={() => onBookmarkClick(bookmark.anchor)}
                      type="button"
                    >
                      {bookmark.label}
                    </button>
                    <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                      <span>{formatDate(bookmark.createdAt)}</span>
                      <Button
                        onClick={() => onDeleteBookmark(bookmark.id)}
                        size="icon-sm"
                        title="Remove bookmark"
                        variant="ghost"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="rounded-md border border-white/10 bg-white/5 p-3 text-sm text-muted-foreground">
                Bookmark paragraphs or sections from the editor.
              </p>
            )}
          </section>

          <Separator className="my-5" />

          <section>
            <div className="mb-3 flex items-center gap-2 text-sm font-medium text-white">
              <NotebookTabs className="size-4 text-blue-200" />
              Note Properties
            </div>

            <div className="space-y-3 text-sm">
              <PropertyRow
                icon={<CalendarDays className="size-4" />}
                label="Created"
                value={formatDate(note.createdAt)}
              />
              <PropertyRow
                icon={<CalendarDays className="size-4" />}
                label="Updated"
                value={formatDate(note.updatedAt)}
              />
              <PropertyRow
                icon={<Hash className="size-4" />}
                label="Word Count"
                value={String(wordCount)}
              />
              <div className="rounded-md border border-white/10 bg-white/5 p-3">
                <label className="mb-2 block text-xs uppercase text-muted-foreground">
                  Notebook
                </label>
                <select
                  className="h-9 w-full rounded-md border border-white/10 bg-black/30 px-3 text-sm text-white outline-none focus:ring-2 focus:ring-ring"
                  onChange={(event) => onChangeNotebook(event.target.value)}
                  value={note.notebookId}
                >
                  {notebooks.map((notebook) => (
                    <option key={notebook.id} value={notebook.id}>
                      {notebook.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>
        </div>
      )}
    </aside>
  );
}

function PropertyRow({
  icon,
  label,
  value
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-md border border-white/10 bg-white/5 p-3">
      <span className="text-muted-foreground">{icon}</span>
      <div className="min-w-0 flex-1">
        <div className="text-xs uppercase text-muted-foreground">{label}</div>
        <div className="mt-1 truncate text-white">{value}</div>
      </div>
    </div>
  );
}
