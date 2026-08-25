import { Candidate } from "./candidates";
import { MatchResponse, TeamMember } from "./types";
import { INTEREST_SYNONYMS, SKILL_SYNONYMS } from "./domainSynonyms";

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

function mentionsAny(description: string, terms: string[]): boolean {
  return terms.some((term) => mentions(description, term));
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

type MatchKind = "exact" | "inferred";

/**
 * A skill/interest counts as "exact" if its literal name appears in the
 * description, or "inferred" if a related natural-language phrase from
 * domainSynonyms.ts appears instead (e.g. "phone-camera photos" implying
 * "Computer vision"). Inferred matches count for less in scoring since
 * they're a weaker signal than the literal term.
 */
function matchTerm(description: string, term: string, synonyms: Record<string, string[]>): MatchKind | null {
  if (mentions(description, term)) return "exact";
  const related = synonyms[term];
  if (related && mentionsAny(description, related)) return "inferred";
  return null;
}

/**
 * Pure, local, non-AI fallback used when the Gemini calls fail (quota
 * exhaustion or any other error). Ranks the fixed candidate pool by
 * skill/interest overlap with the free-text description — both literal
 * keyword matches and a curated set of natural-language synonyms — so a
 * live demo never dead-ends on an API failure. Deterministic and free —
 * no network calls, no API key required.
 */
export function heuristicMatch(description: string, candidates: Candidate[]): MatchResponse {
  const allSkills = Array.from(new Set(candidates.flatMap((c) => c.skills)));
  const requiredSkills = allSkills.filter((skill) => matchTerm(description, skill, SKILL_SYNONYMS) !== null);

  const scored = candidates.map((candidate) => {
    const skillMatches = candidate.skills
      .map((skill) => ({ skill, kind: matchTerm(description, skill, SKILL_SYNONYMS) }))
      .filter((m): m is { skill: string; kind: MatchKind } => m.kind !== null);

    const interestMatches = candidate.interests
      .map((interest) => ({ interest, kind: matchTerm(description, interest, INTEREST_SYNONYMS) }))
      .filter((m): m is { interest: string; kind: MatchKind } => m.kind !== null);

    let score = 0;
    for (const m of skillMatches) score += m.kind === "exact" ? 22 : 13;
    for (const m of interestMatches) score += m.kind === "exact" ? 8 : 5;
    if (candidate.availability === "full-time") score += 3;
    if (candidate.experience === "Senior" || candidate.experience === "Lead") score += 3;

    return { candidate, skillMatches, interestMatches, score: clamp(score, 0, 100) };
  });

  scored.sort((a, b) => b.score - a.score);

  const positiveCount = scored.filter((s) => s.score > 0).length;
  const pickCount = clamp(positiveCount, 3, 5);
  const picks = scored.slice(0, pickCount);

  const team: TeamMember[] = picks.map(({ candidate, skillMatches, interestMatches, score }) => {
    const shownSkills =
      skillMatches.length > 0 ? skillMatches.map((m) => m.skill).slice(0, 5) : candidate.skills.slice(0, 3);

    const exactSkills = skillMatches.filter((m) => m.kind === "exact").map((m) => m.skill);
    const inferredSkills = skillMatches.filter((m) => m.kind === "inferred").map((m) => m.skill);

    let rationale: string;
    if (exactSkills.length > 0) {
      rationale = `Matches on ${exactSkills.slice(0, 3).join(", ")} — ${candidate.experience.toLowerCase()}-level, ${candidate.availability}.`;
    } else if (inferredSkills.length > 0) {
      rationale = `Likely relevant based on ${inferredSkills.slice(0, 2).join(", ")} experience — ${candidate.experience.toLowerCase()}-level, ${candidate.availability}.`;
    } else if (interestMatches.length > 0) {
      rationale = `Background in ${interestMatches
        .slice(0, 2)
        .map((m) => m.interest)
        .join(", ")} lines up with this project's domain.`;
    } else {
      rationale = `No direct skill keywords matched, but ${candidate.role.toLowerCase()} experience (${candidate.skills
        .slice(0, 2)
        .join(", ")}) could still generalize here.`;
    }

    return {
      id: candidate.id,
      name: candidate.name,
      role: candidate.role,
      bio: candidate.bio,
      availability: candidate.availability,
      experience: candidate.experience,
      skills: candidate.skills,
      matchedSkills: shownSkills,
      skillsMatched: skillMatches.length > 0,
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
