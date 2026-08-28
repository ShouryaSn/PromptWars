"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Spinner from "@/components/Spinner";

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
      <div className="mb-8">
        <Spinner size="h-16 w-16" />
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
