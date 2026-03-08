import type { ReactNode } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect, beforeEach } from "vitest";
import RegisterPage from "./page";

const mockPush = vi.hoisted(() => vi.fn());
const mockRegisterAndSignIn = vi.hoisted(() => vi.fn());
const mockSearchParamGet = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => ({ get: mockSearchParamGet }),
}));

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: ReactNode; href: string }) => <a href={href}>{children}</a>,
}));

vi.mock("../auth-client", () => ({
  registerAndSignIn: mockRegisterAndSignIn,
}));

describe("RegisterPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParamGet.mockReturnValue(null);
  });

  it("shows password validation for short password", async () => {
    const user = userEvent.setup();
    const { container } = render(<RegisterPage />);

    const emailInput = screen.getByRole("textbox");
    const passwordInput = container.querySelector("input[type='password']");

    expect(passwordInput).not.toBeNull();

    await user.type(emailInput, "user@example.com");
    await user.type(passwordInput as HTMLInputElement, "short");
    await user.click(screen.getByRole("button", { name: "Register" }));

    expect(mockRegisterAndSignIn).not.toHaveBeenCalled();
    expect(await screen.findByText("Password must be at least 8 characters")).toBeInTheDocument();
  });

  it("shows email validation for invalid email", async () => {
    const user = userEvent.setup();
    const { container } = render(<RegisterPage />);

    const emailInput = screen.getByRole("textbox");
    const passwordInput = container.querySelector("input[type='password']");

    expect(passwordInput).not.toBeNull();

    await user.type(emailInput, "not-an-email");
    await user.type(passwordInput as HTMLInputElement, "password123");
    await user.click(screen.getByRole("button", { name: "Register" }));

    expect(mockRegisterAndSignIn).not.toHaveBeenCalled();
    expect(await screen.findByText("Invalid email address")).toBeInTheDocument();
  });

  it("submits valid data and redirects on success", async () => {
    const user = userEvent.setup();
    mockRegisterAndSignIn.mockResolvedValue({ ok: true });

    const { container } = render(<RegisterPage />);
    const emailInput = screen.getByRole("textbox");
    const passwordInput = container.querySelector("input[type='password']");

    expect(passwordInput).not.toBeNull();

    await user.type(emailInput, "user@example.com");
    await user.type(passwordInput as HTMLInputElement, "password123");
    await user.click(screen.getByRole("button", { name: "Register" }));

    await waitFor(() => {
      expect(mockRegisterAndSignIn).toHaveBeenCalledWith({
        email: "user@example.com",
        password: "password123",
      });
    });
    expect(mockPush).toHaveBeenCalledWith("/");
  });

  it("shows server error and does not redirect on failed registration", async () => {
    const user = userEvent.setup();
    mockRegisterAndSignIn.mockResolvedValue({
      ok: false,
      error: "Registration failed",
    });

    const { container } = render(<RegisterPage />);
    const emailInput = screen.getByRole("textbox");
    const passwordInput = container.querySelector("input[type='password']");

    expect(passwordInput).not.toBeNull();

    await user.type(emailInput, "user@example.com");
    await user.type(passwordInput as HTMLInputElement, "password123");
    await user.click(screen.getByRole("button", { name: "Register" }));

    expect(await screen.findByText("Registration failed")).toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();
  });
});
