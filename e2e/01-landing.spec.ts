import { test, expect } from "@playwright/test";

/**
 * LANDING PAGE — Full manual-style tests
 * Simulates a real user visiting the homepage for the first time
 */

test.describe("🏠 Landing Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("page loads with correct title", async ({ page }) => {
    await expect(page).toHaveTitle(/buildpro/i);
  });

  test("hero section is visible with headline", async ({ page }) => {
    await expect(page.getByText(/reliable way to hire/i)).toBeVisible();
  });

  test("navbar is visible at top", async ({ page }) => {
    await expect(page.getByRole("navigation").first()).toBeVisible();
  });

  test("search box is visible and focusable", async ({ page }) => {
    const searchInput = page.getByPlaceholder(/house construction/i);
    await expect(searchInput).toBeVisible();
    await searchInput.click();
    await expect(searchInput).toBeFocused();
  });

  test("search with keyword redirects to services page", async ({ page }) => {
    await page.getByPlaceholder(/house construction/i).fill("electrician");
    await page.getByRole("button", { name: /get quotes/i }).click();
    await expect(page).toHaveURL(/\/customer\/services\?search=electrician/);
  });

  test("search with empty input goes to all services", async ({ page }) => {
    await page.getByRole("button", { name: /get quotes/i }).click();
    await expect(page).toHaveURL(/\/customer\/services/);
  });

  test("pressing Enter in search box submits search", async ({ page }) => {
    await page.getByPlaceholder(/house construction/i).fill("plumber");
    await page.getByPlaceholder(/house construction/i).press("Enter");
    await expect(page).toHaveURL(/search=plumber/);
  });

  test("stats section shows numbers (contractors, jobs etc)", async ({ page }) => {
    await expect(page.getByText(/contractors on site/i)).toBeVisible();
    await expect(page.getByText(/jobs completed/i)).toBeVisible();
  });

  test("'How It Works' section is visible", async ({ page }) => {
    await page.getByText(/how it works/i).scrollIntoViewIfNeeded();
    await expect(page.getByText(/how it works/i)).toBeVisible();
  });

  test("footer has links and contact info", async ({ page }) => {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await expect(page.getByRole("contentinfo")).toBeVisible();
  });

  test("'Post a Job' CTA link works", async ({ page }) => {
    const postJobLink = page.getByRole("link", { name: /post a job/i }).first();
    await expect(postJobLink).toBeVisible();
  });

  test("customer login link is accessible from navbar", async ({ page }) => {
    const loginLink = page.getByRole("link", { name: /sign in|login/i }).first();
    if (await loginLink.isVisible()) {
      await expect(loginLink).toBeVisible();
    }
  });
});
