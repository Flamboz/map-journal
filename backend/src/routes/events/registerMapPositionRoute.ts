import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { get } from "../../db/sqlite";
import { sendServerError } from "../../utils/httpErrors";
import { DEFAULT_PIN_ZOOM } from "./shared";
import { requireAuthenticatedUserId } from "../../auth/requestAuth";

export function registerMapPositionRoute(fastify: FastifyInstance) {
  fastify.get(
    "/map-position",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const userId = requireAuthenticatedUserId(request, reply);
      if (!userId) {
        return;
      }

      try {
        const storedPosition = (await get("SELECT lat, lng, zoom FROM map_positions WHERE user_id = ?", [userId])) as
          | { lat: number; lng: number; zoom: number }
          | null;

        if (storedPosition) {
          return reply.status(200).send({ lastMapPosition: storedPosition });
        }

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

        return reply.status(200).send({ lastMapPosition: null });
      } catch (error) {
        return sendServerError(request, reply, error);
      }
    },
  );
}
