import { describe, it, expect } from "vitest";
import { candidates } from "./candidates";

describe("candidates data integrity", () => {
  it("has at least one candidate", () => {
    expect(candidates.length).toBeGreaterThan(0);
  });

  it("has unique candidate ids", () => {
    const ids = candidates.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every candidate has required non-empty fields", () => {
    for (const c of candidates) {
      expect(c.id).toBeTruthy();
      expect(c.name).toBeTruthy();
      expect(c.role).toBeTruthy();
      expect(Array.isArray(c.skills)).toBe(true);
      expect(c.skills.length).toBeGreaterThan(0);
      expect(Array.isArray(c.interests)).toBe(true);
      expect(c.availability).toBeTruthy();
      expect(c.bio).toBeTruthy();
    }
  });

  it("every candidate has a valid experience level", () => {
    const valid = ["Junior", "Mid", "Senior", "Lead"];
    for (const c of candidates) {
      expect(valid).toContain(c.experience);
    }
  });
});
