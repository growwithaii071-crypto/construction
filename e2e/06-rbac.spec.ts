import { test, expect } from "@playwright/test";
import { loginAsCustomer, loginAsContractor, loginAsAdmin } from "./helpers";

/**
 * ═══════════════════════════════════════════════════════
 *  06 — ROLE-BASED ACCESS CONTROL
 *  Unified login at /login — role decides destination.
 * ═══════════════════════════════════════════════════════
 */

test.describe("🔒 Unauthenticated — Protected Routes Block", () => {
  const customerProtected = [
    "/customer/dashboard",
    "/customer/services",
    "/customer/requests",
    "/customer/profile",
  ];

  const contractorProtected = [
    "/construction/dashboard",
    "/construction/services",
    "/construction/requests",
    "/construction/earnings",
    "/construction/analytics",
    "/construction/reviews",
    "/construction/invoices",
    "/construction/team",
    "/construction/profile",
  ];

  for (const path of customerProtected) {
    test(`visiting ${path} redirects to /login`, async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveURL(/\/login/);
    });
  }

  for (const path of contractorProtected) {
    test(`visiting ${path} redirects to /login`, async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveURL(/\/login/);
    });
  }

  test("visiting /dashboard redirects to /login", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });

  test("visiting /admin redirects to /login", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe("🌐 Public Routes — Accessible Without Login", () => {
  const publicRoutes = [
    { path: "/", match: "/" },
    { path: "/services", match: /\/services/ },
    { path: "/services?search=electrical", match: /\/services/ },
    { path: "/login", match: /\/login/ },
    { path: "/customer/register", match: /\/customer\/register/ },
    { path: "/construction/register", match: /\/construction\/register/ },
  ];

  for (const { path, match } of publicRoutes) {
    test(`${path} is accessible without login`, async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveURL(match);
    });
  }

  test("legacy /customer/login redirects to unified /login", async ({ page }) => {
    await page.goto("/customer/login");
    await expect(page).toHaveURL(/\/login/);
  });

  test("legacy /construction/login redirects to unified /login", async ({ page }) => {
    await page.goto("/construction/login");
    await expect(page).toHaveURL(/\/login/);
  });

  test("/login does NOT trigger ERR_TOO_MANY_REDIRECTS", async ({ page }) => {
    let redirectCount = 0;
    page.on("response", (res) => {
      if ([301, 302, 307, 308].includes(res.status())) redirectCount++;
    });
    await page.goto("/login");
    expect(redirectCount).toBeLessThan(5);
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe("🔒 Customer — Cannot Access Contractor Pages", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsCustomer(page);
  });

  const blockedPaths = [
    "/construction/dashboard",
    "/construction/services",
    "/construction/requests",
    "/construction/earnings",
    "/construction/analytics",
    "/construction/reviews",
    "/construction/invoices",
    "/construction/team",
  ];

  for (const path of blockedPaths) {
    test(`customer visiting ${path} is redirected to /customer/dashboard`, async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveURL(/\/customer\/dashboard/, { timeout: 8000 });
    });
  }

  test("customer visiting /dashboard (admin) is redirected to /customer/dashboard", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/customer\/dashboard/, { timeout: 8000 });
  });
});

test.describe("🔒 Contractor — Cannot Access Customer Pages", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsContractor(page);
  });

  const blockedPaths = [
    "/customer/dashboard",
    "/customer/services",
    "/customer/requests",
    "/customer/profile",
  ];

  for (const path of blockedPaths) {
    test(`contractor visiting ${path} is redirected to /construction/dashboard`, async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveURL(/\/construction\/dashboard/, { timeout: 8000 });
    });
  }

  test("contractor visiting /dashboard (admin) is redirected to /construction/dashboard", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/construction\/dashboard/, { timeout: 8000 });
  });
});

test.describe("🔒 No Re-login for Authenticated Users", () => {
  test("logged-in customer visiting /login is redirected to dashboard", async ({ page }) => {
    await loginAsCustomer(page);
    await page.goto("/login");
    await expect(page).toHaveURL(/\/customer\/dashboard/, { timeout: 8000 });
  });

  test("logged-in contractor visiting /login is redirected to dashboard", async ({ page }) => {
    await loginAsContractor(page);
    await page.goto("/login");
    await expect(page).toHaveURL(/\/construction\/dashboard/, { timeout: 8000 });
  });

  test("logged-in customer visiting /customer/register is redirected", async ({ page }) => {
    await loginAsCustomer(page);
    await page.goto("/customer/register");
    await expect(page).toHaveURL(/\/customer\/dashboard/, { timeout: 8000 });
  });
});

test.describe("🔒 Unified Login — Role Routing", () => {
  test("client credentials land on /customer/dashboard", async ({ page }) => {
    await loginAsCustomer(page);
    await expect(page).toHaveURL(/\/customer\/dashboard/);
  });

  test("contractor credentials land on /construction/dashboard", async ({ page }) => {
    await loginAsContractor(page);
    await expect(page).toHaveURL(/\/construction\/dashboard/);
  });

  test("admin credentials land on /dashboard", async ({ page }) => {
    await loginAsAdmin(page);
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page).not.toHaveURL(/\/customer\/dashboard/);
    await expect(page).not.toHaveURL(/\/construction\/dashboard/);
  });
});

test.describe("🔒 Session / Cookie Handling", () => {
  test("clearing cookies on /customer/dashboard redirects to login", async ({ page }) => {
    await loginAsCustomer(page);
    await page.context().clearCookies();
    await page.reload();
    await expect(page).toHaveURL(/\/login/, { timeout: 8000 });
  });

  test("clearing cookies on /construction/dashboard redirects to login", async ({ page }) => {
    await loginAsContractor(page);
    await page.context().clearCookies();
    await page.reload();
    await expect(page).toHaveURL(/\/login/, { timeout: 8000 });
  });
});
