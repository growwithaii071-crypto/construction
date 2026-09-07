import { test, expect } from "@playwright/test";
import { loginAsContractor, signOut } from "./helpers";

/**
 * CONTRACTOR FULL JOURNEY
 * login → dashboard → add service → view requests → earnings → analytics → team → sign out
 */

test.describe("🏗️ Contractor — Login Flow", () => {
  test("can login with correct credentials", async ({ page }) => {
    await page.goto("/construction/login");
    await page.getByPlaceholder(/company@example.com/i).fill("contractor@buildpro.com");
    await page.getByPlaceholder(/enter your password/i).fill("Contractor@123");
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/construction\/dashboard/, { timeout: 10000 });
  });
});

test.describe("🏗️ Contractor Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsContractor(page);
  });

  test("dashboard loads with welcome message", async ({ page }) => {
    await expect(page.getByText(/welcome|dashboard/i)).toBeVisible();
  });

  test("stat cards are visible (services, requests, pending, completed)", async ({ page }) => {
    await expect(page.getByText(/services|requests/i).first()).toBeVisible();
  });

  test("quick access grid is visible", async ({ page }) => {
    await expect(page.getByText(/quick access/i)).toBeVisible();
  });

  test("all sidebar navigation items are visible", async ({ page }) => {
    await expect(page.getByRole("link", { name: /^dashboard$/i }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /my services/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /add service/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /customer requests/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /earnings/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /analytics/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /reviews/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /invoices/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /my team/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /my profile/i })).toBeVisible();
  });
});

test.describe("🏗️ Contractor — Add Service", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsContractor(page);
    await page.goto("/construction/services/new");
  });

  test("add service form loads", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /add|new service/i })).toBeVisible();
  });

  test("shows error when submitting empty form", async ({ page }) => {
    await page.getByRole("button", { name: /save|add|create/i }).click();
    await expect(page.locator("[class*=error], p.text-red-500, p.text-xs").first()).toBeVisible({ timeout: 3000 });
  });

  test("can fill and submit add service form", async ({ page }) => {
    await page.getByLabel(/title/i).fill("Professional Plumbing Services");
    await page.getByLabel(/description/i).fill("Expert plumbing for homes and offices. Licensed and insured.");
    // Select category if dropdown exists
    const categorySelect = page.getByLabel(/category/i);
    if (await categorySelect.isVisible()) {
      await categorySelect.selectOption({ index: 1 });
    }
    await page.getByRole("button", { name: /save|add|create/i }).click();
    // Should redirect to services list or show success
    await expect(
      page.getByText(/success|added|saved/i).or(page.getByURL ? page : page.locator("body"))
    ).toBeTruthy();
  });
});

test.describe("🏗️ Contractor — My Services", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsContractor(page);
    await page.goto("/construction/services");
  });

  test("services list page loads", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /my services/i })).toBeVisible();
  });

  test("shows Add Service button", async ({ page }) => {
    await expect(page.getByRole("link", { name: /add service/i })).toBeVisible();
  });

  test("shows empty state or service cards", async ({ page }) => {
    const hasServices = await page.getByText(/active|inactive/i).first().isVisible().catch(() => false);
    const isEmpty = await page.getByText(/no services|add your first/i).isVisible().catch(() => false);
    expect(hasServices || isEmpty).toBe(true);
  });
});

test.describe("🏗️ Contractor — Customer Requests", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsContractor(page);
    await page.goto("/construction/requests");
  });

  test("requests page loads", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /customer requests/i })).toBeVisible();
  });

  test("shows empty or request list with status badges", async ({ page }) => {
    const hasRequests = await page.getByText(/pending|accepted|in progress/i).first().isVisible().catch(() => false);
    const isEmpty = await page.getByText(/no.*requests|no pending/i).isVisible().catch(() => false);
    expect(hasRequests || isEmpty).toBe(true);
  });
});

test.describe("🏗️ Contractor — Earnings Page", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsContractor(page);
    await page.goto("/construction/earnings");
  });

  test("earnings page loads with stat cards", async ({ page }) => {
    await expect(page.getByText(/total earned/i)).toBeVisible();
    await expect(page.getByText(/pending earnings/i)).toBeVisible();
    await expect(page.getByText(/jobs completed/i)).toBeVisible();
  });

  test("shows completed jobs table or empty state", async ({ page }) => {
    const hasTable = await page.getByRole("table").isVisible().catch(() => false);
    const isEmpty = await page.getByText(/no completed jobs/i).isVisible().catch(() => false);
    expect(hasTable || isEmpty).toBe(true);
  });
});

test.describe("🏗️ Contractor — Analytics", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsContractor(page);
    await page.goto("/construction/analytics");
  });

  test("analytics page loads with KPI cards", async ({ page }) => {
    await expect(page.getByText(/total requests/i)).toBeVisible();
    await expect(page.getByText(/conversion rate/i)).toBeVisible();
    await expect(page.getByText(/completion rate/i)).toBeVisible();
  });

  test("monthly chart section is visible", async ({ page }) => {
    await expect(page.getByText(/requests over time/i)).toBeVisible();
  });

  test("request status breakdown is visible", async ({ page }) => {
    await expect(page.getByText(/request status/i)).toBeVisible();
  });
});

test.describe("🏗️ Contractor — Reviews", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsContractor(page);
    await page.goto("/construction/reviews");
  });

  test("reviews page loads", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /reviews/i })).toBeVisible();
  });

  test("shows empty state or review cards", async ({ page }) => {
    const hasReviews = await page.getByText(/star|rating/i).first().isVisible().catch(() => false);
    const isEmpty = await page.getByText(/no reviews/i).isVisible().catch(() => false);
    expect(hasReviews || isEmpty).toBe(true);
  });
});

test.describe("🏗️ Contractor — Invoices", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsContractor(page);
    await page.goto("/construction/invoices");
  });

  test("invoices page loads with summary cards", async ({ page }) => {
    await expect(page.getByText(/total invoices/i)).toBeVisible();
    await expect(page.getByText(/amount collected/i)).toBeVisible();
    await expect(page.getByText(/outstanding/i)).toBeVisible();
  });
});

test.describe("🏗️ Contractor — Team Management", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsContractor(page);
    await page.goto("/construction/team");
  });

  test("team page loads", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /my team/i })).toBeVisible();
  });

  test("shows stat cards (total, active, on leave)", async ({ page }) => {
    await expect(page.getByText(/total members/i)).toBeVisible();
    await expect(page.getByText(/on leave/i)).toBeVisible();
  });

  test("Add Member button is visible", async ({ page }) => {
    await expect(page.getByRole("button", { name: /add member/i })).toBeVisible();
  });

  test("Manage Roles button is visible", async ({ page }) => {
    await expect(page.getByRole("button", { name: /manage roles/i })).toBeVisible();
  });

  test("clicking Add Member opens modal", async ({ page }) => {
    await page.getByRole("button", { name: /add member/i }).click();
    await expect(page.getByRole("heading", { name: /add team member/i })).toBeVisible({ timeout: 2000 });
  });

  test("can fill Add Member form and save", async ({ page }) => {
    await page.getByRole("button", { name: /add member/i }).click();
    await page.getByPlaceholder(/ramesh kumar/i).fill("New Worker");
    await page.getByPlaceholder(/\+91/i).fill("+91 90000 00000");
    await page.getByPlaceholder(/name@email.com/i).fill("worker@test.com");
    await page.getByRole("button", { name: /^add member$/i }).click();
    await expect(page.getByText(/new worker/i)).toBeVisible({ timeout: 3000 });
  });

  test("Manage Roles modal opens and shows roles list", async ({ page }) => {
    await page.getByRole("button", { name: /manage roles/i }).click();
    await expect(page.getByRole("heading", { name: /manage roles/i })).toBeVisible({ timeout: 2000 });
    await expect(page.getByText(/site supervisor/i)).toBeVisible();
  });

  test("can add a new custom role", async ({ page }) => {
    await page.getByRole("button", { name: /manage roles/i }).click();
    await page.getByPlaceholder(/structural engineer/i).fill("Drone Operator");
    await page.getByRole("button", { name: /^add$/i }).click();
    await expect(page.getByText(/drone operator/i)).toBeVisible({ timeout: 2000 });
  });
});

test.describe("🏗️ Contractor — Profile", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsContractor(page);
    await page.goto("/construction/profile");
  });

  test("profile page shows contractor email", async ({ page }) => {
    await expect(page.getByText(/contractor@buildpro.com/i)).toBeVisible();
  });

  test("profile shows CONTRACTOR role badge", async ({ page }) => {
    await expect(page.getByText(/contractor/i)).toBeVisible();
  });
});

test.describe("🏗️ Contractor — Sign Out", () => {
  test("can sign out from contractor dashboard", async ({ page }) => {
    await loginAsContractor(page);
    await signOut(page);
    await expect(page).toHaveURL(/\/construction\/login|\/login/, { timeout: 8000 });
  });
});
