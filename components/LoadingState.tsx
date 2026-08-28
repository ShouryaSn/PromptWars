"use client";

import Spinner from "@/components/Spinner";

export default function LoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-12" role="status" aria-live="polite">
      <Spinner />
      <p className="text-sm text-muted">{label}</p>
    </div>
  );
}
