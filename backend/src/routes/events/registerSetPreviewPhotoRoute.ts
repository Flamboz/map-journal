import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { all, get, run } from "../../db/sqlite";
import { EventPhotoParams, parseEventId, parsePhotoId, parseUserId, UserQuerystring } from "./shared";

export function registerSetPreviewPhotoRoute(fastify: FastifyInstance) {
  fastify.patch(
    "/events/:eventId/photos/:photoId/preview",
    async (
      request: FastifyRequest<{ Params: EventPhotoParams; Querystring: UserQuerystring }>,
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

      const photoId = parsePhotoId(request.params.photoId);
      if (!photoId) {
        return reply.status(400).send({ error: "INVALID_PHOTO", message: "A valid photoId is required." });
      }

      try {
        const existingEvent = await get("SELECT id, user_id FROM events WHERE id = ?", [eventId]);
        if (!existingEvent) {
          return reply.status(404).send({ error: "EVENT_NOT_FOUND", message: "Event not found." });
        }

        if (Number(existingEvent.user_id) !== userId) {
          return reply.status(403).send({ error: "FORBIDDEN", message: "Cannot edit this event." });
        }

        const existingPhoto = await get("SELECT id FROM event_photos WHERE id = ? AND event_id = ?", [photoId, eventId]);
        if (!existingPhoto) {
          return reply.status(404).send({ error: "PHOTO_NOT_FOUND", message: "Photo not found." });
        }

        const allEventPhotos = (await all(
          `SELECT id
           FROM event_photos
           WHERE event_id = ?
           ORDER BY sort_order ASC, created_at ASC, id ASC`,
          [eventId],
        )) as Array<{ id: string }>;

        const orderedPhotoIds = [photoId, ...allEventPhotos.map((photo) => photo.id).filter((id) => id !== photoId)];
        let sortOrder = 1;
        for (const orderedPhotoId of orderedPhotoIds) {
          await run("UPDATE event_photos SET sort_order = ? WHERE id = ?", [sortOrder, orderedPhotoId]);
          sortOrder += 1;
        }

        const orderedPhotos = (await all(
          `SELECT id, file_path, created_at
           FROM event_photos
           WHERE event_id = ?
           ORDER BY sort_order ASC, created_at ASC, id ASC`,
          [eventId],
        )) as Array<{ id: string; file_path: string; created_at: string }>;

        return reply.status(200).send({
          photos: orderedPhotos.map((photo) => ({
            id: photo.id,
            path: photo.file_path,
            url: `/uploads/${photo.file_path}`,
            createdAt: photo.created_at,
          })),
        });
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({ error: "SERVER_ERROR", message: "Internal server error" });
      }
    },
  );
}