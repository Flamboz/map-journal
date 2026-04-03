import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { sendServerError } from "../../utils/httpErrors";
import { UserQuerystring } from "./shared";
import { listEventsForUser } from "../../services/eventService";
import { requireAuthenticatedUserId } from "../../auth/requestAuth";

export function registerGetEventsRoute(fastify: FastifyInstance) {
  fastify.get(
    "/events",
    async (request: FastifyRequest<{ Querystring: UserQuerystring }>, reply: FastifyReply) => {
      const userId = requireAuthenticatedUserId(request, reply);
      if (!userId) {
        return;
      }

      try {
        const normalizedEvents = await listEventsForUser({
          userId,
          search: request.query.search,
          labels: request.query.labels,
          visitCompany: request.query.visitCompany,
          dateFrom: request.query.dateFrom,
          dateTo: request.query.dateTo,
        });

        return reply.status(200).send({ events: normalizedEvents });
      } catch (error) {
        return sendServerError(request, reply, error);
      }
    },
  );
}
