import { GoogleGenAI, Type } from "@google/genai";
import { Candidate } from "./candidates";

const MODEL = "gemini-3.6-flash";

function getClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set");
  }
  return new GoogleGenAI({ apiKey });
}

export type Requirements = {
  requiredRoles: string[];
  requiredSkills: string[];
  projectSummary: string;
};

const requirementsSchema = {
  type: Type.OBJECT,
  properties: {
    requiredRoles: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "3-6 role titles the project needs (e.g. 'Backend Engineer', 'Product Designer').",
    },
    requiredSkills: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Concrete skills/technologies implied by the project description.",
    },
    projectSummary: {
      type: Type.STRING,
      description: "One-sentence neutral restatement of what the project is building.",
    },
  },
  required: ["requiredRoles", "requiredSkills", "projectSummary"],
};

export async function extractRequirements(description: string): Promise<Requirements> {
  const ai = getClient();
  const response = await ai.models.generateContent({
    model: MODEL,
    contents: `You are a technical staffing analyst. Read this project description and extract what
roles and skills a team would need to build it. Be concrete and specific rather than generic.

Project description:
"""
${description}
"""`,
    config: {
      responseMimeType: "application/json",
      responseSchema: requirementsSchema,
      temperature: 0.4,
      maxOutputTokens: 1024,
    },
  });

  const parsed = JSON.parse(response.text ?? "{}");
  return {
    requiredRoles: Array.isArray(parsed.requiredRoles) ? parsed.requiredRoles : [],
    requiredSkills: Array.isArray(parsed.requiredSkills) ? parsed.requiredSkills : [],
    projectSummary: typeof parsed.projectSummary === "string" ? parsed.projectSummary : "",
  };
}

export type TeamPick = {
  candidateId: string;
  matchScore: number;
  rationale: string;
};

export type TeamSelection = {
  team: TeamPick[];
  teamSummary: string;
};

const teamSchema = {
  type: Type.OBJECT,
  properties: {
    team: {
      type: Type.ARRAY,
      description: "3 to 5 selected candidates, best fit first.",
      items: {
        type: Type.OBJECT,
        properties: {
          candidateId: { type: Type.STRING },
          matchScore: {
            type: Type.NUMBER,
            description: "0-100 fit score for this project.",
          },
          rationale: {
            type: Type.STRING,
            description: "One specific sentence on why this person fits this project.",
          },
        },
        required: ["candidateId", "matchScore", "rationale"],
      },
    },
    teamSummary: {
      type: Type.STRING,
      description: "One sentence on why this specific group of people works well together for this project.",
    },
  },
  required: ["team", "teamSummary"],
};

export async function selectTeam(
  description: string,
  requirements: Requirements,
  pool: Candidate[]
): Promise<TeamSelection> {
  const ai = getClient();
  const poolText = pool
    .map(
      (c) =>
        `- id: ${c.id} | ${c.name} | ${c.role} | skills: ${c.skills.join(", ")} | interests: ${c.interests.join(", ")} | availability: ${c.availability} | experience: ${c.experience} | bio: ${c.bio}`
    )
    .join("\n");

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: `You are building the best possible small team for a project from a fixed candidate pool.

Project description:
"""
${description}
"""

Extracted requirements:
Roles needed: ${requirements.requiredRoles.join(", ") || "none extracted"}
Skills needed: ${requirements.requiredSkills.join(", ") || "none extracted"}

Candidate pool (choose ONLY from these, reference by id):
${poolText}

Select the best 3 to 5 candidates for this project. Prioritize covering the required roles/skills,
then availability fit and experience level, then interest overlap with the project domain. Prefer a
diverse, complementary team over five people with the same skill set. For each pick, write ONE
specific sentence explaining why that person fits THIS project, referencing their actual skills or
experience rather than generic praise.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: teamSchema,
      temperature: 0.6,
      maxOutputTokens: 2048,
    },
  });

  const parsed = JSON.parse(response.text ?? "{}");
  const rawTeam = Array.isArray(parsed.team) ? parsed.team : [];

  const validIds = new Set(pool.map((c) => c.id));
  const team: TeamPick[] = rawTeam
    .filter((t: any) => t && typeof t.candidateId === "string" && validIds.has(t.candidateId))
    .map((t: any) => ({
      candidateId: t.candidateId,
      matchScore: Math.max(0, Math.min(100, Math.round(Number(t.matchScore) || 0))),
      rationale: typeof t.rationale === "string" ? t.rationale : "",
    }));

  return {
    team,
    teamSummary: typeof parsed.teamSummary === "string" ? parsed.teamSummary : "",
  };
}
