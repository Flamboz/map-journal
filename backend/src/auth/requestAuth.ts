import type { FastifyReply, FastifyRequest } from "fastify";
import { sendUnauthorized } from "../utils/httpErrors";

export function requireAuthenticatedUser(request: FastifyRequest, reply: FastifyReply) {
  if (!request.authUser) {
    sendUnauthorized(reply);
    return null;
  }

  return request.authUser;
}

export function requireAuthenticatedUserId(request: FastifyRequest, reply: FastifyReply): number | null {
  return requireAuthenticatedUser(request, reply)?.id ?? null;
}
