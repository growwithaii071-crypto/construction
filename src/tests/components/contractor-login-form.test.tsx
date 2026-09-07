import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => ({ get: () => null }),
}));

vi.mock("next-auth/react", () => ({
  signIn: vi.fn(),
  getSession: vi.fn(),
}));

import { ContractorLoginForm } from "@/components/auth/contractor-login-form";

describe("ContractorLoginForm", () => {
  it("renders contractor login form", () => {
    render(<ContractorLoginForm />);
    expect(screen.getByPlaceholderText(/company@example.com/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/enter your password/i)).toBeInTheDocument();
  });

  it("has link to customer portal", () => {
    render(<ContractorLoginForm />);
    expect(screen.getByText(/customer portal/i)).toBeInTheDocument();
  });

  it("has link to register company", () => {
    render(<ContractorLoginForm />);
    expect(screen.getByText(/register your construction company/i)).toBeInTheDocument();
  });
});
