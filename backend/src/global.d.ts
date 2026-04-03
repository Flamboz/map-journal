declare module "sql.js" {
  export type SqlValue = number | string | Uint8Array | null;

  export interface QueryExecResult {
    columns: string[];
    values: SqlValue[][];
  }

  export interface Statement {
    bind(values: readonly SqlValue[]): void;
    step(): boolean;
    getAsObject(): Record<string, SqlValue>;
    free(): void;
  }

  export interface Database {
    prepare(sql: string): Statement;
    exec(sql: string): QueryExecResult[];
    export(): Uint8Array;
  }

  export interface SqlJsStatic {
    Database: new (data?: Uint8Array) => Database;
  }

  export default function initSqlJs(): Promise<SqlJsStatic>;
}

declare module "fastify" {
  type RouteGenericInterface = {
    Body?: unknown;
    Querystring?: unknown;
    Params?: unknown;
  };

  export interface FastifyRequest<RouteGeneric extends RouteGenericInterface = RouteGenericInterface> {
    body: RouteGeneric["Body"];
    query: RouteGeneric["Querystring"];
    params: RouteGeneric["Params"];
    headers: Record<string, string | string[] | undefined>;
    method: string;
    authUser: import("./auth/token").AuthenticatedUser | null;
    log: {
      error: (...args: unknown[]) => void;
    };
  }

  interface FastifyRequest {
    authUser: import("./auth/token").AuthenticatedUser | null;
  }

  export interface FastifyReply {
    header: (name: string, value: string) => FastifyReply;
    code: (statusCode: number) => FastifyReply;
    status: (statusCode: number) => FastifyReply;
    send: (payload?: unknown) => FastifyReply;
  }

  type RouteHandler<RouteGeneric extends RouteGenericInterface = RouteGenericInterface> = (
    request: FastifyRequest<RouteGeneric>,
    reply: FastifyReply,
  ) => unknown | Promise<unknown>;

  type RouteMethod = {
    <RouteGeneric extends RouteGenericInterface = RouteGenericInterface>(path: string, handler: RouteHandler<RouteGeneric>): void;
    <RouteGeneric extends RouteGenericInterface = RouteGenericInterface>(
      path: string,
      options: { schema?: unknown },
      handler: RouteHandler<RouteGeneric>,
    ): void;
  };

  export interface FastifyInstance {
    get: RouteMethod;
    post: RouteMethod;
    patch: RouteMethod;
    delete: RouteMethod;
    register: (plugin: (fastify: FastifyInstance, opts?: unknown) => unknown | Promise<unknown>, opts?: unknown) => Promise<void>;
    addHook: (name: string, hook: (request: FastifyRequest, reply: FastifyReply) => unknown | Promise<unknown>) => void;
    decorateRequest: (name: string, defaultValue: unknown) => void;
    listen: (options: { port: number; host: string }) => Promise<void>;
    close: () => Promise<void>;
    log: {
      error: (...args: unknown[]) => void;
    };
  }

  export default function Fastify(options?: { logger?: boolean }): FastifyInstance;
}
