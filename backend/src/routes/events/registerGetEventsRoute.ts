import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { sendInvalidUser, sendServerError } from "../../utils/httpErrors";
import { parseUserId, UserQuerystring } from "./shared";
import { listEventsForUser } from "../../services/eventService";

export function registerGetEventsRoute(fastify: FastifyInstance) {
  fastify.get(
    "/events",
    async (request: FastifyRequest<{ Querystring: UserQuerystring }>, reply: FastifyReply) => {
      const userId = parseUserId(request.query.userId);
      if (!userId) {
        return sendInvalidUser(reply);
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
