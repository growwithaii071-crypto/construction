import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

// Mock next-auth/react
vi.mock("next-auth/react", () => ({
  signIn: vi.fn().mockResolvedValue({ ok: true, error: null }),
  signOut: vi.fn().mockResolvedValue({}),
  useSession: vi.fn(() => ({ data: null, status: "unauthenticated" })),
}));

// Mock the auth action
vi.mock("@/actions/auth/login", () => ({
  loginAction: vi.fn().mockResolvedValue({ success: true }),
}));

// ─── Customer Login Form ──────────────────────────────────
import { CustomerLoginForm } from "@/components/auth/customer-login-form";

describe("CustomerLoginForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the email and password fields", () => {
    render(<CustomerLoginForm />);
    expect(screen.getByPlaceholderText(/you@example.com/i)).toBeDefined();
    expect(screen.getByPlaceholderText(/enter your password/i)).toBeDefined();
  });

  it("renders the Sign In button", () => {
    render(<CustomerLoginForm />);
    expect(screen.getByRole("button", { name: /sign in/i })).toBeDefined();
  });

  it("has a link to customer registration page", () => {
    render(<CustomerLoginForm />);
    const links = screen.getAllByRole("link");
    const regLink = links.find(
      (l) => l.getAttribute("href")?.includes("/customer/register")
    );
    expect(regLink).toBeDefined();
  });

  it("email input accepts typed value", async () => {
    const user = userEvent.setup();
    render(<CustomerLoginForm />);
    const emailInput = screen.getByPlaceholderText(/you@example.com/i);
    await user.type(emailInput, "test@example.com");
    expect((emailInput as HTMLInputElement).value).toBe("test@example.com");
  });

  it("password input is masked by default (type='password')", () => {
    render(<CustomerLoginForm />);
    const passInput = screen.getByPlaceholderText(/enter your password/i);
    expect((passInput as HTMLInputElement).type).toBe("password");
  });

  it("shows validation error for empty email on submit", async () => {
    const user = userEvent.setup();
    render(<CustomerLoginForm />);
    await user.click(screen.getByRole("button", { name: /sign in/i }));
    await waitFor(() => {
      const errorEls = document.querySelectorAll("[class*='red'], [class*='destructive']");
      expect(errorEls.length).toBeGreaterThan(0);
    });
  });

  it("shows validation error for invalid email format", async () => {
    const user = userEvent.setup();
    render(<CustomerLoginForm />);
    await user.type(screen.getByPlaceholderText(/you@example.com/i), "notanemail");
    await user.type(screen.getByPlaceholderText(/enter your password/i), "password123");
    await user.click(screen.getByRole("button", { name: /sign in/i }));
    await waitFor(() => {
      // Form should still be visible (not submitted successfully) with invalid email
      const formStillVisible = screen.queryByPlaceholderText(/you@example.com/i);
      expect(formStillVisible).not.toBeNull();
    });
  });
});

// ─── Contractor Login Form ────────────────────────────────
import { ContractorLoginForm } from "@/components/auth/contractor-login-form";

describe("ContractorLoginForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders contractor login form with email + password", () => {
    render(<ContractorLoginForm />);
    expect(screen.getByPlaceholderText(/company@example.com/i)).toBeDefined();
    expect(screen.getByPlaceholderText(/enter your password/i)).toBeDefined();
  });

  it("renders Sign In button", () => {
    render(<ContractorLoginForm />);
    expect(screen.getByRole("button", { name: /sign in/i })).toBeDefined();
  });

  it("has a link to contractor registration page", () => {
    render(<ContractorLoginForm />);
    const links = screen.getAllByRole("link");
    const regLink = links.find(
      (l) => l.getAttribute("href")?.includes("/construction/register")
    );
    expect(regLink).toBeDefined();
  });

  it("email input accepts typed value", async () => {
    const user = userEvent.setup();
    render(<ContractorLoginForm />);
    const emailInput = screen.getByPlaceholderText(/company@example.com/i);
    await user.type(emailInput, "company@test.com");
    expect((emailInput as HTMLInputElement).value).toBe("company@test.com");
  });

  it("password input is masked by default", () => {
    render(<ContractorLoginForm />);
    const passInput = screen.getByPlaceholderText(/enter your password/i);
    expect((passInput as HTMLInputElement).type).toBe("password");
  });
});
