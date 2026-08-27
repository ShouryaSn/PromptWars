"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const MAX_BYTES = 5 * 1024 * 1024;

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function AvatarUpload({
  userId,
  name,
  currentUrl,
  onUploaded,
}: {
  userId: string;
  name: string;
  currentUrl: string | null;
  onUploaded: (url: string) => void;
}) {
  const supabase = createClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(currentUrl);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("Image must be under 5MB.");
      return;
    }

    setError(null);
    setUploading(true);

    const ext = file.name.split(".").pop() || "jpg";
    const path = `${userId}/avatar.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true, cacheControl: "3600" });

    if (uploadError) {
      setError(uploadError.message);
      setUploading(false);
      return;
    }

    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    // Cache-bust: the storage path is stable across re-uploads, so without
    // this the browser (and other users' cached copies) would keep showing
    // the old image after an update.
    const bustUrl = `${data.publicUrl}?t=${Date.now()}`;
    setPreview(bustUrl);
    onUploaded(bustUrl);
    setUploading(false);
  }

  return (
    <div className="flex items-center gap-4">
      <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-accent-light text-xl font-semibold text-accent-dark ring-2 ring-border">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element -- user-uploaded image, no static import possible
          <img src={preview} alt={name} className="h-full w-full object-cover" />
        ) : (
          initials(name || "?")
        )}
      </div>
      <div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleFile}
          className="hidden"
        />
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="focus-ring rounded-lg border border-border bg-background px-3.5 py-2 text-sm font-medium text-ink transition-colors hover:border-accent/50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {uploading ? "Uploading…" : preview ? "Change photo" : "Upload photo"}
        </button>
        <p className="mt-1 text-[11px] text-muted/70">JPG or PNG, up to 5MB.</p>
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      </div>
    </div>
  );
}
