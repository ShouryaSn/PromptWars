"use client";

import { motion } from "framer-motion";
import { TeamMember } from "@/lib/types";

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

const cardVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.96 },
  show: { opacity: 1, y: 0, scale: 1 },
};

export default function TeamCard({ member, index }: { member: TeamMember; index: number }) {
  return (
    <motion.article
      variants={cardVariants}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col rounded-2xl border border-border bg-surface/80 p-5 shadow-lg shadow-black/20 backdrop-blur"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent/20 text-sm font-semibold text-accent-light">
            {initials(member.name)}
          </div>
          <div>
            <h3 className="font-semibold text-white leading-tight">{member.name}</h3>
            <p className="text-sm text-white/50">{member.role}</p>
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-end">
          <span className="text-lg font-bold text-accent-light">{member.matchScore}%</span>
          <span className="text-[10px] uppercase tracking-wide text-white/30">match</span>
        </div>
      </div>

      <p className="mt-4 text-sm leading-relaxed text-white/70">{member.rationale}</p>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {member.matchedSkills.slice(0, 5).map((skill) => (
          <span
            key={skill}
            className="rounded-full border border-accent/30 bg-accent/10 px-2.5 py-1 text-xs font-medium text-accent-light"
          >
            {skill}
          </span>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-xs text-white/40">
        <span>{member.experience}</span>
        <span>{member.availability}</span>
      </div>
    </motion.article>
  );
}
