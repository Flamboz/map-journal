import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { all } from "../../db/sqlite";
import { EventPhotoRow, EventRow, groupPhotosByEvent, normalizeEventRows, parseUserId, UserQuerystring } from "./shared";

export function registerGetEventsRoute(fastify: FastifyInstance) {
  fastify.get(
    "/events",
    async (request: FastifyRequest<{ Querystring: UserQuerystring }>, reply: FastifyReply) => {
      const userId = parseUserId(request.query.userId);
      if (!userId) {
        return reply.status(400).send({ error: "INVALID_USER", message: "A valid userId is required." });
      }

      try {
        const events = (await all(
          "SELECT id, user_id, title, start_date, end_date, description, rating, labels, visit_company, lat, lng, created_at FROM events WHERE user_id = ? ORDER BY created_at DESC, id DESC",
          [userId],
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

        const normalizedEvents = normalizeEventRows(events, groupPhotosByEvent(photos));

        return reply.status(200).send({ events: normalizedEvents });
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({ error: "SERVER_ERROR", message: "Internal server error" });
      }
    },
  );
}
