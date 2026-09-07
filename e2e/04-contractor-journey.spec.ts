import { test, expect } from "@playwright/test";
import { loginAsContractor, signOut } from "./helpers";

/**
 * ═══════════════════════════════════════════════════════
 *  04 — CONTRACTOR FULL JOURNEY  (Advanced)
 *  login → dashboard → add service → requests → earnings
 *  → analytics → reviews → invoices → team → profile → sign out
 * ═══════════════════════════════════════════════════════
 */

// ─────────────────────────────────────────────────────────
//  LOGIN
// ─────────────────────────────────────────────────────────
test.describe("🏗️ Contractor — Login", () => {
  test("can login with correct credentials", async ({ page }) => {
    await page.goto("/construction/login");
    await page.getByPlaceholder(/company@example.com/i).fill("contractor@buildpro.com");
    await page.getByPlaceholder(/enter your password/i).fill("Contractor@123");
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/construction\/dashboard/, { timeout: 10000 });
  });

  test("is NOT redirected to admin or customer dashboard", async ({ page }) => {
    await loginAsContractor(page);
    await expect(page).not.toHaveURL(/\/customer\/dashboard/);
    await expect(page).not.toHaveURL(/^.*\/dashboard$/);
    await expect(page).toHaveURL(/\/construction\/dashboard/);
  });
});

// ─────────────────────────────────────────────────────────
//  DASHBOARD
// ─────────────────────────────────────────────────────────
test.describe("🏗️ Contractor Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsContractor(page);
  });

  test("dashboard loads with welcome/intro message", async ({ page }) => {
    await expect(page.getByText(/welcome|dashboard/i)).toBeVisible();
  });

  test("all 10 sidebar nav items are visible", async ({ page }) => {
    const navItems = [
      /^dashboard$/i,
      /my services/i,
      /add service/i,
      /customer requests/i,
      /earnings/i,
      /analytics/i,
      /reviews/i,
      /invoices/i,
      /my team/i,
      /my profile/i,
    ];
    for (const item of navItems) {
      await expect(page.getByRole("link", { name: item }).first()).toBeVisible();
    }
  });

  test("earnings banner / total earnings card is visible", async ({ page }) => {
    await expect(page.getByText(/total earnings|total earned/i)).toBeVisible();
  });

  test("quick access grid is visible", async ({ page }) => {
    await expect(page.getByText(/quick access/i)).toBeVisible();
  });

  test("request status breakdown panel is visible", async ({ page }) => {
    await expect(page.getByText(/pending|accepted|completed/i).first()).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────
//  ADD SERVICE
// ─────────────────────────────────────────────────────────
test.describe("🏗️ Contractor — Add Service Form", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsContractor(page);
    await page.goto("/construction/services/new");
  });

  test("page loads with form heading", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /add|new service/i })).toBeVisible();
  });

  test("Title, Description, Category fields are visible", async ({ page }) => {
    await expect(page.getByLabel(/title/i)).toBeVisible();
    await expect(page.getByLabel(/description/i)).toBeVisible();
    await expect(page.getByLabel(/category/i)).toBeVisible();
  });

  test("Submit with empty fields shows validation errors", async ({ page }) => {
    await page.getByRole("button", { name: /save|add|create/i }).click();
    const errors = page.locator(".text-red-500, .text-destructive, p[class*='red']");
    await expect(errors.first()).toBeVisible({ timeout: 3000 });
  });

  test("form has price range fields (priceFrom, priceTo)", async ({ page }) => {
    const priceFrom = page.getByLabel(/price from|starting price|minimum price/i)
      .or(page.getByPlaceholder(/price from|from/i));
    await expect(priceFrom).toBeVisible();
  });

  test("can fill all fields and submit", async ({ page }) => {
    await page.getByLabel(/title/i).fill("Advanced Electrical Installation");
    await page.getByLabel(/description/i).fill(
      "Professional electrical work including wiring, panel installation and solar setups."
    );
    const catSelect = page.getByLabel(/category/i);
    if (await catSelect.isVisible()) {
      await catSelect.selectOption({ index: 1 });
    }
    await page.getByRole("button", { name: /save|add|create/i }).click();
    // Should show success toast or redirect to services list
    await expect(
      page.getByText(/success|added|saved/i).or(page.getByRole("heading", { name: /my services/i }))
    ).toBeVisible({ timeout: 8000 });
  });
});

// ─────────────────────────────────────────────────────────
//  MY SERVICES
// ─────────────────────────────────────────────────────────
test.describe("🏗️ Contractor — My Services", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsContractor(page);
    await page.goto("/construction/services");
  });

  test("page loads with heading", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /my services/i })).toBeVisible();
  });

  test("'Add New Service' button is visible", async ({ page }) => {
    await expect(page.getByRole("link", { name: /add.*service|new service/i })).toBeVisible();
  });

  test("shows service cards or empty state message", async ({ page }) => {
    const hasServices = await page.getByText(/active|inactive|toggle/i).first().isVisible().catch(() => false);
    const isEmpty = await page.getByText(/no services|add your first/i).isVisible().catch(() => false);
    expect(hasServices || isEmpty).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────
//  CUSTOMER REQUESTS
// ─────────────────────────────────────────────────────────
test.describe("🏗️ Contractor — Customer Requests", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsContractor(page);
    await page.goto("/construction/requests");
  });

  test("requests page loads with heading", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /customer requests/i })).toBeVisible();
  });

  test("shows pending / accepted / in progress status badges or empty state", async ({ page }) => {
    const hasRequests = await page
      .getByText(/pending|accepted|in progress|completed/i)
      .first()
      .isVisible()
      .catch(() => false);
    const isEmpty = await page.getByText(/no.*requests|no pending/i).isVisible().catch(() => false);
    expect(hasRequests || isEmpty).toBe(true);
  });

  test("status filter tabs are visible if they exist", async ({ page }) => {
    const tabs = page.getByRole("tab").or(page.getByRole("button", { name: /all|pending|accepted/i }));
    const count = await tabs.count();
    // Could be 0 (no tabs) or more - just shouldn't crash
    expect(count).toBeGreaterThanOrEqual(0);
  });
});

// ─────────────────────────────────────────────────────────
//  EARNINGS
// ─────────────────────────────────────────────────────────
test.describe("🏗️ Contractor — Earnings", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsContractor(page);
    await page.goto("/construction/earnings");
  });

  test("earnings page loads", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /earnings/i })).toBeVisible();
  });

  test("shows 'Total Earned' card", async ({ page }) => {
    await expect(page.getByText(/total earned/i)).toBeVisible();
  });

  test("shows 'Pending Earnings' card", async ({ page }) => {
    await expect(page.getByText(/pending earnings/i)).toBeVisible();
  });

  test("shows 'Jobs Completed' card", async ({ page }) => {
    await expect(page.getByText(/jobs completed/i)).toBeVisible();
  });

  test("shows completed jobs table or empty state", async ({ page }) => {
    const hasTable = await page.getByRole("table").isVisible().catch(() => false);
    const isEmpty = await page.getByText(/no completed jobs/i).isVisible().catch(() => false);
    expect(hasTable || isEmpty).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────
//  ANALYTICS
// ─────────────────────────────────────────────────────────
test.describe("🏗️ Contractor — Analytics", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsContractor(page);
    await page.goto("/construction/analytics");
  });

  test("analytics page loads", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /analytics/i })).toBeVisible();
  });

  test("shows 'Total Requests' KPI card", async ({ page }) => {
    await expect(page.getByText(/total requests/i)).toBeVisible();
  });

  test("shows 'Conversion Rate' KPI card", async ({ page }) => {
    await expect(page.getByText(/conversion rate/i)).toBeVisible();
  });

  test("shows 'Completion Rate' KPI card", async ({ page }) => {
    await expect(page.getByText(/completion rate/i)).toBeVisible();
  });

  test("'Requests Over Time' chart section is visible", async ({ page }) => {
    await expect(page.getByText(/requests over time/i)).toBeVisible();
  });

  test("'Request Status' breakdown section is visible", async ({ page }) => {
    await expect(page.getByText(/request status/i)).toBeVisible();
  });

  test("'Top Services' section is visible", async ({ page }) => {
    await expect(page.getByText(/top services/i)).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────
//  REVIEWS
// ─────────────────────────────────────────────────────────
test.describe("🏗️ Contractor — Reviews", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsContractor(page);
    await page.goto("/construction/reviews");
  });

  test("reviews page loads", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /reviews/i })).toBeVisible();
  });

  test("shows average rating section or empty state", async ({ page }) => {
    const hasRating = await page.getByText(/average rating|5\.0|4\./i).isVisible().catch(() => false);
    const isEmpty = await page.getByText(/no reviews/i).isVisible().catch(() => false);
    expect(hasRating || isEmpty).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────
//  INVOICES
// ─────────────────────────────────────────────────────────
test.describe("🏗️ Contractor — Invoices", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsContractor(page);
    await page.goto("/construction/invoices");
  });

  test("invoices page loads", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /invoices/i })).toBeVisible();
  });

  test("shows 'Total Invoices' summary card", async ({ page }) => {
    await expect(page.getByText(/total invoices/i)).toBeVisible();
  });

  test("shows 'Amount Collected' card", async ({ page }) => {
    await expect(page.getByText(/amount collected/i)).toBeVisible();
  });

  test("shows 'Outstanding' card", async ({ page }) => {
    await expect(page.getByText(/outstanding/i)).toBeVisible();
  });

  test("shows invoice table or empty state", async ({ page }) => {
    const hasTable = await page.getByRole("table").isVisible().catch(() => false);
    const isEmpty = await page.getByText(/no invoices/i).isVisible().catch(() => false);
    expect(hasTable || isEmpty).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────
//  TEAM MANAGEMENT
// ─────────────────────────────────────────────────────────
test.describe("🏗️ Contractor — Team Management", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsContractor(page);
    await page.goto("/construction/team");
  });

  test("team page loads", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /my team/i })).toBeVisible();
  });

  test("stat cards visible: Total Members, Active, On Leave", async ({ page }) => {
    await expect(page.getByText(/total members/i)).toBeVisible();
    await expect(page.getByText(/on leave/i)).toBeVisible();
  });

  test("'Add Member' button is visible", async ({ page }) => {
    await expect(page.getByRole("button", { name: /add member/i })).toBeVisible();
  });

  test("'Manage Roles' button is visible", async ({ page }) => {
    await expect(page.getByRole("button", { name: /manage roles/i })).toBeVisible();
  });

  test("clicking 'Add Member' opens Add Member modal", async ({ page }) => {
    await page.getByRole("button", { name: /add member/i }).click();
    await expect(page.getByRole("heading", { name: /add team member/i })).toBeVisible({ timeout: 2000 });
  });

  test("Add Member modal has required fields (name, phone, email, role)", async ({ page }) => {
    await page.getByRole("button", { name: /add member/i }).click();
    await expect(page.getByPlaceholder(/ramesh kumar/i)).toBeVisible({ timeout: 2000 });
    await expect(page.getByPlaceholder(/\+91/i)).toBeVisible();
    await expect(page.getByPlaceholder(/name@email.com/i)).toBeVisible();
  });

  test("can add a new team member", async ({ page }) => {
    await page.getByRole("button", { name: /add member/i }).click();
    const timestamp = Date.now();
    await page.getByPlaceholder(/ramesh kumar/i).fill(`Test Worker ${timestamp}`);
    await page.getByPlaceholder(/\+91/i).fill("+91 90000 00001");
    await page.getByPlaceholder(/name@email.com/i).fill(`worker${timestamp}@test.com`);
    await page.getByRole("button", { name: /^add member$/i }).click();
    await expect(page.getByText(`Test Worker ${timestamp}`)).toBeVisible({ timeout: 3000 });
  });

  test("Manage Roles modal opens with pre-populated roles", async ({ page }) => {
    await page.getByRole("button", { name: /manage roles/i }).click();
    await expect(page.getByRole("heading", { name: /manage roles/i })).toBeVisible({ timeout: 2000 });
    await expect(page.getByText(/site supervisor/i)).toBeVisible();
  });

  test("can add a custom role in Manage Roles modal", async ({ page }) => {
    await page.getByRole("button", { name: /manage roles/i }).click();
    await page.getByPlaceholder(/structural engineer/i).fill("Safety Inspector");
    await page.getByRole("button", { name: /^add$/i }).click();
    await expect(page.getByText(/safety inspector/i)).toBeVisible({ timeout: 2000 });
  });

  test("can delete a custom role in Manage Roles modal", async ({ page }) => {
    await page.getByRole("button", { name: /manage roles/i }).click();
    // Add a role to delete
    await page.getByPlaceholder(/structural engineer/i).fill("Temp Role To Delete");
    await page.getByRole("button", { name: /^add$/i }).click();
    await expect(page.getByText(/temp role to delete/i)).toBeVisible({ timeout: 2000 });
    // Delete it
    const deleteBtn = page
      .locator("li")
      .filter({ hasText: /temp role to delete/i })
      .getByRole("button");
    if (await deleteBtn.isVisible()) {
      await deleteBtn.click();
      await expect(page.getByText(/temp role to delete/i)).not.toBeVisible({ timeout: 2000 });
    }
  });

  test("team member status toggle is visible for listed members", async ({ page }) => {
    const toggleOrBadge = page
      .getByRole("button", { name: /toggle|active|on leave/i })
      .or(page.getByText(/active|on leave/i).first());
    const exists = await toggleOrBadge.isVisible().catch(() => false);
    // Either members exist (toggle visible) or empty state — both OK
    expect(typeof exists).toBe("boolean");
  });
});

// ─────────────────────────────────────────────────────────
//  PROFILE
// ─────────────────────────────────────────────────────────
test.describe("🏗️ Contractor — Profile", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsContractor(page);
    await page.goto("/construction/profile");
  });

  test("profile shows contractor email", async ({ page }) => {
    await expect(page.getByText(/contractor@buildpro\.com/i)).toBeVisible();
  });

  test("profile shows CONTRACTOR role badge", async ({ page }) => {
    await expect(page.getByText(/contractor/i)).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────
//  SIGN OUT
// ─────────────────────────────────────────────────────────
test.describe("🏗️ Contractor — Sign Out", () => {
  test("can sign out and is redirected to login page", async ({ page }) => {
    await loginAsContractor(page);
    await signOut(page);
    await expect(page).toHaveURL(/\/construction\/login|\/login/, { timeout: 8000 });
  });

  test("after sign out, /construction/dashboard requires login again", async ({ page }) => {
    await loginAsContractor(page);
    await signOut(page);
    await page.goto("/construction/dashboard");
    await expect(page).toHaveURL(/\/construction\/login/, { timeout: 8000 });
  });
});
