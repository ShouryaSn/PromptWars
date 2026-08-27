"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import ProjectForm from "@/components/ProjectForm";
import LoadingSequence from "@/components/LoadingSequence";
import TeamResults from "@/components/TeamResults";
import ErrorState from "@/components/ErrorState";
import { MatchResponse } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";

type Status = "idle" | "loading" | "success" | "error";

const MIN_LOADING_MS = 2200;

export default function MatchPage() {
  const [name, setName] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<MatchResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastProjectName, setLastProjectName] = useState<string>("");
  const [lastDescription, setLastDescription] = useState<string>("");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      const fullName = data.user?.user_metadata?.full_name as string | undefined;
      setName(fullName ?? data.user?.email?.split("@")[0] ?? null);
    });

    const storedResult = sessionStorage.getItem("projectmatch:result");
    if (storedResult) {
      try {
        setResult(JSON.parse(storedResult) as MatchResponse);
        setLastProjectName(sessionStorage.getItem("projectmatch:lastProjectName") ?? "");
        setLastDescription(sessionStorage.getItem("projectmatch:lastDescription") ?? "");
        setStatus("success");
      } catch {
        sessionStorage.removeItem("projectmatch:result");
      }
    }
  }, []);

  async function handleSubmit(projectName: string, description: string) {
    setLastProjectName(projectName);
    setLastDescription(description);
    setStatus("loading");
    setError(null);

    const started = Date.now();

    try {
      const res = await fetch("/api/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectName, description }),
      });

      const data = await res.json();

      const elapsed = Date.now() - started;
      if (elapsed < MIN_LOADING_MS) {
        await new Promise((r) => setTimeout(r, MIN_LOADING_MS - elapsed));
      }

      if (!res.ok) {
        setError(data?.error ?? "Something went wrong. Please try again.");
        setStatus("error");
        return;
      }

      setResult(data as MatchResponse);
      setStatus("success");
      sessionStorage.setItem("projectmatch:result", JSON.stringify(data));
      sessionStorage.setItem("projectmatch:lastProjectName", projectName);
      sessionStorage.setItem("projectmatch:lastDescription", description);
    } catch {
      const elapsed = Date.now() - started;
      if (elapsed < MIN_LOADING_MS) {
        await new Promise((r) => setTimeout(r, MIN_LOADING_MS - elapsed));
      }
      setError("Couldn't reach the matching service. Check your connection and try again.");
      setStatus("error");
    }
  }

  function handleReset() {
    setStatus("idle");
    setResult(null);
    setError(null);
    setLastProjectName("");
    setLastDescription("");
    sessionStorage.removeItem("projectmatch:result");
    sessionStorage.removeItem("projectmatch:lastProjectName");
    sessionStorage.removeItem("projectmatch:lastDescription");
  }

  function handleRetry() {
    if (lastDescription) {
      handleSubmit(lastProjectName, lastDescription);
    } else {
      handleReset();
    }
  }

  return (
    <main className="relative flex min-h-screen flex-col items-center px-6 py-16">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-10 flex flex-col items-center text-center"
      >
        <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-accent-light px-3 py-1 text-xs font-semibold text-accent-dark">
          <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse-slow" />
          {name ? `Welcome, ${name}` : "Welcome"}
        </span>
        <h1 className="max-w-xl text-3xl font-bold tracking-tight text-ink sm:text-4xl">
          Describe your project. Meet your dream team.
        </h1>
      </motion.div>

      <div className="flex w-full flex-1 flex-col items-center justify-start">
        <AnimatePresence mode="wait">
          {status === "idle" && (
            <motion.div
              key="form"
              exit={{ opacity: 0, y: -12 }}
              className="flex w-full flex-col items-center"
            >
              <ProjectForm onSubmit={handleSubmit} />
            </motion.div>
          )}

          {status === "loading" && (
            <motion.div key="loading" exit={{ opacity: 0 }} className="flex w-full flex-col items-center">
              <LoadingSequence />
            </motion.div>
          )}

          {status === "success" && result && (
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex w-full flex-col items-center"
            >
              <TeamResults result={result} onReset={handleReset} />
            </motion.div>
          )}

          {status === "error" && (
            <motion.div key="error" exit={{ opacity: 0 }} className="flex w-full flex-col items-center">
              <ErrorState message={error ?? "Something went wrong."} onRetry={handleRetry} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
