import { test, expect } from "@playwright/test";

/**
 * ═══════════════════════════════════════════════════════
 *  02 — FORM VALIDATIONS  (Advanced)
 *  Every form field, every error message, edge cases.
 * ═══════════════════════════════════════════════════════
 */

// ─────────────────────────────────────────────────────────
//  CUSTOMER REGISTRATION FORM
// ─────────────────────────────────────────────────────────
test.describe("📝 Customer Registration Form", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/customer/register");
  });

  test("registration page loads with all required fields", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /create account|register|sign up/i })).toBeVisible();
    await expect(page.getByPlaceholder(/full name/i)).toBeVisible();
    await expect(page.getByPlaceholder(/you@example.com/i)).toBeVisible();
    await expect(page.getByPlaceholder(/enter your password/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /create account|register|sign up/i })).toBeVisible();
  });

  test("shows 'required' errors on empty submit", async ({ page }) => {
    await page.getByRole("button", { name: /create account|register|sign up/i }).click();
    const errors = page.locator("p[class*='red'], span[class*='red'], .text-red-500, .text-destructive");
    await expect(errors.first()).toBeVisible({ timeout: 3000 });
  });

  test("shows error for invalid email format", async ({ page }) => {
    await page.getByPlaceholder(/full name/i).fill("Test User");
    await page.getByPlaceholder(/you@example.com/i).fill("not-an-email");
    await page.getByPlaceholder(/enter your password/i).fill("Password@123");
    await page.getByRole("button", { name: /create account|register|sign up/i }).click();
    await expect(page.getByText(/invalid email|valid email/i)).toBeVisible({ timeout: 3000 });
  });

  test("shows error for weak password (too short)", async ({ page }) => {
    await page.getByPlaceholder(/full name/i).fill("Test User");
    await page.getByPlaceholder(/you@example.com/i).fill("test@example.com");
    await page.getByPlaceholder(/enter your password/i).fill("123");
    await page.getByRole("button", { name: /create account|register|sign up/i }).click();
    await expect(page.getByText(/password|characters|minimum/i)).toBeVisible({ timeout: 3000 });
  });

  test("password field is masked by default", async ({ page }) => {
    const passwordInput = page.getByPlaceholder(/enter your password/i);
    await expect(passwordInput).toHaveAttribute("type", "password");
  });

  test("toggle password visibility works", async ({ page }) => {
    const passwordInput = page.getByPlaceholder(/enter your password/i);
    const toggle = page.getByRole("button", { name: /show|hide|toggle password/i })
      .or(page.locator("button[aria-label*='password']"));
    if (await toggle.isVisible()) {
      await toggle.click();
      await expect(passwordInput).toHaveAttribute("type", "text");
      await toggle.click();
      await expect(passwordInput).toHaveAttribute("type", "password");
    }
  });

  test("has a link to login page for existing users", async ({ page }) => {
    await expect(page.getByRole("link", { name: /sign in|already have/i })).toBeVisible();
  });

  test("register link from /login opens client registration", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("link", { name: /register as client/i }).click();
    await expect(page).toHaveURL(/\/customer\/register/);
  });
});

// ─────────────────────────────────────────────────────────
//  UNIFIED LOGIN FORM
// ─────────────────────────────────────────────────────────
test.describe("🔐 Unified Login Form", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
  });

  test("login page loads with Admin / Client / Contractor hint", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /sign in/i })).toBeVisible();
    await expect(page.getByText(/admin/i).first()).toBeVisible();
    await expect(page.getByText(/client/i).first()).toBeVisible();
    await expect(page.getByText(/contractor/i).first()).toBeVisible();
    await expect(page.getByPlaceholder(/you@example.com/i)).toBeVisible();
    await expect(page.getByPlaceholder(/enter your password/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
  });

  test("shows error on completely empty submit", async ({ page }) => {
    await page.getByRole("button", { name: /sign in/i }).click();
    const error = page.locator("p[class*='red'], .text-red-500, .text-destructive");
    await expect(error.first()).toBeVisible({ timeout: 3000 });
  });

  test("shows error for invalid credentials", async ({ page }) => {
    await page.getByPlaceholder(/you@example.com/i).fill("wrong@example.com");
    await page.getByPlaceholder(/enter your password/i).fill("WrongPass@123");
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page.getByText(/invalid|incorrect|credentials|email or password/i)).toBeVisible({ timeout: 8000 });
  });

  test("password input is masked by default", async ({ page }) => {
    await expect(page.getByPlaceholder(/enter your password/i)).toHaveAttribute("type", "password");
  });

  test("has Register as Client and Register as Contractor links", async ({ page }) => {
    await expect(page.getByRole("link", { name: /register as client/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /register as contractor/i })).toBeVisible();
  });

  test("page does not have ERR_TOO_MANY_REDIRECTS", async ({ page }) => {
    let redirectCount = 0;
    page.on("response", (res) => {
      if ([301, 302, 307].includes(res.status())) redirectCount++;
    });
    await page.goto("/login");
    expect(redirectCount).toBeLessThan(5);
  });
});

// ─────────────────────────────────────────────────────────
//  CONTRACTOR REGISTRATION FORM
// ─────────────────────────────────────────────────────────
test.describe("📝 Contractor Registration Form", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/construction/register");
  });

  test("registration form loads with company name field", async ({ page }) => {
    await expect(page.getByPlaceholder(/company name|your company/i)).toBeVisible();
  });

  test("shows errors on empty submit", async ({ page }) => {
    await page.getByRole("button", { name: /register|create|sign up/i }).click();
    const error = page.locator("p[class*='red'], .text-red-500, .text-destructive");
    await expect(error.first()).toBeVisible({ timeout: 3000 });
  });

  test("specialization multi-select dropdown is visible", async ({ page }) => {
    const specField = page
      .getByLabel(/specialization/i)
      .or(page.getByText(/specialization/i));
    await expect(specField.first()).toBeVisible();
  });

  test("can open specialization dropdown", async ({ page }) => {
    const dropdown = page.getByRole("button", { name: /select specialization|select specializations/i })
      .or(page.locator("[data-specialization], #specialization").first());
    if (await dropdown.isVisible()) {
      await dropdown.click();
      await expect(page.getByText(/residential|electrical|plumbing/i).first()).toBeVisible({ timeout: 2000 });
    }
  });

  test("phone number field is present", async ({ page }) => {
    await expect(page.getByLabel(/phone/i).or(page.getByPlaceholder(/phone|\+91/i))).toBeVisible();
  });

  test("password mismatch shows confirm password error", async ({ page }) => {
    const passInputs = await page.locator("input[type='password']").all();
    if (passInputs.length >= 2) {
      await passInputs[0].fill("Password@123");
      await passInputs[1].fill("DifferentPassword@456");
      await page.getByRole("button", { name: /register|create|sign up/i }).click();
      await expect(page.getByText(/match|confirm/i)).toBeVisible({ timeout: 3000 });
    }
  });
});
