import { NextRequest, NextResponse } from "next/server";
import { ApiError } from "@google/genai";
import { candidates, Candidate } from "@/lib/candidates";
import { extractRequirements, selectTeam } from "@/lib/gemini";
import { heuristicMatch } from "@/lib/fallbackMatch";
import { MatchResponse, TeamMember } from "@/lib/types";
import { createClient } from "@/lib/supabase/server";
import { developerToCandidate, DeveloperProfileRow } from "@/lib/developer";

type DeveloperProfileWithName = DeveloperProfileRow & { profiles: { full_name: string | null } | null };

/** Opted-in real developer profiles, mapped into the same shape as the mock candidate pool. */
async function loadRealCandidates(): Promise<{ pool: Candidate[]; realIds: Set<string> }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("developer_profiles")
    .select("*, profiles(full_name)")
    .eq("opted_in", true);

  if (error || !data) {
    if (error) console.warn("match route: failed to load real developer profiles:", error.message);
    return { pool: [], realIds: new Set() };
  }

  const rows = data as unknown as DeveloperProfileWithName[];
  const pool = rows.map((row) => developerToCandidate(row.profiles?.full_name || "Developer", row));
  return { pool, realIds: new Set(rows.map((r) => r.id)) };
}

/** Logs a match_impressions row for every picked team member who is a real (non-mock) developer. */
async function logImpressions(
  team: TeamMember[],
  realIds: Set<string>,
  requiredRoles: string[],
  requiredSkills: string[]
) {
  // `team` is already sorted best-first by matchScore, so index 0 is the best overall pick.
  const topPickId = team[0]?.id;

  const rows = team
    .filter((member) => realIds.has(member.id))
    .map((member) => ({
      developer_id: member.id,
      match_score: member.matchScore,
      was_top_pick: member.id === topPickId,
      required_roles: requiredRoles,
      required_skills: requiredSkills,
    }));

  if (rows.length === 0) return;

  try {
    const supabase = await createClient();
    const { error } = await supabase.from("match_impressions").insert(rows);
    if (error) console.warn("match route: failed to log impressions:", error.message);
  } catch (err) {
    console.warn("match route: failed to log impressions:", err);
  }
}

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
  let body: { projectName?: unknown; description?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const projectName = typeof body.projectName === "string" ? body.projectName.trim() : "";
  const description = typeof body.description === "string" ? body.description.trim() : "";

  if (projectName.length < 2) {
    return NextResponse.json({ error: "Give your project a name." }, { status: 400 });
  }

  if (projectName.length > 120) {
    return NextResponse.json({ error: "That project name is too long — try trimming it down." }, { status: 400 });
  }

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
  const { pool: realCandidates, realIds } = await loadRealCandidates();

  const cached = matchCache.get(cacheKey);
  if (cached) {
    // A cached team can include a real developer who has since opted out — drop them from what's
    // actually returned so opting out takes effect immediately, even for a cached description.
    const mockIds = new Set(candidates.map((c) => c.id));
    const visibleTeam = cached.team.filter((m) => mockIds.has(m.id) || realIds.has(m.id));
    await logImpressions(visibleTeam, realIds, cached.requiredRoles, cached.requiredSkills);
    return NextResponse.json({ ...cached, team: visibleTeam, projectName });
  }

  const pool = [...candidates, ...realCandidates];

  try {
    const requirements = await extractRequirements(description);
    const selection = await selectTeam(description, requirements, pool);

    if (selection.team.length === 0) {
      return NextResponse.json(
        { error: "Couldn't find a strong match for that project. Try adding more detail." },
        { status: 422 }
      );
    }

    const byId = new Map(pool.map((c) => [c.id, c]));

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
          skillsMatched: matchedSkills.length > 0,
          matchScore: pick.matchScore,
          rationale: pick.rationale,
          avatarUrl: candidate.avatarUrl,
        };
      })
      .filter((t): t is NonNullable<typeof t> => t !== null)
      .sort((a, b) => b.matchScore - a.matchScore);

    const payload: MatchResponse = {
      projectName,
      requiredRoles: requirements.requiredRoles,
      requiredSkills: requirements.requiredSkills,
      projectSummary: requirements.projectSummary,
      teamSummary: selection.teamSummary,
      team,
      mode: "ai",
    };

    cacheSet(cacheKey, payload);
    await logImpressions(team, realIds, requirements.requiredRoles, requirements.requiredSkills);
    return NextResponse.json(payload);
  } catch (err) {
    const quota = isQuotaError(err);
    console.warn(`match route: AI call failed (${quota ? "quota" : "error"}), using local fallback:`, err);

    const fallback = heuristicMatch(description, pool);
    fallback.projectName = projectName;
    fallback.fallbackNote = quota
      ? "The AI matching quota was reached, so this team was picked locally by skill/keyword overlap instead of live AI matching."
      : "Live AI matching hit an unexpected error, so this team was picked locally by skill/keyword overlap instead.";

    await logImpressions(fallback.team, realIds, fallback.requiredRoles, fallback.requiredSkills);
    return NextResponse.json(fallback);
  }
}
