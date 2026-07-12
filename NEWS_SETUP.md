# 3D Hub News setup

The News section is available at `/news` and uses its own API, bookmarks,
reading history, date filters, and browser text-to-speech. It does not use the
Home, Movies, Music, Shorts, or YouTube recommendation data.

## Data providers

The section works without a new API key by using the GDELT fallback for recent
news. Add a NewsData.io key for richer descriptions, related video metadata,
and archive searches supported by your NewsData.io account.

Add this environment variable locally and in Vercel:

```env
NEWSDATA_API_KEY=your_newsdata_api_key
```

In Vercel, open **Project Settings → Environment Variables**, add the variable,
and redeploy.

## Audio

Audio is generated in the user's browser through the Web Speech API. Available
English, Telugu, and Hindi voices depend on the browser and device. Users can
listen to a complete summary, one section, or text they select on the article
page.

## Included routes

- `/news` — date/category selection and news cards
- `/news/[id]` — summary, image, related video when available, source link, and audio
- `/api/news` — isolated news provider route
