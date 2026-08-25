"use client";

import { useState } from "react";
import { motion } from "framer-motion";

const EXAMPLE =
  "We're building a mobile app that helps small farmers track crop health using phone-camera photos and get AI-driven treatment suggestions, plus a marketplace to sell surplus produce locally.";

export default function ProjectForm({
  onSubmit,
  disabled,
}: {
  onSubmit: (description: string) => void;
  disabled?: boolean;
}) {
  const [value, setValue] = useState("");
  const [touched, setTouched] = useState(false);

  const tooShort = value.trim().length > 0 && value.trim().length < 20;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (value.trim().length < 20) return;
    onSubmit(value.trim());
  }

  return (
    <motion.form
      onSubmit={handleSubmit}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="w-full max-w-2xl"
    >
      <label htmlFor="description" className="sr-only">
        Project description
      </label>
      <textarea
        id="description"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={() => setTouched(true)}
        disabled={disabled}
        rows={6}
        placeholder={`What are you building? e.g.\n\n"${EXAMPLE}"`}
        className="focus-ring w-full resize-none rounded-2xl border border-border bg-surface p-5 text-base text-ink placeholder:text-muted/60 shadow-xl shadow-black/[0.04] transition-colors focus:border-accent disabled:opacity-50"
      />

      <div className="mt-2 flex min-h-[1.25rem] items-center justify-between px-1">
        <p className="text-xs text-red-600">
          {touched && tooShort ? "Give a bit more detail (20+ characters)." : ""}
        </p>
        <p className="text-xs text-muted/70">{value.trim().length} chars</p>
      </div>

      <motion.button
        type="submit"
        disabled={disabled}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        className="focus-ring mt-3 w-full rounded-xl bg-accent px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
      >
        Build my team
      </motion.button>
    </motion.form>
  );
}
