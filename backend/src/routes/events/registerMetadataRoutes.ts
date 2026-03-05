import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { ALLOWED_LABEL_VALUES, ALLOWED_VISIT_COMPANY_VALUES } from "./shared";

export function registerMetadataRoutes(fastify: FastifyInstance) {
  fastify.get("/events/labels", async (_request: FastifyRequest, reply: FastifyReply) => {
    return reply.status(200).send({ labels: [...ALLOWED_LABEL_VALUES] });
  });

  fastify.get("/events/visit-companies", async (_request: FastifyRequest, reply: FastifyReply) => {
    return reply.status(200).send({ visitCompanies: [...ALLOWED_VISIT_COMPANY_VALUES] });
  });
}
