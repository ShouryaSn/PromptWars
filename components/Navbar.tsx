"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export default function Navbar() {
  return (
    <motion.header
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="sticky top-0 z-20 w-full border-b border-border bg-surface/90 backdrop-blur"
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-accent text-sm font-bold text-white">
            P
          </span>
          <span className="text-lg font-bold tracking-tight text-ink">
            project<span className="text-accent">match</span>
          </span>
        </Link>

        <span className="hidden items-center gap-1.5 rounded-full border border-border bg-accent-light px-3 py-1 text-xs font-medium text-accent-dark sm:inline-flex">
          <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse-slow" />
          AI Team Builder
        </span>
      </div>
    </motion.header>
  );
}
