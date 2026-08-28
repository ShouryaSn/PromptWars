"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { RequestRow, RequestStatus, STATUS_LABEL } from "@/lib/requests";
import LoadingState from "@/components/LoadingState";

type OutboxRow = RequestRow & {
  developer_profiles: { title: string; profiles: { full_name: string | null } | null } | null;
};

type LoadState = "loading" | "ready" | "error";

const STATUS_STYLE: Record<RequestStatus, string> = {
  pending: "border-border bg-background text-muted",
  accepted: "border-accent/30 bg-accent-light text-accent-dark",
  rejected: "border-red-200 bg-red-50 text-red-700",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export default function RequestOutboxPage() {
  const supabase = createClient();
  const [state, setState] = useState<LoadState>("loading");
  const [rows, setRows] = useState<OutboxRow[]>([]);
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

      const { data, error: fetchError } = await supabase
        .from("requests")
        .select("*, developer_profiles(title, profiles(full_name))")
        .eq("seeker_id", user.id)
        .order("created_at", { ascending: false });

      if (cancelled) return;

      if (fetchError) {
        setError(fetchError.message);
        setState("error");
        return;
      }

      setRows((data as unknown as OutboxRow[]) ?? []);
      setState("ready");
    })();

    return () => {
      cancelled = true;
    };
  }, [supabase]);

  return (
    <main className="relative flex min-h-[calc(100vh-4rem)] flex-col items-center px-6 py-16">
      <div className="w-full max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="mb-8 flex flex-col items-center text-center"
        >
          <h1 className="max-w-xl text-3xl font-bold tracking-tight text-ink sm:text-4xl">Request Outbox</h1>
          <p className="mt-3 max-w-md text-balance text-muted">Requests you&apos;ve sent to developers.</p>
        </motion.div>

        {state === "loading" && <LoadingState />}
        {state === "error" && <p className="text-center text-sm text-red-600">{error}</p>}

        {state === "ready" && rows.length === 0 && (
          <p className="text-center text-sm text-muted">
            You haven&apos;t sent any requests yet. Find a developer in your match results and send one.
          </p>
        )}

        {state === "ready" && rows.length > 0 && (
          <div className="space-y-3">
            {rows.map((row, i) => (
              <motion.div
                key={row.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: i * 0.04 }}
                className="rounded-2xl border border-border bg-surface p-5 shadow-lg shadow-black/[0.04]"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink">{row.project_name}</p>
                    <p className="mt-0.5 text-xs text-muted">
                      To {row.developer_profiles?.profiles?.full_name || "a developer"}
                      {row.developer_profiles?.title ? ` — ${row.developer_profiles.title}` : ""}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-medium ${STATUS_STYLE[row.status]}`}
                  >
                    {STATUS_LABEL[row.status]}
                  </span>
                </div>
                <p className="mt-3 text-[11px] text-muted/70">Sent {formatDate(row.created_at)}</p>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
