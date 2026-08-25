"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Mode = "signup" | "login";

function nameFromEmail(email: string): string {
  const local = email.split("@")[0] ?? "";
  const words = local
    .replace(/[._-]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1));
  return words.join(" ") || "there";
}

export default function LoginForm() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signup");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (mode === "signup") {
      const trimmedName = name.trim();
      if (trimmedName.length < 2) {
        setError("Enter your name to continue.");
        return;
      }
      if (email.trim().length > 0 && !EMAIL_RE.test(email.trim())) {
        setError("That email doesn't look right.");
        return;
      }
      setError(null);
      setSubmitting(true);
      sessionStorage.setItem("projectmatch:name", trimmedName);
      router.push("/match");
      return;
    }

    // login
    const trimmedEmail = email.trim();
    if (!EMAIL_RE.test(trimmedEmail)) {
      setError("Enter the email you signed up with.");
      return;
    }
    if (password.length < 1) {
      setError("Enter your password.");
      return;
    }
    setError(null);
    setSubmitting(true);
    sessionStorage.setItem("projectmatch:name", nameFromEmail(trimmedEmail));
    router.push("/match");
  }

  return (
    <motion.form
      onSubmit={handleSubmit}
      className="w-full max-w-sm rounded-2xl border border-border bg-surface p-6 shadow-xl shadow-black/[0.04]"
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="mb-5 flex rounded-lg border border-border bg-background p-1">
        {(["signup", "login"] as Mode[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => switchMode(m)}
            className={`focus-ring relative flex-1 overflow-hidden rounded-md py-1.5 text-sm font-semibold transition-colors ${
              mode === m ? "text-white" : "text-muted hover:text-ink"
            }`}
          >
            {mode === m && (
              <motion.span
                layoutId="auth-mode-pill"
                className="absolute inset-0 rounded-md bg-accent"
                transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
              />
            )}
            <span className="relative">{m === "signup" ? "Sign up" : "Log in"}</span>
          </button>
        ))}
      </div>

      <div className="mb-5 space-y-1">
        <h2 className="text-lg font-semibold text-ink">
          {mode === "signup" ? "Create your account" : "Welcome back"}
        </h2>
        <p className="text-sm text-muted">
          {mode === "signup"
            ? "Just a name so your session feels like yours."
            : "Log in to pick up where you left off."}
        </p>
      </div>

      {mode === "signup" ? (
        <div className="space-y-3">
          <div>
            <label htmlFor="name" className="mb-1.5 block text-xs font-medium text-muted">
              Name
            </label>
            <input
              id="name"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ada Lovelace"
              className="focus-ring w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-ink placeholder:text-muted/60 transition-colors focus:border-accent"
            />
          </div>
          <div>
            <label htmlFor="email" className="mb-1.5 block text-xs font-medium text-muted">
              Email <span className="text-muted/60">(optional)</span>
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ada@example.com"
              className="focus-ring w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-ink placeholder:text-muted/60 transition-colors focus:border-accent"
            />
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div>
            <label htmlFor="login-email" className="mb-1.5 block text-xs font-medium text-muted">
              Email
            </label>
            <input
              id="login-email"
              type="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ada@example.com"
              className="focus-ring w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-ink placeholder:text-muted/60 transition-colors focus:border-accent"
            />
          </div>
          <div>
            <label htmlFor="password" className="mb-1.5 block text-xs font-medium text-muted">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="focus-ring w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-ink placeholder:text-muted/60 transition-colors focus:border-accent"
            />
          </div>
        </div>
      )}

      {error && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 text-sm text-red-600"
        >
          {error}
        </motion.p>
      )}

      <motion.button
        type="submit"
        disabled={submitting}
        whileHover={{ scale: 1.015 }}
        whileTap={{ scale: 0.985 }}
        className="focus-ring mt-5 w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-dark disabled:opacity-60"
      >
        {submitting ? "Entering…" : mode === "signup" ? "Sign up" : "Log in"}
      </motion.button>

      <p className="mt-4 text-center text-xs text-muted">
        {mode === "signup" ? (
          <>
            Already have an account?{" "}
            <button type="button" onClick={() => switchMode("login")} className="focus-ring font-medium text-accent-dark hover:underline">
              Log in
            </button>
          </>
        ) : (
          <>
            New here?{" "}
            <button type="button" onClick={() => switchMode("signup")} className="focus-ring font-medium text-accent-dark hover:underline">
              Sign up
            </button>
          </>
        )}
      </p>

      <p className="mt-3 text-center text-[11px] text-muted/70">
        Demo mode — no account is created or verified, nothing leaves your session.
      </p>
    </motion.form>
  );
}
