"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import Link from "next/link";

type FocusedField = "email" | "password" | null;

function getFriendlyError(error: unknown) {
  const message = error instanceof Error ? error.message : "";

  if (message.includes("auth/email-already-in-use")) {
    return "An account already exists with this email. Log in instead.";
  }
  if (message.includes("auth/weak-password")) {
    return "Use a stronger password with at least 6 characters.";
  }
  if (message.includes("auth/invalid-email")) {
    return "Enter a valid email address.";
  }
  if (message.includes("auth/operation-not-allowed")) {
    return "Email signup is not enabled. Check Firebase Authentication settings.";
  }
  if (message.includes("auth/too-many-requests")) {
    return "Too many attempts. Please wait a moment and try again.";
  }
  if (message.includes("auth/popup-closed-by-user")) {
    return "Google sign-up was cancelled.";
  }
  if (message.includes("auth/network-request-failed")) {
    return "Network error. Check your internet connection.";
  }

  return "Unable to create your account. Please try again.";
}

export default function Signup() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [focusedField, setFocusedField] = useState<FocusedField>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");

  const isPasswordFocused = focusedField === "password";
  const isCoveringEyes = isPasswordFocused && !showPassword;
  const isPeeking = isPasswordFocused && showPassword;

  async function handleEmailSignup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isLoading || isGoogleLoading) return;

    setError("");
    setIsLoading(true);

    try {
      await createUserWithEmailAndPassword(auth, email.trim(), password);
      setIsSuccess(true);

      window.setTimeout(() => {
        router.push("/");
        router.refresh();
      }, 850);
    } catch (signupError) {
      setError(getFriendlyError(signupError));
      setIsLoading(false);
    }
  }

  async function handleGoogleSignup() {
    if (isLoading || isGoogleLoading) return;

    setError("");
    setIsGoogleLoading(true);

    try {
      await signInWithPopup(auth, googleProvider);
      setIsSuccess(true);

      window.setTimeout(() => {
        router.push("/");
        router.refresh();
      }, 850);
    } catch (signupError) {
      setError(getFriendlyError(signupError));
      setIsGoogleLoading(false);
    }
  }

  return (
    <main className="login-page">
      <div className="background-orb orb-one" />
      <div className="background-orb orb-two" />
      <div className="background-grid" />

      <section
        className={`login-shell ${error ? "has-error" : ""} ${
          isSuccess ? "is-success" : ""
        }`}
        aria-labelledby="signup-title"
      >
        <div
          className={`mascot-wrap ${isCoveringEyes ? "covering" : ""} ${
            isPeeking ? "peeking" : ""
          } ${isSuccess ? "celebrating" : ""}`}
          aria-hidden="true"
        >
          <div className="mascot-shadow" />

          <div className="antenna">
            <span />
          </div>

          <div className="mascot-head">
            <div className="head-highlight" />

            <div className="ear ear-left" />
            <div className="ear ear-right" />

            <div className="face-screen">
              <div className="eyes">
                <span className="eye">
                  <span
                    className="pupil"
                    style={{
                      transform: `translateX(${Math.min(email.length * 0.18, 3)}px)`,
                    }}
                  />
                </span>
                <span className="eye">
                  <span
                    className="pupil"
                    style={{
                      transform: `translateX(${Math.min(email.length * 0.18, 3)}px)`,
                    }}
                  />
                </span>
              </div>

              <div className="mascot-mouth">
                <span />
              </div>
            </div>

            <div className="paw paw-left">
              <span className="paw-pad" />
            </div>
            <div className="paw paw-right">
              <span className="paw-pad" />
            </div>
          </div>
        </div>

        <div className="login-card">
          <div className="brand-row">
            <div className="brand-mark" aria-hidden="true">
              <span>3D</span>
            </div>
            <span className="brand-name">3D Hub</span>
          </div>

          <div className="heading-block">
            <p className="eyebrow">{isSuccess ? "Account ready" : "Join 3D Hub"}</p>
            <h1 id="signup-title">
              {isSuccess ? "Account created!" : "Create your account"}
            </h1>
            <p>
              {isSuccess
                ? "Taking you to your entertainment hub..."
                : "Save playlists, history, favourites, and continue watching anywhere."}
            </p>
          </div>

          <form onSubmit={handleEmailSignup} className="login-form">
            <label className="field-label" htmlFor="email">
              Email
            </label>
            <div
              className={`input-wrap ${
                focusedField === "email" ? "focused" : ""
              }`}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M4 5.5h16a1.5 1.5 0 0 1 1.5 1.5v10A1.5 1.5 0 0 1 20 18.5H4A1.5 1.5 0 0 1 2.5 17V7A1.5 1.5 0 0 1 4 5.5Z" />
                <path d="m3.5 7 8.5 6 8.5-6" />
              </svg>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onFocus={() => setFocusedField("email")}
                onBlur={() => setFocusedField(null)}
                onChange={(event) => setEmail(event.target.value)}
                disabled={isLoading || isGoogleLoading || isSuccess}
                required
              />
            </div>

            <label
              className="field-label password-field-label"
              htmlFor="password"
            >
              Password
            </label>

            <div
              className={`input-wrap ${
                focusedField === "password" ? "focused" : ""
              }`}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <rect x="4" y="10" width="16" height="11" rx="2" />
                <path d="M8 10V7a4 4 0 0 1 8 0v3" />
              </svg>

              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Password (minimum 6 characters)"
                value={password}
                minLength={6}
                onFocus={() => setFocusedField("password")}
                onBlur={() => setFocusedField(null)}
                onChange={(event) => setPassword(event.target.value)}
                disabled={isLoading || isGoogleLoading || isSuccess}
                required
              />

              <button
                className="password-toggle"
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => setShowPassword((current) => !current)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                disabled={isLoading || isGoogleLoading || isSuccess}
              >
                {showPassword ? (
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M3 3 21 21" />
                    <path d="M10.6 10.7a2 2 0 0 0 2.7 2.7" />
                    <path d="M9.9 4.3A10.8 10.8 0 0 1 12 4c5.5 0 9 5.8 9 5.8a14 14 0 0 1-2.2 2.8" />
                    <path d="M6.2 6.2C4.1 7.6 3 9.8 3 9.8S6.5 15.5 12 15.5c1 0 2-.2 2.8-.5" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M3 12s3.5-5.5 9-5.5S21 12 21 12s-3.5 5.5-9 5.5S3 12 3 12Z" />
                    <circle cx="12" cy="12" r="2.5" />
                  </svg>
                )}
              </button>
            </div>

            {error && (
              <div className="error-message" role="alert">
                <span aria-hidden="true">!</span>
                {error}
              </div>
            )}

            <button
              className="primary-button"
              type="submit"
              disabled={isLoading || isGoogleLoading || isSuccess}
            >
              {isSuccess ? (
                <>
                  <span className="success-check">✓</span>
                  Account created!
                </>
              ) : isLoading ? (
                <>
                  <span className="button-loader" />
                  Creating account...
                </>
              ) : (
                <>
                  Sign up
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M5 12h14" />
                    <path d="m14 7 5 5-5 5" />
                  </svg>
                </>
              )}
            </button>
          </form>

          <div className="divider">
            <span>or sign up with</span>
          </div>

          <button
            className="google-button"
            type="button"
            onClick={handleGoogleSignup}
            disabled={isLoading || isGoogleLoading || isSuccess}
          >
            {isGoogleLoading ? (
              <span className="google-loader" />
            ) : (
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="#4285F4"
                  d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.9h5.4a4.6 4.6 0 0 1-2 3v2.6h3.3c1.9-1.8 2.9-4.4 2.9-7.5Z"
                />
                <path
                  fill="#34A853"
                  d="M12 22c2.7 0 5-.9 6.7-2.3l-3.3-2.6c-.9.6-2.1 1-3.4 1-2.6 0-4.8-1.8-5.6-4.1H3v2.7A10 10 0 0 0 12 22Z"
                />
                <path
                  fill="#FBBC05"
                  d="M6.4 14a6 6 0 0 1 0-3.9V7.4H3a10 10 0 0 0 0 9.3L6.4 14Z"
                />
                <path
                  fill="#EA4335"
                  d="M12 6c1.5 0 2.9.5 3.9 1.5l2.9-2.9A9.7 9.7 0 0 0 3 7.4l3.4 2.7C7.2 7.8 9.4 6 12 6Z"
                />
              </svg>
            )}
            {isGoogleLoading ? "Connecting..." : "Sign up with Google"}
          </button>

          <p className="signup-copy">
            Already have an account? <Link href="/login">Log in</Link>
          </p>
        </div>
      </section>

      <style jsx>{`
        .login-page {
          min-height: 100dvh;
          position: relative;
          display: grid;
          place-items: center;
          overflow: hidden;
          padding: 100px 20px 40px;
          color: #f8fafc;
          background:
            radial-gradient(circle at 50% 0%, rgba(37, 99, 235, 0.16), transparent 35%),
            radial-gradient(circle at 100% 100%, rgba(124, 58, 237, 0.16), transparent 32%),
            #05070d;
        }

        .background-grid {
          position: absolute;
          inset: 0;
          opacity: 0.13;
          background-image:
            linear-gradient(rgba(255, 255, 255, 0.055) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.055) 1px, transparent 1px);
          background-size: 42px 42px;
          mask-image: linear-gradient(to bottom, black, transparent 82%);
          pointer-events: none;
        }

        .background-orb {
          position: absolute;
          border-radius: 999px;
          filter: blur(80px);
          pointer-events: none;
          animation: orbFloat 8s ease-in-out infinite;
        }

        .orb-one {
          width: 300px;
          height: 300px;
          top: 4%;
          left: 8%;
          background: rgba(37, 99, 235, 0.15);
        }

        .orb-two {
          width: 360px;
          height: 360px;
          right: 4%;
          bottom: -7%;
          background: rgba(124, 58, 237, 0.14);
          animation-delay: -3s;
        }

        .login-shell {
          position: relative;
          z-index: 2;
          width: min(100%, 430px);
          animation: cardEnter 650ms cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        .login-card {
          position: relative;
          z-index: 3;
          padding: 34px;
          border: 1px solid rgba(148, 163, 184, 0.16);
          border-radius: 28px;
          background:
            linear-gradient(145deg, rgba(17, 24, 39, 0.9), rgba(7, 11, 20, 0.93));
          box-shadow:
            0 30px 80px rgba(0, 0, 0, 0.5),
            inset 0 1px rgba(255, 255, 255, 0.04);
          backdrop-filter: blur(24px);
        }

        .brand-row {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          margin-bottom: 26px;
        }

        .brand-mark {
          width: 38px;
          height: 38px;
          display: grid;
          place-items: center;
          border-radius: 12px;
          background: linear-gradient(135deg, #2563eb, #7c3aed);
          box-shadow: 0 8px 24px rgba(37, 99, 235, 0.32);
          transform: rotate(-4deg);
        }

        .brand-mark span {
          font-size: 13px;
          font-weight: 900;
          letter-spacing: -0.5px;
        }

        .brand-name {
          font-size: 19px;
          font-weight: 800;
          letter-spacing: -0.4px;
        }

        .heading-block {
          text-align: center;
          margin-bottom: 27px;
        }

        .eyebrow {
          margin: 0 0 7px;
          color: #60a5fa;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.13em;
          text-transform: uppercase;
        }

        .heading-block h1 {
          margin: 0;
          font-size: clamp(27px, 6vw, 34px);
          line-height: 1.15;
          letter-spacing: -1.2px;
        }

        .heading-block p:last-child {
          max-width: 330px;
          margin: 11px auto 0;
          color: #94a3b8;
          font-size: 14px;
          line-height: 1.6;
        }

        .login-form {
          display: flex;
          flex-direction: column;
        }

        .field-label {
          display: inline-block;
          margin: 0 0 8px 2px;
          color: #dbeafe;
          font-size: 13px;
          font-weight: 700;
        }

        .password-field-label {
          margin-top: 17px;
        }

        .password-label-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 17px;
        }

        .password-label-row a {
          margin-bottom: 8px;
          color: #60a5fa;
          font-size: 12px;
          font-weight: 700;
          text-decoration: none;
        }

        .password-label-row a:hover {
          color: #93c5fd;
        }

        .input-wrap {
          height: 52px;
          display: flex;
          align-items: center;
          gap: 11px;
          padding: 0 14px;
          border: 1px solid rgba(148, 163, 184, 0.2);
          border-radius: 14px;
          background: rgba(2, 6, 23, 0.62);
          transition:
            border-color 180ms ease,
            box-shadow 180ms ease,
            transform 180ms ease;
        }

        .input-wrap.focused {
          border-color: rgba(59, 130, 246, 0.9);
          box-shadow:
            0 0 0 4px rgba(37, 99, 235, 0.13),
            0 0 24px rgba(37, 99, 235, 0.13);
          transform: translateY(-1px);
        }

        .input-wrap > svg {
          width: 19px;
          flex: 0 0 auto;
          fill: none;
          stroke: #64748b;
          stroke-width: 1.8;
          stroke-linecap: round;
          stroke-linejoin: round;
          transition: stroke 180ms ease;
        }

        .input-wrap.focused > svg {
          stroke: #60a5fa;
        }

        .input-wrap input {
          width: 100%;
          min-width: 0;
          border: 0;
          outline: 0;
          background: transparent;
          color: #f8fafc;
          font: inherit;
          font-size: 14px;
        }

        .input-wrap input::placeholder {
          color: #475569;
        }

        .input-wrap input:disabled {
          cursor: not-allowed;
        }

        .password-toggle {
          width: 34px;
          height: 34px;
          display: grid;
          place-items: center;
          flex: 0 0 auto;
          border: 0;
          border-radius: 9px;
          background: transparent;
          cursor: pointer;
        }

        .password-toggle:hover {
          background: rgba(255, 255, 255, 0.05);
        }

        .password-toggle svg {
          width: 19px;
          fill: none;
          stroke: #94a3b8;
          stroke-width: 1.8;
          stroke-linecap: round;
          stroke-linejoin: round;
        }

        .error-message {
          display: flex;
          align-items: center;
          gap: 9px;
          margin-top: 14px;
          padding: 11px 12px;
          border: 1px solid rgba(248, 113, 113, 0.25);
          border-radius: 12px;
          background: rgba(127, 29, 29, 0.16);
          color: #fecaca;
          font-size: 12.5px;
          line-height: 1.45;
        }

        .error-message span {
          width: 20px;
          height: 20px;
          display: grid;
          place-items: center;
          flex: 0 0 auto;
          border-radius: 50%;
          background: rgba(248, 113, 113, 0.2);
          font-weight: 900;
        }

        .primary-button,
        .google-button {
          width: 100%;
          min-height: 52px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          border-radius: 14px;
          font: inherit;
          font-size: 14px;
          font-weight: 800;
          cursor: pointer;
          transition:
            transform 180ms ease,
            box-shadow 180ms ease,
            border-color 180ms ease,
            opacity 180ms ease;
        }

        .primary-button {
          margin-top: 20px;
          border: 0;
          color: white;
          background: linear-gradient(135deg, #2563eb, #7c3aed);
          box-shadow: 0 13px 30px rgba(37, 99, 235, 0.28);
          position: relative;
          overflow: hidden;
        }

        .primary-button::before {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(
            110deg,
            transparent 25%,
            rgba(255, 255, 255, 0.2) 45%,
            transparent 65%
          );
          transform: translateX(-120%);
          animation: buttonShine 3.3s ease-in-out infinite;
        }

        .primary-button > :global(*) {
          position: relative;
          z-index: 1;
        }

        .primary-button:hover:not(:disabled),
        .google-button:hover:not(:disabled) {
          transform: translateY(-2px);
        }

        .primary-button:hover:not(:disabled) {
          box-shadow: 0 17px 35px rgba(37, 99, 235, 0.36);
        }

        .primary-button svg {
          width: 19px;
          fill: none;
          stroke: currentColor;
          stroke-width: 2;
          stroke-linecap: round;
          stroke-linejoin: round;
        }

        .primary-button:disabled,
        .google-button:disabled,
        .password-toggle:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }

        .button-loader,
        .google-loader {
          width: 18px;
          height: 18px;
          border: 2px solid rgba(255, 255, 255, 0.28);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 700ms linear infinite;
        }

        .google-loader {
          border-color: rgba(148, 163, 184, 0.28);
          border-top-color: #3b82f6;
        }

        .success-check {
          width: 22px;
          height: 22px;
          display: grid;
          place-items: center;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.2);
        }

        .divider {
          display: flex;
          align-items: center;
          gap: 13px;
          margin: 23px 0;
          color: #64748b;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        .divider::before,
        .divider::after {
          content: "";
          height: 1px;
          flex: 1;
          background: rgba(148, 163, 184, 0.14);
        }

        .google-button {
          border: 1px solid rgba(148, 163, 184, 0.2);
          color: #e2e8f0;
          background: rgba(15, 23, 42, 0.72);
        }

        .google-button:hover:not(:disabled) {
          border-color: rgba(96, 165, 250, 0.45);
          box-shadow: 0 12px 30px rgba(0, 0, 0, 0.22);
        }

        .google-button svg {
          width: 21px;
          height: 21px;
        }

        .signup-copy {
          margin: 23px 0 0;
          text-align: center;
          color: #94a3b8;
          font-size: 13px;
        }

        .signup-copy a {
          color: #60a5fa;
          font-weight: 800;
          text-decoration: none;
        }

        .signup-copy a:hover {
          color: #93c5fd;
        }

        .mascot-wrap {
          width: 180px;
          height: 122px;
          position: absolute;
          z-index: 4;
          left: 50%;
          top: -91px;
          transform: translateX(-50%);
          pointer-events: none;
        }

        .mascot-shadow {
          width: 126px;
          height: 19px;
          position: absolute;
          left: 27px;
          bottom: 3px;
          border-radius: 50%;
          background: rgba(0, 0, 0, 0.55);
          filter: blur(9px);
        }

        .mascot-head {
          width: 126px;
          height: 100px;
          position: absolute;
          left: 27px;
          bottom: 9px;
          border: 2px solid rgba(147, 197, 253, 0.28);
          border-radius: 44px 44px 37px 37px;
          background:
            linear-gradient(145deg, rgba(219, 234, 254, 0.98), rgba(96, 165, 250, 0.8));
          box-shadow:
            0 16px 32px rgba(37, 99, 235, 0.26),
            inset 0 2px rgba(255, 255, 255, 0.78);
          animation: mascotIdle 3s ease-in-out infinite;
        }

        .head-highlight {
          width: 62px;
          height: 22px;
          position: absolute;
          top: 9px;
          left: 19px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.3);
          filter: blur(5px);
          transform: rotate(-12deg);
        }

        .antenna {
          width: 4px;
          height: 22px;
          position: absolute;
          z-index: 1;
          left: 88px;
          top: 0;
          border-radius: 99px;
          background: #93c5fd;
          transform-origin: bottom;
          animation: antennaWiggle 2.7s ease-in-out infinite;
        }

        .antenna span {
          width: 12px;
          height: 12px;
          position: absolute;
          left: -4px;
          top: -7px;
          border-radius: 50%;
          background: #3b82f6;
          box-shadow: 0 0 16px rgba(59, 130, 246, 0.9);
        }

        .ear {
          width: 18px;
          height: 35px;
          position: absolute;
          top: 31px;
          border: 2px solid rgba(147, 197, 253, 0.3);
          background: linear-gradient(#93c5fd, #3b82f6);
        }

        .ear-left {
          left: -12px;
          border-radius: 12px 4px 4px 12px;
        }

        .ear-right {
          right: -12px;
          border-radius: 4px 12px 12px 4px;
        }

        .face-screen {
          width: 92px;
          height: 62px;
          position: absolute;
          left: 15px;
          top: 21px;
          border: 2px solid rgba(96, 165, 250, 0.25);
          border-radius: 27px;
          background:
            radial-gradient(circle at 50% -30%, rgba(96, 165, 250, 0.23), transparent 60%),
            #07101f;
          box-shadow:
            inset 0 0 15px rgba(59, 130, 246, 0.14),
            0 5px 12px rgba(15, 23, 42, 0.22);
        }

        .eyes {
          display: flex;
          justify-content: center;
          gap: 20px;
          padding-top: 17px;
        }

        .eye {
          width: 14px;
          height: 18px;
          display: grid;
          place-items: center;
          border-radius: 50%;
          background: #bfdbfe;
          box-shadow: 0 0 11px rgba(96, 165, 250, 0.85);
          overflow: hidden;
          animation: blink 5s infinite;
        }

        .pupil {
          width: 5px;
          height: 7px;
          border-radius: 50%;
          background: #1d4ed8;
          transition: transform 200ms ease;
        }

        .mascot-mouth {
          width: 29px;
          height: 11px;
          position: absolute;
          left: 30px;
          bottom: 9px;
          overflow: hidden;
        }

        .mascot-mouth span {
          width: 26px;
          height: 15px;
          display: block;
          border-bottom: 3px solid #60a5fa;
          border-radius: 0 0 50% 50%;
          transition: all 220ms ease;
        }

        .paw {
          width: 38px;
          height: 49px;
          position: absolute;
          z-index: 3;
          top: 67px;
          border: 2px solid rgba(147, 197, 253, 0.27);
          border-radius: 19px 19px 15px 15px;
          background: linear-gradient(145deg, #dbeafe, #60a5fa);
          box-shadow: 0 7px 14px rgba(15, 23, 42, 0.26);
          transition:
            transform 380ms cubic-bezier(0.22, 1, 0.36, 1),
            top 380ms cubic-bezier(0.22, 1, 0.36, 1),
            left 380ms cubic-bezier(0.22, 1, 0.36, 1),
            right 380ms cubic-bezier(0.22, 1, 0.36, 1);
        }

        .paw-left {
          left: -5px;
          transform: rotate(13deg);
        }

        .paw-right {
          right: -5px;
          transform: rotate(-13deg);
        }

        .paw-pad {
          width: 15px;
          height: 11px;
          position: absolute;
          left: 10px;
          top: 8px;
          border-radius: 50%;
          background: rgba(37, 99, 235, 0.28);
        }

        .covering .paw {
          top: 28px;
        }

        .covering .paw-left {
          left: 19px;
          transform: rotate(-16deg);
        }

        .covering .paw-right {
          right: 19px;
          transform: rotate(16deg);
        }

        .peeking .paw {
          top: 33px;
        }

        .peeking .paw-left {
          left: 11px;
          transform: rotate(-8deg) translateY(14px);
        }

        .peeking .paw-right {
          right: 11px;
          transform: rotate(8deg) translateY(14px);
        }

        .celebrating .mascot-head {
          animation: celebrate 650ms ease-in-out infinite alternate;
        }

        .celebrating .eye:first-child {
          height: 4px;
          margin-top: 7px;
          border-radius: 999px;
          animation: none;
        }

        .celebrating .eye:first-child .pupil {
          display: none;
        }

        .celebrating .mascot-mouth span {
          width: 29px;
          height: 19px;
          border-bottom-width: 4px;
        }

        .celebrating .paw-left {
          top: 9px;
          left: -20px;
          transform: rotate(-38deg);
        }

        .celebrating .paw-right {
          top: 9px;
          right: -20px;
          transform: rotate(38deg);
        }

        .has-error .login-card {
          animation: shake 430ms ease-in-out;
        }

        .is-success .login-card {
          border-color: rgba(96, 165, 250, 0.34);
          box-shadow:
            0 30px 85px rgba(0, 0, 0, 0.52),
            0 0 46px rgba(37, 99, 235, 0.15);
        }

        @keyframes cardEnter {
          from {
            opacity: 0;
            transform: translateY(22px) scale(0.97);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes mascotIdle {
          0%,
          100% {
            transform: translateY(0) rotate(-1deg);
          }
          50% {
            transform: translateY(-5px) rotate(1deg);
          }
        }

        @keyframes antennaWiggle {
          0%,
          100% {
            transform: rotate(-7deg);
          }
          50% {
            transform: rotate(8deg);
          }
        }

        @keyframes blink {
          0%,
          44%,
          48%,
          100% {
            transform: scaleY(1);
          }
          46% {
            transform: scaleY(0.12);
          }
        }

        @keyframes celebrate {
          from {
            transform: translateY(-3px) rotate(-4deg);
          }
          to {
            transform: translateY(-8px) rotate(4deg);
          }
        }

        @keyframes shake {
          0%,
          100% {
            transform: translateX(0);
          }
          25% {
            transform: translateX(-8px);
          }
          50% {
            transform: translateX(7px);
          }
          75% {
            transform: translateX(-4px);
          }
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes buttonShine {
          0%,
          55% {
            transform: translateX(-120%);
          }
          75%,
          100% {
            transform: translateX(120%);
          }
        }

        @keyframes orbFloat {
          0%,
          100% {
            transform: translate3d(0, 0, 0) scale(1);
          }
          50% {
            transform: translate3d(18px, -16px, 0) scale(1.08);
          }
        }

        @media (max-width: 560px) {
          .login-page {
            place-items: start center;
            padding: 102px 14px 24px;
            overflow-y: auto;
          }

          .login-card {
            padding: 28px 20px 24px;
            border-radius: 23px;
          }

          .mascot-wrap {
            transform: translateX(-50%) scale(0.9);
            transform-origin: bottom center;
            top: -88px;
          }

          .heading-block {
            margin-bottom: 23px;
          }
        }

        /*
          Compact desktop layout:
          keeps Email, Password, Google login and Sign up inside the viewport
          on laptops and displays around 700–920px tall.
        */
        @media (min-width: 561px) and (max-height: 920px) {
          .login-page {
            min-height: calc(100dvh - 108px);
            place-items: center;
            padding: 62px 20px 14px;
            overflow: hidden;
          }

          .login-shell {
            width: min(100%, 410px);
          }

          .login-card {
            padding: 21px 28px 18px;
            border-radius: 23px;
          }

          .mascot-wrap {
            top: -72px;
            transform: translateX(-50%) scale(0.73);
            transform-origin: bottom center;
          }

          .brand-row {
            gap: 8px;
            margin-bottom: 11px;
          }

          .brand-mark {
            width: 32px;
            height: 32px;
            border-radius: 10px;
          }

          .brand-name {
            font-size: 17px;
          }

          .heading-block {
            margin-bottom: 13px;
          }

          .eyebrow {
            margin-bottom: 4px;
            font-size: 10px;
          }

          .heading-block h1 {
            font-size: 28px;
            line-height: 1.08;
          }

          .heading-block p:last-child {
            max-width: 345px;
            margin-top: 6px;
            font-size: 12px;
            line-height: 1.4;
          }

          .field-label {
            margin-bottom: 5px;
            font-size: 12px;
          }

          .password-field-label {
            margin-top: 8px;
          }

          .password-label-row {
            margin-top: 8px;
          }

          .password-label-row a {
            margin-bottom: 5px;
            font-size: 11px;
          }

          .input-wrap {
            height: 44px;
            padding: 0 12px;
            border-radius: 12px;
          }

          .input-wrap input {
            font-size: 13px;
          }

          .primary-button,
          .google-button {
            min-height: 44px;
            border-radius: 12px;
            font-size: 13px;
          }

          .primary-button {
            margin-top: 12px;
          }

          .divider {
            margin: 12px 0;
            font-size: 9px;
          }

          .signup-copy {
            margin-top: 11px;
            font-size: 12px;
          }

          .error-message {
            margin-top: 8px;
            padding: 8px 10px;
            font-size: 11px;
          }
        }

        /*
          Very short laptop windows can still scroll safely instead of
          clipping controls.
        */
        @media (min-width: 561px) and (max-height: 650px) {
          .login-page {
            min-height: 620px;
            place-items: start center;
            padding-top: 62px;
            overflow-y: auto;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          *,
          *::before,
          *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            scroll-behavior: auto !important;
          }
        }
      `}</style>
    </main>
  );
}
