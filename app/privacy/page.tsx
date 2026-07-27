import Link from "next/link";

const linkStyle: React.CSSProperties = {
  color: "var(--cyan)",
  textDecoration: "underline",
  textUnderlineOffset: 3,
};

const sectionStyle: React.CSSProperties = {
  padding: "20px 0",
  borderTop: "1px solid var(--line)",
};

export default function PrivacyPage() {
  return (
    <main
      style={{
        width: "min(920px, calc(100% - 32px))",
        margin: "32px auto 64px",
        padding: "24px",
        border: "1px solid var(--line)",
        borderRadius: 18,
        background: "var(--surface)",
        color: "var(--text)",
        lineHeight: 1.75,
      }}
    >
      <h1 style={{ marginTop: 0 }}>Privacy Policy</h1>
      <p>
        <strong>Effective date:</strong> July 27, 2026
      </p>

      <p>
        This Privacy Policy explains how <strong>3D Hub</strong> accesses,
        collects, stores, uses, shares, refreshes, and deletes information when
        you use the website at{" "}
        <a href="https://3d-hub-lac.vercel.app/" style={linkStyle}>
          https://3d-hub-lac.vercel.app/
        </a>
        .
      </p>

      <section style={sectionStyle}>
        <h2>1. YouTube API Services</h2>
        <p>
          3D Hub uses the <strong>YouTube Data API v3</strong> and YouTube
          embedded players to search for and display publicly available YouTube
          videos and related metadata, including video IDs, titles, channel
          names, thumbnails, publication information, duration, and public view
          counts when available.
        </p>
        <p>
          By using features that display YouTube content, you also agree to the{" "}
          <a
            href="https://www.youtube.com/t/terms"
            target="_blank"
            rel="noopener noreferrer"
            style={linkStyle}
          >
            YouTube Terms of Service
          </a>
          . You should also review the{" "}
          <a
            href="https://www.google.com/policies/privacy/"
            target="_blank"
            rel="noopener noreferrer"
            style={linkStyle}
          >
            Google Privacy Policy
          </a>
          .
        </p>
        <p>
          3D Hub uses an application API key for public YouTube searches. It
          does not request YouTube OAuth scopes, access private YouTube account
          data, store YouTube passwords, or perform actions such as uploading,
          commenting, subscribing, or liking content on a user&apos;s YouTube
          account.
        </p>
      </section>

      <section style={sectionStyle}>
        <h2>2. Information we collect and store</h2>
        <p>Depending on the features you use, 3D Hub may process:</p>
        <ul>
          <li>
            <strong>Account information:</strong> Firebase Authentication user
            ID and, when supplied by your sign-in provider, name, email address,
            and profile photo.
          </li>
          <li>
            <strong>3D Hub activity:</strong> search history, watch history,
            liked items, watch-later items, playlists, and the sections in which
            you used those features.
          </li>
          <li>
            <strong>YouTube API metadata:</strong> public video IDs, titles,
            channel names, thumbnails, and related public metadata needed to
            display your saved 3D Hub activity.
          </li>
          <li>
            <strong>Browser storage:</strong> theme choice, policy-consent
            status, news bookmarks/history, and playback settings.
          </li>
          <li>
            <strong>Technical and analytics information:</strong> if Google
            Analytics is configured and you accept this policy, basic device,
            browser, page-view, and usage information may be processed by
            Google Analytics.
          </li>
        </ul>
      </section>

      <section style={sectionStyle}>
        <h2>3. How we use information</h2>
        <p>We use information only to:</p>
        <ul>
          <li>authenticate users and protect their saved data;</li>
          <li>provide search, playback, history, library, and playlist features;</li>
          <li>restore user preferences and improve reliability;</li>
          <li>refresh or remove stored YouTube API metadata; and</li>
          <li>detect errors, abuse, and security problems.</li>
        </ul>
        <p>
          3D Hub does not sell personal information or YouTube API data to
          advertisers or data brokers.
        </p>
      </section>

      <section style={sectionStyle}>
        <h2>4. Services that receive information</h2>
        <p>Information may be processed by the following service providers:</p>
        <ul>
          <li>
            <strong>Google and Firebase:</strong> authentication, Firestore data
            storage, YouTube API requests, YouTube embedded playback, and
            optional Google Analytics.
          </li>
          <li>
            <strong>Vercel:</strong> website hosting, server execution, delivery,
            and operational logs.
          </li>
        </ul>
        <p>
          YouTube embedded players may collect and share basic device and usage
          data with YouTube when a player loads and additional playback data
          when a video is played. Those activities are governed by Google&apos;s
          and YouTube&apos;s policies.
        </p>
      </section>

      <section style={sectionStyle}>
        <h2>5. YouTube API data refresh and deletion</h2>
        <ul>
          <li>
            Normal YouTube search responses are cached for no more than six
            hours.
          </li>
          <li>
            Trending and Shorts responses are cached for no more than 30
            minutes.
          </li>
          <li>
            A user-triggered refresh bypasses the application cache and requests
            current data.
          </li>
          <li>
            YouTube metadata stored with 3D Hub history, liked items,
            watch-later items, and playlists is rechecked while an authenticated
            user uses the app. Records that cannot be refreshed are removed.
          </li>
          <li>
            Stored Firestore records containing YouTube API metadata include an
            expiration timestamp set before 30 days. Firestore Time-to-Live
            policies remove records that are not refreshed before that
            expiration.
          </li>
        </ul>
      </section>

      <section style={sectionStyle}>
        <h2>6. Your controls and deletion rights</h2>
        <p>
          In <Link href="/settings" style={linkStyle}>Settings</Link>, you can
          delete selected history, clear history, or use <strong>Delete all my
          3D Hub data</strong> to remove stored search history, watch history,
          liked items, watch-later items, playlists, and related browser data.
          Deleting data from 3D Hub does not delete information stored by
          YouTube. To delete YouTube data, use YouTube directly.
        </p>
        <p>
          You may review or revoke connected Google account access in{" "}
          <a
            href="https://security.google.com/settings/security/permissions"
            target="_blank"
            rel="noopener noreferrer"
            style={linkStyle}
          >
            Google Security Settings
          </a>
          . Because 3D Hub does not request YouTube OAuth scopes, this Google
          sign-in connection does not grant access to private YouTube account
          data.
        </p>
        <p>
          You may also request deletion by emailing{" "}
          <a href="mailto:k43234609@gmail.com" style={linkStyle}>
            k43234609@gmail.com
          </a>
          . Verified requests will be handled as soon as possible and no later
          than seven calendar days.
        </p>
      </section>

      <section style={sectionStyle}>
        <h2>7. Security and retention</h2>
        <p>
          3D Hub uses HTTPS and Firebase access controls. No internet service can
          guarantee absolute security. Personal information is kept only for as
          long as needed to provide the requested features, meet legal
          obligations, resolve disputes, and protect the service.
        </p>
      </section>

      <section style={sectionStyle}>
        <h2>8. Children</h2>
        <p>
          The Kids section displays content search results but 3D Hub does not
          knowingly request children to provide personal information. A parent
          or guardian who believes a child submitted personal information may
          contact us for deletion.
        </p>
      </section>

      <section style={sectionStyle}>
        <h2>9. Changes and contact</h2>
        <p>
          We may update this policy when the application or legal requirements
          change. The effective date above will be updated when material changes
          are published.
        </p>
        <p>
          Privacy questions or complaints: <strong>Dileep Kumar Badham</strong>,{" "}
          <a href="mailto:k43234609@gmail.com" style={linkStyle}>
            k43234609@gmail.com
          </a>
          .
        </p>
      </section>

      <p style={{ marginBottom: 0 }}>
        3D Hub&apos;s use and transfer of information received from Google APIs
        will adhere to the Google API Services User Data Policy, including the
        Limited Use requirements where applicable.
      </p>
    </main>
  );
}
