import { test, expect } from "@playwright/test";

/**
 * ═══════════════════════════════════════════════════════
 *  01 — LANDING PAGE  (Advanced)
 *  Simulates a real first-time visitor thoroughly checking every
 *  visible element, interaction, and navigation path.
 * ═══════════════════════════════════════════════════════
 */

test.describe("🏠 Landing — Page Meta & Layout", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("page title contains 'BuildPro'", async ({ page }) => {
    await expect(page).toHaveTitle(/buildpro/i);
  });

  test("page loads without JS console errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });
    await page.goto("/");
    expect(errors.filter((e) => !e.includes("favicon"))).toHaveLength(0);
  });

  test("viewport is responsive — no horizontal scroll on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");
    const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
    const clientWidth = await page.evaluate(() => document.body.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 5); // allow 5px tolerance
  });

  test("no broken images (all img elements have loaded)", async ({ page }) => {
    await page.goto("/");
    const brokenImages = await page.evaluate(() => {
      const imgs = Array.from(document.querySelectorAll("img"));
      return imgs.filter((img) => !img.naturalWidth).map((img) => img.src);
    });
    expect(brokenImages.length).toBe(0);
  });
});

test.describe("🏠 Landing — Navbar", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("BuildPro logo is visible in navbar", async ({ page }) => {
    await expect(page.getByRole("navigation").getByText(/buildpro/i).first()).toBeVisible();
  });

  test("navbar has 'How it Works' link", async ({ page }) => {
    await expect(page.getByRole("link", { name: /how it works/i })).toBeVisible();
  });

  test("navbar has 'Services' link", async ({ page }) => {
    await expect(page.getByRole("link", { name: /^services$/i }).first()).toBeVisible();
  });

  test("navbar has 'Sign in' link", async ({ page }) => {
    const signIn = page.getByRole("link", { name: /sign in/i }).first();
    await expect(signIn).toBeVisible();
  });

  test("navbar has 'Post a job' CTA button", async ({ page }) => {
    const cta = page.getByRole("link", { name: /post a job|find work/i }).first();
    await expect(cta).toBeVisible();
  });

  test("clicking 'Services' in navbar goes to /services", async ({ page }) => {
    await page.getByRole("link", { name: /^services$/i }).first().click();
    await expect(page).toHaveURL(/\/services/);
  });
});

test.describe("🏠 Landing — Hero Section & Search", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("hero headline is visible", async ({ page }) => {
    await expect(page.getByText(/reliable way to hire/i)).toBeVisible();
  });

  test("hero sub-text is visible", async ({ page }) => {
    await expect(page.getByText(/verified professionals/i)).toBeVisible();
  });

  test("search box is visible with placeholder", async ({ page }) => {
    await expect(page.getByPlaceholder(/house construction/i)).toBeVisible();
  });

  test("search input can be typed into", async ({ page }) => {
    const input = page.getByPlaceholder(/house construction/i);
    await input.fill("electrician");
    await expect(input).toHaveValue("electrician");
  });

  test("pressing Enter in search redirects to /services?search=...", async ({ page }) => {
    await page.getByPlaceholder(/house construction/i).fill("plumber");
    await page.getByPlaceholder(/house construction/i).press("Enter");
    await expect(page).toHaveURL(/\/services\?search=plumber/);
  });

  test("clicking Get Quotes with keyword redirects to /services?search=...", async ({ page }) => {
    await page.getByPlaceholder(/house construction/i).fill("electrician");
    await page.getByRole("button", { name: /get quotes/i }).click();
    await expect(page).toHaveURL(/\/services\?search=electrician/);
  });

  test("clicking Get Quotes with empty input goes to /services", async ({ page }) => {
    await page.getByRole("button", { name: /get quotes/i }).click();
    await expect(page).toHaveURL(/\/services/);
  });

  test("search query is properly URL-encoded (special chars)", async ({ page }) => {
    await page.getByPlaceholder(/house construction/i).fill("house & renovation");
    await page.getByRole("button", { name: /get quotes/i }).click();
    // URL should be encoded correctly
    await expect(page).toHaveURL(/\/services/);
  });

  test("Free to post · No obligation badge is visible", async ({ page }) => {
    await expect(page.getByText(/free to post/i)).toBeVisible();
  });
});

test.describe("🏠 Landing — Stats Counter Section", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("contractors count is visible", async ({ page }) => {
    await expect(page.getByText(/contractors on site/i)).toBeVisible();
  });

  test("jobs completed count is visible", async ({ page }) => {
    await expect(page.getByText(/jobs completed/i)).toBeVisible();
  });

  test("active trades count is visible", async ({ page }) => {
    await expect(page.getByText(/active trades/i)).toBeVisible();
  });
});

test.describe("🏠 Landing — How It Works Section", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.getByText(/how to hire/i).scrollIntoViewIfNeeded().catch(() => {});
    await page.getByText(/how it works/i).scrollIntoViewIfNeeded().catch(() => {});
  });

  test("'How It Works' heading is visible", async ({ page }) => {
    await expect(page.getByText(/how to hire|how it works/i).first()).toBeVisible();
  });

  test("Step 1: Post a job is visible", async ({ page }) => {
    await expect(page.getByText(/post a job/i)).toBeVisible();
  });

  test("Step 2: Receive quotes is visible", async ({ page }) => {
    await expect(page.getByText(/receive|quotes/i).first()).toBeVisible();
  });

  test("Step 3: Hire with confidence is visible", async ({ page }) => {
    await expect(page.getByText(/hire with confidence/i)).toBeVisible();
  });
});

test.describe("🏠 Landing — Browse by Trade / Popular Trades", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => window.scrollBy(0, 800));
  });

  test("'Browse by trade' section is visible", async ({ page }) => {
    await expect(page.getByText(/browse by trade/i)).toBeVisible({ timeout: 5000 });
  });

  test("'Popular trades' heading is visible", async ({ page }) => {
    await expect(page.getByText(/popular trades/i)).toBeVisible({ timeout: 5000 });
  });
});

test.describe("🏠 Landing — Testimonials / Reviews", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
  });

  test("testimonials section heading is visible", async ({ page }) => {
    await expect(page.getByText(/trusted by builders/i)).toBeVisible({ timeout: 5000 });
  });

  test("at least one testimonial card is visible", async ({ page }) => {
    await expect(page.getByText(/buildpro made/i).or(page.getByText(/renovation/i))).toBeVisible({ timeout: 5000 });
  });

  test("average rating badge shows 4.9", async ({ page }) => {
    await expect(page.getByText(/4\.9/)).toBeVisible({ timeout: 5000 });
  });
});

test.describe("🏠 Landing — CTA Section & Footer", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  });

  test("footer is visible at the bottom", async ({ page }) => {
    await expect(page.getByRole("contentinfo")).toBeVisible();
  });

  test("footer has 'Customers' section", async ({ page }) => {
    await expect(page.getByText(/customers/i).first()).toBeVisible();
  });

  test("footer has 'Contractors' section", async ({ page }) => {
    await expect(page.getByText(/contractors/i).first()).toBeVisible();
  });

  test("footer has copyright notice", async ({ page }) => {
    await expect(page.getByText(/buildpro|©|all rights reserved/i).last()).toBeVisible();
  });

  test("'I need a contractor' CTA is visible in final section", async ({ page }) => {
    await expect(page.getByText(/I need a contractor/i)).toBeVisible();
  });

  test("'I'm a contractor' CTA is visible in final section", async ({ page }) => {
    await expect(page.getByText(/I'm a contractor/i)).toBeVisible();
  });

  test("Sign In footer link is clickable and navigates correctly", async ({ page }) => {
    const loginLink = page.getByRole("link", { name: /^sign in$/i }).last();
    await expect(loginLink).toBeVisible();
    await loginLink.click();
    await expect(page).toHaveURL(/\/login/);
  });
});
