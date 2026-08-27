"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { RequestRow, RequestStatus, STATUS_LABEL } from "@/lib/requests";

type InboxRow = RequestRow & { profiles: { full_name: string | null } | null };

type LoadState = "loading" | "ready" | "error";

const STATUS_STYLE: Record<RequestStatus, string> = {
  pending: "border-border bg-background text-muted",
  accepted: "border-accent/30 bg-accent-light text-accent-dark",
  rejected: "border-red-200 bg-red-50 text-red-700",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export default function RequestInboxPage() {
  const supabase = createClient();
  const [state, setState] = useState<LoadState>("loading");
  const [rows, setRows] = useState<InboxRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [respondingId, setRespondingId] = useState<string | null>(null);

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
        .select("*, profiles(full_name)")
        .eq("developer_id", user.id)
        .order("created_at", { ascending: false });

      if (cancelled) return;

      if (fetchError) {
        setError(fetchError.message);
        setState("error");
        return;
      }

      setRows((data as unknown as InboxRow[]) ?? []);
      setState("ready");
    })();

    return () => {
      cancelled = true;
    };
  }, [supabase]);

  async function respond(id: string, status: "accepted" | "rejected") {
    setRespondingId(id);
    const { error: updateError } = await supabase.from("requests").update({ status }).eq("id", id);
    setRespondingId(null);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
  }

  return (
    <main className="relative flex min-h-[calc(100vh-4rem)] flex-col items-center px-6 py-16">
      <div className="w-full max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="mb-8 flex flex-col items-center text-center"
        >
          <h1 className="max-w-xl text-3xl font-bold tracking-tight text-ink sm:text-4xl">Request Inbox</h1>
          <p className="mt-3 max-w-md text-balance text-muted">Requests seekers have sent you.</p>
        </motion.div>

        {state === "loading" && <p className="text-center text-sm text-muted">Loading…</p>}
        {state === "error" && <p className="text-center text-sm text-red-600">{error}</p>}

        {state === "ready" && rows.length === 0 && (
          <p className="text-center text-sm text-muted">No requests yet.</p>
        )}

        {state === "ready" && rows.length > 0 && (
          <div className="space-y-3">
            {rows.map((row, i) => {
              const expanded = expandedId === row.id;
              return (
                <motion.div
                  key={row.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: i * 0.04 }}
                  className="overflow-hidden rounded-2xl border border-border bg-surface shadow-lg shadow-black/[0.04]"
                >
                  <button
                    type="button"
                    onClick={() => setExpandedId(expanded ? null : row.id)}
                    className="focus-ring flex w-full items-start justify-between gap-2 p-5 text-left"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-ink">{row.project_name}</p>
                      <p className="mt-0.5 text-xs text-muted">
                        From {row.profiles?.full_name || "a seeker"} · {formatDate(row.created_at)}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-medium ${STATUS_STYLE[row.status]}`}
                    >
                      {STATUS_LABEL[row.status]}
                    </span>
                  </button>

                  <AnimatePresence>
                    {expanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden border-t border-border"
                      >
                        <div className="space-y-3 p-5 text-sm">
                          <p className="leading-relaxed text-ink/80">{row.project_description}</p>

                          <dl className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-3">
                            <div>
                              <dt className="text-muted">Paid</dt>
                              <dd className="text-ink">{row.is_paid ? "Yes" : "No"}</dd>
                            </div>
                            {row.is_paid && (
                              <>
                                <div>
                                  <dt className="text-muted">Mode</dt>
                                  <dd className="text-ink">{row.payment_mode}</dd>
                                </div>
                                <div>
                                  <dt className="text-muted">Timing</dt>
                                  <dd className="text-ink">{row.payment_timing}</dd>
                                </div>
                              </>
                            )}
                            <div>
                              <dt className="text-muted">Work type</dt>
                              <dd className="text-ink">{row.work_type}</dd>
                            </div>
                            <div>
                              <dt className="text-muted">Deadline</dt>
                              <dd className="text-ink">{row.deadline ? formatDate(row.deadline) : "None given"}</dd>
                            </div>
                          </dl>

                          {row.status === "pending" && (
                            <div className="flex gap-2 pt-1">
                              <button
                                type="button"
                                disabled={respondingId === row.id}
                                onClick={() => respond(row.id, "accepted")}
                                className="focus-ring flex-1 rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                Accept
                              </button>
                              <button
                                type="button"
                                disabled={respondingId === row.id}
                                onClick={() => respond(row.id, "rejected")}
                                className="focus-ring flex-1 rounded-lg border border-border px-4 py-2 text-xs font-medium text-muted transition-colors hover:border-red-300 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                Decline
                              </button>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        )}

        {error && state === "ready" && <p className="mt-4 text-center text-sm text-red-600">{error}</p>}
      </div>
    </main>
  );
}
