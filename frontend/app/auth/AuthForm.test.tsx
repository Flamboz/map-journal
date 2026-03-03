import { render, screen } from "@testing-library/react";
import { useForm, type FieldErrors } from "react-hook-form";
import { describe, it, expect, vi } from "vitest";
import { AuthForm } from "./AuthForm";
import type { AuthFormValues } from "./auth-schema";

type AuthFormHarnessProps = {
  isSubmitting?: boolean;
  serverError?: string | null;
  errors?: FieldErrors<AuthFormValues>;
  submitLabel?: string;
};

function AuthFormHarness({
  isSubmitting = false,
  serverError,
  errors,
  submitLabel = "Sign in",
}: AuthFormHarnessProps) {
  const { register } = useForm<AuthFormValues>();

  return (
    <AuthForm
      register={register}
      errors={errors ?? {}}
      isSubmitting={isSubmitting}
      onSubmit={vi.fn()}
      submitLabel={submitLabel}
      serverError={serverError}
    />
  );
}

describe("AuthForm", () => {
  it("renders email, password and submit button", () => {
    const { container } = render(<AuthFormHarness submitLabel="Register" />);

    const emailInput = screen.getByRole("textbox");
    const passwordInput = container.querySelector("input[type='password']");

    expect(emailInput).toBeInTheDocument();
    expect(passwordInput).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Register" })).toBeInTheDocument();
  });

  it("disables submit button when submitting", () => {
    render(<AuthFormHarness isSubmitting />);

    expect(screen.getByRole("button", { name: "Sign in" })).toBeDisabled();
  });

  it("shows field and server errors", () => {
    render(
      <AuthFormHarness
        serverError="Sign in is temporarily unavailable. Please try again."
      />,
    );

    expect(screen.getByText("Sign in is temporarily unavailable. Please try again.")).toBeInTheDocument();
  });
});
