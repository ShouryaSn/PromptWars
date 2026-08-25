"use client";

import { motion } from "framer-motion";
import CountUp from "./CountUp";

const STATS = [
  { value: 12847, suffix: "", label: "Professionals in the network" },
  { value: 3214, suffix: "", label: "Projects matched" },
  { value: 94, suffix: "%", label: "Would work with their match again" },
];

export default function StatsSection() {
  return (
    <section className="w-full max-w-5xl py-16">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.5 }}
        className="mb-10 flex flex-col items-center text-center"
      >
        <span className="mb-3 text-xs font-semibold uppercase tracking-wide text-accent-dark">
          Trusted by builders
        </span>
        <h2 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">A growing network, ready when you are</h2>
      </motion.div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {STATS.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.4, delay: i * 0.08 }}
            whileHover={{ y: -4 }}
            className="flex flex-col items-center rounded-2xl border border-border bg-surface px-4 py-6 text-center shadow-sm shadow-black/[0.02] transition-colors hover:border-accent/40"
          >
            <span className="text-3xl font-bold text-accent-dark sm:text-4xl">
              <CountUp value={stat.value} suffix={stat.suffix} />
            </span>
            <span className="mt-2 text-xs text-muted">{stat.label}</span>
          </motion.div>
        ))}

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.4, delay: 0.24 }}
          whileHover={{ y: -4 }}
          className="flex flex-col items-center rounded-2xl border border-border bg-surface px-4 py-6 text-center shadow-sm shadow-black/[0.02] transition-colors hover:border-accent/40"
        >
          <span className="text-3xl font-bold text-accent-dark sm:text-4xl">&lt;60s</span>
          <span className="mt-2 text-xs text-muted">To your first shortlist</span>
        </motion.div>
      </div>
    </section>
  );
}
