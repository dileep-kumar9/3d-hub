# Required Firestore TTL setup for YouTube API data

The replacement code adds an `expiresAt` Firestore `Timestamp` to records that contain stored YouTube API metadata. You must enable Firestore Time-to-Live policies after deploying the files; code alone cannot enable TTL in the Firebase console.

## Enable four TTL policies

1. Open **Google Cloud Console** for the same Firebase project used by 3D Hub.
2. Go to **Firestore → Databases** and open your database.
3. Open **Time-to-live**.
4. Select **Create policy**.
5. Create each policy below using the field name `expiresAt`:

| Collection group | TTL field |
|---|---|
| `liked` | `expiresAt` |
| `watchLater` | `expiresAt` |
| `items` | `expiresAt` |
| `playlists` | `expiresAt` |

The `items` collection group is used by 3D Hub watch-history records.

## What the code does

- New watch-history, liked, watch-later, and playlist records receive an expiration time 29 days in the future.
- When a signed-in user returns, 3D Hub rechecks older YouTube metadata through `videos.list` and extends the expiration only after a successful refresh.
- Deleted, private, or otherwise unavailable videos are removed from the saved records.
- If the user does not return, Firestore TTL removes unrefreshed records. Firestore may take up to about 24 hours after the expiration time to complete deletion, so the code uses 29 days rather than 30 days.

## Verify after deployment

1. Sign in to 3D Hub.
2. Like one video, save one video to Watch Later, play one video, and add one video to a playlist.
3. Open Firestore and check those documents.
4. Confirm each document contains:
   - `apiDataRefreshedAt`
   - `expiresAt`
5. Confirm all four TTL policies show **Active**.

Do not send the YouTube compliance reply until the policies are active and the live privacy page displays the Google Privacy Policy link.
