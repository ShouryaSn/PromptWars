"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import TagInput from "@/components/TagInput";
import AvatarUpload from "@/components/AvatarUpload";
import { AVAILABILITY_OPTIONS, EXPERIENCE_LEVELS, Experience, DeveloperProfileRow } from "@/lib/developer";

export default function DeveloperProfileForm({
  mode,
  initial,
}: {
  mode: "create" | "edit";
  initial?: DeveloperProfileRow;
}) {
  const supabase = createClient();

  const [userId, setUserId] = useState<string | null>(null);
  const [name, setName] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);

  const [avatarUrl, setAvatarUrl] = useState<string | null>(initial?.avatar_url ?? null);
  const [title, setTitle] = useState(initial?.title ?? "");
  const [skills, setSkills] = useState<string[]>(initial?.skills ?? []);
  const [interests, setInterests] = useState<string[]>(initial?.interests ?? []);
  const [availability, setAvailability] = useState<string>(initial?.availability ?? AVAILABILITY_OPTIONS[0]);
  const [experience, setExperience] = useState<Experience>(initial?.experience ?? "Mid");
  const [bio, setBio] = useState(initial?.bio ?? "");
  const [location, setLocation] = useState(initial?.location ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [linkedinHandle, setLinkedinHandle] = useState(initial?.linkedin_handle ?? "");
  const [githubHandle, setGithubHandle] = useState(initial?.github_handle ?? "");

  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const fullName = data.user?.user_metadata?.full_name as string | undefined;
      setUserId(data.user?.id ?? null);
      setName(fullName ?? data.user?.email?.split("@")[0] ?? null);
      setEmail(data.user?.email ?? null);
    });
  }, [supabase]);

  const bioTooShort = bio.trim().length > 0 && bio.trim().length < 20;
  const isValid =
    title.trim().length >= 2 &&
    skills.length >= 1 &&
    bio.trim().length >= 20 &&
    location.trim().length >= 2;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    setError(null);
    setSaved(false);
    if (!isValid || !userId) return;

    setSubmitting(true);

    const payload = {
      title: title.trim(),
      skills,
      interests,
      availability,
      experience,
      bio: bio.trim(),
      location: location.trim(),
      phone: phone.trim() || null,
      linkedin_handle: linkedinHandle.trim() || null,
      github_handle: githubHandle.trim() || null,
      avatar_url: avatarUrl,
    };

    const { error: saveError } =
      mode === "create"
        ? await supabase.from("developer_profiles").insert({ id: userId, email, ...payload })
        : await supabase.from("developer_profiles").update(payload).eq("id", userId);

    setSubmitting(false);

    if (saveError) {
      setError(saveError.message);
      return;
    }

    if (mode === "create") {
      window.location.href = "/developer/dashboard";
      return;
    }

    setSaved(true);
  }

  return (
    <main className="relative flex min-h-[calc(100vh-4rem)] flex-col items-center px-6 py-16">
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="mb-8 flex flex-col items-center text-center"
      >
        <h1 className="max-w-xl text-3xl font-bold tracking-tight text-ink sm:text-4xl">
          {mode === "create" ? "Set up your developer profile" : "Edit your developer profile"}
        </h1>
        <p className="mt-3 max-w-md text-balance text-muted">
          This is what seekers see when you&apos;re matched to their project. Fill it in like your
          best professional bio.
        </p>
      </motion.div>

      <motion.form
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-2xl rounded-2xl border border-border bg-surface p-6 shadow-xl shadow-black/[0.04] sm:p-8"
      >
        <div className="mb-6 flex items-center justify-between gap-4 rounded-lg border border-border bg-background px-4 py-3">
          {userId ? (
            <AvatarUpload userId={userId} name={name ?? "?"} currentUrl={avatarUrl} onUploaded={setAvatarUrl} />
          ) : (
            <div className="h-20 w-20 shrink-0 animate-pulse rounded-full bg-accent-light" />
          )}
          <div className="min-w-0 text-right">
            <p className="truncate text-sm font-medium text-ink">{name ?? "Loading…"}</p>
            <p className="truncate text-xs text-muted">{email ?? ""}</p>
          </div>
        </div>

        <div className="space-y-5">
          <div>
            <label htmlFor="title" className="mb-1.5 block text-xs font-medium text-muted">
              Role / title
            </label>
            <input
              id="title"
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Full-Stack Engineer"
              className="focus-ring w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-ink placeholder:text-muted/60 transition-colors focus:border-accent"
            />
          </div>

          <TagInput
            id="skills"
            label="Skills"
            placeholder="React, PostgreSQL, TypeScript…"
            values={skills}
            onChange={setSkills}
            disabled={submitting}
          />

          <TagInput
            id="interests"
            label="Interests (optional)"
            placeholder="fintech, open source…"
            values={interests}
            onChange={setInterests}
            disabled={submitting}
          />

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="availability" className="mb-1.5 block text-xs font-medium text-muted">
                Availability
              </label>
              <select
                id="availability"
                value={availability}
                onChange={(e) => setAvailability(e.target.value)}
                className="focus-ring w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-ink transition-colors focus:border-accent"
              >
                {AVAILABILITY_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="experience" className="mb-1.5 block text-xs font-medium text-muted">
                Experience level
              </label>
              <select
                id="experience"
                value={experience}
                onChange={(e) => setExperience(e.target.value as Experience)}
                className="focus-ring w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-ink transition-colors focus:border-accent"
              >
                {EXPERIENCE_LEVELS.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="bio" className="mb-1.5 block text-xs font-medium text-muted">
              Bio
            </label>
            <textarea
              id="bio"
              rows={4}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="What you build, how you work, what you're proud of…"
              className="focus-ring w-full resize-none rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-ink placeholder:text-muted/60 transition-colors focus:border-accent"
            />
            {touched && bioTooShort && (
              <p className="mt-1 text-xs text-red-600">Give a bit more detail (20+ characters).</p>
            )}
          </div>

          <div>
            <label htmlFor="location" className="mb-1.5 block text-xs font-medium text-muted">
              Location
            </label>
            <input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Austin, TX"
              className="focus-ring w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-ink placeholder:text-muted/60 transition-colors focus:border-accent"
            />
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            <div>
              <label htmlFor="phone" className="mb-1.5 block text-xs font-medium text-muted">
                Phone (optional)
              </label>
              <input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 000-0000"
                className="focus-ring w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-ink placeholder:text-muted/60 transition-colors focus:border-accent"
              />
            </div>
            <div>
              <label htmlFor="linkedin" className="mb-1.5 block text-xs font-medium text-muted">
                LinkedIn (optional)
              </label>
              <input
                id="linkedin"
                value={linkedinHandle}
                onChange={(e) => setLinkedinHandle(e.target.value)}
                placeholder="handle"
                className="focus-ring w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-ink placeholder:text-muted/60 transition-colors focus:border-accent"
              />
            </div>
            <div>
              <label htmlFor="github" className="mb-1.5 block text-xs font-medium text-muted">
                GitHub (optional)
              </label>
              <input
                id="github"
                value={githubHandle}
                onChange={(e) => setGithubHandle(e.target.value)}
                placeholder="handle"
                className="focus-ring w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-ink placeholder:text-muted/60 transition-colors focus:border-accent"
              />
            </div>
          </div>
        </div>

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
        {saved && <p className="mt-4 text-sm text-accent-dark">Saved.</p>}

        <motion.button
          type="submit"
          disabled={submitting}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          className="focus-ring mt-6 w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Saving…" : mode === "create" ? "Create profile" : "Save changes"}
        </motion.button>
      </motion.form>
    </main>
  );
}
