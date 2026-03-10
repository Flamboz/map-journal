import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { sendError, sendServerError } from "../utils/httpErrors";
import { isStrongPassword, isValidEmail, normalizeEmail } from "../utils/validators";
import { authenticateUser, registerUser } from "../services/authService";
import { loginSchema, registerSchema } from "./schemas/authSchemas";

export default async function authRoutes(fastify: FastifyInstance) {
  fastify.post(
    "/register",
    { schema: registerSchema },
    async (request: FastifyRequest<{ Body: { email?: string; password?: string } }>, reply: FastifyReply) => {
      const body = request.body;
      const email = normalizeEmail(body?.email);
      const password = body?.password;

      if (!email || !isValidEmail(email)) {
        return sendError(reply, 400, "INVALID_EMAIL", "Please provide a valid email address.");
      }

      if (!isStrongPassword(password)) {
        return sendError(reply, 400, "WEAK_PASSWORD", "Password must be at least 8 characters.");
      }

      try {
        const user = await registerUser(email, password);
        if (!user) {
          return sendError(reply, 409, "USER_EXISTS", "An account with this email already exists.");
        }

        return reply.status(201).send({ user });
      } catch (error) {
        return sendServerError(request, reply, error);
      }
    },
  );

  fastify.post(
    "/login",
    { schema: loginSchema },
    async (request: FastifyRequest<{ Body: { email?: string; password?: string } }>, reply: FastifyReply) => {
      const body = request.body;
      const email = normalizeEmail(body?.email);
      const password = body?.password || "";

      if (!email || !password) {
        return sendError(reply, 400, "INVALID_INPUT", "Email and password are required.");
      }

      try {
        const user = await authenticateUser(email, password);
        if (!user) {
          return sendError(reply, 401, "INVALID_CREDENTIALS", "Invalid email or password.");
        }

        return reply.status(200).send({ user });
      } catch (error) {
        return sendServerError(request, reply, error);
      }
    },
  );
}
