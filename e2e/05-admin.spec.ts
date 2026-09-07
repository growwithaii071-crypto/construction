import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "./helpers";

/**
 * ADMIN DASHBOARD TESTS
 * Simulates admin logging in and using management features
 */

test.describe("👑 Admin — Login", () => {
  test("admin can login with correct credentials", async ({ page }) => {
    await page.goto("/login");
    await page.getByPlaceholder(/email/i).first().fill("admin@buildpro.com");
    await page.getByPlaceholder(/password/i).first().fill("Admin@123");
    await page.getByRole("button", { name: /sign in|log in/i }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
  });

  test("admin dashboard loads", async ({ page }) => {
    await loginAsAdmin(page);
    await expect(page).toHaveURL(/\/dashboard/);
  });
});

test.describe("👑 Admin — Dashboard Navigation", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("admin dashboard has navigation sidebar", async ({ page }) => {
    await expect(page.getByRole("navigation").first()).toBeVisible();
  });

  test("admin can access dashboard home", async ({ page }) => {
    await expect(page.getByText(/dashboard|overview/i).first()).toBeVisible();
  });
});
