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
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium">Email</label>
        <input
          className={`w-full border p-2 ${errors.email ? "border-red-600" : "border-gray-300"}`}
          {...register("email")}
        />
        {typeof errors.email?.message === "string" && <p className="text-sm text-red-600">{errors.email.message}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium">Password</label>
        <input
          type="password"
          className={`w-full border p-2 ${errors.password ? "border-red-600" : "border-gray-300"}`}
          {...register("password")}
        />
        {typeof errors.password?.message === "string" && <p className="text-sm text-red-600">{errors.password.message}</p>}
      </div>
      <div>
        <button className="px-4 py-2 bg-blue-600 text-white disabled:opacity-50" type="submit" disabled={isSubmitting}>
          {submitLabel}
        </button>
      </div>
      {serverError && (
        <div className="text-red-600">
          <p>{serverError}</p>
        </div>
      )}
    </form>
  );
}