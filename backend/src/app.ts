import Fastify, { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import multipart from "@fastify/multipart";
import fastifyStatic from "@fastify/static";
import path from "path";
import authRoutes from "./routes/auth";
import eventsRoutes from "./routes/events";

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({ logger: true });

  app.addHook("onRequest", async (request: FastifyRequest, reply: FastifyReply) => {
    reply.header("Access-Control-Allow-Origin", "*");
    reply.header("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
    reply.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    if (request.method === "OPTIONS") {
      reply.code(204).send();
    }
  });

  await app.register(multipart);
  await app.register(fastifyStatic, {
    root: path.join(process.cwd(), "uploads"),
    prefix: "/uploads/",
  });

  await app.register(authRoutes, { prefix: "/auth" });
  await app.register(eventsRoutes);

  return app;
}
