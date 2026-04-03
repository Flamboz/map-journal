import Fastify, { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import multipart from "@fastify/multipart";
import fastifyStatic from "@fastify/static";
import path from "path";
import { assertAuthTokenSecretConfigured, verifyAuthToken } from "./auth/token";
import authRoutes from "./routes/auth";
import eventsRoutes from "./routes/events";

export async function buildApp(): Promise<FastifyInstance> {
  assertAuthTokenSecretConfigured();

  const app = Fastify({ logger: true });
  app.decorateRequest("authUser", null);

  app.addHook("onRequest", async (request: FastifyRequest, reply: FastifyReply) => {
    reply.header("Access-Control-Allow-Origin", "*");
    reply.header("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
    reply.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    if (request.method === "OPTIONS") {
      return reply.code(204).send();
    }

    const authHeader = request.headers.authorization;
    if (typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
      request.authUser = verifyAuthToken(authHeader.slice("Bearer ".length).trim());
      return;
    }

    request.authUser = null;
  });

  await app.register(multipart, { limits: { fileSize: Number.MAX_SAFE_INTEGER } });
  await app.register(fastifyStatic, {
    root: path.join(process.cwd(), "uploads"),
    prefix: "/uploads/",
  });

  await app.register(authRoutes, { prefix: "/auth" });
  await app.register(eventsRoutes);

  return app;
}
