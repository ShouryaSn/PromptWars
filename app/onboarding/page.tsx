"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";

type Role = "seeker" | "developer";

const OPTIONS: { role: Role; title: string; description: string }[] = [
  {
    role: "seeker",
    title: "Seeker",
    description: "I'm looking for a developer or teammate to help build something.",
  },
  {
    role: "developer",
    title: "Developer",
    description: "I'm looking for clubs or projects to work on.",
  },
];

export default function OnboardingPage() {
  const supabase = createClient();
  const [pending, setPending] = useState<Role | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function choose(role: Role) {
    setError(null);
    setPending(role);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("Your session expired. Please log in again.");
      setPending(null);
      return;
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ role })
      .eq("id", user.id);

    if (updateError) {
      setError(updateError.message);
      setPending(null);
      return;
    }

    window.location.href = role === "developer" ? "/developer/profile" : "/match";
  }

  return (
    <main className="relative flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-6 py-16">
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="mb-10 flex flex-col items-center text-center"
      >
        <h1 className="max-w-xl text-3xl font-bold tracking-tight text-ink sm:text-4xl">
          What are you here to do?
        </h1>
        <p className="mt-3 max-w-md text-balance text-muted">
          This decides what ProjectMatch shows you next. You can switch between Seeker and Developer
          later from the menu, so just pick what fits right now.
        </p>
      </motion.div>

      <div className="grid w-full max-w-2xl gap-4 sm:grid-cols-2">
        {OPTIONS.map(({ role, title, description }, i) => (
          <motion.button
            key={role}
            type="button"
            disabled={pending !== null}
            onClick={() => choose(role)}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 + i * 0.08 }}
            whileHover={{ scale: 1.015 }}
            whileTap={{ scale: 0.985 }}
            className="focus-ring flex flex-col items-start rounded-2xl border border-border bg-surface p-6 text-left shadow-xl shadow-black/[0.04] transition-colors hover:border-accent disabled:opacity-60"
          >
            <h2 className="text-lg font-semibold text-ink">{title}</h2>
            <p className="mt-1.5 text-sm text-muted">{description}</p>
            <span className="mt-4 text-sm font-medium text-accent-dark">
              {pending === role ? "Saving…" : `Continue as ${title}`}
            </span>
          </motion.button>
        ))}
      </div>

      {error && <p className="mt-6 text-sm text-red-600">{error}</p>}
    </main>
  );
}
