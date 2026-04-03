import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { sendServerError } from "../../utils/httpErrors";
import { requireAuthenticatedUser } from "../../auth/requestAuth";
import { findShareableUserByEmail } from "../../services/eventSharing";

type LookupShareUserQuerystring = {
  email?: string;
};

export function registerLookupShareUserRoute(fastify: FastifyInstance) {
  fastify.get(
    "/events/shareable-users/lookup",
    async (
      request: FastifyRequest<{ Querystring: LookupShareUserQuerystring }>,
      reply: FastifyReply,
    ) => {
      if (!requireAuthenticatedUser(request, reply)) {
        return;
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
