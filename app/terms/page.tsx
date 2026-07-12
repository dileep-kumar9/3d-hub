export default function TermsPage() {
  return (
    <main
      style={{
        maxWidth: "900px",
        margin: "40px auto",
        padding: "20px",
        color: "white",
        lineHeight: 1.8,
      }}
    >
      <h1>Terms of Service</h1>

      <p>
        <strong>Effective Date:</strong> July 10, 2026
      </p>

      <p>
        Welcome to <strong>3D Hub</strong>. By accessing or using our website,
        you agree to these Terms of Service.
      </p>

      <h2>1. Acceptance of Terms</h2>
      <p>
        By using 3D Hub, you agree to comply with these Terms of Service and all
        applicable laws and regulations.
      </p>

      <h2>2. Use of the Service</h2>
      <p>
        3D Hub allows users to search and browse publicly available YouTube
        content. Users must not misuse the service or attempt to interfere with
        its operation.
      </p>

      <h2>3. YouTube Content</h2>
      <p>
        3D Hub uses the YouTube Data API to retrieve publicly available
        information. All videos, thumbnails, titles, and related content remain
        the property of their respective owners and are subject to YouTube's
        Terms of Service.
      </p>

      <h2>4. Intellectual Property</h2>
      <p>
        Except for third-party content obtained through the YouTube Data API,
        all application design, code, and branding belong to 3D Hub.
      </p>

      <h2>5. Disclaimer</h2>
      <p>
        The service is provided on an "as is" and "as available" basis without
        warranties of any kind.
      </p>

      <h2>6. Limitation of Liability</h2>
      <p>
        3D Hub shall not be liable for any damages arising from the use or
        inability to use the service.
      </p>

      <h2>7. Changes to These Terms</h2>
      <p>
        We may update these Terms of Service at any time. Continued use of the
        website constitutes acceptance of the revised Terms.
      </p>

      <h2>8. Contact</h2>
      <p>
        For any questions regarding these Terms, contact us at:
      </p>

      <p>
        <strong>Email:</strong> your-email@gmail.com
      </p>

      <hr style={{ margin: "30px 0", borderColor: "#333" }} />

      <p>
        By using 3D Hub, you also agree to the applicable{" "}
        <a
          href="https://www.youtube.com/t/terms"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "#60a5fa" }}
        >
          YouTube Terms of Service
        </a>
        .
      </p>
    </main>
  );
}
