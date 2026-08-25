"use client";

import { motion } from "framer-motion";
import { MatchResponse } from "@/lib/types";
import TeamCard from "./TeamCard";

const containerVariants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.09, delayChildren: 0.1 },
  },
};

export default function TeamResults({
  result,
  onReset,
}: {
  result: MatchResponse;
  onReset: () => void;
}) {
  return (
    <div className="w-full max-w-5xl">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-8 rounded-2xl border border-accent/30 bg-accent-light px-5 py-4 text-center"
      >
        <p className="text-sm font-medium text-ink">{result.teamSummary}</p>
        {result.requiredRoles.length > 0 && (
          <p className="mt-2 text-xs text-muted">
            Roles matched: {result.requiredRoles.join(" · ")}
          </p>
        )}
      </motion.div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        {result.team.map((member, i) => (
          <TeamCard key={member.id} member={member} index={i} />
        ))}
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-10 flex justify-center"
      >
        <button
          onClick={onReset}
          className="focus-ring rounded-xl border border-border bg-surface px-6 py-3 text-sm font-medium text-muted transition-colors hover:border-accent/50 hover:text-ink"
        >
          Try another project
        </button>
      </motion.div>
    </div>
  );
}
