"use client";

import { motion } from "framer-motion";
import BackgroundGlow from "@/components/BackgroundGlow";
import LoginForm from "@/components/LoginForm";

export default function WelcomePage() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center px-6 py-16">
      <BackgroundGlow />

      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="mb-10 flex flex-col items-center text-center"
      >
        <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-surface/80 px-3 py-1 text-xs font-medium text-white/60">
          <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse-slow" />
          AI Team Builder
        </span>
        <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-white sm:text-5xl">
          Describe your project.
          <br />
          Meet your dream team.
        </h1>
        <p className="mt-4 max-w-md text-balance text-white/50">
          Type a few sentences about what you&apos;re building — ProjectMatch matches you with the
          right people from our talent pool and tells you exactly why.
        </p>
      </motion.div>

      <LoginForm />
    </main>
  );
}
