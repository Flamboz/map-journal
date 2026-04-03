import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { EventParams, parseEventId } from "./shared";
import { sendError, sendEventNotFound, sendInvalidEvent, sendServerError } from "../../utils/httpErrors";
import { deleteEventForUser } from "../../services/eventService";
import { requireAuthenticatedUserId } from "../../auth/requestAuth";

export function registerDeleteEventRoute(fastify: FastifyInstance) {
  fastify.delete(
    "/events/:eventId",
    async (request: FastifyRequest<{ Params: EventParams }>, reply: FastifyReply) => {
      const userId = requireAuthenticatedUserId(request, reply);
      if (!userId) {
        return;
      }

      const eventId = parseEventId(request.params.eventId);
      if (!eventId) {
        return sendInvalidEvent(reply);
      }

      try {
        const result = await deleteEventForUser(eventId, userId);
        if (!result.ok) {
          if (result.error.error === "EVENT_NOT_FOUND") {
            return sendEventNotFound(reply);
          }

          return sendError(reply, result.error.statusCode, result.error.error, result.error.message);
        }

        return reply.status(200).send(result.value);
      } catch (error) {
        return sendServerError(request, reply, error);
      }
    },
  );
}
