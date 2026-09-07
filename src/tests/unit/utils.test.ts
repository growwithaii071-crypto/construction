import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// ─── cn() utility ────────────────────────────────────────────────
import { cn } from "@/lib/utils";

describe("cn() utility", () => {
  it("merges class names", () => {
    expect(cn("px-4", "py-2")).toBe("px-4 py-2");
  });

  it("handles conditional classes", () => {
    expect(cn("base", false && "hidden", "visible")).toBe("base visible");
  });

  it("deduplicates tailwind classes", () => {
    // tailwind-merge removes earlier conflicting classes
    expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
  });
});

// ─── Zod schemas ─────────────────────────────────────────────────
import { LoginSchema } from "@/schemas/auth";

describe("LoginSchema", () => {
  it("accepts valid credentials", () => {
    const result = LoginSchema.safeParse({
      email: "test@example.com",
      password: "password123",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid email", () => {
    const result = LoginSchema.safeParse({
      email: "not-an-email",
      password: "password123",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty password", () => {
    const result = LoginSchema.safeParse({
      email: "test@example.com",
      password: "",
    });
    expect(result.success).toBe(false);
  });
});
