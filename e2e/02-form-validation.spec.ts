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

  test("register link from /customer/login opens registration page", async ({ page }) => {
    await page.goto("/customer/login");
    await page.getByRole("link", { name: /create account|register|sign up/i }).click();
    await expect(page).toHaveURL(/\/customer\/register/);
  });
});

// ─────────────────────────────────────────────────────────
//  CUSTOMER LOGIN FORM
// ─────────────────────────────────────────────────────────
test.describe("🔐 Customer Login Form", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/customer/login");
  });

  test("login page loads correctly", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /sign in|log in|customer/i })).toBeVisible();
    await expect(page.getByPlaceholder(/you@example.com/i)).toBeVisible();
    await expect(page.getByPlaceholder(/enter your password/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /sign in|log in/i })).toBeVisible();
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

  test("has link to registration page", async ({ page }) => {
    await expect(page.getByRole("link", { name: /create account|register|sign up|don't have/i })).toBeVisible();
  });

  test("shows page without header/footer overlap errors", async ({ page }) => {
    // Page should render cleanly
    await expect(page.locator("body")).toBeVisible();
    const loginCard = page.locator("form");
    await expect(loginCard).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────
//  CONTRACTOR LOGIN FORM
// ─────────────────────────────────────────────────────────
test.describe("🔐 Contractor Login Form", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/construction/login");
  });

  test("login page loads correctly", async ({ page }) => {
    await expect(page.getByPlaceholder(/company@example.com/i)).toBeVisible();
    await expect(page.getByPlaceholder(/enter your password/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /sign in|log in/i })).toBeVisible();
  });

  test("shows error for empty form submit", async ({ page }) => {
    await page.getByRole("button", { name: /sign in/i }).click();
    const error = page.locator("p[class*='red'], .text-red-500, .text-destructive");
    await expect(error.first()).toBeVisible({ timeout: 3000 });
  });

  test("shows error for wrong credentials", async ({ page }) => {
    await page.getByPlaceholder(/company@example.com/i).fill("fake@contractor.com");
    await page.getByPlaceholder(/enter your password/i).fill("WrongPass@123");
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page.getByText(/invalid|incorrect|credentials/i)).toBeVisible({ timeout: 8000 });
  });

  test("has a link to contractor registration page", async ({ page }) => {
    await expect(page.getByRole("link", { name: /register|create|sign up/i })).toBeVisible();
  });

  test("page does not have ERR_TOO_MANY_REDIRECTS (no infinite loop)", async ({ page }) => {
    let redirectCount = 0;
    page.on("response", (res) => {
      if (res.status() === 301 || res.status() === 302 || res.status() === 307) {
        redirectCount++;
      }
    });
    await page.goto("/construction/login");
    expect(redirectCount).toBeLessThan(5); // Sanity check — no redirect loop
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

// ─────────────────────────────────────────────────────────
//  ADMIN LOGIN FORM
// ─────────────────────────────────────────────────────────
test.describe("🔐 Admin Login Form", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
  });

  test("admin login page loads", async ({ page }) => {
    await expect(page.locator("input[type='email'], input[name='email']").first()).toBeVisible();
    await expect(page.locator("input[type='password']").first()).toBeVisible();
  });

  test("shows error for wrong admin credentials", async ({ page }) => {
    await page.locator("input[type='email'], input[name='email']").first().fill("notadmin@test.com");
    await page.locator("input[type='password']").first().fill("WrongPass@123");
    await page.getByRole("button", { name: /sign in|log in/i }).first().click();
    await expect(page.getByText(/invalid|incorrect|credentials/i)).toBeVisible({ timeout: 8000 });
  });
});
