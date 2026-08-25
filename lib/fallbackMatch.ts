import { Candidate } from "./candidates";
import { MatchResponse, TeamMember } from "./types";

function escapeRegex(term: string): string {
  return term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Case-insensitive "does description mention this term" check, using a
 * word-boundary regex rather than plain substring matching. Plain
 * `.includes()` produces real false positives even for longer terms —
 * e.g. "Unity" (the game engine) matching inside "community" — so every
 * term is boundary-checked, not just short ones.
 */
function mentions(description: string, term: string): boolean {
  const t = term.trim();
  if (!t) return false;
  const re = new RegExp(`(^|[^a-z0-9])${escapeRegex(t.toLowerCase())}($|[^a-z0-9])`, "i");
  return re.test(description);
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

/**
 * Pure, local, non-AI fallback used when the Gemini calls fail (quota
 * exhaustion or any other error). Ranks the fixed candidate pool by simple
 * skill/interest keyword overlap with the free-text description so a live
 * demo never dead-ends on an API failure. Deterministic and free — no
 * network calls, no API key required.
 */
export function heuristicMatch(description: string, candidates: Candidate[]): MatchResponse {
  const allSkills = Array.from(new Set(candidates.flatMap((c) => c.skills)));
  const requiredSkills = allSkills.filter((skill) => mentions(description, skill));

  const scored = candidates.map((candidate) => {
    const matchedSkills = candidate.skills.filter((skill) => mentions(description, skill));
    const matchedInterests = candidate.interests.filter((interest) => mentions(description, interest));

    let score = matchedSkills.length * 22 + matchedInterests.length * 8;
    if (candidate.availability === "full-time") score += 3;
    if (candidate.experience === "Senior" || candidate.experience === "Lead") score += 3;

    return { candidate, matchedSkills, score: clamp(score, 0, 100) };
  });

  scored.sort((a, b) => b.score - a.score);

  const positiveCount = scored.filter((s) => s.score > 0).length;
  const pickCount = clamp(positiveCount, 3, 5);
  const picks = scored.slice(0, pickCount);

  const team: TeamMember[] = picks.map(({ candidate, matchedSkills, score }) => {
    const shownSkills = matchedSkills.length > 0 ? matchedSkills.slice(0, 5) : candidate.skills.slice(0, 3);
    const rationale =
      matchedSkills.length > 0
        ? `Matches on ${matchedSkills.slice(0, 3).join(", ")} — ${candidate.experience.toLowerCase()}-level, ${candidate.availability}.`
        : `No direct skill keywords matched, but ${candidate.role.toLowerCase()} experience (${candidate.skills
            .slice(0, 2)
            .join(", ")}) could still generalize here.`;

    return {
      id: candidate.id,
      name: candidate.name,
      role: candidate.role,
      bio: candidate.bio,
      availability: candidate.availability,
      experience: candidate.experience,
      skills: candidate.skills,
      matchedSkills: shownSkills,
      matchScore: score,
      rationale,
      avatarUrl: candidate.avatarUrl,
    };
  });

  const requiredRoles = Array.from(new Set(team.map((m) => m.role)));

  return {
    requiredRoles,
    requiredSkills,
    projectSummary: description.length > 140 ? `${description.slice(0, 140).trim()}…` : description,
    teamSummary:
      requiredSkills.length > 0
        ? `This team covers ${requiredSkills.slice(0, 4).join(", ")}, matched from your description by keyword overlap.`
        : "No strong skill keywords were found in your description, so this is a best-effort general team.",
    team,
    mode: "fallback",
  };
}
