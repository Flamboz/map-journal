import type { ReactNode } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect, beforeEach } from "vitest";
import SignInPage from "./page";

const mockPush = vi.hoisted(() => vi.fn());
const mockSignInWithCredentials = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: ReactNode; href: string }) => <a href={href}>{children}</a>,
}));

vi.mock("../auth-client", () => ({
  signInWithCredentials: mockSignInWithCredentials,
}));

describe("SignInPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows validation and blocks submit for invalid form", async () => {
    const user = userEvent.setup();
    render(<SignInPage />);

    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(mockSignInWithCredentials).not.toHaveBeenCalled();
    expect(await screen.findByText(/invalid email/i)).toBeInTheDocument();
  });

  it("shows email validation for invalid email", async () => {
    const user = userEvent.setup();
    const { container } = render(<SignInPage />);

    const emailInput = container.querySelector("input[name='email']");
    const passwordInput = container.querySelector("input[type='password']");

    expect(emailInput).not.toBeNull();
    expect(passwordInput).not.toBeNull();

    await user.type(emailInput as HTMLInputElement, "not-an-email");
    await user.type(passwordInput as HTMLInputElement, "password123");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(mockSignInWithCredentials).not.toHaveBeenCalled();
    expect(await screen.findByText("Invalid email address")).toBeInTheDocument();
  });

  it("submits valid credentials and redirects on success", async () => {
    const user = userEvent.setup();
    mockSignInWithCredentials.mockResolvedValue({ ok: true });

    const { container } = render(<SignInPage />);
    const emailInput = container.querySelector("input[name='email']");
    const passwordInput = container.querySelector("input[type='password']");

    expect(emailInput).not.toBeNull();
    expect(passwordInput).not.toBeNull();

    await user.type(emailInput as HTMLInputElement, "user@example.com");
    await user.type(passwordInput as HTMLInputElement, "password123");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() => {
      expect(mockSignInWithCredentials).toHaveBeenCalledWith({
        email: "user@example.com",
        password: "password123",
      });
    });
    expect(mockPush).toHaveBeenCalledWith("/");
  });

  it("shows server error and does not redirect on failed sign in", async () => {
    const user = userEvent.setup();
    mockSignInWithCredentials.mockResolvedValue({
      ok: false,
      error: "Invalid email or password.",
    });

    const { container } = render(<SignInPage />);
    const emailInput = container.querySelector("input[name='email']");
    const passwordInput = container.querySelector("input[type='password']");

    expect(emailInput).not.toBeNull();
    expect(passwordInput).not.toBeNull();

    await user.type(emailInput as HTMLInputElement, "user@example.com");
    await user.type(passwordInput as HTMLInputElement, "password123");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByText("Invalid email or password.")).toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();
  });
});
