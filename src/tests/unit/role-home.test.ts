import { describe, it, expect } from "vitest";
import { getRoleHome, ROLE_HOME } from "@/lib/role-home";

describe("getRoleHome()", () => {
  it("maps CLIENT to customer dashboard", () => {
    expect(getRoleHome("CLIENT")).toBe("/customer/dashboard");
  });

  it("maps CONTRACTOR to construction dashboard", () => {
    expect(getRoleHome("CONTRACTOR")).toBe("/construction/dashboard");
  });

  it("maps ADMIN and SUPER_ADMIN to /dashboard", () => {
    expect(getRoleHome("ADMIN")).toBe("/dashboard");
    expect(getRoleHome("SUPER_ADMIN")).toBe("/dashboard");
  });

  it("falls back to /dashboard for unknown or empty role", () => {
    expect(getRoleHome(undefined)).toBe("/dashboard");
    expect(getRoleHome(null)).toBe("/dashboard");
    expect(getRoleHome("UNKNOWN")).toBe("/dashboard");
  });

  it("ROLE_HOME includes all three main portal roles", () => {
    expect(ROLE_HOME.CLIENT).toBeDefined();
    expect(ROLE_HOME.CONTRACTOR).toBeDefined();
    expect(ROLE_HOME.ADMIN).toBeDefined();
  });
});
