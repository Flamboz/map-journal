export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "/map-journal";

export function assetPath(pathname: string): string {
  if (!pathname) return BASE_PATH;
  if (/^https?:\/\//i.test(pathname)) return pathname;
  return `${BASE_PATH}${pathname.startsWith("/") ? "" : "/"}${pathname}`;
}
