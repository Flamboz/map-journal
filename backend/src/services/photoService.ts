import { randomUUID } from "crypto";
import fs from "fs";
import path from "path";
import { pipeline } from "stream/promises";
import { all, get, run } from "../db/sqlite";
import { getOrderedPhotoIds, resequencePhotoSortOrder } from "../db/queries/photoQueries";
import { deleteUploadedFile, removeEventUploadDirectory, removeUserDirectoryIfEmpty } from "../utils/fileCleanup";
import { EventPhotosTableColumn, sanitizeFilename } from "../routes/events/shared";
import { failure, ServiceResult, success } from "./serviceResult";

type UploadPart = {
  type: string;
  mimetype?: string;
  filename?: string;
  file?: NodeJS.ReadableStream;
  toBuffer?: () => Promise<Buffer>;
};

export async function uploadEventPhotosForUser(
  eventId: string,
  userId: number,
  parts: AsyncIterable<UploadPart>,
): Promise<ServiceResult<Array<{ id: string; path: string; url: string; createdAt: string }>>> {
  const existingEvent = (await get("SELECT id, user_id FROM events WHERE id = ?", [eventId])) as
    | { id: string; user_id: number }
    | null;

  if (!existingEvent) {
    return failure(404, "EVENT_NOT_FOUND", "Event not found.");
  }

  if (Number(existingEvent.user_id) !== userId) {
    return failure(403, "FORBIDDEN", "Cannot upload photos to this event.");
  }

  const uploadDir = path.join(process.cwd(), "uploads", `user-${userId}`, `event-${eventId}`);
  await fs.promises.mkdir(uploadDir, { recursive: true });

  const eventPhotosColumns = (await all("PRAGMA table_info(event_photos)")) as EventPhotosTableColumn[];
  const eventPhotosColumnSet = new Set(eventPhotosColumns.map((column) => column.name));

  const maxSortOrderResult = (await get("SELECT MAX(sort_order) AS maxSortOrder FROM event_photos WHERE event_id = ?", [
    eventId,
  ])) as { maxSortOrder?: number | null } | null;
  let nextSortOrder = Number(maxSortOrderResult?.maxSortOrder ?? 0);

  const uploadedPhotos: Array<{ id: string; path: string; url: string; createdAt: string }> = [];
  let fileIndex = 0;

  for await (const part of parts) {
    if (part.type !== "file") {
      continue;
    }

    const mimetype = (part.mimetype || "").toString();
    if (mimetype && !(mimetype.startsWith("image/") || mimetype.startsWith("video/"))) {
      return failure(400, "INVALID_FILE_TYPE", "Only image and video media types are allowed.");
    }

    fileIndex += 1;
    const originalName = sanitizeFilename(part.filename || `media-${fileIndex}`);
    const ext = path.extname(originalName) || "";
    const baseName = path.basename(originalName, ext) || `media-${fileIndex}`;
    const storedFileName = `${Date.now()}-${fileIndex}-${baseName}${ext}`;
    const absoluteFilePath = path.join(uploadDir, storedFileName);

    const tempFilePath = absoluteFilePath + ".part";
    let sizeBytes = 0;

    if ((part as any).file && typeof (part as any).file.pipe === "function") {
      const readStream: NodeJS.ReadableStream = (part as any).file;
      readStream.on("data", (chunk: Buffer) => {
        sizeBytes += chunk.length;
      });

      const writeStream = fs.createWriteStream(tempFilePath, { flags: "w" });
      try {
        await pipeline(readStream as any, writeStream);
        await fs.promises.rename(tempFilePath, absoluteFilePath);
      } catch (err) {
        // cleanup temp file on failure
        try {
          await fs.promises.unlink(tempFilePath);
        } catch {}
        throw err;
      }
    } else if (typeof part.toBuffer === "function") {
      // Fallback for parts that only expose toBuffer(). Still write using async fs.
      const fileBuffer = await part.toBuffer();
      sizeBytes = fileBuffer.length;
      await fs.promises.writeFile(absoluteFilePath, fileBuffer);
    } else {
      return failure(400, "INVALID_PART", "Uploaded part is not a file stream.");
    }

    const relativePath = path.posix.join(`user-${userId}`, `event-${eventId}`, storedFileName);

    const insertPayload: Record<string, unknown> = {
      id: randomUUID(),
      event_id: eventId,
      file_path: relativePath,
    };

    if (eventPhotosColumnSet.has("sort_order")) {
      nextSortOrder += 1;
      insertPayload.sort_order = nextSortOrder;
    }

    if (eventPhotosColumnSet.has("secure_url")) {
      insertPayload.secure_url = `/uploads/${relativePath}`;
    }

    if (eventPhotosColumnSet.has("url")) {
      insertPayload.url = `/uploads/${relativePath}`;
    }

    if (eventPhotosColumnSet.has("public_id")) {
      insertPayload.public_id = `event-${eventId}-${storedFileName}`;
    }

    if (eventPhotosColumnSet.has("mime_type")) {
      insertPayload.mime_type = mimetype || null;
    }

    if (eventPhotosColumnSet.has("original_name")) {
      insertPayload.original_name = part.filename || storedFileName;
    }

    if (eventPhotosColumnSet.has("size_bytes")) {
      insertPayload.size_bytes = sizeBytes;
    }

    for (const column of eventPhotosColumns) {
      const isRequiredWithoutDefault = column.notnull === 1 && column.dflt_value === null && column.pk === 0;
      const isMissingValue = insertPayload[column.name] === undefined;
      if (!isRequiredWithoutDefault || !isMissingValue) {
        continue;
      }

      const normalizedType = (column.type || "").toUpperCase();
      if (normalizedType.includes("INT") || normalizedType.includes("REAL") || normalizedType.includes("NUM")) {
        insertPayload[column.name] = 0;
      } else {
        insertPayload[column.name] = "";
      }
    }

    const insertColumns = Object.keys(insertPayload);
    const insertValues = insertColumns.map((columnName) => insertPayload[columnName]);
    const placeholders = insertColumns.map(() => "?").join(", ");

    await run(`INSERT INTO event_photos (${insertColumns.join(", ")}) VALUES (${placeholders})`, insertValues);

    const photo = (await get("SELECT id, file_path, created_at FROM event_photos WHERE id = ?", [insertPayload.id])) as
      | { id: string; file_path: string; created_at: string }
      | null;

    if (photo) {
      uploadedPhotos.push({
        id: photo.id,
        path: photo.file_path,
        url: `/uploads/${photo.file_path}`,
        createdAt: photo.created_at,
      });
    }
  }

  if (uploadedPhotos.length === 0) {
    return failure(400, "NO_PHOTOS", "At least one photo file is required.");
  }

  return success(uploadedPhotos);
}

export async function deleteEventPhotoForUser(
  eventId: string,
  photoId: string,
  userId: number,
): Promise<ServiceResult<Array<{ id: string; path: string; url: string; createdAt: string }>>> {
  const existingEvent = (await get("SELECT id, user_id FROM events WHERE id = ?", [eventId])) as
    | { id: string; user_id: number }
    | null;
  if (!existingEvent) {
    return failure(404, "EVENT_NOT_FOUND", "Event not found.");
  }

  if (Number(existingEvent.user_id) !== userId) {
    return failure(403, "FORBIDDEN", "Cannot edit this event.");
  }

  const existingPhoto = (await get("SELECT id, event_id, file_path FROM event_photos WHERE id = ? AND event_id = ?", [
    photoId,
    eventId,
  ])) as { id: string; event_id: string; file_path: string } | null;

  if (!existingPhoto) {
    return failure(404, "PHOTO_NOT_FOUND", "Photo not found.");
  }

  await run("DELETE FROM event_photos WHERE id = ?", [photoId]);
  deleteUploadedFile(existingPhoto.file_path);

  const remainingPhotos = await getOrderedPhotoIds(eventId);
  if (remainingPhotos.length === 0) {
    removeEventUploadDirectory(userId, eventId);
    removeUserDirectoryIfEmpty(userId);
  }

  await resequencePhotoSortOrder(remainingPhotos.map((photo) => photo.id));

  const orderedPhotos = (await all(
    `SELECT id, file_path, created_at
     FROM event_photos
     WHERE event_id = ?
     ORDER BY sort_order ASC, created_at ASC, id ASC`,
    [eventId],
  )) as Array<{ id: string; file_path: string; created_at: string }>;

  return success(
    orderedPhotos.map((photo) => ({
      id: photo.id,
      path: photo.file_path,
      url: `/uploads/${photo.file_path}`,
      createdAt: photo.created_at,
    })),
  );
}

export async function setPreviewPhotoForUser(
  eventId: string,
  photoId: string,
  userId: number,
): Promise<ServiceResult<Array<{ id: string; path: string; url: string; createdAt: string }>>> {
  const existingEvent = (await get("SELECT id, user_id FROM events WHERE id = ?", [eventId])) as
    | { id: string; user_id: number }
    | null;
  if (!existingEvent) {
    return failure(404, "EVENT_NOT_FOUND", "Event not found.");
  }

  if (Number(existingEvent.user_id) !== userId) {
    return failure(403, "FORBIDDEN", "Cannot edit this event.");
  }

  const existingPhoto = await get("SELECT id FROM event_photos WHERE id = ? AND event_id = ?", [photoId, eventId]);
  if (!existingPhoto) {
    return failure(404, "PHOTO_NOT_FOUND", "Photo not found.");
  }

  const allEventPhotos = await getOrderedPhotoIds(eventId);
  const orderedPhotoIds = [photoId, ...allEventPhotos.map((photo) => photo.id).filter((id) => id !== photoId)];
  await resequencePhotoSortOrder(orderedPhotoIds);

  const orderedPhotos = (await all(
    `SELECT id, file_path, created_at
     FROM event_photos
     WHERE event_id = ?
     ORDER BY sort_order ASC, created_at ASC, id ASC`,
    [eventId],
  )) as Array<{ id: string; file_path: string; created_at: string }>;

  return success(
    orderedPhotos.map((photo) => ({
      id: photo.id,
      path: photo.file_path,
      url: `/uploads/${photo.file_path}`,
      createdAt: photo.created_at,
    })),
  );
}
