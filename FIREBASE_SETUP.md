# Firebase Setup for SYNAPSE NOTES

## 1. Authentication

1. Open Firebase Console.
2. Select your `synapse-notes-dev` project.
3. Go to **Build > Authentication**.
4. Open the **Sign-in method** tab.
5. Enable **Google**.
6. Choose a support email.
7. Save.

## 2. Authorized Domains

1. Go to **Authentication > Settings > Authorized domains**.
2. Make sure these are added:
   - `localhost`
   - your Netlify domain, for example `synapse-notes.netlify.app`
   - your custom domain, if you connect one later

If this step is missing, Google sign-in can fail on Netlify with `auth/unauthorized-domain`.

## 3. Firestore Database

1. Go to **Build > Firestore Database**.
2. Create a database if it does not exist.
3. Choose your preferred region.
4. Open the **Rules** tab.
5. Paste the contents of `firestore.rules`.
6. Click **Publish**.

These rules allow each signed-in Google user to read and write only their own data under:

```text
users/{userId}/notebooks
users/{userId}/notes
users/{userId}/notes/{noteId}/bookmarks
```

## 4. Firebase Storage

Skip this for now if Firebase asks you to upgrade the project. The app works with Authentication + Firestore only.

If you enable Storage later:

1. Go to **Build > Storage**.
2. Create a storage bucket if it does not exist.
3. Open the **Rules** tab.
4. Paste the contents of `storage.rules`.
5. Click **Publish**.

Images are stored under:

```text
notes/{userId}/images/{imageId}
```

Only the owner can read or upload images, uploads must be images, and each upload must be under 10 MB.

## 5. Environment Variables

Keep real Firebase values in `.env.local` locally and in Netlify environment variables in production.

Do not commit `.env.local`.

Required keys:

```text
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
```

Optional later for image uploads:

```text
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
```

## 6. Netlify

1. Open your Netlify site.
2. Go to **Site configuration > Environment variables**.
3. Add the five required `NEXT_PUBLIC_FIREBASE_*` variables.
4. Go to **Deploys**.
5. Trigger a new deploy.

Build settings:

```text
Base directory: leave empty
Build command: npm run build
Publish directory: .next
```
