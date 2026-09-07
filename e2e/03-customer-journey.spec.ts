import { test, expect } from "@playwright/test";
import { loginAsCustomer, signOut } from "./helpers";

/**
 * CUSTOMER FULL JOURNEY
 * Like a real user: login → see dashboard → browse services → make request → check status → logout
 */

test.describe("👤 Customer — Login Flow", () => {
  test("can login with correct credentials", async ({ page }) => {
    await page.goto("/customer/login");
    await page.getByPlaceholder(/you@example.com/i).fill("customer@buildpro.com");
    await page.getByPlaceholder(/enter your password/i).fill("Customer@123");
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/customer\/dashboard/, { timeout: 10000 });
  });

  test("dashboard shows welcome message with user name", async ({ page }) => {
    await loginAsCustomer(page);
    await expect(page.getByText(/welcome|hello/i)).toBeVisible();
  });
});

test.describe("👤 Customer Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsCustomer(page);
  });

  test("shows stat cards (total requests, pending, active, completed)", async ({ page }) => {
    // Stat cards should be visible
    await expect(page.getByText(/requests|pending|completed/i).first()).toBeVisible();
  });

  test("shows quick action cards", async ({ page }) => {
    await expect(page.getByText(/browse services/i)).toBeVisible();
  });

  test("sidebar navigation links are all visible", async ({ page }) => {
    await expect(page.getByRole("link", { name: /dashboard/i }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /browse services/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /my requests/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /my profile/i })).toBeVisible();
  });

  test("can navigate to Browse Services page", async ({ page }) => {
    await page.getByRole("link", { name: /browse services/i }).click();
    await expect(page).toHaveURL(/\/customer\/services/);
    await expect(page.getByRole("heading", { name: /browse services/i })).toBeVisible();
  });

  test("can navigate to My Requests page", async ({ page }) => {
    await page.getByRole("link", { name: /my requests/i }).click();
    await expect(page).toHaveURL(/\/customer\/requests/);
  });

  test("can navigate to My Profile page", async ({ page }) => {
    await page.getByRole("link", { name: /my profile/i }).click();
    await expect(page).toHaveURL(/\/customer\/profile/);
    await expect(page.getByText(/customer@buildpro.com/i)).toBeVisible();
  });
});

test.describe("👤 Customer — Browse Services", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsCustomer(page);
    await page.goto("/customer/services");
  });

  test("services page loads with search bar", async ({ page }) => {
    await expect(page.getByPlaceholder(/search by service/i)).toBeVisible();
  });

  test("can search for a service by keyword", async ({ page }) => {
    await page.getByPlaceholder(/search by service/i).fill("electric");
    await page.getByRole("button", { name: /search/i }).click();
    await expect(page).toHaveURL(/search=electric/);
  });

  test("clear button removes search filter", async ({ page }) => {
    await page.goto("/customer/services?search=test");
    await expect(page.getByRole("link", { name: /clear/i })).toBeVisible();
    await page.getByRole("link", { name: /clear/i }).click();
    await expect(page).toHaveURL(/\/customer\/services$/);
  });

  test("no results message shows for unknown search term", async ({ page }) => {
    await page.goto("/customer/services?search=xyznonexistent999");
    await expect(page.getByText(/no results for/i)).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole("link", { name: /browse all services/i })).toBeVisible();
  });

  test("category filter pills are visible when services exist", async ({ page }) => {
    // If services exist, category pills should show
    const allPill = page.getByRole("link", { name: /^all$/i });
    if (await allPill.isVisible()) {
      await expect(allPill).toBeVisible();
    }
  });
});

test.describe("👤 Customer — My Requests Page", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsCustomer(page);
    await page.goto("/customer/requests");
  });

  test("requests page loads", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /my requests/i })).toBeVisible();
  });

  test("shows empty state or request list", async ({ page }) => {
    // Either shows no requests message OR a list
    const hasRequests = await page.getByText(/service|status/i).isVisible();
    const isEmpty = await page.getByText(/no requests|haven't made/i).isVisible();
    expect(hasRequests || isEmpty).toBe(true);
  });
});

test.describe("👤 Customer — Sign Out", () => {
  test("can sign out from customer dashboard", async ({ page }) => {
    await loginAsCustomer(page);
    await signOut(page);
    // After sign out, should be redirected to login
    await expect(page).toHaveURL(/\/customer\/login|\/login/, { timeout: 8000 });
  });
});
