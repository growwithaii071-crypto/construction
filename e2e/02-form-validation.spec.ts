import { test, expect } from "@playwright/test";

/**
 * FORM VALIDATION TESTS
 * Simulates a user making mistakes in every form — empty fields, bad input, etc.
 */

test.describe("📋 Customer Registration — Validation", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/customer/register");
  });

  test("register page loads", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /create.*account|register/i })).toBeVisible();
  });

  test("shows error when submitting empty form", async ({ page }) => {
    await page.getByRole("button", { name: /create account|register/i }).click();
    // Should show validation errors
    await expect(page.locator("p.text-xs.text-red-500, [class*=error]").first()).toBeVisible({ timeout: 3000 });
  });

  test("shows error for invalid email", async ({ page }) => {
    await page.getByPlaceholder(/email/i).fill("not-an-email");
    await page.getByRole("button", { name: /create account|register/i }).click();
    await expect(page.getByText(/invalid email/i)).toBeVisible({ timeout: 3000 });
  });

  test("shows error when passwords don't match", async ({ page }) => {
    const fields = await page.getByPlaceholder(/password/i).all();
    if (fields.length >= 2) {
      await fields[0].fill("Password@123");
      await fields[1].fill("DifferentPassword@123");
      await page.getByRole("button", { name: /create account|register/i }).click();
      await expect(page.getByText(/do not match|mismatch/i)).toBeVisible({ timeout: 3000 });
    }
  });

  test("password strength indicators show while typing", async ({ page }) => {
    await page.getByPlaceholder(/password/i).first().fill("weak");
    // strength indicators should appear
    await expect(page.getByText(/uppercase|lowercase|8\+/i).first()).toBeVisible({ timeout: 2000 });
  });

  test("link to login page is present", async ({ page }) => {
    await expect(page.getByRole("link", { name: /sign in|login/i })).toBeVisible();
  });
});

test.describe("📋 Contractor Registration — Validation", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/construction/register");
  });

  test("register page loads", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /register.*company/i })).toBeVisible();
  });

  test("specialization dropdown opens on click", async ({ page }) => {
    const trigger = page.getByText(/select specialization/i);
    await expect(trigger).toBeVisible();
    await trigger.click();
    // Dropdown should appear with options
    await expect(page.getByText(/residential construction/i)).toBeVisible({ timeout: 2000 });
  });

  test("can select multiple specializations", async ({ page }) => {
    await page.getByText(/select specialization/i).click();
    await page.getByText(/residential construction/i).click();
    await page.getByText(/electrical works/i).click();
    // Should show 2 selected
    await expect(page.getByText(/2 selected/i)).toBeVisible({ timeout: 2000 });
  });

  test("can deselect a specialization by clicking X on tag", async ({ page }) => {
    await page.getByText(/select specialization/i).click();
    await page.getByText(/residential construction/i).click();
    await page.getByText(/done/i).click();
    // X button on the tag should remove it
    const removeBtn = page.locator("button").filter({ hasText: "" }).last();
    if (await removeBtn.isVisible()) {
      await removeBtn.click();
      await expect(page.getByText(/0 selected|select specialization/i)).toBeVisible({ timeout: 2000 });
    }
  });

  test("shows error if no specialization selected", async ({ page }) => {
    await page.getByLabel(/contact person/i).fill("Test User");
    await page.getByLabel(/company name/i).fill("Test Company");
    await page.getByLabel(/business email/i).fill("test@test.com");
    await page.getByRole("button", { name: /register/i }).click();
    await expect(page.getByText(/select at least one/i)).toBeVisible({ timeout: 3000 });
  });

  test("link to contractor login is present", async ({ page }) => {
    await expect(page.getByRole("link", { name: /sign in/i })).toBeVisible();
  });
});

test.describe("📋 Login Form Validation", () => {
  test("customer login — empty email shows error", async ({ page }) => {
    await page.goto("/customer/login");
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page.locator("p.text-xs.text-red-500").first()).toBeVisible({ timeout: 3000 });
  });

  test("customer login — wrong credentials shows error message", async ({ page }) => {
    await page.goto("/customer/login");
    await page.getByPlaceholder(/you@example.com/i).fill("wrong@example.com");
    await page.getByPlaceholder(/enter your password/i).fill("wrongpassword");
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page.getByText(/invalid email or password/i)).toBeVisible({ timeout: 5000 });
  });

  test("contractor login — wrong credentials shows error message", async ({ page }) => {
    await page.goto("/construction/login");
    await page.getByPlaceholder(/company@example.com/i).fill("wrong@company.com");
    await page.getByPlaceholder(/enter your password/i).fill("wrongpassword");
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page.getByText(/invalid email or password/i)).toBeVisible({ timeout: 5000 });
  });

  test("customer login — password toggle shows/hides password", async ({ page }) => {
    await page.goto("/customer/login");
    const passwordInput = page.getByPlaceholder(/enter your password/i);
    await passwordInput.fill("TestPassword");
    await expect(passwordInput).toHaveAttribute("type", "password");
    // Click eye icon
    await page.locator("button[type='button']").last().click();
    await expect(passwordInput).toHaveAttribute("type", "text");
  });
});
