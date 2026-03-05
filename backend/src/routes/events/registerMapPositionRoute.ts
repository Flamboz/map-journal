import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { get } from "../../db/sqlite";
import { DEFAULT_PIN_ZOOM, parseUserId, UserQuerystring } from "./shared";

export function registerMapPositionRoute(fastify: FastifyInstance) {
  fastify.get(
    "/map-position",
    async (request: FastifyRequest<{ Querystring: UserQuerystring }>, reply: FastifyReply) => {
      const userId = parseUserId(request.query.userId);
      if (!userId) {
        return reply.status(400).send({ error: "INVALID_USER", message: "A valid userId is required." });
      }

      try {
        const latestEvent = (await get(
          `SELECT lat, lng
           FROM events
           WHERE user_id = ?
           ORDER BY created_at DESC, id DESC
           LIMIT 1`,
          [userId],
        )) as { lat: number; lng: number } | null;

        if (latestEvent) {
          return reply
            .status(200)
            .send({ lastMapPosition: { lat: latestEvent.lat, lng: latestEvent.lng, zoom: DEFAULT_PIN_ZOOM } });
        }

        const storedPosition = (await get("SELECT lat, lng, zoom FROM map_positions WHERE user_id = ?", [userId])) as
          | { lat: number; lng: number; zoom: number }
          | null;

        return reply.status(200).send({ lastMapPosition: storedPosition ?? null });
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({ error: "SERVER_ERROR", message: "Internal server error" });
      }
    },
  );
}
