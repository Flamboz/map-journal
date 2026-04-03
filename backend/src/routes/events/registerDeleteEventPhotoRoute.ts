import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { EventPhotoParams, parseEventId, parsePhotoId } from "./shared";
import {
  sendError,
  sendInvalidEvent,
  sendInvalidPhoto,
  sendServerError,
} from "../../utils/httpErrors";
import { deleteEventPhotoForUser } from "../../services/photoService";
import { requireAuthenticatedUserId } from "../../auth/requestAuth";

export function registerDeleteEventPhotoRoute(fastify: FastifyInstance) {
  fastify.delete(
    "/events/:eventId/photos/:photoId",
    async (request: FastifyRequest<{ Params: EventPhotoParams }>, reply: FastifyReply) => {
      const userId = requireAuthenticatedUserId(request, reply);
      if (!userId) {
        return;
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
        const result = await deleteEventPhotoForUser(eventId, photoId, userId);
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
