import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import fs from "fs";
import path from "path";
import { all, get, run } from "../../db/sqlite";
import {
  EventParams,
  EventPhotosTableColumn,
  MAX_UPLOAD_BYTES,
  parseEventId,
  parseUserId,
  sanitizeFilename,
  UserQuerystring,
} from "./shared";

export function registerUploadEventPhotosRoute(fastify: FastifyInstance) {
  fastify.post(
    "/events/:eventId/photos",
    async (
      request: FastifyRequest<{ Params: EventParams; Querystring: UserQuerystring }>,
      reply: FastifyReply,
    ) => {
      const userId = parseUserId(request.query.userId);
      if (!userId) {
        return reply.status(400).send({ error: "INVALID_USER", message: "A valid userId is required." });
      }

      const eventId = parseEventId(request.params.eventId);
      if (!eventId) {
        return reply.status(400).send({ error: "INVALID_EVENT", message: "A valid eventId is required." });
      }

      const isMultipart = typeof (request as any).isMultipart === "function" && (request as any).isMultipart();
      if (!isMultipart) {
        return reply
          .status(400)
          .send({ error: "INVALID_MULTIPART", message: "Photos must be sent as multipart/form-data." });
      }

      try {
        const existingEvent = await get("SELECT id, user_id FROM events WHERE id = ?", [eventId]);
        if (!existingEvent) {
          return reply.status(404).send({ error: "EVENT_NOT_FOUND", message: "Event not found." });
        }

        if (Number(existingEvent.user_id) !== userId) {
          return reply.status(403).send({ error: "FORBIDDEN", message: "Cannot upload photos to this event." });
        }

        const uploadDir = path.join(process.cwd(), "uploads", `user-${userId}`, `event-${eventId}`);
        fs.mkdirSync(uploadDir, { recursive: true });

        const eventPhotosColumns = (await all("PRAGMA table_info(event_photos)")) as EventPhotosTableColumn[];
        const eventPhotosColumnSet = new Set(eventPhotosColumns.map((column) => column.name));

        const uploadedPhotos: Array<{ id: number; path: string; url: string; createdAt: string }> = [];
        let fileIndex = 0;

        for await (const part of request.parts()) {
          if (part.type !== "file") {
            continue;
          }

          if (!part.mimetype.startsWith("image/")) {
            return reply.status(400).send({ error: "INVALID_FILE_TYPE", message: "Only images are allowed." });
          }

          const fileBuffer = await part.toBuffer();
          if (fileBuffer.length > MAX_UPLOAD_BYTES) {
            return reply.status(400).send({ error: "FILE_TOO_LARGE", message: "Each photo must be 10MB or smaller." });
          }

          fileIndex += 1;
          const originalName = sanitizeFilename(part.filename || `photo-${fileIndex}.jpg`);
          const ext = path.extname(originalName) || ".jpg";
          const baseName = path.basename(originalName, ext) || `photo-${fileIndex}`;
          const storedFileName = `${Date.now()}-${fileIndex}-${baseName}${ext}`;
          const absoluteFilePath = path.join(uploadDir, storedFileName);

          fs.writeFileSync(absoluteFilePath, fileBuffer);

          const relativePath = path.posix.join(`user-${userId}`, `event-${eventId}`, storedFileName);

          const insertPayload: Record<string, unknown> = {
            event_id: eventId,
            file_path: relativePath,
          };

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
            insertPayload.mime_type = part.mimetype;
          }

          if (eventPhotosColumnSet.has("original_name")) {
            insertPayload.original_name = part.filename || storedFileName;
          }

          if (eventPhotosColumnSet.has("size_bytes")) {
            insertPayload.size_bytes = fileBuffer.length;
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

          const insertResult = (await run(
            `INSERT INTO event_photos (${insertColumns.join(", ")}) VALUES (${placeholders})`,
            insertValues,
          )) as { lastID?: number };

          const photo = await get("SELECT id, file_path, created_at FROM event_photos WHERE id = ?", [insertResult.lastID]);
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
          return reply.status(400).send({ error: "NO_PHOTOS", message: "At least one photo file is required." });
        }

        return reply.status(201).send({ photos: uploadedPhotos });
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({ error: "SERVER_ERROR", message: "Internal server error" });
      }
    },
  );
}
