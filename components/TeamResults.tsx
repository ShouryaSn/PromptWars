"use client";

import { useMemo, useState } from "react";
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
  const roles = useMemo(() => Array.from(new Set(result.team.map((m) => m.role))), [result.team]);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  const visibleTeam = selectedRole ? result.team.filter((m) => m.role === selectedRole) : result.team;

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

      {roles.length > 1 && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.3 }}
          className="mb-6 flex flex-wrap items-center justify-center gap-2"
        >
          <button
            onClick={() => setSelectedRole(null)}
            className={`focus-ring relative overflow-hidden rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
              selectedRole === null
                ? "border-transparent text-white"
                : "border-border bg-surface text-muted hover:border-accent/40 hover:text-ink"
            }`}
          >
            {selectedRole === null && (
              <motion.span
                layoutId="role-filter-pill"
                className="absolute inset-0 rounded-full bg-accent"
                transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
              />
            )}
            <span className="relative">All ({result.team.length})</span>
          </button>

          {roles.map((role) => {
            const count = result.team.filter((m) => m.role === role).length;
            const active = selectedRole === role;
            return (
              <button
                key={role}
                onClick={() => setSelectedRole(role)}
                className={`focus-ring relative overflow-hidden rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                  active
                    ? "border-transparent text-white"
                    : "border-border bg-surface text-muted hover:border-accent/40 hover:text-ink"
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="role-filter-pill"
                    className="absolute inset-0 rounded-full bg-accent"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                  />
                )}
                <span className="relative">
                  {role} ({count})
                </span>
              </button>
            );
          })}
        </motion.div>
      )}

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        {visibleTeam.map((member, i) => (
          <TeamCard key={member.id} member={member} index={i} />
        ))}
      </motion.div>

      {visibleTeam.length === 0 && (
        <p className="mt-10 text-center text-sm text-muted">No team members match that filter.</p>
      )}

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
