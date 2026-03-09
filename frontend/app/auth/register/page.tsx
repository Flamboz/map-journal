"use client";
import React, { Suspense } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
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
    <div className="max-w-md mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Sign up</h1>
      <AuthForm
        register={register}
        errors={errors}
        isSubmitting={isSubmitting}
        onSubmit={handleSubmit(onSubmit)}
        submitLabel="Register"
        serverError={serverError}
      />
      <p className="text-center text-sm mt-6">
        Already have an account?{" "}
        <Link href={`/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`} className="text-blue-600 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterPageContent />
    </Suspense>
  );
}
