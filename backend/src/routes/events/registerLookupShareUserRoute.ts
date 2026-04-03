import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { sendInvalidUser, sendServerError } from "../../utils/httpErrors";
import { findShareableUserByEmail } from "../../services/eventSharing";
import { parseUserId } from "./shared";

type LookupShareUserQuerystring = {
  userId?: string;
  email?: string;
};

export function registerLookupShareUserRoute(fastify: FastifyInstance) {
  fastify.get(
    "/events/shareable-users/lookup",
    async (
      request: FastifyRequest<{ Querystring: LookupShareUserQuerystring }>,
      reply: FastifyReply,
    ) => {
      const userId = parseUserId(request.query.userId);
      if (!userId) {
        return sendInvalidUser(reply);
      }

      try {
        const result = await findShareableUserByEmail(request.query.email);
        return reply.status(200).send(result);
      } catch (error) {
        return sendServerError(request, reply, error);
      }
    },
  );
}
