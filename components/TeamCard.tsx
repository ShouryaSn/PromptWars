"use client";

import { useState } from "react";
import Link from "next/link";
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
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <motion.article
      variants={cardVariants}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -6, boxShadow: "0 20px 40px -12px rgba(20,23,26,0.15)" }}
      className="group flex flex-col rounded-2xl border border-border bg-surface p-5 shadow-md shadow-black/[0.03] transition-colors hover:border-accent/40"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full bg-accent-light ring-2 ring-transparent transition-all duration-300 group-hover:ring-accent/40">
            {!imgFailed ? (
              <motion.img
                src={member.avatarUrl}
                alt={member.name}
                onError={() => setImgFailed(true)}
                className="h-full w-full object-cover"
                whileHover={{ scale: 1.08 }}
                transition={{ duration: 0.3 }}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-accent-dark">
                {initials(member.name)}
              </div>
            )}
          </div>
          <div>
            <h3 className="font-semibold text-ink leading-tight">{member.name}</h3>
            <p className="text-sm text-muted">{member.role}</p>
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-end">
          <span className="text-lg font-bold text-accent-dark">{member.matchScore}%</span>
          <span className="text-[10px] uppercase tracking-wide text-muted/70">match</span>
        </div>
      </div>

      <p className="mt-4 text-sm leading-relaxed text-muted">{member.rationale}</p>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {member.matchedSkills.slice(0, 5).map((skill) => (
          <span
            key={skill}
            className="rounded-full border border-border bg-background px-2.5 py-1 text-xs font-medium text-ink transition-colors group-hover:border-accent/30 group-hover:bg-accent-light group-hover:text-accent-dark"
          >
            {skill}
          </span>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-xs text-muted/80">
        <span>{member.experience}</span>
        <span>{member.availability}</span>
      </div>

      <Link href={`/candidate/${member.id}`} className="mt-4 block">
        <motion.span
          whileHover={{ scale: 1.015 }}
          whileTap={{ scale: 0.985 }}
          className="focus-ring flex w-full items-center justify-center rounded-lg border border-accent bg-white px-4 py-2 text-sm font-semibold text-accent-dark transition-colors hover:bg-accent hover:text-white"
        >
          View profile
        </motion.span>
      </Link>
    </motion.article>
  );
}
