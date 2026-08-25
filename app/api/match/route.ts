import { NextRequest, NextResponse } from "next/server";
import { ApiError } from "@google/genai";
import { candidates } from "@/lib/candidates";
import { extractRequirements, selectTeam } from "@/lib/gemini";
import { heuristicMatch } from "@/lib/fallbackMatch";
import { MatchResponse } from "@/lib/types";

export const runtime = "nodejs";

// In-memory cache, keyed by normalized description. Lives for as long as
// this server process is warm. Two purposes: (1) repeating the same
// description (rehearsing a demo, then running it again live) doesn't spend
// a second Gemini quota unit, and (2) it's what a quota-exhausted fallback
// checks first before falling back to the local heuristic matcher. Only
// real AI results are cached — fallback results are cheap to recompute and
// caching them could keep serving a stale approximation after quota
// recovers.
const MAX_CACHE_ENTRIES = 200;
const matchCache = new Map<string, MatchResponse>();

function normalize(description: string): string {
  return description.trim().toLowerCase().replace(/\s+/g, " ");
}

function cacheSet(key: string, value: MatchResponse) {
  if (matchCache.size >= MAX_CACHE_ENTRIES) {
    const oldestKey = matchCache.keys().next().value;
    if (oldestKey !== undefined) matchCache.delete(oldestKey);
  }
  matchCache.set(key, value);
}

function isQuotaError(err: unknown): boolean {
  if (err instanceof ApiError && err.status === 429) return true;
  const message = err instanceof Error ? err.message : String(err);
  return /RESOURCE_EXHAUSTED|quota/i.test(message);
}

export async function POST(req: NextRequest) {
  let body: { description?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const description = typeof body.description === "string" ? body.description.trim() : "";

  if (description.length < 20) {
    return NextResponse.json(
      { error: "Tell us a bit more about your project (at least 20 characters)." },
      { status: 400 }
    );
  }

  if (description.length > 4000) {
    return NextResponse.json(
      { error: "That description is too long — try trimming it down." },
      { status: 400 }
    );
  }

  const cacheKey = normalize(description);
  const cached = matchCache.get(cacheKey);
  if (cached) {
    return NextResponse.json(cached);
  }

  try {
    const requirements = await extractRequirements(description);
    const selection = await selectTeam(description, requirements, candidates);

    if (selection.team.length === 0) {
      return NextResponse.json(
        { error: "Couldn't find a strong match for that project. Try adding more detail." },
        { status: 422 }
      );
    }

    const byId = new Map(candidates.map((c) => [c.id, c]));

    const team = selection.team
      .map((pick) => {
        const candidate = byId.get(pick.candidateId);
        if (!candidate) return null;
        const requiredSkillsLower = requirements.requiredSkills.map((s) => s.toLowerCase());
        const matchedSkills = candidate.skills.filter((skill) =>
          requiredSkillsLower.some(
            (req) => req.includes(skill.toLowerCase()) || skill.toLowerCase().includes(req)
          )
        );
        return {
          id: candidate.id,
          name: candidate.name,
          role: candidate.role,
          bio: candidate.bio,
          availability: candidate.availability,
          experience: candidate.experience,
          skills: candidate.skills,
          matchedSkills: matchedSkills.length > 0 ? matchedSkills : candidate.skills.slice(0, 3),
          matchScore: pick.matchScore,
          rationale: pick.rationale,
          avatarUrl: candidate.avatarUrl,
        };
      })
      .filter((t): t is NonNullable<typeof t> => t !== null)
      .sort((a, b) => b.matchScore - a.matchScore);

    const payload: MatchResponse = {
      requiredRoles: requirements.requiredRoles,
      requiredSkills: requirements.requiredSkills,
      projectSummary: requirements.projectSummary,
      teamSummary: selection.teamSummary,
      team,
      mode: "ai",
    };

    cacheSet(cacheKey, payload);
    return NextResponse.json(payload);
  } catch (err) {
    const quota = isQuotaError(err);
    console.warn(`match route: AI call failed (${quota ? "quota" : "error"}), using local fallback:`, err);

    const fallback = heuristicMatch(description, candidates);
    fallback.fallbackNote = quota
      ? "The AI matching quota was reached, so this team was picked locally by skill/keyword overlap instead of live AI matching."
      : "Live AI matching hit an unexpected error, so this team was picked locally by skill/keyword overlap instead.";

    return NextResponse.json(fallback);
  }
}
