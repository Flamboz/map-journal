const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const EMAIL_REGEX = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export function normalizeEmail(value: unknown): string {
  return typeof value === "string" ? value.toLowerCase().trim() : "";
}

export function isValidEmail(value: string): boolean {
  return EMAIL_REGEX.test(value);
}

export function isStrongPassword(value: unknown, minimumLength = 8): value is string {
  return typeof value === "string" && value.length >= minimumLength;
}

export function parsePositiveInt(value: unknown): number | null {
  const raw = typeof value === "number" ? value : Number(value);
  if (!Number.isInteger(raw) || raw <= 0) {
    return null;
  }
  return raw;
}

export function parseUuid(value: unknown): string | null {
  if (typeof value !== "string" || !UUID_REGEX.test(value)) {
    return null;
  }
  return value;
}

export function parseFiniteNumber(value: unknown): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function parseRating(value: unknown): number | null {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 10) {
    return null;
  }

  return parsed;
}

export function hasInvalidDateRange(startDate: string, endDate: string | null): boolean {
  return Boolean(endDate && endDate < startDate);
}

export function normalizeStringList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string").map((item) => item.trim());
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}
