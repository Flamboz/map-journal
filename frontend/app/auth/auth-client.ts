import { signIn, type SignInResponse } from "next-auth/react";
import { getAuthErrorMessage } from "./auth-error";
import type { AuthFormValues } from "./auth-schema";

type AuthResult =
  | { ok: true }
  | { ok: false; error: string };

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? process.env.BACKEND_URL ?? "http://localhost:4000";

export async function registerAndSignIn(values: AuthFormValues): Promise<AuthResult> {
  try {
    const registerResponse = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(values),
    });

    const registerData = (await registerResponse.json().catch(() => ({}))) as { message?: string };
    if (!registerResponse.ok) {
      return { ok: false, error: registerData.message ?? "Registration failed" };
    }

    const signInResponse = (await signIn("credentials", {
      redirect: false,
      email: values.email,
      password: values.password,
    })) as SignInResponse | undefined;

    if (!signInResponse || signInResponse.error || !signInResponse.ok) {
      return { ok: false, error: getAuthErrorMessage(signInResponse?.error ?? null) };
    }

    return { ok: true };
  } catch {
    return { ok: false, error: getAuthErrorMessage("AUTH_UNAVAILABLE") };
  }
}

export async function signInWithCredentials(values: AuthFormValues): Promise<AuthResult> {
  try {
    const signInResponse = (await signIn("credentials", {
      redirect: false,
      email: values.email,
      password: values.password,
    })) as SignInResponse | undefined;

    if (!signInResponse || signInResponse.error || !signInResponse.ok) {
      return { ok: false, error: getAuthErrorMessage(signInResponse?.error ?? null) };
    }

    return { ok: true };
  } catch {
    return { ok: false, error: getAuthErrorMessage("AUTH_UNAVAILABLE") };
  }
}