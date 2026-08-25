"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const STEPS = [
  "Parsing your requirements…",
  "Scanning the candidate pool…",
  "Scoring skill & interest overlap…",
  "Ranking the best matches…",
  "Writing rationale for each pick…",
];

export default function LoadingSequence() {
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStepIndex((i) => Math.min(i + 1, STEPS.length - 1));
    }, 1100);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex w-full max-w-md flex-col items-center py-16 text-center" role="status" aria-live="polite">
      <div className="relative mb-8 h-16 w-16">
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-accent/20"
        />
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-t-accent border-r-accent/40 border-b-transparent border-l-transparent"
          animate={{ rotate: 360 }}
          transition={{ duration: 1.1, repeat: Infinity, ease: "linear" }}
        />
      </div>

      <div className="h-6 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.p
            key={stepIndex}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="text-sm font-medium text-muted"
          >
            {STEPS[stepIndex]}
          </motion.p>
        </AnimatePresence>
      </div>

      <div className="mt-6 flex gap-1.5">
        {STEPS.map((_, i) => (
          <div
            key={i}
            className={`h-1 w-6 rounded-full transition-colors duration-300 ${
              i <= stepIndex ? "bg-accent" : "bg-border"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
