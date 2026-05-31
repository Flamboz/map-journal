const DEFAULT_API_URL = "http://localhost:4000";

function stripTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

function joinPath(base: string, pathname: string): string {
  if (!pathname) return base;
  if (/^https?:\/\//i.test(pathname)) return pathname;
  return `${base}${pathname.startsWith("/") ? "" : "/"}${pathname}`;
}

function resolveClientBase(): string {
  const base = process.env.NEXT_PUBLIC_API_URL || DEFAULT_API_URL;
  if (typeof window !== "undefined") {
    return stripTrailingSlash(new URL(base, window.location.origin).toString());
  }
  return stripTrailingSlash(base);
}

function resolveFetchBase(): string {
  if (typeof window !== "undefined") {
    return resolveClientBase();
  }

  const backend = process.env.BACKEND_URL;
  if (backend) return stripTrailingSlash(backend);

  const pub = process.env.NEXT_PUBLIC_API_URL;
  if (pub && /^https?:\/\//i.test(pub)) return stripTrailingSlash(pub);

  return DEFAULT_API_URL;
}

export const API_URL = resolveFetchBase();

const CLIENT_API_URL = resolveClientBase();

export function resolveApiUrl(urlOrPath: string): string {
  if (!urlOrPath) return urlOrPath;
  return joinPath(CLIENT_API_URL, urlOrPath);
}
