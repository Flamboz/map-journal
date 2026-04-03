import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import {
  sendError,
  sendInvalidEvent,
  sendServerError,
} from "../../utils/httpErrors";
import {
  EventParams,
  parseEventId,
} from "./shared";
import { uploadEventPhotosForUser } from "../../services/photoService";
import { requireAuthenticatedUserId } from "../../auth/requestAuth";

export function registerUploadEventPhotosRoute(fastify: FastifyInstance) {
  fastify.post(
    "/events/:eventId/photos",
    async (request: FastifyRequest<{ Params: EventParams }>, reply: FastifyReply) => {
      const userId = requireAuthenticatedUserId(request, reply);
      if (!userId) {
        return;
      }

      const eventId = parseEventId(request.params.eventId);
      if (!eventId) {
        return sendInvalidEvent(reply);
      }

      const isMultipart = request.isMultipart();
      if (!isMultipart) {
        return sendError(reply, 400, "INVALID_MULTIPART", "Photos must be sent as multipart/form-data.");
      }

      try {
        const result = await uploadEventPhotosForUser(eventId, userId, request.parts());
        if (!result.ok) {
          return sendError(reply, result.error.statusCode, result.error.error, result.error.message);
        }

        return reply.status(201).send({ photos: result.value });
      } catch (error) {
        return sendServerError(request, reply, error);
      }
    },
  );
}
