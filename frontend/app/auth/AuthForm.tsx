"use client";

import type { FieldErrors, UseFormRegister } from "react-hook-form";
import type { AuthFormValues } from "./auth-schema";

type AuthFormProps = {
  register: UseFormRegister<AuthFormValues>;
  errors: FieldErrors<AuthFormValues>;
  isSubmitting: boolean;
  onSubmit: () => void;
  submitLabel: string;
  serverError?: string | null;
};

export function AuthForm({
  register,
  errors,
  isSubmitting,
  onSubmit,
  submitLabel,
  serverError,
}: AuthFormProps) {
  const emailError = typeof errors.email?.message === "string" ? errors.email.message : null;
  const passwordError = typeof errors.password?.message === "string" ? errors.password.message : null;

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      <div>
        <label className="mb-1 flex items-center gap-1.5 text-sm font-semibold text-slate-800" htmlFor="auth-email">
          <span aria-hidden="true" className="h-2 w-2 rounded-full bg-[color:var(--accent-indicator)]" />
          <span>Email</span>
        </label>
        <input
          id="auth-email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          className={`w-full rounded-[var(--radius-md)] border bg-[color:var(--paper-surface)] px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[color:var(--focus-border)] focus:ring-2 focus:ring-[color:var(--focus-ring)]/70 ${
            emailError ? "border-red-600" : "border-[color:var(--border-soft)]"
          }`}
          {...register("email")}
        />
        {emailError && <p className="mt-1 text-sm text-red-600">{emailError}</p>}
      </div>

      <div>
        <label className="mb-1 flex items-center gap-1.5 text-sm font-semibold text-slate-800" htmlFor="auth-password">
          <span aria-hidden="true" className="h-2 w-2 rounded-full bg-[color:var(--accent-indicator)]" />
          <span>Password</span>
        </label>
        <input
          id="auth-password"
          type="password"
          autoComplete={submitLabel === "Register" ? "new-password" : "current-password"}
          placeholder="At least 8 characters"
          className={`w-full rounded-[var(--radius-md)] border bg-[color:var(--paper-surface)] px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[color:var(--focus-border)] focus:ring-2 focus:ring-[color:var(--focus-ring)]/70 ${
            passwordError ? "border-red-600" : "border-[color:var(--border-soft)]"
          }`}
          {...register("password")}
        />
        {passwordError && <p className="mt-1 text-sm text-red-600">{passwordError}</p>}
      </div>

      <div className="rounded-[var(--radius-md)] border border-[color:var(--border-soft)] bg-[color:var(--paper-muted)] px-4 py-3 text-sm text-slate-700">
        Your journal stays private to your account and opens directly back into the map experience.
      </div>

      <div>
        <button
          className="w-full rounded-[var(--radius-md)] bg-[color:var(--accent-primary)] px-4 py-3 text-sm font-semibold text-white transition hover:translate-y-[-1px] hover:bg-[color:var(--accent-primary-strong)] hover:shadow-[0_10px_24px_rgba(180,72,42,0.3)] disabled:opacity-50"
          type="submit"
          disabled={isSubmitting}
        >
          {submitLabel}
        </button>
      </div>

      {serverError && (
        <div className="rounded-[var(--radius-md)] border border-red-200 bg-red-50 px-4 py-3 text-red-600">
          <p>{serverError}</p>
        </div>
      )}
    </form>
  );
}