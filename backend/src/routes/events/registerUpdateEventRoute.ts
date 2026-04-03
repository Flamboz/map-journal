import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import {
  sendError,
  sendEventNotFound,
  sendInvalidEvent,
  sendServerError,
} from "../../utils/httpErrors";
import { EventParams, parseEventId, UpdateEventBody } from "./shared";
import { updateEventForUser } from "../../services/eventService";
import { updateEventSchema } from "../schemas/eventSchemas";
import { requireAuthenticatedUserId } from "../../auth/requestAuth";

export function registerUpdateEventRoute(fastify: FastifyInstance) {
  fastify.patch(
    "/events/:eventId",
    { schema: updateEventSchema },
    async (
      request: FastifyRequest<{ Params: EventParams; Body: UpdateEventBody }>,
      reply: FastifyReply,
    ) => {
      const userId = requireAuthenticatedUserId(request, reply);
      if (!userId) {
        return;
      }

      const body = request.body ?? {};

      const eventId = parseEventId(request.params.eventId);
      if (!eventId) {
        return sendInvalidEvent(reply);
      }

      try {
        const result = await updateEventForUser({ ...body, userId, eventId });
        if (!result.ok) {
          if (result.error.error === "EVENT_NOT_FOUND") {
            return sendEventNotFound(reply);
          }

          return sendError(reply, result.error.statusCode, result.error.error, result.error.message);
        }

        return reply.status(200).send({ event: result.value });
      } catch (error) {
        return sendServerError(request, reply, error);
      }
    },
  );
}
