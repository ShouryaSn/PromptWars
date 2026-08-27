"use client";

import { useState } from "react";

export default function TagInput({
  id,
  label,
  placeholder,
  values,
  onChange,
  disabled,
}: {
  id: string;
  label: string;
  placeholder: string;
  values: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
}) {
  const [draft, setDraft] = useState("");

  function commit() {
    const tag = draft.trim();
    if (!tag) return;
    if (!values.some((v) => v.toLowerCase() === tag.toLowerCase())) {
      onChange([...values, tag]);
    }
    setDraft("");
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      commit();
    } else if (e.key === "Backspace" && draft === "" && values.length > 0) {
      onChange(values.slice(0, -1));
    }
  }

  function removeAt(index: number) {
    onChange(values.filter((_, i) => i !== index));
  }

  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-xs font-medium text-muted">
        {label}
      </label>
      <div className="focus-within:border-accent flex min-h-[2.75rem] w-full flex-wrap items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2 transition-colors">
        {values.map((tag, i) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-full border border-border bg-surface px-2.5 py-1 text-xs font-medium text-ink"
          >
            {tag}
            <button
              type="button"
              disabled={disabled}
              onClick={() => removeAt(i)}
              aria-label={`Remove ${tag}`}
              className="text-muted transition-colors hover:text-red-600"
            >
              ×
            </button>
          </span>
        ))}
        <input
          id={id}
          value={draft}
          disabled={disabled}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={commit}
          placeholder={values.length === 0 ? placeholder : ""}
          className="min-w-[8rem] flex-1 bg-transparent text-sm text-ink placeholder:text-muted/60 focus:outline-none"
        />
      </div>
      <p className="mt-1 text-[11px] text-muted/70">Press Enter or comma to add.</p>
    </div>
  );
}
