import { test, expect } from "@playwright/test";
import { loginAsCustomer, loginAsContractor } from "./helpers";

/**
 * ROLE-BASED ACCESS CONTROL TESTS
 * Simulates users trying to access pages they shouldn't be able to
 */

test.describe("🔒 Unauthenticated Access — Redirects to Login", () => {
  test("visiting /customer/dashboard redirects to /customer/login", async ({ page }) => {
    await page.goto("/customer/dashboard");
    await expect(page).toHaveURL(/\/customer\/login/);
  });

  test("visiting /customer/services redirects to /customer/login", async ({ page }) => {
    await page.goto("/customer/services");
    await expect(page).toHaveURL(/\/customer\/login/);
  });

  test("visiting /customer/requests redirects to /customer/login", async ({ page }) => {
    await page.goto("/customer/requests");
    await expect(page).toHaveURL(/\/customer\/login/);
  });

  test("visiting /construction/dashboard redirects to /construction/login", async ({ page }) => {
    await page.goto("/construction/dashboard");
    await expect(page).toHaveURL(/\/construction\/login/);
  });

  test("visiting /construction/services redirects to /construction/login", async ({ page }) => {
    await page.goto("/construction/services");
    await expect(page).toHaveURL(/\/construction\/login/);
  });

  test("visiting /construction/earnings redirects to /construction/login", async ({ page }) => {
    await page.goto("/construction/earnings");
    await expect(page).toHaveURL(/\/construction\/login/);
  });

  test("visiting /construction/team redirects to /construction/login", async ({ page }) => {
    await page.goto("/construction/team");
    await expect(page).toHaveURL(/\/construction\/login/);
  });

  test("visiting /dashboard redirects to /login", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe("🔒 Customer Cannot Access Contractor Pages", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsCustomer(page);
  });

  test("customer trying /construction/dashboard is redirected to their dashboard", async ({ page }) => {
    await page.goto("/construction/dashboard");
    await expect(page).toHaveURL(/\/customer\/dashboard/);
  });

  test("customer trying /construction/services is redirected", async ({ page }) => {
    await page.goto("/construction/services");
    await expect(page).toHaveURL(/\/customer\/dashboard/);
  });

  test("customer trying /construction/earnings is redirected", async ({ page }) => {
    await page.goto("/construction/earnings");
    await expect(page).toHaveURL(/\/customer\/dashboard/);
  });

  test("customer trying /dashboard (admin) is redirected", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/customer\/dashboard/);
  });
});

test.describe("🔒 Contractor Cannot Access Customer Pages", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsContractor(page);
  });

  test("contractor trying /customer/dashboard is redirected to their dashboard", async ({ page }) => {
    await page.goto("/customer/dashboard");
    await expect(page).toHaveURL(/\/construction\/dashboard/);
  });

  test("contractor trying /customer/services is redirected", async ({ page }) => {
    await page.goto("/customer/services");
    await expect(page).toHaveURL(/\/construction\/dashboard/);
  });

  test("contractor trying /dashboard (admin) is redirected", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/construction\/dashboard/);
  });
});

test.describe("🔒 Already Logged-in User Cannot Re-visit Login Page", () => {
  test("logged-in customer visiting /customer/login is redirected to dashboard", async ({ page }) => {
    await loginAsCustomer(page);
    await page.goto("/customer/login");
    await expect(page).toHaveURL(/\/customer\/dashboard/);
  });

  test("logged-in contractor visiting /construction/login is redirected to dashboard", async ({ page }) => {
    await loginAsContractor(page);
    await page.goto("/construction/login");
    await expect(page).toHaveURL(/\/construction\/dashboard/);
  });

  test("logged-in customer visiting /customer/register is redirected", async ({ page }) => {
    await loginAsCustomer(page);
    await page.goto("/customer/register");
    await expect(page).toHaveURL(/\/customer\/dashboard/);
  });
});

test.describe("🔒 Public Pages Accessible to Everyone", () => {
  test("homepage is accessible without login", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL("/");
  });

  test("/customer/login is accessible without login", async ({ page }) => {
    await page.goto("/customer/login");
    await expect(page).toHaveURL(/\/customer\/login/);
  });

  test("/customer/register is accessible without login", async ({ page }) => {
    await page.goto("/customer/register");
    await expect(page).toHaveURL(/\/customer\/register/);
  });

  test("/construction/login is accessible without login", async ({ page }) => {
    await page.goto("/construction/login");
    await expect(page).toHaveURL(/\/construction\/login/);
  });

  test("/construction/register is accessible without login", async ({ page }) => {
    await page.goto("/construction/register");
    await expect(page).toHaveURL(/\/construction\/register/);
  });
});
