# Setup Guide

This app needs two things before it works: a Firebase project (for login + saved videos)
and a YouTube Data API key (for search).

## 1. Create a Firebase project

1. Go to https://console.firebase.google.com → **Add project** → name it (e.g. "entertainment-hub") → Create.
2. In the left sidebar, click **Build → Authentication → Get started**.
3. Under **Sign-in method**, enable **Email/Password** and **Google**.
4. In the left sidebar, click **Build → Firestore Database → Create database** → Start in **production mode** → choose a location → Enable.
5. Go to **Project settings** (gear icon top left) → scroll to **Your apps** → click the **</> (Web)** icon → register app (any nickname) → Firebase will show you a config object like:

```js
apiKey: "AIza...",
authDomain: "entertainment-hub-xxxx.firebaseapp.com",
projectId: "entertainment-hub-xxxx",
storageBucket: "entertainment-hub-xxxx.appspot.com",
messagingSenderId: "123456789",
appId: "1:123456789:web:abcdef"
```

Save these six values — you'll paste them into environment variables in Step 3.

6. Set Firestore security rules so each user can only read/write their own saved list. Go to **Firestore Database → Rules** and paste:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/saved/{videoId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

Click **Publish**.

## 2. Get a YouTube Data API key

1. Go to https://console.cloud.google.com → create a new project (or reuse the Firebase one, they can share).
2. Go to **APIs & Services → Library** → search "YouTube Data API v3" → **Enable**.
3. Go to **APIs & Services → Credentials → Create Credentials → API key**.
4. Copy the key. (Optional but recommended: click "Restrict key" → restrict it to the YouTube Data API v3 only.)

## 3. Set environment variables

Locally: copy `.env.local.example` to `.env.local` and fill in all 7 values (6 Firebase + 1 YouTube key).

On Vercel: go to your project → **Settings → Environment Variables** → add each of the 7 variables with the same names, for the **Production** environment. Redeploy after saving.

## 4. Run locally (optional)

```
npm install
npm run dev
```

Visit http://localhost:3000

## Notes

- Videos play via YouTube's official embedded player — this is legal and is how most apps show YouTube content. There is no offline "download" feature, since downloading YouTube videos violates YouTube's Terms of Service. Instead, users can **Save** a video to their profile, which stores a reference to it and lets them replay it anytime from the site.
- The YouTube API key stays server-side (used only inside `app/api/youtube/route.ts`), so it's never exposed to the browser.
