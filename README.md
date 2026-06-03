# SYNAPSE NOTES

A premium, student-focused notes app built as a separate repository from SYNAPSE.

## Stack

- Next.js 15
- TypeScript
- Tailwind CSS
- shadcn/ui-style primitives
- Tiptap Editor
- Firebase Authentication, Firestore, and Storage
- Framer Motion

## Local Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy the environment file:

   ```bash
   cp .env.example .env.local
   ```

3. Fill in your Firebase web app values in `.env.local`.

4. Start the app:

   ```bash
   npm run dev
   ```

## Firebase Data Shape

```text
users/{userId}/notebooks/{notebookId}
users/{userId}/notes/{noteId}
users/{userId}/notes/{noteId}/bookmarks/{bookmarkId}
```

Images are uploaded to:

```text
notes/{userId}/images/{fileId}
```

The base note document contains:

```ts
{
  title: string;
  content: JSON;
  notebookId: string;
  favorite: boolean;
  deleted: boolean;
  createdAt: timestamp;
  updatedAt: timestamp;
}
```

Highlights are persisted inside the Tiptap JSON content. Bookmarks live in a note subcollection to keep the base note model stable.
