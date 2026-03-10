import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { sendError, sendInvalidUser, sendServerError } from "../../utils/httpErrors";
import { CreateEventBody, parseUserId } from "./shared";
import { createEventSchema } from "../schemas/eventSchemas";
import { createEventForUser } from "../../services/eventService";

export function registerCreateEventRoute(fastify: FastifyInstance) {
  fastify.post(
    "/events",
    { schema: createEventSchema },
    async (request: FastifyRequest<{ Body: CreateEventBody }>, reply: FastifyReply) => {
      const body = request.body ?? {};
      const userId = parseUserId(typeof body.userId === "number" ? String(body.userId) : body.userId);
      if (!userId) {
        return sendInvalidUser(reply);
      }

      try {
        const result = await createEventForUser({ ...body, userId });
        if (!result.ok) {
          return sendError(reply, result.error.statusCode, result.error.error, result.error.message);
        }

        return reply.status(201).send({ event: result.value });
      } catch (error) {
        return sendServerError(request, reply, error);
      }
    },
  );
}
