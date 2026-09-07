import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// All vi.mock calls MUST be at the top level
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => ({ get: () => null }),
}));

vi.mock("next-auth/react", () => ({
  signIn: vi.fn(),
  getSession: vi.fn(),
}));

import { CustomerLoginForm } from "@/components/auth/customer-login-form";
import { signIn, getSession } from "next-auth/react";

describe("CustomerLoginForm", () => {
  it("renders email and password fields", () => {
    render(<CustomerLoginForm />);
    expect(screen.getByPlaceholderText(/you@example.com/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/enter your password/i)).toBeInTheDocument();
  });

  it("renders Sign In button", () => {
    render(<CustomerLoginForm />);
    expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument();
  });

  it("shows error on invalid credentials", async () => {
    vi.mocked(signIn).mockResolvedValueOnce({
      error: "CredentialsSignin",
      ok: false,
      status: 401,
      url: null,
    });

    const user = userEvent.setup();
    render(<CustomerLoginForm />);

    await user.type(screen.getByPlaceholderText(/you@example.com/i), "wrong@email.com");
    await user.type(screen.getByPlaceholderText(/enter your password/i), "wrongpass");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText(/invalid email or password/i)).toBeInTheDocument();
    });
  });

  it("calls signIn with correct credentials on submit", async () => {
    vi.mocked(signIn).mockResolvedValueOnce({ error: null, ok: true, status: 200, url: null });
    vi.mocked(getSession).mockResolvedValueOnce({
      user: { role: "CLIENT", email: "customer@buildpro.com", name: "Test" },
      expires: "",
    });

    const user = userEvent.setup();
    render(<CustomerLoginForm />);

    await user.type(screen.getByPlaceholderText(/you@example.com/i), "customer@buildpro.com");
    await user.type(screen.getByPlaceholderText(/enter your password/i), "Customer@123");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(signIn).toHaveBeenCalledWith(
        "credentials",
        expect.objectContaining({
          email: "customer@buildpro.com",
          password: "Customer@123",
          redirect: false,
        })
      );
    });
  });
});
