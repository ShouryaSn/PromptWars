import { Candidate } from "./candidates";

export type Experience = "Junior" | "Mid" | "Senior" | "Lead";
export const EXPERIENCE_LEVELS: Experience[] = ["Junior", "Mid", "Senior", "Lead"];

export const AVAILABILITY_OPTIONS = ["full-time", "20hrs/wk", "10hrs/wk"] as const;
export type Availability = (typeof AVAILABILITY_OPTIONS)[number];

/** Row shape as stored in the `developer_profiles` table (snake_case). */
export type DeveloperProfileRow = {
  id: string;
  title: string;
  skills: string[];
  interests: string[];
  availability: string;
  experience: Experience;
  bio: string;
  location: string;
  email: string;
  phone: string | null;
  linkedin_handle: string | null;
  github_handle: string | null;
  avatar_url: string | null;
  opted_in: boolean;
  created_at: string;
  updated_at: string;
};

/** A single row from `match_impressions`. */
export type MatchImpressionRow = {
  id: string;
  developer_id: string;
  matched_at: string;
  match_score: number;
  was_top_pick: boolean;
  required_roles: string[];
  required_skills: string[];
};

/** Deterministic placeholder avatar so a developer without a photo still gets a face, not a blank circle. */
export function fallbackAvatarUrl(seed: string): string {
  return `https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(seed)}`;
}

/** Maps a real developer's profile row into the same shape the matching engine (and candidate detail page) already understands. */
export function developerToCandidate(fullName: string, dev: DeveloperProfileRow): Candidate {
  return {
    id: dev.id,
    name: fullName,
    role: dev.title,
    skills: dev.skills,
    interests: dev.interests,
    availability: dev.availability,
    experience: dev.experience,
    bio: dev.bio,
    avatarUrl: dev.avatar_url || fallbackAvatarUrl(dev.id),
    location: dev.location,
    email: dev.email,
    phone: dev.phone ?? "",
    linkedinHandle: dev.linkedin_handle ?? "",
    githubHandle: dev.github_handle ?? undefined,
  };
}
