export type TeamMember = {
  id: string;
  name: string;
  role: string;
  bio: string;
  availability: string;
  experience: string;
  skills: string[];
  matchedSkills: string[];
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
};

export type MatchError = {
  error: string;
};
