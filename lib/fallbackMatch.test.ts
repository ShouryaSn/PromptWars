import { describe, it, expect } from "vitest";
import { heuristicMatch } from "./fallbackMatch";
import { candidates } from "./candidates";

describe("heuristicMatch", () => {
  it("returns a team of 3 to 5 members", () => {
    const result = heuristicMatch(
      "We need a React and Node.js web app with a PostgreSQL backend.",
      candidates
    );
    expect(result.team.length).toBeGreaterThanOrEqual(3);
    expect(result.team.length).toBeLessThanOrEqual(5);
  });

  it("sorts the team by descending match score", () => {
    const result = heuristicMatch(
      "Python and PyTorch based machine learning pipeline for healthtech.",
      candidates
    );
    for (let i = 1; i < result.team.length; i++) {
      expect(result.team[i - 1].matchScore).toBeGreaterThanOrEqual(result.team[i].matchScore);
    }
  });

  it("only matches whole words, not substrings (Unity vs community)", () => {
    const result = heuristicMatch(
      "Building a strong local community garden app.",
      candidates
    );
    const unityCandidate = result.team.find((m) => m.matchedSkills.includes("Unity"));
    expect(unityCandidate).toBeUndefined();
  });

  it("flags picks with no real skill overlap as unmatched", () => {
    const result = heuristicMatch("asdf qwer zxcv", candidates);
    for (const member of result.team) {
      expect(member.skillsMatched).toBe(false);
    }
  });

  it("marks the response mode as fallback", () => {
    const result = heuristicMatch("A mobile app for tracking fitness goals.", candidates);
    expect(result.mode).toBe("fallback");
  });
});
