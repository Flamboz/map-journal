const authErrorMessages: Record<string, string> = {
  CredentialsSignin: "Invalid email or password.",
  INVALID_CREDENTIALS: "Invalid email or password.",
  INVALID_INPUT: "Please enter a valid email and password.",
  AUTH_UNAVAILABLE: "Sign in is temporarily unavailable. Please try again.",
};

export function getAuthErrorMessage(error?: string | null) {
  if (!error) {
    return "Unable to sign in. Please try again.";
  }

  return authErrorMessages[error] ?? "Unable to sign in. Please try again.";
}