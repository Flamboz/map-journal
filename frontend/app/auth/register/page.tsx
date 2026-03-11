"use client";
import React, { Suspense } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { registerAndSignIn } from "../auth-client";
import { AuthForm } from "../AuthForm";
import { registerSchema, type AuthFormValues } from "../auth-schema";
import { getSafeCallbackUrl } from "../callback-url";

const schema = registerSchema;

function RegisterPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AuthFormValues>({ resolver: zodResolver(schema) });

  const [serverError, setServerError] = useState<string | null>(null);
  const callbackUrl = getSafeCallbackUrl(searchParams.get("callbackUrl"));

  async function onSubmit(values: AuthFormValues) {
    setServerError(null);
    const result = await registerAndSignIn(values);

    if (!result.ok) {
      setServerError(result.error);
      return;
    }

    router.push(callbackUrl);
  }

  return (
    <section className="min-h-[calc(100vh-var(--topbar-height))] bg-[radial-gradient(circle_at_top_left,_rgba(212,90,54,0.14),_transparent_32%),linear-gradient(180deg,_#faf8f4_0%,_#f4ede1_100%)] px-4 py-8 sm:px-6 lg:px-10 lg:py-12">
      <div className="mx-auto max-w-xl">
        <div className="paper-card flex flex-col justify-between p-6 sm:p-8 lg:p-10">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#9b6b57]">Create Account</p>
            <h1 className="mt-4 text-4xl leading-tight text-slate-900 sm:text-5xl">Register</h1>
            <p className="mt-3 max-w-lg text-base leading-7 text-slate-700">
              Create your account to start saving events, labels, and photos in your map journal.
            </p>
            <div className="mt-6">
              <AuthForm
                register={register}
                errors={errors}
                isSubmitting={isSubmitting}
                onSubmit={handleSubmit(onSubmit)}
                submitLabel="Register"
                serverError={serverError}
              />
            </div>
          </div>

          <p className="mt-8 border-t border-[color:var(--border-soft)] pt-5 text-sm text-slate-700">
            Already have an account?{" "}
            <Link
              href={`/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`}
              className="font-semibold text-[#a7492a] transition hover:text-[#8a3d23]"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterPageContent />
    </Suspense>
  );
}
