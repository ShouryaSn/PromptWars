"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import type { DeveloperProfileRow, MatchImpressionRow } from "@/lib/developer";
import LoadingState from "@/components/LoadingState";

type LoadState = "loading" | "ready" | "error";

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function frequencyRank(lists: string[][]): { term: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const list of lists) {
    for (const term of list) {
      const key = term.trim();
      if (!key) continue;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }
  return Array.from(counts.entries())
    .map(([term, count]) => ({ term, count }))
    .sort((a, b) => b.count - a.count || a.term.localeCompare(b.term));
}

export default function DeveloperDashboardPage() {
  const supabase = createClient();

  const [state, setState] = useState<LoadState>("loading");
  const [name, setName] = useState<string>("");
  const [profile, setProfile] = useState<DeveloperProfileRow | null>(null);
  const [impressions, setImpressions] = useState<MatchImpressionRow[]>([]);
  const [optedIn, setOptedIn] = useState(true);
  const [togglePending, setTogglePending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        if (!cancelled) {
          setError("Your session expired. Please log in again.");
          setState("error");
        }
        return;
      }

      const fullName = (user.user_metadata?.full_name as string | undefined) ?? user.email?.split("@")[0] ?? "";

      const [{ data: devProfile, error: profileError }, { data: impressionRows, error: impressionsError }] =
        await Promise.all([
          supabase.from("developer_profiles").select("*").eq("id", user.id).single(),
          supabase
            .from("match_impressions")
            .select("*")
            .eq("developer_id", user.id)
            .order("matched_at", { ascending: false }),
        ]);

      if (cancelled) return;

      if (profileError || !devProfile) {
        setError("Couldn't load your profile.");
        setState("error");
        return;
      }

      setName(fullName);
      setProfile(devProfile as DeveloperProfileRow);
      setOptedIn((devProfile as DeveloperProfileRow).opted_in);
      setImpressions((impressionRows as MatchImpressionRow[] | null) ?? []);
      if (impressionsError) {
        console.warn("Couldn't load match impressions:", impressionsError.message);
      }
      setState("ready");
    })();

    return () => {
      cancelled = true;
    };
  }, [supabase]);

  const topPickCount = useMemo(() => impressions.filter((i) => i.was_top_pick).length, [impressions]);

  const skillTerms = useMemo(
    () => frequencyRank(impressions.map((i) => i.required_skills)).slice(0, 16),
    [impressions]
  );
  const roleTerms = useMemo(
    () => frequencyRank(impressions.map((i) => i.required_roles)).slice(0, 12),
    [impressions]
  );

  async function toggleOptIn() {
    if (!profile) return;
    setTogglePending(true);
    const next = !optedIn;

    const { error: updateError } = await supabase
      .from("developer_profiles")
      .update({ opted_in: next })
      .eq("id", profile.id);

    setTogglePending(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    setError(null);
    setOptedIn(next);
  }

  if (state === "loading") {
    return (
      <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-6">
        <LoadingState label="Loading your dashboard…" />
      </main>
    );
  }

  if (state === "error" || !profile) {
    return (
      <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-6">
        <p className="text-sm text-red-600">{error ?? "Something went wrong."}</p>
      </main>
    );
  }

  return (
    <main className="relative flex min-h-[calc(100vh-4rem)] flex-col items-center px-6 py-16">
      <div className="w-full max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="mb-8 flex flex-col items-center text-center"
        >
          <h1 className="max-w-xl text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            Your developer dashboard
          </h1>
          <p className="mt-3 max-w-md text-balance text-muted">
            How your profile is performing in the match pool.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
          className="mb-6 flex items-center gap-4 rounded-2xl border border-border bg-surface p-5 shadow-lg shadow-black/[0.04]"
        >
          <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-accent-light text-lg font-semibold text-accent-dark">
            {profile.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element -- generated avatar, no runtime fallback needed
              <img src={profile.avatar_url} alt={name} className="h-full w-full object-cover" />
            ) : (
              initials(name || "?")
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-base font-semibold text-ink">{name}</p>
            <p className="truncate text-sm text-muted">{profile.title}</p>
          </div>
          <Link
            href="/developer/edit"
            className="focus-ring shrink-0 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:border-accent/50 hover:text-ink"
          >
            Edit profile
          </Link>
          <span
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${
              optedIn
                ? "border-accent/30 bg-accent-light text-accent-dark"
                : "border-border bg-background text-muted"
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${optedIn ? "bg-accent animate-pulse-slow" : "bg-muted"}`} />
            {optedIn ? "Visible in match pool" : "Opted out"}
          </span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.14, ease: [0.16, 1, 0.3, 1] }}
          className="mb-6 grid grid-cols-2 gap-4"
        >
          <div className="rounded-2xl border border-border bg-surface p-5 text-center shadow-lg shadow-black/[0.04]">
            <p className="text-3xl font-bold text-ink">{impressions.length}</p>
            <p className="mt-1 text-xs font-medium text-muted">Times suggested</p>
          </div>
          <div className="rounded-2xl border border-border bg-surface p-5 text-center shadow-lg shadow-black/[0.04]">
            <p className="text-3xl font-bold text-ink">{topPickCount}</p>
            <p className="mt-1 text-xs font-medium text-muted">Times as best match</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="mb-6 rounded-2xl border border-border bg-surface p-6 shadow-lg shadow-black/[0.04] sm:p-8"
        >
          {impressions.length === 0 ? (
            <p className="text-sm text-muted">
              Not suggested to any seeker yet. Once a project&apos;s needs line up with your skills, it&apos;ll show
              up here.
            </p>
          ) : (
            <div className="space-y-6">
              <section>
                <h2 className="text-sm font-semibold text-ink">Skills you&apos;ve been matched for</h2>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {skillTerms.map(({ term, count }) => (
                    <span
                      key={term}
                      className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2.5 py-1 text-xs font-medium text-ink"
                    >
                      {term}
                      <span className="text-muted">×{count}</span>
                    </span>
                  ))}
                </div>
              </section>

              {roleTerms.length > 0 && (
                <section>
                  <h2 className="text-sm font-semibold text-ink">Roles you&apos;ve been matched for</h2>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {roleTerms.map(({ term, count }) => (
                      <span
                        key={term}
                        className="inline-flex items-center gap-1 rounded-full border border-accent/30 bg-accent-light px-2.5 py-1 text-xs font-medium text-accent-dark"
                      >
                        {term}
                        <span className="text-accent-dark/70">×{count}</span>
                      </span>
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.26, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-border bg-surface p-6 shadow-lg shadow-black/[0.04] sm:flex-row sm:items-center sm:p-8"
        >
          <div>
            <h2 className="text-sm font-semibold text-ink">Match pool visibility</h2>
            <p className="mt-1 max-w-sm text-sm text-muted">
              {optedIn
                ? "You can be suggested to seekers whose projects fit your skills. Opt out any time — for example if you're already committed elsewhere."
                : "You won't be suggested to any seeker until you opt back in."}
            </p>
          </div>
          <motion.button
            type="button"
            onClick={toggleOptIn}
            disabled={togglePending}
            whileHover={{ scale: 1.015 }}
            whileTap={{ scale: 0.985 }}
            className={`focus-ring shrink-0 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
              optedIn
                ? "border border-border text-muted hover:border-red-300 hover:text-red-600"
                : "bg-accent text-white hover:bg-accent-dark"
            }`}
          >
            {togglePending ? "Saving…" : optedIn ? "Opt out of match pool" : "Opt back in"}
          </motion.button>
        </motion.div>

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      </div>
    </main>
  );
}
