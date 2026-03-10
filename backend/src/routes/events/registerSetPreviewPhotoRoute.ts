import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { EventPhotoParams, parseEventId, parsePhotoId, parseUserId, UserQuerystring } from "./shared";
import {
  sendError,
  sendInvalidEvent,
  sendInvalidPhoto,
  sendInvalidUser,
  sendServerError,
} from "../../utils/httpErrors";
import { setPreviewPhotoForUser } from "../../services/photoService";

export function registerSetPreviewPhotoRoute(fastify: FastifyInstance) {
  fastify.patch(
    "/events/:eventId/photos/:photoId/preview",
    async (
      request: FastifyRequest<{ Params: EventPhotoParams; Querystring: UserQuerystring }>,
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

      const photoId = parsePhotoId(request.params.photoId);
      if (!photoId) {
        return sendInvalidPhoto(reply);
      }

      try {
        const result = await setPreviewPhotoForUser(eventId, photoId, userId);
        if (!result.ok) {
          return sendError(reply, result.error.statusCode, result.error.error, result.error.message);
        }

        return reply.status(200).send({ photos: result.value });
      } catch (error) {
        return sendServerError(request, reply, error);
      }
    },
  );
}