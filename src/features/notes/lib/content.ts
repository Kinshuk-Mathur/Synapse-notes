import type { JSONContent } from "@tiptap/react";
import type { Timestamp } from "firebase/firestore";
import type { NoteHeading } from "../types/note";

export const EMPTY_NOTE_CONTENT: JSONContent = {
  type: "doc",
  content: [
    {
      type: "paragraph",
      attrs: {
        id: "intro"
      }
    }
  ]
};

export function sanitizeContent(content: JSONContent): JSONContent {
  return JSON.parse(JSON.stringify(content)) as JSONContent;
}

export function extractTextFromContent(content?: JSONContent | null): string {
  if (!content) {
    return "";
  }

  const fragments: string[] = [];

  function visit(node: JSONContent) {
    if (node.text) {
      fragments.push(node.text);
    }

    node.content?.forEach(visit);
  }

  visit(content);
  return fragments.join(" ").replace(/\s+/g, " ").trim();
}

export function countWords(content?: JSONContent | null): number {
  const text = extractTextFromContent(content);
  return text ? text.split(/\s+/).length : 0;
}

export function collectHeadings(content?: JSONContent | null): NoteHeading[] {
  if (!content) {
    return [];
  }

  const headings: NoteHeading[] = [];

  function visit(node: JSONContent) {
    if (node.type === "heading") {
      const text = extractTextFromContent(node);
      if (text) {
        headings.push({
          id:
            typeof node.attrs?.id === "string"
              ? node.attrs.id
              : slugifyHeading(text),
          text,
          level:
            typeof node.attrs?.level === "number"
              ? node.attrs.level
              : 1
        });
      }
    }

    node.content?.forEach(visit);
  }

  visit(content);
  return headings;
}

export function toDate(
  value: Timestamp | Date | null | undefined
): Date | null {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return value;
  }

  if ("toDate" in value && typeof value.toDate === "function") {
    return value.toDate();
  }

  return null;
}

export function formatDate(value: Timestamp | Date | null | undefined) {
  const date = toDate(value);

  if (!date) {
    return "Pending";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(date);
}

export function isRecentlyUpdated(value: Timestamp | Date | null | undefined) {
  const date = toDate(value);

  if (!date) {
    return false;
  }

  const sevenDays = 1000 * 60 * 60 * 24 * 7;
  return Date.now() - date.getTime() <= sevenDays;
}

export function slugifyHeading(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
