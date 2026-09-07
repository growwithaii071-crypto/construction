import { test, expect } from "@playwright/test";

test.describe("Homepage", () => {
  test("loads and shows hero section", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/buildpro/i);
    await expect(page.getByText(/reliable way to hire/i)).toBeVisible();
  });

  test("search box is visible", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByPlaceholder(/house construction/i)).toBeVisible();
  });

  test("search redirects to services page", async ({ page }) => {
    await page.goto("/");
    await page.getByPlaceholder(/house construction/i).fill("plumber");
    await page.getByRole("button", { name: /get quotes/i }).click();
    await expect(page).toHaveURL(/\/customer\/services\?search=plumber/);
  });

  test("navbar has login links", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: /post a job/i })).toBeVisible();
  });
});
