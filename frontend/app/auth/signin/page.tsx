"use client";
import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { signInWithCredentials } from "../auth-client";
import { AuthForm } from "../AuthForm";
import { signInSchema, type AuthFormValues } from "../auth-schema";
import { getSafeCallbackUrl } from "../callback-url";

const schema = signInSchema;

export default function SignInPage() {
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
    const result = await signInWithCredentials(values);

    if (!result.ok) {
      setServerError(result.error);
      return;
    }

    router.push(callbackUrl);
  }

  return (
    <div className="max-w-md mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Sign in</h1>
      <AuthForm
        register={register}
        errors={errors}
        isSubmitting={isSubmitting}
        onSubmit={handleSubmit(onSubmit)}
        submitLabel="Sign in"
        serverError={serverError}
      />
      <p className="text-sm text-center mt-4">
        Don&apos;t have an account?{" "}
        <Link href={`/auth/register?callbackUrl=${encodeURIComponent(callbackUrl)}`} className="text-blue-600 underline">
          Register here
        </Link>
      </p>
    </div>
  );
}
