import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import {
  sendError,
  sendEventNotFound,
  sendInvalidEvent,
  sendInvalidUser,
  sendServerError,
} from "../../utils/httpErrors";
import { EventParams, parseEventId, parseUserId, UpdateEventBody } from "./shared";
import { updateEventForUser } from "../../services/eventService";

export function registerUpdateEventRoute(fastify: FastifyInstance) {
  fastify.patch(
    "/events/:eventId",
    async (
      request: FastifyRequest<{ Params: EventParams; Body: UpdateEventBody }>,
      reply: FastifyReply,
    ) => {
      const body = request.body ?? {};
      const userId = parseUserId(typeof body.userId === "number" ? String(body.userId) : body.userId);
      if (!userId) {
        return sendInvalidUser(reply);
      }

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