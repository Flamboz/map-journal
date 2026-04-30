import "fastify";

declare module "fastify" {
  interface FastifyRequest {
    authUser: import("./auth/token").AuthenticatedUser | null;
  }
}

export {};
