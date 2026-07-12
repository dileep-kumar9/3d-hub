"use client";

import { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase";
import Link from "next/link";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sent" | "error">("idle");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      await sendPasswordResetEmail(auth, email);
      setStatus("sent");
    } catch (err: any) {
      setError(err.message);
      setStatus("error");
    }
  }

  return (
    <div style={{ maxWidth: 400, margin: "60px auto", padding: 24 }}>
      <h1 style={{ fontSize: 28, marginBottom: 12 }}>Reset your password</h1>
      <p style={{ color: "#999", marginBottom: 24, fontSize: 14 }}>
        Enter your account email and we'll send a link to reset your password.
      </p>

      {status === "sent" ? (
        <p style={{ color: "#4ade80" }}>
          Check your inbox — a reset link has been sent to {email}.
        </p>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={inputStyle}
          />
          <button type="submit" style={buttonStyle}>Send reset link</button>
        </form>
      )}

      {error && <p style={{ color: "#ff6b6b", marginTop: 12 }}>{error}</p>}

      <p style={{ marginTop: 20, color: "#999" }}>
        <Link href="/login" style={{ color: "#e50914" }}>Back to log in</Link>
      </p>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  padding: 12,
  borderRadius: 6,
  border: "1px solid #333",
  background: "#1a1a1a",
  color: "white",
  fontSize: 15,
};

const buttonStyle: React.CSSProperties = {
  padding: 12,
  borderRadius: 6,
  border: "none",
  background: "#e50914",
  color: "white",
  fontSize: 15,
  cursor: "pointer",
};
