import { test, expect } from "@playwright/test";

test.describe("Customer Login", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/customer/login");
  });

  test("renders login form", async ({ page }) => {
    await expect(page.getByPlaceholder(/you@example.com/i)).toBeVisible();
    await expect(page.getByPlaceholder(/enter your password/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
  });

  test("shows error on wrong credentials", async ({ page }) => {
    await page.getByPlaceholder(/you@example.com/i).fill("wrong@email.com");
    await page.getByPlaceholder(/enter your password/i).fill("wrongpassword");
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page.getByText(/invalid email or password/i)).toBeVisible({ timeout: 5000 });
  });

  test("successful login redirects to customer dashboard", async ({ page }) => {
    await page.getByPlaceholder(/you@example.com/i).fill("customer@buildpro.com");
    await page.getByPlaceholder(/enter your password/i).fill("Customer@123");
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/customer\/dashboard/, { timeout: 10000 });
  });
});

test.describe("Contractor Login", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/construction/login");
  });

  test("renders contractor login form", async ({ page }) => {
    await expect(page.getByPlaceholder(/company@example.com/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
  });

  test("successful login redirects to construction dashboard", async ({ page }) => {
    await page.getByPlaceholder(/company@example.com/i).fill("contractor@buildpro.com");
    await page.getByPlaceholder(/enter your password/i).fill("Contractor@123");
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/construction\/dashboard/, { timeout: 10000 });
  });
});

test.describe("Role-based Access Control", () => {
  test("unauthenticated user is redirected from customer dashboard to login", async ({ page }) => {
    await page.goto("/customer/dashboard");
    await expect(page).toHaveURL(/\/customer\/login/);
  });

  test("unauthenticated user is redirected from contractor dashboard to login", async ({ page }) => {
    await page.goto("/construction/dashboard");
    await expect(page).toHaveURL(/\/construction\/login/);
  });

  test("unauthenticated user is redirected from admin dashboard to login", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });
});
