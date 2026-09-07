import { test, expect } from "@playwright/test";
import { loginAsCustomer, loginAsContractor, loginAsAdmin } from "./helpers";

/**
 * ═══════════════════════════════════════════════════════
 *  06 — ROLE-BASED ACCESS CONTROL  (Advanced)
 *  Every protected route tested for every role.
 *  Also tests public routes remain public.
 * ═══════════════════════════════════════════════════════
 */

// ─────────────────────────────────────────────────────────
//  UNAUTHENTICATED — PROTECTED ROUTES REDIRECT TO LOGIN
// ─────────────────────────────────────────────────────────
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
    test(`visiting ${path} redirects to /customer/login`, async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveURL(/\/customer\/login/);
    });
  }

  for (const path of contractorProtected) {
    test(`visiting ${path} redirects to /construction/login`, async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveURL(/\/construction\/login/);
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

// ─────────────────────────────────────────────────────────
//  PUBLIC ROUTES — NO LOGIN REQUIRED
// ─────────────────────────────────────────────────────────
test.describe("🌐 Public Routes — Accessible Without Login", () => {
  const publicRoutes = [
    { path: "/", match: "/" },
    { path: "/services", match: /\/services/ },
    { path: "/services?search=electrical", match: /\/services/ },
    { path: "/customer/login", match: /\/customer\/login/ },
    { path: "/customer/register", match: /\/customer\/register/ },
    { path: "/construction/login", match: /\/construction\/login/ },
    { path: "/construction/register", match: /\/construction\/register/ },
    { path: "/login", match: /\/login/ },
  ];

  for (const { path, match } of publicRoutes) {
    test(`${path} is accessible without login`, async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveURL(match);
      // Should NOT redirect to any login page (unless the path IS a login page)
      if (!path.includes("login") && !path.includes("register")) {
        await expect(page).not.toHaveURL(/\/login(?!\/)/, { timeout: 3000 });
      }
    });
  }

  test("/construction/login does NOT trigger ERR_TOO_MANY_REDIRECTS", async ({ page }) => {
    let redirectCount = 0;
    page.on("response", (res) => {
      if ([301, 302, 307, 308].includes(res.status())) redirectCount++;
    });
    await page.goto("/construction/login");
    expect(redirectCount).toBeLessThan(5);
    await expect(page).toHaveURL(/\/construction\/login/);
  });
});

// ─────────────────────────────────────────────────────────
//  CUSTOMER CANNOT ACCESS CONTRACTOR PAGES
// ─────────────────────────────────────────────────────────
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

  test("customer visiting /admin is redirected to /customer/dashboard", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/customer\/dashboard/, { timeout: 8000 });
  });
});

// ─────────────────────────────────────────────────────────
//  CONTRACTOR CANNOT ACCESS CUSTOMER PAGES
// ─────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────
//  LOGGED-IN USERS CANNOT RE-VISIT THEIR OWN LOGIN PAGES
// ─────────────────────────────────────────────────────────
test.describe("🔒 No Re-login for Authenticated Users", () => {
  test("logged-in customer visiting /customer/login is redirected to dashboard", async ({ page }) => {
    await loginAsCustomer(page);
    await page.goto("/customer/login");
    await expect(page).toHaveURL(/\/customer\/dashboard/, { timeout: 8000 });
  });

  test("logged-in customer visiting /customer/register is redirected to dashboard", async ({ page }) => {
    await loginAsCustomer(page);
    await page.goto("/customer/register");
    await expect(page).toHaveURL(/\/customer\/dashboard/, { timeout: 8000 });
  });

  test("logged-in contractor visiting /construction/login is redirected to dashboard", async ({ page }) => {
    await loginAsContractor(page);
    await page.goto("/construction/login");
    await expect(page).toHaveURL(/\/construction\/dashboard/, { timeout: 8000 });
  });

  test("logged-in contractor visiting /construction/register is redirected to dashboard", async ({ page }) => {
    await loginAsContractor(page);
    await page.goto("/construction/register");
    await expect(page).toHaveURL(/\/construction\/dashboard/, { timeout: 8000 });
  });
});

// ─────────────────────────────────────────────────────────
//  ADMIN DASHBOARD
// ─────────────────────────────────────────────────────────
test.describe("🔒 Admin — Access Control", () => {
  test("admin can access /dashboard", async ({ page }) => {
    await loginAsAdmin(page);
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("admin dashboard shows admin content (not customer/contractor)", async ({ page }) => {
    await loginAsAdmin(page);
    await expect(page.getByText(/admin|dashboard|users|site/i).first()).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────
//  SESSION EXPIRY SIMULATION
// ─────────────────────────────────────────────────────────
test.describe("🔒 Session / Cookie Handling", () => {
  test("clearing cookies on /customer/dashboard redirects to login", async ({ page }) => {
    await loginAsCustomer(page);
    await page.context().clearCookies();
    await page.reload();
    await expect(page).toHaveURL(/\/customer\/login/, { timeout: 8000 });
  });

  test("clearing cookies on /construction/dashboard redirects to login", async ({ page }) => {
    await loginAsContractor(page);
    await page.context().clearCookies();
    await page.reload();
    await expect(page).toHaveURL(/\/construction\/login/, { timeout: 8000 });
  });
});
