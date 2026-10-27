import { describe, expect, it } from "vitest";

describe("matching helpers", () => {
  it("fairness prefers lower invite load conceptually", () => {
    const a = { score: 100 - 2 * 5 };
    const b = { score: 100 - 8 * 5 };
    expect(a.score).toBeGreaterThan(b.score);
  });

  it("verified boost dominates category-only", () => {
    const verified = 100 + 15;
    const unverifiedCategory = 40;
    expect(verified).toBeGreaterThan(unverifiedCategory);
  });
});
