import Fastify, { FastifyReply, FastifyRequest } from "fastify";
import multipart from "@fastify/multipart";
import fastifyStatic from "@fastify/static";
import dotenv from "dotenv";
import path from "path";
import { init } from "./db/sqlite";
import authRoutes from "./routes/auth";
import eventsRoutes from "./routes/events";

dotenv.config();

const PORT = Number(process.env.PORT || 4000);

async function start() {
  const app = Fastify({ logger: true });

  // Simple CORS handling to avoid plugin-version mismatch issues
  app.addHook("onRequest", async (request: FastifyRequest, reply: FastifyReply) => {
    reply.header("Access-Control-Allow-Origin", "*");
    reply.header("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
    reply.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    if (request.method === "OPTIONS") {
      reply.code(204).send();
    }
  });

  await init();

  await app.register(multipart);
  await app.register(fastifyStatic, {
    root: path.join(process.cwd(), "uploads"),
    prefix: "/uploads/",
  });

  await app.register(authRoutes, { prefix: "/auth" });
  await app.register(eventsRoutes);

  try {
    await app.listen({ port: PORT, host: "0.0.0.0" });
    console.log(`Backend listening on http://localhost:${PORT}`);
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
}

start();
// server started in start()
