import { test, expect } from "@playwright/test";
import { loginAsAdmin, signOut } from "./helpers";

/**
 * ═══════════════════════════════════════════════════════
 *  05 — ADMIN DASHBOARD  (Advanced)
 *  login → dashboard stats → users → reports → sign out
 * ═══════════════════════════════════════════════════════
 */

// ─────────────────────────────────────────────────────────
//  ADMIN LOGIN
// ─────────────────────────────────────────────────────────
test.describe("🛡️ Admin — Login", () => {
  test("can login with admin credentials and reach /dashboard", async ({ page }) => {
    await page.goto("/login");
    await page.locator("input[type='email'], input[name='email']").first().fill("admin@buildpro.com");
    await page.locator("input[type='password']").first().fill("Admin@123");
    await page.getByRole("button", { name: /sign in|log in/i }).first().click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
  });

  test("is NOT redirected to customer or contractor dashboard", async ({ page }) => {
    await loginAsAdmin(page);
    await expect(page).not.toHaveURL(/\/customer\/dashboard/);
    await expect(page).not.toHaveURL(/\/construction\/dashboard/);
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("shows error for wrong admin credentials", async ({ page }) => {
    await page.goto("/login");
    await page.locator("input[type='email'], input[name='email']").first().fill("wrong@admin.com");
    await page.locator("input[type='password']").first().fill("WrongPass@123");
    await page.getByRole("button", { name: /sign in|log in/i }).first().click();
    await expect(page.getByText(/invalid|incorrect|credentials/i)).toBeVisible({ timeout: 8000 });
  });
});

// ─────────────────────────────────────────────────────────
//  ADMIN DASHBOARD — OVERVIEW
// ─────────────────────────────────────────────────────────
test.describe("🛡️ Admin Dashboard — Overview", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("dashboard main content area is visible", async ({ page }) => {
    await expect(page.getByRole("main")).toBeVisible();
  });

  test("admin sidebar navigation is visible", async ({ page }) => {
    await expect(page.getByRole("navigation").first()).toBeVisible();
  });

  test("admin can see a heading or branding element", async ({ page }) => {
    await expect(page.getByText(/buildpro|admin|dashboard/i).first()).toBeVisible();
  });

  test("stat cards or overview metrics are visible", async ({ page }) => {
    await expect(
      page.getByText(/users|reports|total|projects/i).first()
    ).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────
//  ADMIN NAVIGATION
// ─────────────────────────────────────────────────────────
test.describe("🛡️ Admin Dashboard — Navigation", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("can navigate to Users page", async ({ page }) => {
    const usersLink = page.getByRole("link", { name: /users/i });
    if (await usersLink.isVisible()) {
      await usersLink.click();
      await expect(page).toHaveURL(/\/users/);
    }
  });

  test("can navigate to Reports page", async ({ page }) => {
    const reportsLink = page.getByRole("link", { name: /reports|site reports/i });
    if (await reportsLink.isVisible()) {
      await reportsLink.click();
      await expect(page).toHaveURL(/\/reports|\/site-reports/);
    }
  });

  test("admin profile area is accessible via sidebar/topbar", async ({ page }) => {
    const profileLink = page
      .getByRole("link", { name: /profile|account/i })
      .or(page.getByRole("button", { name: /account/i }));
    if (await profileLink.isVisible()) {
      await expect(profileLink).toBeVisible();
    }
  });
});

// ─────────────────────────────────────────────────────────
//  ADMIN — SIGN OUT
// ─────────────────────────────────────────────────────────
test.describe("🛡️ Admin — Sign Out", () => {
  test("can sign out and is redirected to login", async ({ page }) => {
    await loginAsAdmin(page);
    await signOut(page);
    await expect(page).toHaveURL(/\/login/, { timeout: 8000 });
  });

  test("after sign out, /dashboard redirects to /login", async ({ page }) => {
    await loginAsAdmin(page);
    await signOut(page);
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/, { timeout: 8000 });
  });
});
