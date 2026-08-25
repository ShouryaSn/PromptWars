"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";

const EXAMPLES = [
  {
    label: "🌾 Farming app",
    text: "We're building a mobile app that helps small farmers track crop health using phone-camera photos and get AI-driven treatment suggestions, plus a marketplace to sell surplus produce locally.",
  },
  {
    label: "💳 Fintech dashboard",
    text: "We're building a web dashboard for small businesses to track cash flow across bank accounts, forecast upcoming expenses, and get alerts before they run low on funds. Needs bank-grade security and a polished, trustworthy UI.",
  },
  {
    label: "🎮 Multiplayer game",
    text: "We're a small studio building a cross-platform multiplayer mobile game with real-time matches and in-game cosmetics, plus a community Discord-style chat. Need someone who can also help us market it at launch.",
  },
];

export default function ProjectForm({
  onSubmit,
  disabled,
}: {
  onSubmit: (description: string) => void;
  disabled?: boolean;
}) {
  const [value, setValue] = useState("");
  const [touched, setTouched] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const tooShort = value.trim().length > 0 && value.trim().length < 20;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (value.trim().length < 20) return;
    onSubmit(value.trim());
  }

  function useExample(text: string) {
    setValue(text);
    setTouched(false);
    textareaRef.current?.focus();
  }

  return (
    <motion.form
      onSubmit={handleSubmit}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="w-full max-w-2xl"
    >
      <div className="mb-3 flex flex-wrap items-center justify-center gap-2">
        <span className="text-xs font-medium text-muted">Try an example:</span>
        {EXAMPLES.map((ex) => (
          <button
            key={ex.label}
            type="button"
            onClick={() => useExample(ex.text)}
            disabled={disabled}
            className="focus-ring rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-muted transition-colors hover:border-accent/40 hover:text-accent-dark disabled:cursor-not-allowed disabled:opacity-50"
          >
            {ex.label}
          </button>
        ))}
      </div>

      <label htmlFor="description" className="sr-only">
        Project description
      </label>
      <textarea
        id="description"
        ref={textareaRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={() => setTouched(true)}
        disabled={disabled}
        rows={6}
        placeholder={`What are you building? e.g.\n\n"${EXAMPLES[0].text}"`}
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
