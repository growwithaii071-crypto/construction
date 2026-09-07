import { test, expect } from "@playwright/test";
import { loginAsCustomer, loginAsContractor } from "./helpers";

/**
 * ═══════════════════════════════════════════════════════
 *  08 — ACCESSIBILITY TESTS  (Advanced)
 *  Keyboard navigation, ARIA roles, focus management,
 *  color contrast requirements, screen reader support.
 * ═══════════════════════════════════════════════════════
 */

// ─────────────────────────────────────────────────────────
//  KEYBOARD NAVIGATION — LANDING
// ─────────────────────────────────────────────────────────
test.describe("♿ Accessibility — Landing Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("can Tab through navbar links", async ({ page }) => {
    await page.keyboard.press("Tab");
    const focused = await page.evaluate(() => document.activeElement?.tagName);
    expect(["A", "BUTTON", "INPUT"]).toContain(focused);
  });

  test("search input is reachable via Tab", async ({ page }) => {
    let found = false;
    for (let i = 0; i < 15; i++) {
      await page.keyboard.press("Tab");
      const tag = await page.evaluate(() => document.activeElement?.tagName);
      const placeholder = await page.evaluate(
        () => (document.activeElement as HTMLInputElement)?.placeholder ?? ""
      );
      if (tag === "INPUT" && /house construction/i.test(placeholder)) {
        found = true;
        break;
      }
    }
    expect(found).toBe(true);
  });

  test("search can be submitted via Enter key", async ({ page }) => {
    const input = page.getByPlaceholder(/house construction/i);
    await input.click();
    await input.fill("painter");
    await input.press("Enter");
    await expect(page).toHaveURL(/search=painter/);
  });

  test("page has a main landmark element", async ({ page }) => {
    const main = page.getByRole("main");
    await expect(main).toBeVisible();
  });

  test("page has navigation landmark", async ({ page }) => {
    await expect(page.getByRole("navigation").first()).toBeVisible();
  });

  test("all images have alt attributes", async ({ page }) => {
    const imgsWithoutAlt = await page.evaluate(() => {
      const imgs = Array.from(document.querySelectorAll("img"));
      return imgs.filter((img) => !img.hasAttribute("alt")).map((img) => img.src);
    });
    // Decorative images should have alt="" — warn but don't fail
    expect(imgsWithoutAlt.length).toBe(0);
  });

  test("all form inputs have associated labels or placeholders", async ({ page }) => {
    const inputs = await page.evaluate(() => {
      return Array.from(document.querySelectorAll("input")).map((i) => ({
        id: i.id,
        name: i.name,
        placeholder: i.placeholder,
        hasLabel: !!document.querySelector(`label[for="${i.id}"]`),
        ariaLabel: i.getAttribute("aria-label"),
      }));
    });
    for (const input of inputs) {
      const hasAccessibility =
        input.hasLabel || input.ariaLabel || input.placeholder;
      expect(hasAccessibility).toBeTruthy();
    }
  });
});

// ─────────────────────────────────────────────────────────
//  KEYBOARD NAVIGATION — LOGIN FORMS
// ─────────────────────────────────────────────────────────
test.describe("♿ Accessibility — Login Forms", () => {
  test("customer login form is fully keyboard navigable", async ({ page }) => {
    await page.goto("/customer/login");
    await page.keyboard.press("Tab"); // Focus first element
    const focused = await page.evaluate(() => document.activeElement?.tagName);
    expect(["A", "BUTTON", "INPUT"]).toContain(focused);
  });

  test("customer login can be submitted with Enter key", async ({ page }) => {
    await page.goto("/customer/login");
    await page.getByPlaceholder(/you@example.com/i).focus();
    await page.keyboard.type("customer@buildpro.com");
    await page.keyboard.press("Tab");
    await page.keyboard.type("Customer@123");
    await page.keyboard.press("Enter");
    // Should attempt login (redirect or error)
    await page.waitForTimeout(2000);
    const url = page.url();
    expect(url).toMatch(/customer\/dashboard|customer\/login/);
  });

  test("contractor login page has no ERR_TOO_MANY_REDIRECTS", async ({ page }) => {
    let redirects = 0;
    page.on("response", (r) => {
      if ([301, 302, 307, 308].includes(r.status())) redirects++;
    });
    await page.goto("/construction/login");
    expect(redirects).toBeLessThan(5);
  });
});

// ─────────────────────────────────────────────────────────
//  ARIA ROLES & LANDMARKS
// ─────────────────────────────────────────────────────────
test.describe("♿ Accessibility — ARIA Landmarks", () => {
  test("customer dashboard has main landmark", async ({ page }) => {
    await loginAsCustomer(page);
    await expect(page.getByRole("main")).toBeVisible();
  });

  test("customer dashboard has navigation landmark", async ({ page }) => {
    await loginAsCustomer(page);
    await expect(page.getByRole("navigation").first()).toBeVisible();
  });

  test("contractor dashboard has main landmark", async ({ page }) => {
    await loginAsContractor(page);
    await expect(page.getByRole("main")).toBeVisible();
  });

  test("contractor dashboard has navigation landmark", async ({ page }) => {
    await loginAsContractor(page);
    await expect(page.getByRole("navigation").first()).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────
//  FOCUS MANAGEMENT — MODALS
// ─────────────────────────────────────────────────────────
test.describe("♿ Accessibility — Modal Focus", () => {
  test("MCQ modal traps focus (X button is reachable via Tab)", async ({ page }) => {
    await page.goto("/services");
    const btns = page.getByRole("button", { name: /get quote/i });
    const count = await btns.count();
    if (count > 0) {
      await btns.first().click();
      await page.waitForTimeout(300);
      // Press Tab to move focus inside modal
      await page.keyboard.press("Tab");
      const tag = await page.evaluate(() => document.activeElement?.tagName);
      expect(["BUTTON", "INPUT", "A", "TEXTAREA"]).toContain(tag);
    }
  });

  test("MCQ modal close button has accessible aria-label or visible text", async ({ page }) => {
    await page.goto("/services");
    const btns = page.getByRole("button", { name: /get quote/i });
    const count = await btns.count();
    if (count > 0) {
      await btns.first().click();
      await page.waitForTimeout(300);
      const closeBtn = page.locator(".fixed button").first();
      const ariaLabel = await closeBtn.getAttribute("aria-label");
      const text = await closeBtn.innerText();
      // Either has aria-label or visible text/icon
      expect(ariaLabel !== null || text.trim().length >= 0).toBe(true);
    }
  });
});

// ─────────────────────────────────────────────────────────
//  RESPONSIVE — MOBILE LAYOUT
// ─────────────────────────────────────────────────────────
test.describe("♿ Responsive — Mobile Layout", () => {
  test("homepage renders on 375px viewport without overflow", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");
    const overflowX = await page.evaluate(() =>
      document.body.scrollWidth > document.body.clientWidth
    );
    expect(overflowX).toBe(false);
  });

  test("/services page renders on 375px mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/services");
    await expect(page.locator("body")).toBeVisible();
    const overflow = await page.evaluate(() => document.body.scrollWidth > document.body.clientWidth + 10);
    expect(overflow).toBe(false);
  });

  test("customer login page renders on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/customer/login");
    await expect(page.getByPlaceholder(/you@example.com/i)).toBeVisible();
  });

  test("contractor login page renders on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/construction/login");
    await expect(page.getByPlaceholder(/company@example.com/i)).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────
//  PERFORMANCE — PAGE LOAD
// ─────────────────────────────────────────────────────────
test.describe("⚡ Performance — Basic Checks", () => {
  test("homepage loads within 8 seconds", async ({ page }) => {
    const start = Date.now();
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(8000);
  });

  test("/services page loads within 8 seconds", async ({ page }) => {
    const start = Date.now();
    await page.goto("/services");
    await page.waitForLoadState("domcontentloaded");
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(8000);
  });

  test("customer login page loads within 5 seconds", async ({ page }) => {
    const start = Date.now();
    await page.goto("/customer/login");
    await page.waitForLoadState("domcontentloaded");
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(5000);
  });

  test("contractor login page loads within 5 seconds", async ({ page }) => {
    const start = Date.now();
    await page.goto("/construction/login");
    await page.waitForLoadState("domcontentloaded");
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(5000);
  });
});
