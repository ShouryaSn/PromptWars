"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { GoogleIcon, GitHubIcon } from "@/components/icons/ProviderIcons";
import type { Provider } from "@supabase/supabase-js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Mode = "signup" | "login";

const OAUTH_PROVIDERS: { id: Provider; label: string; icon: () => React.JSX.Element }[] = [
  { id: "google", label: "Google", icon: GoogleIcon },
  { id: "github", label: "GitHub", icon: GitHubIcon },
];

export default function LoginForm() {
  const supabase = createClient();
  const [mode, setMode] = useState<Mode>("signup");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [oauthPending, setOauthPending] = useState<Provider | null>(null);

  // If Supabase's OAuth redirect doesn't land on /auth/callback (e.g. that URL
  // isn't in the project's Redirect URLs allowlist), it falls back to landing
  // here with a bare "?code=" and the browser SDK exchanges it client-side.
  // The server already rendered this logged-out form before that exchange
  // finished, so once a session lands we force a real navigation to "/" —
  // middleware then sees the now-set cookie and routes correctly.
  useEffect(() => {
    if (!window.location.search.includes("code=")) return;

    let redirected = false;
    const redirectHome = () => {
      if (redirected) return;
      redirected = true;
      window.location.href = "/";
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") redirectHome();
    });

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) redirectHome();
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
    setInfo(null);
  }

  async function handleOAuth(provider: Provider) {
    setError(null);
    setInfo(null);
    setOauthPending(provider);
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (oauthError) {
      setError(oauthError.message);
      setOauthPending(null);
    }
    // On success the browser is redirected away, so no further state change here.
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);

    if (mode === "signup") {
      const trimmedName = name.trim();
      const trimmedEmail = email.trim();
      if (trimmedName.length < 2) {
        setError("Enter your name to continue.");
        return;
      }
      if (!EMAIL_RE.test(trimmedEmail)) {
        setError("That email doesn't look right.");
        return;
      }
      if (password.length < 6) {
        setError("Password must be at least 6 characters.");
        return;
      }

      setSubmitting(true);
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
        options: {
          data: { full_name: trimmedName },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      setSubmitting(false);

      if (signUpError) {
        setError(signUpError.message);
        return;
      }
      if (!data.session) {
        // Email confirmation is required before a session is issued.
        setInfo("Check your email to confirm your account, then log in.");
        return;
      }
      window.location.href = "/";
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

    setSubmitting(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: trimmedEmail,
      password,
    });
    setSubmitting(false);

    if (signInError) {
      setError(signInError.message);
      return;
    }
    window.location.href = "/";
  }

  return (
    <motion.form
      onSubmit={handleSubmit}
      noValidate
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
            ? "Tell us who you are and we'll take it from there."
            : "Log in to pick up where you left off."}
        </p>
      </div>

      <div className="mb-5 space-y-2">
        {OAUTH_PROVIDERS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            disabled={oauthPending !== null}
            onClick={() => handleOAuth(id)}
            className="focus-ring flex w-full items-center justify-center gap-2.5 rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-accent-light/40 disabled:opacity-60"
          >
            <Icon />
            {oauthPending === id ? "Redirecting…" : `Continue with ${label}`}
          </button>
        ))}
      </div>

      <div className="mb-5 flex items-center gap-3">
        <span className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted">or use email</span>
        <span className="h-px flex-1 bg-border" />
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
              Email
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
          <div>
            <label htmlFor="password" className="mb-1.5 block text-xs font-medium text-muted">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
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

      {info && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 text-sm text-accent-dark"
        >
          {info}
        </motion.p>
      )}

      <motion.button
        type="submit"
        disabled={submitting || oauthPending !== null}
        whileHover={{ scale: 1.015 }}
        whileTap={{ scale: 0.985 }}
        className="focus-ring mt-5 w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-dark disabled:opacity-60"
      >
        {submitting ? "Please wait…" : mode === "signup" ? "Sign up" : "Log in"}
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
    </motion.form>
  );
}
