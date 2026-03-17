import { randomUUID } from "crypto";
import { all, get, run } from "../db/sqlite";
import { reverseGeocodeCity } from "../utils/geocode";
import { deleteUploadedFile, removeEventUploadDirectory, removeUserDirectoryIfEmpty } from "../utils/fileCleanup";
import { failure, ServiceResult, success } from "./serviceResult";
import {
  ALLOWED_LABEL_VALUES,
  ALLOWED_VISIT_COMPANIES,
  EventPhotoRow,
  EventRow,
  groupPhotosByEvent,
  normalizeEventRows,
  normalizeLabels,
} from "../routes/events/shared";

const SAME_PIN_DISTANCE_METERS = 20;
const EARTH_RADIUS_METERS = 6_371_000;

type ListEventsInput = {
  userId: number;
  search?: string;
  labels?: string | string[];
  visitCompany?: string;
  dateFrom?: string;
  dateTo?: string;
};

type CreateEventInput = {
  userId: number;
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

type UpdateEventInput = {
  userId: number;
  eventId: string;
  name?: string;
  date?: string;
  startDate?: string;
  endDate?: string;
  description?: string;
  rating?: number | string | null;
  labels?: string[];
  visitCompany?: string;
};

function toRadians(value: number): number {
  return (value * Math.PI) / 180;
}

function getDistanceMeters(pointA: { lat: number; lng: number }, pointB: { lat: number; lng: number }): number {
  const latitudeDelta = toRadians(pointB.lat - pointA.lat);
  const longitudeDelta = toRadians(pointB.lng - pointA.lng);
  const latA = toRadians(pointA.lat);
  const latB = toRadians(pointB.lat);

  const a =
    Math.sin(latitudeDelta / 2) * Math.sin(latitudeDelta / 2) +
    Math.cos(latA) * Math.cos(latB) * Math.sin(longitudeDelta / 2) * Math.sin(longitudeDelta / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_METERS * c;
}

function normalizeQueryLabels(rawLabels: string | string[] | undefined): string[] {
  if (!rawLabels) {
    return [];
  }

  const allowedLabels = new Set(ALLOWED_LABEL_VALUES);
  const labels = (Array.isArray(rawLabels) ? rawLabels : rawLabels.split(","))
    .map((label) => label.trim())
    .filter((label) => allowedLabels.has(label));

  return Array.from(new Set(labels));
}

function parseStoredLabels(rawLabels?: string | null): string[] {
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

export async function listEventsForUser(input: ListEventsInput) {
  const whereClauses: string[] = ["user_id = ?"];
  const params: Array<number | string> = [input.userId];
  const trimmedSearch = input.search?.trim();

  if (trimmedSearch) {
    whereClauses.push("(instr(title, ?) > 0 OR instr(COALESCE(description, ''), ?) > 0)");
    params.push(trimmedSearch, trimmedSearch);
  }

  const labels = normalizeQueryLabels(input.labels);
  if (labels.length > 0) {
    const labelWhere = labels.map(() => "labels LIKE ?").join(" OR ");
    whereClauses.push(`(${labelWhere})`);

    for (const label of labels) {
      params.push(`%\"${label}\"%`);
    }
  }

  const visitCompany = input.visitCompany?.trim();
  if (visitCompany && ALLOWED_VISIT_COMPANIES.has(visitCompany)) {
    whereClauses.push("visit_company = ?");
    params.push(visitCompany);
  }

  const dateFrom = input.dateFrom?.trim();
  const dateTo = input.dateTo?.trim();
  if (dateFrom || dateTo) {
    whereClauses.push("start_date IS NOT NULL");

    if (dateTo) {
      whereClauses.push("start_date <= ?");
      params.push(dateTo);
    }

    if (dateFrom) {
      whereClauses.push("COALESCE(end_date, start_date) >= ?");
      params.push(dateFrom);
    }
  }

  const events = (await all(
    `SELECT id, user_id, title, start_date, end_date, description, rating, labels, visit_company, city, lat, lng, created_at
     FROM events
     WHERE ${whereClauses.join(" AND ")}
     ORDER BY created_at DESC, id DESC`,
    params,
  )) as EventRow[];

  const eventIds = events.map((event) => event.id);
  const photos =
    eventIds.length > 0
      ? ((await all(
          `SELECT id, event_id, file_path, created_at
           FROM event_photos
           WHERE event_id IN (${eventIds.map(() => "?").join(",")})
           ORDER BY sort_order ASC, created_at ASC, id ASC`,
          eventIds,
        )) as EventPhotoRow[])
      : [];

  return normalizeEventRows(events, groupPhotosByEvent(photos));
}

export async function getEventByIdForUser(eventId: string, userId: number): Promise<ServiceResult<Record<string, unknown>>> {
  const event = (await get(
    `SELECT id, user_id, title, start_date, end_date, description, rating, labels, visit_company, city, lat, lng, created_at
     FROM events
     WHERE id = ? AND user_id = ?`,
    [eventId, userId],
  )) as EventRow | null;

  if (!event) {
    return failure(404, "EVENT_NOT_FOUND", "Event not found.");
  }

  const photos = (await all(
    `SELECT id, event_id, file_path, sort_order, created_at
     FROM event_photos
     WHERE event_id = ?
     ORDER BY sort_order ASC, created_at ASC, id ASC`,
    [eventId],
  )) as EventPhotoRow[];

  const latitudeDelta = SAME_PIN_DISTANCE_METERS / 111_320;
  const latitudeRadians = toRadians(event.lat);
  const cosineLatitude = Math.abs(Math.cos(latitudeRadians));
  const safeCosineLatitude = cosineLatitude < 1e-6 ? 1e-6 : cosineLatitude;
  const longitudeDelta = SAME_PIN_DISTANCE_METERS / (111_320 * safeCosineLatitude);

  const samePinEventCandidates = (await all(
    `SELECT id, lat, lng
     FROM events
     WHERE user_id = ?
       AND lat BETWEEN ? AND ?
       AND lng BETWEEN ? AND ?
     ORDER BY created_at DESC, id DESC`,
    [userId, event.lat - latitudeDelta, event.lat + latitudeDelta, event.lng - longitudeDelta, event.lng + longitudeDelta],
  )) as Array<{ id: string; lat: number; lng: number }>;

  const normalizedEvent = normalizeEventRows([event], groupPhotosByEvent(photos))[0];

  const samePinEventIds = samePinEventCandidates
    .filter((candidate) =>
      getDistanceMeters({ lat: event.lat, lng: event.lng }, { lat: candidate.lat, lng: candidate.lng }) <=
      SAME_PIN_DISTANCE_METERS,
    )
    .map((samePinEvent) => samePinEvent.id);

  return success({ ...normalizedEvent, samePinEventIds });
}

export async function createEventForUser(input: CreateEventInput): Promise<ServiceResult<Record<string, unknown>>> {
  const name = (input.name ?? "").trim();
  if (!name) {
    return failure(400, "INVALID_NAME", "Name is required.");
  }

  const lat = Number(input.lat);
  const lng = Number(input.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return failure(400, "INVALID_COORDINATES", "Valid coordinates are required.");
  }

  const startDate = (input.startDate ?? input.date ?? "").trim();
  const endDate = (input.endDate ?? "").trim();
  if (!startDate) {
    return failure(400, "INVALID_DATE", "Date or date range is required.");
  }

  const description = (input.description ?? "").trim();
  const normalizedRating =
    input.rating === undefined || input.rating === null || input.rating === "" ? null : Number(input.rating);

  if (normalizedRating !== null && (!Number.isInteger(normalizedRating) || normalizedRating < 1 || normalizedRating > 10)) {
    return failure(400, "INVALID_RATING", "Rating must be between 1 and 10.");
  }

  const labels = normalizeLabels(input.labels);
  const visitCompany = (input.visitCompany ?? "").trim();
  if (visitCompany && !ALLOWED_VISIT_COMPANIES.has(visitCompany)) {
    return failure(400, "INVALID_VISIT_COMPANY", "Invalid visit company value.");
  }

  const eventId = randomUUID();

  let city = await reverseGeocodeCity(lat, lng);
  if (!city) {
    city = "";
  }

  await run(
    `INSERT INTO events (id, user_id, title, start_date, end_date, description, rating, labels, visit_company, city, lat, lng)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      eventId,
      input.userId,
      name,
      startDate,
      endDate || null,
      description,
      normalizedRating,
      JSON.stringify(labels),
      visitCompany,
      city,
      lat,
      lng,
    ],
  );

  const event = (await get(
    `SELECT id, user_id, title, start_date, end_date, description, rating, labels, visit_company, city, lat, lng, created_at
     FROM events
     WHERE id = ?`,
    [eventId],
  )) as EventRow | null;

  if (!event) {
    return failure(404, "EVENT_NOT_FOUND", "Event not found.");
  }

  const normalizedEvent = normalizeEventRows([event])[0];
  return success(normalizedEvent);
}

export async function updateEventForUser(input: UpdateEventInput): Promise<ServiceResult<Record<string, unknown>>> {
  const existingEvent = (await get(
    `SELECT id, user_id, title, start_date, end_date, description, rating, labels, visit_company, city, lat, lng, created_at
     FROM events
     WHERE id = ?`,
    [input.eventId],
  )) as EventRow | null;

  if (!existingEvent) {
    return failure(404, "EVENT_NOT_FOUND", "Event not found.");
  }

  if (Number(existingEvent.user_id) !== input.userId) {
    return failure(403, "FORBIDDEN", "Cannot edit this event.");
  }

  const nextName = input.name === undefined ? existingEvent.title : String(input.name).trim();
  if (!nextName) {
    return failure(400, "INVALID_NAME", "Name is required.");
  }

  const startDateInput = input.startDate ?? input.date;
  const nextStartDate = startDateInput === undefined ? String(existingEvent.start_date ?? "").trim() : String(startDateInput).trim();
  if (!nextStartDate) {
    return failure(400, "INVALID_DATE", "Date or date range is required.");
  }

  const nextEndDate = input.endDate === undefined ? String(existingEvent.end_date ?? "").trim() || null : String(input.endDate).trim() || null;
  if (nextEndDate && nextEndDate < nextStartDate) {
    return failure(400, "INVALID_DATE_RANGE", "End date cannot be before start date.");
  }

  const nextDescription = input.description === undefined ? String(existingEvent.description ?? "") : String(input.description).trim();

  const normalizedRating =
    input.rating === undefined
      ? existingEvent.rating ?? null
      : input.rating === null || input.rating === ""
        ? null
        : Number(input.rating);

  if (normalizedRating !== null && (!Number.isInteger(normalizedRating) || normalizedRating < 1 || normalizedRating > 10)) {
    return failure(400, "INVALID_RATING", "Rating must be between 1 and 10.");
  }

  const nextLabels = input.labels === undefined ? parseStoredLabels(existingEvent.labels) : normalizeLabels(input.labels);

  const nextVisitCompany =
    input.visitCompany === undefined ? String(existingEvent.visit_company ?? "") : String(input.visitCompany).trim();
  if (nextVisitCompany && !ALLOWED_VISIT_COMPANIES.has(nextVisitCompany)) {
    return failure(400, "INVALID_VISIT_COMPANY", "Invalid visit company value.");
  }

  await run(
    `UPDATE events
     SET title = ?, start_date = ?, end_date = ?, description = ?, rating = ?, labels = ?, visit_company = ?
     WHERE id = ?`,
    [nextName, nextStartDate, nextEndDate, nextDescription, normalizedRating, JSON.stringify(nextLabels), nextVisitCompany, input.eventId],
  );

  const updatedEvent = (await get(
    `SELECT id, user_id, title, start_date, end_date, description, rating, labels, visit_company, city, lat, lng, created_at
     FROM events
     WHERE id = ?`,
    [input.eventId],
  )) as EventRow | null;

  if (!updatedEvent) {
    return failure(404, "EVENT_NOT_FOUND", "Event not found.");
  }

  const photos = (await all(
    `SELECT id, event_id, file_path, sort_order, created_at
     FROM event_photos
     WHERE event_id = ?
     ORDER BY sort_order ASC, created_at ASC, id ASC`,
    [input.eventId],
  )) as EventPhotoRow[];

  const normalizedEvent = normalizeEventRows([updatedEvent], groupPhotosByEvent(photos))[0];
  return success(normalizedEvent);
}

export async function deleteEventForUser(eventId: string, userId: number): Promise<ServiceResult<{ success: true }>> {
  const existingEvent = (await get("SELECT id, user_id FROM events WHERE id = ?", [eventId])) as { id: string; user_id: number } | null;
  if (!existingEvent) {
    return failure(404, "EVENT_NOT_FOUND", "Event not found.");
  }

  if (Number(existingEvent.user_id) !== userId) {
    return failure(403, "FORBIDDEN", "Cannot delete this event.");
  }

  const photos = (await all("SELECT file_path FROM event_photos WHERE event_id = ?", [eventId])) as Array<{ file_path: string }>;

  await run("DELETE FROM event_photos WHERE event_id = ?", [eventId]);
  await run("DELETE FROM events WHERE id = ?", [eventId]);

  for (const photo of photos) {
    deleteUploadedFile(photo.file_path);
  }

  removeEventUploadDirectory(userId, eventId);
  removeUserDirectoryIfEmpty(userId);

  return success({ success: true });
}
