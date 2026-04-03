import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import {
  sendError,
  sendInvalidEvent,
  sendInvalidUser,
  sendServerError,
} from "../../utils/httpErrors";
import {
  EventParams,
  parseEventId,
  parseUserId,
  UserQuerystring,
} from "./shared";
import { uploadEventPhotosForUser } from "../../services/photoService";

export function registerUploadEventPhotosRoute(fastify: FastifyInstance) {
  fastify.post(
    "/events/:eventId/photos",
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
