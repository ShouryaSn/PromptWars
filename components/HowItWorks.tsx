"use client";

import { motion } from "framer-motion";

const STEPS = [
  {
    icon: "📝",
    title: "Describe your project",
    body: "Tell us what you're building in plain English — no forms, no dropdowns, no keyword-stuffing required.",
  },
  {
    icon: "🧠",
    title: "AI reads between the lines",
    body: "Our matching engine runs two passes: first it extracts the roles and skills your project actually needs, then it ranks every professional in the network against that spec.",
  },
  {
    icon: "🤝",
    title: "Meet your dream team",
    body: "Get a ranked shortlist with a plain-English reason for every pick, view full profiles, and reach out to get moving.",
  },
];

export default function HowItWorks() {
  return (
    <section className="w-full max-w-5xl py-20">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.5 }}
        className="mb-12 flex flex-col items-center text-center"
      >
        <span className="mb-3 text-xs font-semibold uppercase tracking-wide text-accent-dark">How it works</span>
        <h2 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">From idea to team in three steps</h2>
      </motion.div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        {STEPS.map((step, i) => (
          <motion.div
            key={step.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.45, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
            whileHover={{ y: -6 }}
            className="group flex flex-col rounded-2xl border border-border bg-surface p-6 shadow-md shadow-black/[0.03] transition-colors hover:border-accent/40"
          >
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-accent-light text-xl transition-transform duration-300 group-hover:scale-110">
              {step.icon}
            </div>
            <div className="mb-1 flex items-center gap-2">
              <span className="text-xs font-semibold text-accent-dark">Step {i + 1}</span>
            </div>
            <h3 className="font-semibold text-ink">{step.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">{step.body}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
