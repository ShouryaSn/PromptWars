"use client";

import { motion } from "framer-motion";

export default function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex w-full max-w-md flex-col items-center rounded-2xl border border-red-500/20 bg-red-500/5 px-6 py-8 text-center"
    >
      <p className="text-sm font-medium text-red-300">{message}</p>
      <button
        onClick={onRetry}
        className="focus-ring mt-4 rounded-lg border border-border bg-surface/80 px-5 py-2 text-sm font-medium text-white/70 transition-colors hover:border-accent/50 hover:text-white"
      >
        Try again
      </button>
    </motion.div>
  );
}
