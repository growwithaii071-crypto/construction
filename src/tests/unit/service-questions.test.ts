import { describe, it, expect } from "vitest";
import {
  getQuestionsForCategory,
  SERVICE_MCQ,
} from "@/components/services/service-questions";

describe("getQuestionsForCategory()", () => {
  it("returns questions for 'Residential Construction'", () => {
    const qs = getQuestionsForCategory("Residential Construction");
    expect(qs.length).toBeGreaterThan(0);
  });

  it("returns questions for 'Electrical Works'", () => {
    const qs = getQuestionsForCategory("Electrical Works");
    expect(qs.length).toBeGreaterThan(0);
  });

  it("returns questions for 'Plumbing & Sanitation'", () => {
    const qs = getQuestionsForCategory("Plumbing & Sanitation");
    expect(qs.length).toBeGreaterThan(0);
  });

  it("returns DEFAULT questions for unknown category", () => {
    const qs = getQuestionsForCategory("Some Unknown Category XYZ");
    expect(qs.length).toBeGreaterThan(0);
    // Default has 'scope' question
    expect(qs.some((q) => q.id === "scope" || q.id === "timeline" || q.id === "budget")).toBe(true);
  });

  it("each question has id, question, options, emoji fields", () => {
    for (const [, questions] of Object.entries(SERVICE_MCQ)) {
      for (const q of questions) {
        expect(q).toHaveProperty("id");
        expect(q).toHaveProperty("question");
        expect(q).toHaveProperty("options");
        expect(q).toHaveProperty("emoji");
        expect(typeof q.id).toBe("string");
        expect(typeof q.question).toBe("string");
        expect(Array.isArray(q.options)).toBe(true);
        expect(q.options.length).toBeGreaterThanOrEqual(2);
      }
    }
  });

  it("all question IDs are unique within a category", () => {
    for (const [category, questions] of Object.entries(SERVICE_MCQ)) {
      const ids = questions.map((q) => q.id);
      const unique = new Set(ids);
      expect(unique.size).toBe(ids.length); // no duplicates
    }
  });

  it("all options are non-empty strings", () => {
    for (const [, questions] of Object.entries(SERVICE_MCQ)) {
      for (const q of questions) {
        for (const opt of q.options) {
          expect(typeof opt).toBe("string");
          expect(opt.trim().length).toBeGreaterThan(0);
        }
      }
    }
  });

  it("SERVICE_MCQ covers at least 8 categories", () => {
    expect(Object.keys(SERVICE_MCQ).length).toBeGreaterThanOrEqual(8);
  });

  it("every category has exactly 4 questions", () => {
    for (const [category, questions] of Object.entries(SERVICE_MCQ)) {
      expect(questions.length).toBe(4);
    }
  });

  it("every category's last question is budget-related", () => {
    for (const [, questions] of Object.entries(SERVICE_MCQ)) {
      const lastQ = questions[questions.length - 1];
      expect(lastQ.id).toBe("budget");
      expect(lastQ.emoji).toBe("💰");
    }
  });

  it("all categories with budget question have ₹ symbol in options", () => {
    for (const [, questions] of Object.entries(SERVICE_MCQ)) {
      const budgetQ = questions.find((q) => q.id === "budget");
      if (budgetQ) {
        const hasRupee = budgetQ.options.some((o) => o.includes("₹"));
        expect(hasRupee).toBe(true);
      }
    }
  });
});
