import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { get, run } from "../db/sqlite";
import { hashPassword, verifyPassword } from "../auth/hash";

export default async function authRoutes(fastify: FastifyInstance) {
  fastify.post(
    "/register",
    async (request: FastifyRequest<{ Body: { email?: string; password?: string } }>, reply: FastifyReply) => {
      const body = request.body;
      const email = (body?.email || "").toLowerCase().trim();
      const password = body?.password || "";

    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return reply.status(400).send({ error: "INVALID_EMAIL", message: "Please provide a valid email address." });
    }
    if (typeof password !== "string" || password.length < 8) {
      return reply.status(400).send({ error: "WEAK_PASSWORD", message: "Password must be at least 8 characters." });
    }

    try {
      const existing = await get("SELECT id FROM users WHERE email = ?", [email]);
      if (existing) return reply.status(409).send({ error: "USER_EXISTS", message: "An account with this email already exists." });

      const password_hash = await hashPassword(password);
      const res = (await run("INSERT INTO users (email, password_hash) VALUES (?, ?)", [
        email,
        password_hash,
      ])) as { lastID?: number };
      const userId = res.lastID ?? null;
      await run("INSERT INTO profiles (user_id) VALUES (?)", [userId]);

      return reply.status(201).send({ user: { id: userId, email } });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: "SERVER_ERROR", message: "Internal server error" });
    }
  });

  fastify.post(
    "/login",
    async (request: FastifyRequest<{ Body: { email?: string; password?: string } }>, reply: FastifyReply) => {
      const body = request.body;
      const email = (body?.email || "").toLowerCase().trim();
      const password = body?.password || "";

    if (!email || !password) return reply.status(400).send({ error: "INVALID_INPUT", message: "Email and password are required." });

    try {
      const user = await get("SELECT id, email, password_hash FROM users WHERE email = ?", [email]);
      if (!user) return reply.status(401).send({ error: "INVALID_CREDENTIALS", message: "Invalid email or password." });

      const ok = await verifyPassword(user.password_hash, password);
      if (!ok) return reply.status(401).send({ error: "INVALID_CREDENTIALS", message: "Invalid email or password." });

      return reply.status(200).send({ user: { id: user.id, email: user.email } });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: "SERVER_ERROR", message: "Internal server error" });
    }
  });
}
