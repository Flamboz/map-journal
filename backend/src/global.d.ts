declare module "sql.js" {
  const initSqlJs: any;
  export default initSqlJs;
  export type Database = any;
}

// Provide minimal fallbacks so the TS server won't error if node_modules aren't installed yet
declare module "fastify" {
  import type { IncomingMessage, ServerResponse } from "http";
  const fastify: any;
  export type FastifyInstance = any;
  export type FastifyRequest<T = any> = any;
  export type FastifyReply = any;
  export default fastify;
}
