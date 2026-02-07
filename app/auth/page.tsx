"use client";

import { useState, FormEvent, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "../components/AuthProvider";
import { signInWithEmail, signUpWithEmail, signInWithGoogle } from "@/lib/authClient";

export const dynamic = "force-dynamic";

export default function AuthPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams?.get("redirect") || "/";
  const { user, loading } = useAuth();
  
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);

  if (loading) {
    return (
      <main
        style={{
          minHeight: "100vh",
          background: "radial-gradient(circle at top left, rgba(56,189,248,0.18), transparent 55%), radial-gradient(circle at bottom right, rgba(59,130,246,0.18), transparent 55%), linear-gradient(135deg, #f9fafb 0%, #e0f2fe 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px",
        }}
      >
        <div style={{ textAlign: "center", color: "#475569" }}>
          <p>Checking your session…</p>
        </div>
      </main>
    );
  }

  if (user) {
    return (
      <main
        style={{
          minHeight: "100vh",
          background: "radial-gradient(circle at top left, rgba(56,189,248,0.18), transparent 55%), radial-gradient(circle at bottom right, rgba(59,130,246,0.18), transparent 55%), linear-gradient(135deg, #f9fafb 0%, #e0f2fe 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px",
        }}
      >
        <div
          style={{
            background: "rgba(255, 255, 255, 0.8)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(56, 189, 248, 0.2)",
            borderRadius: 24,
            padding: "48px 32px",
            maxWidth: 480,
            textAlign: "center",
          }}
        >
          <h1
            style={{
              fontSize: 28,
              fontWeight: 700,
              color: "#0f172a",
              margin: "0 0 16px 0",
            }}
          >
            You're signed in!
          </h1>
          <p style={{ fontSize: 15, color: "#475569", margin: "0 0 32px 0" }}>
            Welcome, <strong>{user.email}</strong>
          </p>
          <button
            onClick={() => router.push(redirectTo)}
            style={{
              padding: "10px 24px",
              borderRadius: 9999,
              border: "none",
              backgroundColor: "#0284c7",
              color: "#ffffff",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
              boxShadow: "0 12px 30px rgba(8,47,73,0.35)",
            }}
          >
            {redirectTo === "/" ? "Back to Home" : "Continue"}
          </button>
        </div>
      </main>
    );
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);

    try {
      if (mode === "signin") {
        await signInWithEmail(email, password);
        setSuccess("Signed in! Redirecting…");
        setTimeout(() => router.push(redirectTo), 1500);
      } else {
        if (password.length < 6) {
          setError("Password must be at least 6 characters.");
          setSubmitting(false);
          return;
        }
        await signUpWithEmail(email, password);
        setSuccess("Account created! Redirecting…");
        setTimeout(() => router.push(redirectTo), 1500);
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong. Try again.");
      setSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    setSuccess("");
    setGoogleSubmitting(true);
    try {
      await signInWithGoogle();
      setSuccess("Signed in! Redirecting…");
      setTimeout(() => router.push(redirectTo), 1500);
    } catch (err: any) {
      setError(err.message || "Google sign-in failed. Try again.");
      setGoogleSubmitting(false);
    }
  };

  const buttonLabel = mode === "signin" ? "Sign in" : "Create account";

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "radial-gradient(circle at top left, rgba(56,189,248,0.18), transparent 55%), radial-gradient(circle at bottom right, rgba(59,130,246,0.18), transparent 55%), linear-gradient(135deg, #f9fafb 0%, #e0f2fe 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 480,
          background: "rgba(255, 255, 255, 0.8)",
          backdropFilter: "blur(10px)",
          border: "1px solid rgba(56, 189, 248, 0.2)",
          borderRadius: 24,
          padding: "40px 32px",
        }}
      >
        <h1
          style={{
            fontSize: 28,
            fontWeight: 700,
            color: "#0f172a",
            margin: "0 0 8px 0",
            textAlign: "center",
          }}
        >
          Welcome
        </h1>
        <p
          style={{
            fontSize: 14,
            color: "#64748b",
            textAlign: "center",
            margin: "0 0 32px 0",
          }}
        >
          {redirectTo === "/products/new" 
            ? "Sign in to add a product." 
            : "Please sign in to add a product or write a review."}
        </p>

        {/* Tabs */}
        <div
          style={{
            display: "flex",
            gap: 12,
            marginBottom: 24,
            borderBottom: "1px solid #e5e7eb",
          }}
        >
          <button
            onClick={() => {
              setMode("signin");
              setError("");
              setSuccess("");
            }}
            style={{
              padding: "8px 16px",
              border: "none",
              backgroundColor: "transparent",
              color: mode === "signin" ? "#0284c7" : "#94a3b8",
              fontSize: 14,
              fontWeight: mode === "signin" ? 600 : 500,
              cursor: "pointer",
              borderBottom: mode === "signin" ? "2px solid #0284c7" : "2px solid transparent",
              transition: "all 0.3s ease",
            }}
          >
            Sign in
          </button>
          <button
            onClick={() => {
              setMode("signup");
              setError("");
              setSuccess("");
            }}
            style={{
              padding: "8px 16px",
              border: "none",
              backgroundColor: "transparent",
              color: mode === "signup" ? "#0284c7" : "#94a3b8",
              fontSize: 14,
              fontWeight: mode === "signup" ? 600 : 500,
              cursor: "pointer",
              borderBottom: mode === "signup" ? "2px solid #0284c7" : "2px solid transparent",
              transition: "all 0.3s ease",
            }}
          >
            Create account
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <section style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                style={{
                  display: "block",
                  fontSize: 12,
                  fontWeight: 500,
                  color: "#4b5563",
                  marginBottom: 4,
                }}
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "9px 10px",
                  borderRadius: 10,
                  border: "1px solid #e5e7eb",
                  fontSize: 14,
                  outline: "none",
                  backgroundColor: "#f9fafb",
                }}
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                style={{
                  display: "block",
                  fontSize: 12,
                  fontWeight: 500,
                  color: "#4b5563",
                  marginBottom: 4,
                }}
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete={
                  mode === "signin" ? "current-password" : "new-password"
                }
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "9px 10px",
                  borderRadius: 10,
                  border: "1px solid #e5e7eb",
                  fontSize: 14,
                  outline: "none",
                  backgroundColor: "#f9fafb",
                }}
              />
              {mode === "signup" && (
                <p
                  style={{
                    fontSize: 11,
                    color: "#9ca3af",
                    marginTop: 4,
                  }}
                >
                  Must be at least 6 characters.
                </p>
              )}
            </div>
          </section>

          {error && (
            <p
              style={{
                marginTop: 12,
                fontSize: 12,
                color: "#b91c1c",
                backgroundColor: "#fee2e2",
                padding: "6px 8px",
                borderRadius: 8,
              }}
            >
              {error}
            </p>
          )}

          {success && (
            <p
              style={{
                marginTop: 12,
                fontSize: 12,
                color: "#166534",
                backgroundColor: "#dcfce7",
                padding: "6px 8px",
                borderRadius: 8,
              }}
            >
              {success}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting || googleSubmitting}
            style={{
              marginTop: 18,
              width: "100%",
              padding: "10px 16px",
              borderRadius: 9999,
              border: "none",
              backgroundColor:
                submitting || googleSubmitting ? "#7dd3fc" : "#0284c7",
              color: "#ffffff",
              fontSize: 14,
              fontWeight: 600,
              cursor:
                submitting || googleSubmitting ? "default" : "pointer",
              boxShadow: "0 12px 30px rgba(8,47,73,0.35)",
            }}
          >
            {submitting ? "Working..." : buttonLabel}
          </button>

          {/* Divider */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginTop: 24,
            }}
          >
            <div style={{ flex: 1, height: "1px", backgroundColor: "#e5e7eb" }} />
            <span style={{ fontSize: 12, color: "#94a3b8" }}>or</span>
            <div style={{ flex: 1, height: "1px", backgroundColor: "#e5e7eb" }} />
          </div>

          {/* Google Sign-In Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={googleSubmitting || submitting}
            style={{
              marginTop: 18,
              width: "100%",
              padding: "10px 16px",
              borderRadius: 9999,
              border: "1px solid #e5e7eb",
              backgroundColor:
                googleSubmitting || submitting ? "#f3f4f6" : "#ffffff",
              color: googleSubmitting || submitting ? "#9ca3af" : "#0f172a",
              fontSize: 14,
              fontWeight: 600,
              cursor:
                googleSubmitting || submitting ? "default" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              if (!googleSubmitting && !submitting) {
                e.currentTarget.style.backgroundColor = "#f9fafb";
                e.currentTarget.style.boxShadow = "0 2px 6px rgba(0, 0, 0, 0.15)";
              }
            }}
            onMouseLeave={(e) => {
              if (!googleSubmitting && !submitting) {
                e.currentTarget.style.backgroundColor = "#ffffff";
                e.currentTarget.style.boxShadow = "0 1px 3px rgba(0, 0, 0, 0.1)";
              }
            }}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            {googleSubmitting ? "Connecting..." : "Continue with Google"}
          </button>
        </form>

        {/* Back link */}
        <p style={{ fontSize: 13, color: "#64748b", textAlign: "center", marginTop: 20 }}>
          <a
            href="/"
            style={{
              color: "#0284c7",
              textDecoration: "none",
              fontWeight: 500,
            }}
          >
            ← Back to home
          </a>
        </p>
      </div>
    </main>
  );
}
