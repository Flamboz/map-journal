export type UserQuerystring = {
  userId?: string;
};

export type CreateEventBody = {
  userId?: string | number;
  name?: string;
  date?: string;
  startDate?: string;
  endDate?: string;
  description?: string;
  rating?: number | string;
  labels?: string[];
  visitCompany?: string;
  lat?: number;
  lng?: number;
};

export type EventParams = {
  eventId?: string;
};

export type EventPhotosTableColumn = {
  cid: number;
  name: string;
  type: string;
  notnull: number;
  dflt_value: string | null;
  pk: number;
};

export const ALLOWED_LABEL_VALUES: string[] = [
  "Cafe",
  "Museum",
  "Gallery",
  "Lake",
  "Trip",
  "Excursion",
  "Hike",
  "Ski",
  "Concert",
  "Festival",
  "Performance",
  "Cinema",
  "Party",
  "Sport",
  "Meeting",
];

const ALLOWED_LABELS = new Set(ALLOWED_LABEL_VALUES);

export const ALLOWED_VISIT_COMPANY_VALUES: string[] = ["Partner", "Solo", "Friends"];

export const ALLOWED_VISIT_COMPANIES = new Set(ALLOWED_VISIT_COMPANY_VALUES);

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
export const DEFAULT_PIN_ZOOM = 13;

export function sanitizeFilename(filename: string): string {
  return filename.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export function normalizeLabels(labels: unknown): string[] {
  if (!Array.isArray(labels)) {
    return [];
  }

  return labels
    .filter((label): label is string => typeof label === "string")
    .map((label) => label.trim())
    .filter((label) => ALLOWED_LABELS.has(label));
}

export function parseEventId(eventId: string | undefined): number | null {
  const parsed = Number(eventId);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}

export function parseUserId(userId: string | undefined): number | null {
  const parsed = Number(userId);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}
