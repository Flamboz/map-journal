import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { sendError, sendServerError } from "../../utils/httpErrors";
import { CreateEventBody } from "./shared";
import { createEventSchema } from "../schemas/eventSchemas";
import { createEventForUser } from "../../services/eventService";
import { requireAuthenticatedUserId } from "../../auth/requestAuth";

export function registerCreateEventRoute(fastify: FastifyInstance) {
  fastify.post(
    "/events",
    { schema: createEventSchema },
    async (request: FastifyRequest<{ Body: CreateEventBody }>, reply: FastifyReply) => {
      const userId = requireAuthenticatedUserId(request, reply);
      if (!userId) {
        return;
      }

      const body = request.body ?? {};

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
