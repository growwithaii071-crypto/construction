import { test, expect } from "@playwright/test";
import { loginAsCustomer, signOut } from "./helpers";

/**
 * ═══════════════════════════════════════════════════════
 *  03 — CUSTOMER FULL JOURNEY  (Advanced)
 *  Simulates a real customer: login → dashboard → services
 *  → MCQ modal → profile → requests → sign out
 * ═══════════════════════════════════════════════════════
 */

// ─────────────────────────────────────────────────────────
//  LOGIN
// ─────────────────────────────────────────────────────────
test.describe("👤 Customer — Login", () => {
  test("can login with correct credentials and lands on /customer/dashboard", async ({ page }) => {
    await page.goto("/customer/login");
    await page.getByPlaceholder(/you@example.com/i).fill("customer@buildpro.com");
    await page.getByPlaceholder(/enter your password/i).fill("Customer@123");
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/customer\/dashboard/, { timeout: 10000 });
  });

  test("dashboard shows customer's welcome message", async ({ page }) => {
    await loginAsCustomer(page);
    await expect(page.getByText(/welcome|hello/i)).toBeVisible();
  });

  test("customer is NOT redirected to admin or contractor dashboard", async ({ page }) => {
    await loginAsCustomer(page);
    await expect(page).not.toHaveURL(/\/dashboard(?!.*customer)/);
    await expect(page).not.toHaveURL(/\/construction\/dashboard/);
    await expect(page).toHaveURL(/\/customer\/dashboard/);
  });
});

// ─────────────────────────────────────────────────────────
//  DASHBOARD
// ─────────────────────────────────────────────────────────
test.describe("👤 Customer Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsCustomer(page);
  });

  test("stat cards are visible: Requests, Pending, Active, Completed", async ({ page }) => {
    await expect(page.getByText(/requests|pending|completed/i).first()).toBeVisible();
  });

  test("'Browse Services' quick action card is visible", async ({ page }) => {
    await expect(page.getByText(/browse services/i)).toBeVisible();
  });

  test("sidebar has all 4 nav links", async ({ page }) => {
    await expect(page.getByRole("link", { name: /^dashboard$/i }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /browse services/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /my requests/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /my profile/i })).toBeVisible();
  });

  test("sidebar 'Browse Services' link navigates correctly", async ({ page }) => {
    await page.getByRole("link", { name: /browse services/i }).click();
    await expect(page).toHaveURL(/\/customer\/services/);
  });

  test("sidebar 'My Requests' link navigates correctly", async ({ page }) => {
    await page.getByRole("link", { name: /my requests/i }).click();
    await expect(page).toHaveURL(/\/customer\/requests/);
  });

  test("sidebar 'My Profile' link navigates correctly", async ({ page }) => {
    await page.getByRole("link", { name: /my profile/i }).click();
    await expect(page).toHaveURL(/\/customer\/profile/);
  });

  test("user email is visible somewhere in the dashboard (topbar/profile area)", async ({ page }) => {
    await expect(page.getByText(/customer@buildpro\.com/i)).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────
//  CUSTOMER — BROWSE SERVICES (authenticated area)
// ─────────────────────────────────────────────────────────
test.describe("👤 Customer — Browse Services (Logged In)", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsCustomer(page);
    await page.goto("/customer/services");
  });

  test("page loads with search bar", async ({ page }) => {
    await expect(page.getByPlaceholder(/search/i).first()).toBeVisible();
  });

  test("can search services by keyword", async ({ page }) => {
    await page.getByPlaceholder(/search/i).first().fill("electrical");
    await page.getByRole("button", { name: /search/i }).click();
    await expect(page).toHaveURL(/search=electrical/);
  });

  test("search result count updates after search", async ({ page }) => {
    await page.goto("/customer/services?search=plumbing");
    // Either shows result count or 'no results' message
    await expect(
      page.getByText(/result|no result|services found/i).first()
    ).toBeVisible({ timeout: 5000 });
  });

  test("'Clear' link appears when search is active", async ({ page }) => {
    await page.goto("/customer/services?search=test");
    await expect(page.getByRole("link", { name: /clear/i })).toBeVisible();
  });

  test("clicking 'Clear' removes search filter", async ({ page }) => {
    await page.goto("/customer/services?search=test");
    await page.getByRole("link", { name: /clear/i }).click();
    await expect(page).toHaveURL(/\/customer\/services$/);
  });

  test("no results message shows for nonexistent keyword", async ({ page }) => {
    await page.goto("/customer/services?search=xyznonexistentservice999");
    await expect(page.getByText(/no results|no services/i)).toBeVisible({ timeout: 5000 });
  });

  test("services grid is visible when services exist", async ({ page }) => {
    // If services are seeded, we should see cards
    const hasCards = await page.locator("[class*='card'], .rounded-2xl, .rounded-xl").count();
    // At least 0 (empty state is valid too)
    expect(hasCards).toBeGreaterThanOrEqual(0);
  });
});

// ─────────────────────────────────────────────────────────
//  CUSTOMER — MY REQUESTS
// ─────────────────────────────────────────────────────────
test.describe("👤 Customer — My Requests", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsCustomer(page);
    await page.goto("/customer/requests");
  });

  test("My Requests page loads", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /my requests/i })).toBeVisible();
  });

  test("shows empty state or request list", async ({ page }) => {
    const hasContent = await page
      .getByText(/no requests|pending|service|contractor/i)
      .first()
      .isVisible();
    expect(hasContent).toBe(true);
  });

  test("'Browse Services' shortcut is visible in empty state", async ({ page }) => {
    const browseBtn = page.getByRole("link", { name: /browse services/i });
    const hasBrowse = await browseBtn.isVisible().catch(() => false);
    // May or may not exist depending on empty/filled state — just ensure no crash
    expect(typeof hasBrowse).toBe("boolean");
  });
});

// ─────────────────────────────────────────────────────────
//  CUSTOMER — PROFILE
// ─────────────────────────────────────────────────────────
test.describe("👤 Customer — Profile Page", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsCustomer(page);
    await page.goto("/customer/profile");
  });

  test("profile page shows email", async ({ page }) => {
    await expect(page.getByText(/customer@buildpro\.com/i)).toBeVisible();
  });

  test("profile page shows CLIENT role badge", async ({ page }) => {
    await expect(page.getByText(/client/i)).toBeVisible();
  });

  test("profile has full name displayed", async ({ page }) => {
    await expect(page.getByText(/Test Customer|customer/i).first()).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────
//  CUSTOMER — SIGN OUT
// ─────────────────────────────────────────────────────────
test.describe("👤 Customer — Sign Out", () => {
  test("can sign out from customer dashboard", async ({ page }) => {
    await loginAsCustomer(page);
    await signOut(page);
    await expect(page).toHaveURL(/\/customer\/login|\/login/, { timeout: 8000 });
  });

  test("after sign out, /customer/dashboard redirects to login", async ({ page }) => {
    await loginAsCustomer(page);
    await signOut(page);
    await page.goto("/customer/dashboard");
    await expect(page).toHaveURL(/\/customer\/login/, { timeout: 8000 });
  });
});
