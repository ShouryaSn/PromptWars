"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
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
  }

  return (
    <motion.form
      onSubmit={handleSubmit}
      className="w-full max-w-sm rounded-2xl border border-border bg-surface p-6 shadow-xl shadow-black/[0.04]"
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="mb-5 space-y-1">
        <h2 className="text-lg font-semibold text-ink">Sign in to continue</h2>
        <p className="text-sm text-muted">Just a name so your session feels like yours.</p>
      </div>

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
        {submitting ? "Entering…" : "Continue"}
      </motion.button>

      <p className="mt-4 text-center text-[11px] text-muted/70">
        Demo mode — no account is created, nothing leaves your session.
      </p>
    </motion.form>
  );
}
