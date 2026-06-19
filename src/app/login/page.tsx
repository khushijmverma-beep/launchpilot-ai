"use client";

import { DotFieldBackground } from "@/components/animations/DotFieldBackground";
import { Logo } from "@/components/Logo";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type AuthMode = "sign-in" | "create-account";

function formatAuthError(error: unknown): string {
  if (!(error instanceof Error)) return "Authentication failed";

  const code = "code" in error ? String((error as { code?: string }).code) : "";

  switch (code) {
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/user-disabled":
      return "This account has been disabled.";
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "Incorrect email or password.";
    case "auth/email-already-in-use":
      return "An account with this email already exists. Try signing in.";
    case "auth/weak-password":
      return "Password must be at least 6 characters.";
    case "auth/popup-closed-by-user":
      return "Google sign-in was cancelled.";
    default:
      return error.message || "Authentication failed";
  }
}

export default function LoginPage() {
  const router = useRouter();
  const { user, loading, signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth();
  const [mode, setMode] = useState<AuthMode>("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && user) {
      router.replace("/start");
    }
  }, [loading, user, router]);

  async function handleGoogleSignIn() {
    setSubmitting(true);
    setError(null);

    try {
      await signInWithGoogle();
      router.push("/start");
    } catch (signInError) {
      setError(formatAuthError(signInError));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleEmailSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!email.trim() || !password) {
      setError("Email and password are required.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      if (mode === "create-account") {
        await signUpWithEmail(email, password);
      } else {
        await signInWithEmail(email, password);
      }
      router.push("/start");
    } catch (authError) {
      setError(formatAuthError(authError));
    } finally {
      setSubmitting(false);
    }
  }

  function toggleMode() {
    setMode((current) => (current === "sign-in" ? "create-account" : "sign-in"));
    setError(null);
  }

  return (
    <main className="relative min-h-screen bg-black">
      <DotFieldBackground variant="calm" bulgeStrength={32} />

      <div className="page-content relative z-10 flex min-h-screen flex-col items-center justify-center px-5">
        <div className="mb-8 flex items-center gap-3 text-white">
          <Logo size={32} />
          <span className="font-mono text-sm tracking-wide">LaunchPilot AI</span>
        </div>

        <div className="w-full max-w-sm border border-white/15 bg-black/80 p-8">
          <p className="mono-label">{mode === "sign-in" ? "Sign in" : "Create account"}</p>
          <h1 className="mt-3 text-2xl font-semibold text-white">Continue to your workspace</h1>
          <p className="mt-3 text-sm leading-6 text-lp-muted">
            Sign in with email or Google to save your profile, projects, and interview progress.
          </p>

          <form onSubmit={handleEmailSubmit} className="mt-8 space-y-4">
            <div>
              <label htmlFor="email" className="mono-label mb-2 block">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                className="input-field"
                placeholder="you@university.edu"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                disabled={submitting || loading}
              />
            </div>
            <div>
              <label htmlFor="password" className="mono-label mb-2 block">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete={mode === "create-account" ? "new-password" : "current-password"}
                className="input-field"
                placeholder="••••••••"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                disabled={submitting || loading}
              />
            </div>

            <button type="submit" className="btn-primary w-full" disabled={submitting || loading}>
              {submitting
                ? "Working…"
                : mode === "sign-in"
                  ? "Sign in with email"
                  : "Create account"}
            </button>
          </form>

          <button
            type="button"
            className="mt-4 w-full font-mono text-xs text-lp-subtle hover:text-white"
            onClick={toggleMode}
            disabled={submitting || loading}
          >
            {mode === "sign-in"
              ? "Need an account? Create one"
              : "Already have an account? Sign in"}
          </button>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-white/10" />
            <span className="font-mono text-[10px] uppercase tracking-wider text-lp-subtle">or</span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          <button
            type="button"
            className="btn-secondary w-full"
            onClick={handleGoogleSignIn}
            disabled={submitting || loading}
          >
            {submitting ? "Working…" : "Continue with Google"}
          </button>

          {error && <p className="mt-4 font-mono text-xs text-red-400">{error}</p>}
        </div>
      </div>
    </main>
  );
}
