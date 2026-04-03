import { randomUUID } from "crypto";
import { all, get, run, withTransaction } from "../db/sqlite";
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
  DEFAULT_PIN_ZOOM,
} from "../routes/events/shared";
import { getSharedEmailsByEventIds, resolveShareRecipients, syncEventShares } from "./eventSharing";
import { uploadEventPhotosForUser, type UploadPart } from "./photoService";

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
  visibility?: string;
  sharedWithEmails?: string[];
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
  visibility?: string;
  sharedWithEmails?: string[];
  photoIdsToDelete?: string[];
  previewPhotoId?: string | null;
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

async function getAccessibleEventRows(input: {
  userId: number;
  whereClauses: string[];
  params: Array<number | string>;
}) {
  return (await all(
    `SELECT DISTINCT
       events.id,
       events.user_id,
       events.title,
       events.start_date,
       events.end_date,
       events.description,
       events.rating,
       events.labels,
       events.visit_company,
       events.city,
       events.lat,
       events.lng,
       events.created_at,
       owners.email AS owner_email,
       CASE WHEN events.user_id = ? THEN 'owner' ELSE 'shared' END AS access_level
     FROM events
     INNER JOIN users AS owners ON owners.id = events.user_id
     LEFT JOIN event_shares AS requester_shares
       ON requester_shares.event_id = events.id
      AND requester_shares.shared_with_user_id = ?
     WHERE (${input.whereClauses.join(" AND ")})
     ORDER BY events.created_at DESC, events.id DESC`,
    [input.userId, input.userId, ...input.params],
  )) as EventRow[];
}

async function getNormalizedAccessibleEventById(eventId: string, userId: number): Promise<EventRow | null> {
  return (await get(
    `SELECT DISTINCT
       events.id,
       events.user_id,
       events.title,
       events.start_date,
       events.end_date,
       events.description,
       events.rating,
       events.labels,
       events.visit_company,
       events.city,
       events.lat,
       events.lng,
       events.created_at,
       owners.email AS owner_email,
       CASE WHEN events.user_id = ? THEN 'owner' ELSE 'shared' END AS access_level
     FROM events
     INNER JOIN users AS owners ON owners.id = events.user_id
     LEFT JOIN event_shares AS requester_shares
       ON requester_shares.event_id = events.id
      AND requester_shares.shared_with_user_id = ?
     WHERE events.id = ?
       AND (events.user_id = ? OR requester_shares.shared_with_user_id IS NOT NULL)`,
    [userId, userId, eventId, userId],
  )) as EventRow | null;
}

export async function listEventsForUser(input: ListEventsInput) {
  const whereClauses: string[] = ["(events.user_id = ? OR requester_shares.shared_with_user_id IS NOT NULL)"];
  const params: Array<number | string> = [input.userId];
  const trimmedSearch = input.search?.trim();

  if (trimmedSearch) {
    whereClauses.push("(instr(events.title, ?) > 0 OR instr(COALESCE(events.description, ''), ?) > 0)");
    params.push(trimmedSearch, trimmedSearch);
  }

  const labels = normalizeQueryLabels(input.labels);
  if (labels.length > 0) {
    const labelWhere = labels.map(() => "events.labels LIKE ?").join(" OR ");
    whereClauses.push(`(${labelWhere})`);

    for (const label of labels) {
      params.push(`%\"${label}\"%`);
    }
  }

  const visitCompany = input.visitCompany?.trim();
  if (visitCompany && ALLOWED_VISIT_COMPANIES.has(visitCompany)) {
    whereClauses.push("events.visit_company = ?");
    params.push(visitCompany);
  }

  const dateFrom = input.dateFrom?.trim();
  const dateTo = input.dateTo?.trim();
  if (dateFrom || dateTo) {
    whereClauses.push("events.start_date IS NOT NULL");

    if (dateTo) {
      whereClauses.push("events.start_date <= ?");
      params.push(dateTo);
    }

    if (dateFrom) {
      whereClauses.push("COALESCE(events.end_date, events.start_date) >= ?");
      params.push(dateFrom);
    }
  }

  const events = await getAccessibleEventRows({
    userId: input.userId,
    whereClauses,
    params,
  });

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
  const sharedEmailsByEvent = await getSharedEmailsByEventIds(eventIds);

  return normalizeEventRows(events, {
    photosByEvent: groupPhotosByEvent(photos),
    sharedEmailsByEvent,
    requestUserId: input.userId,
  });
}

export async function getEventByIdForUser(eventId: string, userId: number): Promise<ServiceResult<Record<string, unknown>>> {
  const event = await getNormalizedAccessibleEventById(eventId, userId);

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
  const sharedEmailsByEvent = await getSharedEmailsByEventIds([eventId]);

  const latitudeDelta = SAME_PIN_DISTANCE_METERS / 111_320;
  const latitudeRadians = toRadians(event.lat);
  const cosineLatitude = Math.abs(Math.cos(latitudeRadians));
  const safeCosineLatitude = cosineLatitude < 1e-6 ? 1e-6 : cosineLatitude;
  const longitudeDelta = SAME_PIN_DISTANCE_METERS / (111_320 * safeCosineLatitude);

  const samePinEventCandidates = (await all(
    `SELECT DISTINCT events.id, events.lat, events.lng
     FROM events
     LEFT JOIN event_shares AS requester_shares
       ON requester_shares.event_id = events.id
      AND requester_shares.shared_with_user_id = ?
     WHERE (events.user_id = ? OR requester_shares.shared_with_user_id IS NOT NULL)
       AND events.lat BETWEEN ? AND ?
       AND events.lng BETWEEN ? AND ?
     ORDER BY events.created_at DESC, events.id DESC`,
    [userId, userId, event.lat - latitudeDelta, event.lat + latitudeDelta, event.lng - longitudeDelta, event.lng + longitudeDelta],
  )) as Array<{ id: string; lat: number; lng: number }>;

  const normalizedEvent = normalizeEventRows([event], {
    photosByEvent: groupPhotosByEvent(photos),
    sharedEmailsByEvent,
    requestUserId: userId,
  })[0];

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

  const shareRecipientsResult = await resolveShareRecipients({
    ownerUserId: input.userId,
    visibility: input.visibility,
    sharedWithEmails: input.sharedWithEmails,
  });
  if (!shareRecipientsResult.ok) {
    return shareRecipientsResult;
  }

  const eventId = randomUUID();

  let city = await reverseGeocodeCity(lat, lng);
  if (!city) {
    city = "";
  }

  await withTransaction(async () => {
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
    await syncEventShares(eventId, shareRecipientsResult.value.recipientUserIds);
  });

  const event = await getNormalizedAccessibleEventById(eventId, input.userId);

  if (!event) {
    return failure(404, "EVENT_NOT_FOUND", "Event not found.");
  }

  const sharedEmailsByEvent = await getSharedEmailsByEventIds([eventId]);
  const normalizedEvent = normalizeEventRows([event], {
    sharedEmailsByEvent,
    requestUserId: input.userId,
  })[0];
  try {
    await run(
      `INSERT OR REPLACE INTO map_positions (user_id, lat, lng, zoom, updated_at)
       VALUES (?, ?, ?, ?, datetime('now'))`,
      [input.userId, lat, lng, DEFAULT_PIN_ZOOM],
    );
  } catch {
  }

  return success(normalizedEvent);
}

async function rollbackCreatedEvent(eventId: string, userId: number) {
  try {
    await deleteEventForUser(eventId, userId);
  } catch {
  }
}

export async function createEventWithPhotosForUser(
  input: CreateEventInput,
  photoParts: AsyncIterable<UploadPart>,
): Promise<ServiceResult<Record<string, unknown>>> {
  const createdEventResult = await createEventForUser(input);
  if (!createdEventResult.ok) {
    return createdEventResult;
  }

  const eventId = createdEventResult.value.id;
  if (typeof eventId !== "string" || eventId.length === 0) {
    return failure(500, "EVENT_CREATE_FAILED", "Event could not be created.");
  }

  try {
    const uploadResult = await uploadEventPhotosForUser(eventId, input.userId, photoParts);
    if (!uploadResult.ok) {
      await rollbackCreatedEvent(eventId, input.userId);
      return uploadResult;
    }

    return success({
      ...createdEventResult.value,
      photos: uploadResult.value,
    });
  } catch (error) {
    await rollbackCreatedEvent(eventId, input.userId);
    throw error;
  }
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

  const existingSharedEmailsByEvent = await getSharedEmailsByEventIds([input.eventId]);
  const existingSharedEmails = existingSharedEmailsByEvent.get(input.eventId) ?? [];
  const shareRecipientsResult = await resolveShareRecipients({
    ownerUserId: input.userId,
    visibility: input.visibility ?? (existingSharedEmails.length > 0 ? "share_with" : "private"),
    sharedWithEmails: input.sharedWithEmails ?? existingSharedEmails,
  });
  if (!shareRecipientsResult.ok) {
    return shareRecipientsResult;
  }

  const existingPhotos = (await all(
    `SELECT id, event_id, file_path, sort_order, created_at
     FROM event_photos
     WHERE event_id = ?
     ORDER BY sort_order ASC, created_at ASC, id ASC`,
    [input.eventId],
  )) as EventPhotoRow[];

  const existingPhotoIds = new Set(existingPhotos.map((photo) => photo.id));
  const photoIdsToDelete = Array.from(new Set((input.photoIdsToDelete ?? []).filter((photoId) => typeof photoId === "string")));
  for (const photoId of photoIdsToDelete) {
    if (!existingPhotoIds.has(photoId)) {
      return failure(400, "PHOTO_NOT_FOUND", "Photo not found.");
    }
  }

  const remainingPhotoIds = existingPhotos.filter((photo) => !photoIdsToDelete.includes(photo.id)).map((photo) => photo.id);
  const previewPhotoId = input.previewPhotoId ?? undefined;
  if (previewPhotoId !== undefined) {
    if (!remainingPhotoIds.includes(previewPhotoId)) {
      return failure(400, "PHOTO_NOT_FOUND", "Photo not found.");
    }
  }

  const orderedPhotoIds =
    previewPhotoId === undefined
      ? remainingPhotoIds
      : [previewPhotoId, ...remainingPhotoIds.filter((photoId) => photoId !== previewPhotoId)];

  await withTransaction(async () => {
    await run(
      `UPDATE events
       SET title = ?, start_date = ?, end_date = ?, description = ?, rating = ?, labels = ?, visit_company = ?
       WHERE id = ?`,
      [nextName, nextStartDate, nextEndDate, nextDescription, normalizedRating, JSON.stringify(nextLabels), nextVisitCompany, input.eventId],
    );
    await syncEventShares(input.eventId, shareRecipientsResult.value.recipientUserIds);

    if (photoIdsToDelete.length > 0) {
      await run(`DELETE FROM event_photos WHERE event_id = ? AND id IN (${photoIdsToDelete.map(() => "?").join(", ")})`, [
        input.eventId,
        ...photoIdsToDelete,
      ]);
    }

    let sortOrder = 1;
    for (const photoId of orderedPhotoIds) {
      await run("UPDATE event_photos SET sort_order = ? WHERE id = ?", [sortOrder, photoId]);
      sortOrder += 1;
    }
  });

  for (const photo of existingPhotos) {
    if (photoIdsToDelete.includes(photo.id)) {
      deleteUploadedFile(photo.file_path);
    }
  }

  const remainingPhotos = existingPhotos.filter((photo) => !photoIdsToDelete.includes(photo.id));
  if (remainingPhotos.length === 0 && photoIdsToDelete.length > 0) {
    removeEventUploadDirectory(input.userId, input.eventId);
    removeUserDirectoryIfEmpty(input.userId);
  }

  const updatedEvent = await getNormalizedAccessibleEventById(input.eventId, input.userId);

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
  const sharedEmailsByEvent = await getSharedEmailsByEventIds([input.eventId]);

  const normalizedEvent = normalizeEventRows([updatedEvent], {
    photosByEvent: groupPhotosByEvent(photos),
    sharedEmailsByEvent,
    requestUserId: input.userId,
  })[0];
  try {
    await run(
      `INSERT OR REPLACE INTO map_positions (user_id, lat, lng, zoom, updated_at)
       VALUES (?, ?, ?, ?, datetime('now'))`,
      [input.userId, updatedEvent.lat, updatedEvent.lng, DEFAULT_PIN_ZOOM],
    );
  } catch {
  }
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

  await withTransaction(async () => {
    await run("DELETE FROM event_shares WHERE event_id = ?", [eventId]);
    await run("DELETE FROM event_photos WHERE event_id = ?", [eventId]);
    await run("DELETE FROM events WHERE id = ?", [eventId]);
  });

  for (const photo of photos) {
    deleteUploadedFile(photo.file_path);
  }

  removeEventUploadDirectory(userId, eventId);
  removeUserDirectoryIfEmpty(userId);

  return success({ success: true });
}
