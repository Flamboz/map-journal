import { FastifyReply, FastifyRequest } from "fastify";

export type ApiErrorPayload = {
  error: string;
  message: string;
};

export function sendError(reply: FastifyReply, statusCode: number, error: string, message: string) {
  return reply.status(statusCode).send({ error, message } satisfies ApiErrorPayload);
}

export function sendServerError(request: FastifyRequest, reply: FastifyReply, error: unknown) {
  request.log.error(error);
  return sendError(reply, 500, "SERVER_ERROR", "Internal server error");
}

export function sendInvalidUser(reply: FastifyReply) {
  return sendError(reply, 400, "INVALID_USER", "A valid userId is required.");
}

export function sendInvalidEvent(reply: FastifyReply) {
  return sendError(reply, 400, "INVALID_EVENT", "A valid eventId is required.");
}

export function sendInvalidPhoto(reply: FastifyReply) {
  return sendError(reply, 400, "INVALID_PHOTO", "A valid photoId is required.");
}

export function sendEventNotFound(reply: FastifyReply) {
  return sendError(reply, 404, "EVENT_NOT_FOUND", "Event not found.");
}

export function sendForbidden(reply: FastifyReply, message = "Cannot access this resource.") {
  return sendError(reply, 403, "FORBIDDEN", message);
}
