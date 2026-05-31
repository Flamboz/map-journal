const DEFAULT_API_URL = "http://localhost:4000";

function stripTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

function resolveBase(): string {
  if (typeof window !== "undefined") {
    const clientBase = process.env.NEXT_PUBLIC_API_URL || DEFAULT_API_URL;
    return stripTrailingSlash(new URL(clientBase, window.location.origin).toString());
  }

  const backend = process.env.BACKEND_URL;
  if (backend) return stripTrailingSlash(backend);

  const pub = process.env.NEXT_PUBLIC_API_URL;
  if (pub && /^https?:\/\//i.test(pub)) return stripTrailingSlash(pub);

  return DEFAULT_API_URL;
}

export const API_URL = resolveBase();

export function resolveApiUrl(urlOrPath: string): string {
  if (!urlOrPath) {
    return urlOrPath;
  }

  if (/^https?:\/\//i.test(urlOrPath)) {
    return urlOrPath;
  }

  return `${API_URL}${urlOrPath.startsWith("/") ? "" : "/"}${urlOrPath}`;
}
