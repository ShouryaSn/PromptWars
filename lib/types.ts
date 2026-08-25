export type TeamMember = {
  id: string;
  name: string;
  role: string;
  bio: string;
  availability: string;
  experience: string;
  skills: string[];
  matchedSkills: string[];
  /** false when matchedSkills is just a generic sample of this person's skills (no real overlap found), not an actual match. */
  skillsMatched: boolean;
  matchScore: number;
  rationale: string;
  avatarUrl: string;
};

export type MatchResponse = {
  requiredRoles: string[];
  requiredSkills: string[];
  projectSummary: string;
  teamSummary: string;
  team: TeamMember[];
  /** "ai" = live Gemini result. "fallback" = local keyword-overlap match, used when the AI call failed. */
  mode: "ai" | "fallback";
  /** Human-readable reason shown in the UI when mode is "fallback". */
  fallbackNote?: string;
};

export type MatchError = {
  error: string;
};
