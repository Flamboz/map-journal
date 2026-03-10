export type UserQuerystring = {
  userId?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  labels?: string | string[];
  visitCompany?: string;
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

export type UpdateEventBody = {
  userId?: string | number;
  name?: string;
  date?: string;
  startDate?: string;
  endDate?: string;
  description?: string;
  rating?: number | string | null;
  labels?: string[];
  visitCompany?: string;
};

export type EventParams = {
  eventId?: string;
};

export type EventPhotoParams = {
  eventId?: string;
  photoId?: string;
};

export type EventPhotosTableColumn = {
  cid: number;
  name: string;
  type: string;
  notnull: number;
  dflt_value: string | null;
  pk: number;
};

export type EventRow = {
  id: string;
  user_id: number;
  title: string;
  start_date?: string | null;
  end_date?: string | null;
  description?: string | null;
  rating?: number | null;
  labels?: string | null;
  visit_company?: string | null;
  lat: number;
  lng: number;
  created_at: string;
};

export type EventPhotoRow = {
  id: string;
  event_id: string;
  file_path: string;
  sort_order?: number | null;
  created_at: string;
};

export type NormalizedEventPhoto = {
  id: string;
  path: string;
  url: string;
  createdAt: string;
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

export function groupPhotosByEvent(
  photos: EventPhotoRow[],
): Map<string, Array<{ id: string; path: string; url: string; createdAt: string }>> {
  const photosByEvent = new Map<string, NormalizedEventPhoto[]>();

  for (const photo of photos) {
    const list = photosByEvent.get(photo.event_id) ?? [];
    list.push({
      id: photo.id,
      path: photo.file_path,
      url: `/uploads/${photo.file_path}`,
      createdAt: photo.created_at,
    });
    photosByEvent.set(photo.event_id, list);
  }

  return photosByEvent;
}

export function normalizeEventRows(events: EventRow[], photosByEvent: Map<string, NormalizedEventPhoto[]> = new Map()) {
  return events.map((event) => ({
    id: event.id,
    user_id: event.user_id,
    title: event.title,
    name: event.title,
    startDate: event.start_date ?? null,
    endDate: event.end_date ?? null,
    description: event.description ?? "",
    rating: event.rating ?? null,
    labels: parseEventLabels(event.labels),
    visitCompany: event.visit_company || "",
    lat: event.lat,
    lng: event.lng,
    created_at: event.created_at,
    photos: photosByEvent.get(event.id) ?? [],
  }));
}

function parseEventLabels(rawLabels?: string | null): string[] {
  if (!rawLabels) {
    return [];
  }

  try {
    const parsed = JSON.parse(rawLabels);
    return Array.isArray(parsed) ? parsed.filter((label): label is string => typeof label === "string") : [];
  } catch {
    return [];
  }
}

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

function isValidUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export function parseEventId(eventId: string | undefined): string | null {
  if (!eventId || !isValidUuid(eventId)) {
    return null;
  }

  return eventId;
}

export function parsePhotoId(photoId: string | undefined): string | null {
  if (!photoId || !isValidUuid(photoId)) {
    return null;
  }

  return photoId;
}

export function parseUserId(userId: string | undefined): number | null {
  const parsed = Number(userId);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}
