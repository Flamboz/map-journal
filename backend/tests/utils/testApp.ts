import fs from "fs";
import os from "os";
import path from "path";
import type { FastifyInstance } from "fastify";
import { vi } from "vitest";

export type TestAppContext = {
  app: FastifyInstance;
  run: (sql: string, params?: unknown[]) => Promise<unknown>;
  get: (sql: string, params?: unknown[]) => Promise<unknown>;
  all: (sql: string, params?: unknown[]) => Promise<unknown[]>;
  cleanup: () => Promise<void>;
};

export async function createTestAppContext(): Promise<TestAppContext> {
  const sqlitePath = path.join(os.tmpdir(), `map-journal-test-${Date.now()}-${Math.random()}.sqlite`);
  process.env.SQLITE_PATH = sqlitePath;
  process.env.AUTH_TOKEN_SECRET = process.env.AUTH_TOKEN_SECRET ?? "test-auth-token-secret";
  vi.resetModules();

  const dbModule = await import("../../src/db/sqlite");
  await dbModule.init();

  const appModule = await import("../../src/app");
  const app = await appModule.buildApp();

  return {
    app,
    run: dbModule.run,
    get: dbModule.get,
    all: dbModule.all,
    cleanup: async () => {
      await app.close();
      if (fs.existsSync(sqlitePath)) {
        fs.unlinkSync(sqlitePath);
      }
    },
  };
}
