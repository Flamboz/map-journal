const DEFAULT_API_URL = "http://localhost:4000";

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? process.env.BACKEND_URL ?? DEFAULT_API_URL;

export function resolveApiUrl(urlOrPath: string): string {
  if (!urlOrPath) {
    return urlOrPath;
  }

  if (/^https?:\/\//i.test(urlOrPath)) {
    return urlOrPath;
  }

  return new URL(urlOrPath, API_URL).toString();
}