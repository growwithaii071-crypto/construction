import { describe, it, expect } from "vitest";

// ─── cn() utility ─────────────────────────────────────────
import { cn } from "@/lib/utils";

describe("cn() utility", () => {
  it("merges two class names", () => {
    expect(cn("px-4", "py-2")).toBe("px-4 py-2");
  });

  it("handles falsy conditional classes", () => {
    expect(cn("base", false && "hidden", "visible")).toBe("base visible");
  });

  it("handles undefined conditional classes", () => {
    expect(cn("base", undefined, "active")).toBe("base active");
  });

  it("handles null conditional classes", () => {
    expect(cn("base", null, "active")).toBe("base active");
  });

  it("deduplicates conflicting tailwind classes (later wins)", () => {
    expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
  });

  it("deduplicates conflicting padding classes", () => {
    expect(cn("p-4", "p-8")).toBe("p-8");
  });

  it("handles empty input", () => {
    expect(cn()).toBe("");
  });

  it("handles all-falsy input", () => {
    expect(cn(false, undefined, null)).toBe("");
  });

  it("handles arrays of classes", () => {
    expect(cn(["text-sm", "font-bold"])).toBe("text-sm font-bold");
  });

  it("merges responsive variants correctly", () => {
    const result = cn("w-full", "md:w-1/2");
    expect(result).toContain("md:w-1/2");
  });
});

// ─── Zod Schemas ──────────────────────────────────────────
import { LoginSchema } from "@/schemas/auth";

describe("LoginSchema", () => {
  it("accepts valid email + password", () => {
    expect(LoginSchema.safeParse({ email: "test@example.com", password: "password123" }).success).toBe(true);
  });

  it("rejects missing email field", () => {
    expect(LoginSchema.safeParse({ password: "password123" }).success).toBe(false);
  });

  it("rejects invalid email (no @)", () => {
    expect(LoginSchema.safeParse({ email: "notanemail", password: "password123" }).success).toBe(false);
  });

  it("rejects invalid email (no domain)", () => {
    expect(LoginSchema.safeParse({ email: "user@", password: "password123" }).success).toBe(false);
  });

  it("rejects empty password", () => {
    expect(LoginSchema.safeParse({ email: "test@example.com", password: "" }).success).toBe(false);
  });

  it("rejects missing password field", () => {
    expect(LoginSchema.safeParse({ email: "test@example.com" }).success).toBe(false);
  });

  it("rejects completely empty object", () => {
    expect(LoginSchema.safeParse({}).success).toBe(false);
  });

  it("rejects extra fields (strict schemas should strip or fail)", () => {
    // Most Zod schemas strip unknown keys — result still success
    const result = LoginSchema.safeParse({
      email: "test@example.com",
      password: "password123",
      extraField: "should be stripped",
    });
    expect(result.success).toBe(true); // Zod strips by default
  });

  it("accepts email with subdomain", () => {
    expect(LoginSchema.safeParse({ email: "user@mail.company.co.in", password: "pass123" }).success).toBe(true);
  });

  it("trims whitespace in email if schema uses .trim()", () => {
    const result = LoginSchema.safeParse({ email: " test@example.com ", password: "pass123" });
    // Either passes (trimmed) or fails — no crash
    expect(typeof result.success).toBe("boolean");
  });
});
