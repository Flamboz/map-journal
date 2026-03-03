import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { all, get } from "../db/sqlite";

type UserQuerystring = {
  userId?: string;
};

function parseUserId(userId: string | undefined): number | null {
  const parsed = Number(userId);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}

export default async function eventsRoutes(fastify: FastifyInstance) {
  fastify.get(
    "/events",
    async (request: FastifyRequest<{ Querystring: UserQuerystring }>, reply: FastifyReply) => {
      const userId = parseUserId(request.query.userId);
      if (!userId) {
        return reply.status(400).send({ error: "INVALID_USER", message: "A valid userId is required." });
      }

      try {
        const events = await all(
          "SELECT id, user_id, title, lat, lng, created_at FROM events WHERE user_id = ? ORDER BY created_at DESC",
          [userId],
        );

        return reply.status(200).send({ events });
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({ error: "SERVER_ERROR", message: "Internal server error" });
      }
    },
  );

  fastify.get(
    "/map-position",
    async (request: FastifyRequest<{ Querystring: UserQuerystring }>, reply: FastifyReply) => {
      const userId = parseUserId(request.query.userId);
      if (!userId) {
        return reply.status(400).send({ error: "INVALID_USER", message: "A valid userId is required." });
      }

      try {
        const position = await get("SELECT lat, lng, zoom FROM map_positions WHERE user_id = ?", [userId]);

        return reply.status(200).send({ lastMapPosition: position ?? null });
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({ error: "SERVER_ERROR", message: "Internal server error" });
      }
    },
  );
}
