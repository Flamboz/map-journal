import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { sendError, sendEventNotFound, sendInvalidEvent, sendInvalidUser, sendServerError } from "../../utils/httpErrors";
import { EventParams, parseEventId, parseUserId, UserQuerystring } from "./shared";
import { getEventByIdForUser } from "../../services/eventService";

export function registerGetEventByIdRoute(fastify: FastifyInstance) {
  fastify.get(
    "/events/:eventId",
    async (
      request: FastifyRequest<{ Params: EventParams; Querystring: UserQuerystring }>,
      reply: FastifyReply,
    ) => {
      const userId = parseUserId(request.query.userId);
      if (!userId) {
        return sendInvalidUser(reply);
      }

      const eventId = parseEventId(request.params.eventId);
      if (!eventId) {
        return sendInvalidEvent(reply);
      }

      try {
        const result = await getEventByIdForUser(eventId, userId);
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
