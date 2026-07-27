const linkStyle: React.CSSProperties = {
  color: "var(--cyan)",
  textDecoration: "underline",
  textUnderlineOffset: 3,
};

export default function TermsPage() {
  return (
    <main
      style={{
        width: "min(920px, calc(100% - 32px))",
        margin: "32px auto 64px",
        padding: 24,
        border: "1px solid var(--line)",
        borderRadius: 18,
        background: "var(--surface)",
        color: "var(--text)",
        lineHeight: 1.75,
      }}
    >
      <h1 style={{ marginTop: 0 }}>Terms of Service</h1>
      <p><strong>Effective date:</strong> July 27, 2026</p>

      <p>
        Welcome to <strong>3D Hub</strong>. By accessing or using this website,
        you agree to these Terms of Service, the Privacy Policy, and all
        applicable laws.
      </p>

      <h2>1. YouTube terms</h2>
      <p>
        3D Hub uses YouTube API Services and embedded YouTube players to display
        publicly available content. By using 3D Hub, you also agree to be bound
        by the{" "}
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

      <h2>2. Permitted use</h2>
      <p>
        You may use 3D Hub to search, browse, and play content made available
        through supported services. You must not misuse the service, attempt to
        bypass security or quota controls, interfere with playback, scrape data,
        download YouTube audiovisual content through 3D Hub, or use the service
        in violation of law or third-party rights.
      </p>

      <h2>3. Accounts and saved activity</h2>
      <p>
        Some features require a 3D Hub account. You are responsible for the
        security of your sign-in account and for activity performed through it.
        Saved likes, watch-later items, playlists, and history are 3D Hub
        features and do not change the corresponding data on YouTube.
      </p>

      <h2>4. Third-party content</h2>
      <p>
        YouTube videos, titles, thumbnails, channel information, and other
        third-party content remain the property of their respective owners. 3D
        Hub does not claim ownership of that content and does not guarantee that
        any particular video will remain available.
      </p>

      <h2>5. Availability</h2>
      <p>
        The service is provided on an &quot;as is&quot; and &quot;as
        available&quot; basis. Features may be changed, interrupted, or removed,
        including when an API provider changes its service or when quota is
        unavailable.
      </p>

      <h2>6. Limitation of liability</h2>
      <p>
        To the maximum extent permitted by law, 3D Hub and its developer will
        not be liable for indirect, incidental, special, consequential, or
        punitive damages arising from use of or inability to use the service.
      </p>

      <h2>7. Changes</h2>
      <p>
        These terms may be updated when the service or legal requirements
        change. Continued use after updated terms are published constitutes
        acceptance of the revised terms.
      </p>

      <h2>8. Contact</h2>
      <p>
        Questions about these terms may be sent to{" "}
        <a href="mailto:k43234609@gmail.com" style={linkStyle}>
          k43234609@gmail.com
        </a>
        .
      </p>
    </main>
  );
}
