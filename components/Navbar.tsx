"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import Sidebar from "@/components/Sidebar";
import ChatDock from "@/components/ChatDock";
import type { User } from "@supabase/supabase-js";

export default function Navbar() {
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  return (
    <>
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

        <div className="flex items-center gap-4">
          <span className="hidden items-center gap-1.5 rounded-full border border-border bg-accent-light px-3 py-1 text-xs font-medium text-accent-dark sm:inline-flex">
            <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse-slow" />
            AI Team Builder
          </span>

          {user && (
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
              className="focus-ring flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted transition-colors hover:border-accent hover:text-ink"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M2 4H14M2 8H14M2 12H14"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          )}
        </div>
      </div>
      </motion.header>

      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <ChatDock />
    </>
  );
}
