"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { candidates, Candidate } from "@/lib/candidates";
import { createClient } from "@/lib/supabase/client";
import { developerToCandidate, DeveloperProfileRow } from "@/lib/developer";
import RequestModal from "@/components/RequestModal";
import LoadingState from "@/components/LoadingState";

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function CandidateProfilePage({ params }: { params: { id: string } }) {
  const mockCandidate = candidates.find((c) => c.id === params.id);
  const [realCandidate, setRealCandidate] = useState<Candidate | null>(null);
  const [lookupDone, setLookupDone] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [requestOpen, setRequestOpen] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    if (mockCandidate) return;

    let cancelled = false;
    const supabase = createClient();

    supabase
      .from("developer_profiles")
      .select("*, profiles(full_name)")
      .eq("id", params.id)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        const row = data as (DeveloperProfileRow & { profiles: { full_name: string | null } | null }) | null;
        if (row) {
          setRealCandidate(developerToCandidate(row.profiles?.full_name || "Developer", row));
        }
        setLookupDone(true);
      });

    supabase.auth.getUser().then(({ data }) => {
      if (!cancelled) setCurrentUserId(data.user?.id ?? null);
    });

    return () => {
      cancelled = true;
    };
  }, [mockCandidate, params.id]);

  const candidate = mockCandidate ?? realCandidate;

  if (!candidate) {
    if (!lookupDone) {
      return (
        <main className="relative flex min-h-screen flex-col items-center justify-center px-6 py-16">
          <LoadingState label="Loading profile…" />
        </main>
      );
    }
    return (
      <main className="relative flex min-h-screen flex-col items-center justify-center px-6 py-16">
        <p className="text-lg font-semibold text-ink">Candidate not found.</p>
        <Link
          href="/match"
          className="focus-ring mt-4 rounded-lg border border-border bg-surface px-5 py-2 text-sm font-medium text-muted transition-colors hover:border-accent/50 hover:text-ink"
        >
          Back to results
        </Link>
      </main>
    );
  }

  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(candidate!.email);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard unavailable — no-op
    }
  }

  return (
    <main className="relative flex min-h-screen flex-col items-center px-6 py-12">
      <div className="w-full max-w-3xl">
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
          <Link
            href="/match"
            className="focus-ring inline-flex items-center gap-1.5 text-sm font-medium text-muted transition-colors hover:text-accent-dark"
          >
            ← Back to results
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
          className="mt-6 overflow-hidden rounded-2xl border border-border bg-surface shadow-lg shadow-black/[0.04]"
        >
          <div className="flex flex-col gap-6 p-6 sm:flex-row sm:items-start sm:p-8">
            <div className="h-24 w-24 shrink-0 overflow-hidden rounded-full bg-accent-light ring-4 ring-accent-light sm:h-28 sm:w-28">
              {!imgFailed ? (
                // eslint-disable-next-line @next/next/no-img-element -- hotlinked external mock avatar, needs runtime onError fallback
                <img
                  src={candidate.avatarUrl}
                  alt={candidate.name}
                  onError={() => setImgFailed(true)}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-2xl font-semibold text-accent-dark">
                  {initials(candidate.name)}
                </div>
              )}
            </div>

            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold text-ink">{candidate.name}</h1>
                <span className="rounded-full border border-border bg-background px-2.5 py-0.5 text-xs font-medium text-muted">
                  {candidate.experience}
                </span>
              </div>
              <p className="mt-1 text-base text-muted">{candidate.role}</p>

              <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-muted">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse-slow" />
                  {candidate.availability}
                </span>
                <span>·</span>
                <span>{candidate.location}</span>
              </div>

              <p className="mt-4 max-w-xl text-sm leading-relaxed text-ink/80">{candidate.bio}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-0 border-t border-border sm:grid-cols-5">
            <div className="col-span-3 space-y-6 p-6 sm:p-8">
              <section>
                <h2 className="text-sm font-semibold text-ink">Skills</h2>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {candidate.skills.map((skill) => (
                    <span
                      key={skill}
                      className="rounded-full border border-border bg-background px-2.5 py-1 text-xs font-medium text-ink"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </section>

              <section>
                <h2 className="text-sm font-semibold text-ink">Interests</h2>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {candidate.interests.map((interest) => (
                    <span
                      key={interest}
                      className="rounded-full border border-accent/30 bg-accent-light px-2.5 py-1 text-xs font-medium text-accent-dark"
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              </section>
            </div>

            <div className="col-span-2 space-y-4 border-t border-border p-6 sm:border-l sm:border-t-0 sm:p-8">
              <h2 className="text-sm font-semibold text-ink">Contact information</h2>
              <p className="text-xs text-muted/80">
                {mockCandidate
                  ? "Mock profile — these details are placeholders for demo purposes only."
                  : "Real developer profile."}
              </p>

              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-xs text-muted">Email</dt>
                  <dd className="flex items-center gap-2">
                    <span className="text-ink">{candidate.email}</span>
                    <button
                      onClick={copyEmail}
                      className="focus-ring rounded border border-border px-1.5 py-0.5 text-[10px] font-medium text-muted transition-colors hover:border-accent/50 hover:text-accent-dark"
                    >
                      {copied ? "Copied" : "Copy"}
                    </button>
                  </dd>
                </div>
                {candidate.phone && (
                  <div>
                    <dt className="text-xs text-muted">Phone</dt>
                    <dd className="text-ink">{candidate.phone}</dd>
                  </div>
                )}
                <div>
                  <dt className="text-xs text-muted">Location</dt>
                  <dd className="text-ink">{candidate.location}</dd>
                </div>
                {candidate.linkedinHandle && (
                  <div>
                    <dt className="text-xs text-muted">LinkedIn</dt>
                    <dd className="text-ink">@{candidate.linkedinHandle}</dd>
                  </div>
                )}
                {candidate.githubHandle && (
                  <div>
                    <dt className="text-xs text-muted">GitHub</dt>
                    <dd className="text-ink">@{candidate.githubHandle}</dd>
                  </div>
                )}
              </dl>

              {mockCandidate ? (
                <motion.button
                  whileHover={{ scale: 1.015 }}
                  whileTap={{ scale: 0.985 }}
                  onClick={copyEmail}
                  className="focus-ring mt-2 w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-dark"
                >
                  Contact {candidate.name.split(" ")[0]}
                </motion.button>
              ) : currentUserId === candidate.id ? (
                <p className="mt-2 text-center text-xs text-muted">This is your own developer profile.</p>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.015 }}
                  whileTap={{ scale: 0.985 }}
                  onClick={() => setRequestOpen(true)}
                  className="focus-ring mt-2 w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-dark"
                >
                  Send a Request
                </motion.button>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {requestOpen && !mockCandidate && (
        <RequestModal
          developerId={candidate.id}
          developerName={candidate.name}
          onClose={() => setRequestOpen(false)}
        />
      )}
    </main>
  );
}
