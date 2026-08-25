"use client";

import { useState } from "react";
import { candidates, Candidate } from "@/lib/candidates";

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

// Every other candidate keeps this deterministic (no client/server hydration
// mismatch from randomizing) while still mixing in people added later in
// the pool, so the strip reads as varied without needing real shuffling.
const marqueeCandidates = candidates.filter((_, i) => i % 2 === 0);
const track = [...marqueeCandidates, ...marqueeCandidates];

function MarqueeAvatar({ candidate, copyIndex }: { candidate: Candidate; copyIndex: number }) {
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <div key={`${candidate.id}-${copyIndex}`} className="group/avatar relative shrink-0">
      <div className="h-12 w-12 overflow-hidden rounded-full border-2 border-white bg-accent-light shadow-sm ring-1 ring-border transition-transform duration-200 group-hover/avatar:scale-110">
        {!imgFailed ? (
          // eslint-disable-next-line @next/next/no-img-element -- hotlinked external mock avatar, needs runtime onError fallback
          <img
            src={candidate.avatarUrl}
            alt={candidate.name}
            onError={() => setImgFailed(true)}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-accent-dark">
            {initials(candidate.name)}
          </div>
        )}
      </div>

      <div className="pointer-events-none absolute left-1/2 top-full z-10 mt-2 -translate-x-1/2 whitespace-nowrap rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs opacity-0 shadow-md transition-opacity duration-200 group-hover/avatar:opacity-100">
        <span className="block font-semibold text-ink">{candidate.name}</span>
        <span className="block text-muted">{candidate.role}</span>
      </div>
    </div>
  );
}

export default function AvatarMarquee() {
  return (
    <section className="w-full overflow-x-clip py-10">
      <p className="mb-4 text-center text-xs font-semibold uppercase tracking-wide text-muted/70">
        Some of the people in the network
      </p>
      <div className="flex w-max animate-marquee gap-4 hover:[animation-play-state:paused]">
        {track.map((candidate, i) => (
          <MarqueeAvatar key={`${candidate.id}-${i}`} candidate={candidate} copyIndex={i} />
        ))}
      </div>
    </section>
  );
}
