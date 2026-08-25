import { NextRequest, NextResponse } from "next/server";
import { candidates } from "@/lib/candidates";
import { extractRequirements, selectTeam } from "@/lib/gemini";
import { MatchResponse } from "@/lib/types";

export const runtime = "nodejs";

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
    };

    return NextResponse.json(payload);
  } catch (err) {
    console.error("match route error:", err);
    return NextResponse.json(
      { error: "Something went wrong while matching your team. Please try again." },
      { status: 500 }
    );
  }
}
