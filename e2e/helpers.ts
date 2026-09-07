/**
 * E2E Test Helpers — shared login utilities used across test files
 */
import { Page } from "@playwright/test";

export async function loginAsCustomer(page: Page) {
  await page.goto("/customer/login");
  await page.getByPlaceholder(/you@example.com/i).fill("customer@buildpro.com");
  await page.getByPlaceholder(/enter your password/i).fill("Customer@123");
  await page.getByRole("button", { name: /sign in/i }).click();
  await page.waitForURL(/\/customer\/dashboard/, { timeout: 10000 });
}

export async function loginAsContractor(page: Page) {
  await page.goto("/construction/login");
  await page.getByPlaceholder(/company@example.com/i).fill("contractor@buildpro.com");
  await page.getByPlaceholder(/enter your password/i).fill("Contractor@123");
  await page.getByRole("button", { name: /sign in/i }).click();
  await page.waitForURL(/\/construction\/dashboard/, { timeout: 10000 });
}

export async function loginAsAdmin(page: Page) {
  await page.goto("/login");
  await page.getByPlaceholder(/email/i).first().fill("admin@buildpro.com");
  await page.getByPlaceholder(/password/i).first().fill("Admin@123");
  await page.getByRole("button", { name: /sign in|log in/i }).click();
  await page.waitForURL(/\/dashboard/, { timeout: 10000 });
}

export async function signOut(page: Page) {
  // Try sidebar sign out button
  const signOutBtn = page.getByTitle("Sign out").or(page.getByRole("button", { name: /sign out/i }));
  if (await signOutBtn.isVisible()) {
    await signOutBtn.click();
  }
}
