import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import fs from "fs";
import path from "path";
import { all, get, run } from "../../db/sqlite";
import { EventParams, parseEventId, parseUserId, UserQuerystring } from "./shared";

export function registerDeleteEventRoute(fastify: FastifyInstance) {
  fastify.delete(
    "/events/:eventId",
    async (request: FastifyRequest<{ Params: EventParams; Querystring: UserQuerystring }>, reply: FastifyReply) => {
      const userId = parseUserId(request.query.userId);
      if (!userId) {
        return reply.status(400).send({ error: "INVALID_USER", message: "A valid userId is required." });
      }

      const eventId = parseEventId(request.params.eventId);
      if (!eventId) {
        return reply.status(400).send({ error: "INVALID_EVENT", message: "A valid eventId is required." });
      }

      try {
        const existingEvent = await get("SELECT id, user_id FROM events WHERE id = ?", [eventId]);
        if (!existingEvent) {
          return reply.status(404).send({ error: "EVENT_NOT_FOUND", message: "Event not found." });
        }

        if (Number(existingEvent.user_id) !== userId) {
          return reply.status(403).send({ error: "FORBIDDEN", message: "Cannot delete this event." });
        }

        const photos = (await all("SELECT file_path FROM event_photos WHERE event_id = ?", [eventId])) as Array<{
          file_path: string;
        }>;

        await run("DELETE FROM event_photos WHERE event_id = ?", [eventId]);
        await run("DELETE FROM events WHERE id = ?", [eventId]);

        for (const photo of photos) {
          const absoluteFilePath = path.join(process.cwd(), "uploads", photo.file_path);
          if (fs.existsSync(absoluteFilePath)) {
            fs.unlinkSync(absoluteFilePath);
          }
        }

        return reply.status(200).send({ success: true });
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({ error: "SERVER_ERROR", message: "Internal server error" });
      }
    },
  );
}