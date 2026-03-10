import { randomUUID } from "crypto";

type RunFn = (sql: string, params?: unknown[]) => Promise<unknown>;

export async function createUser(run: RunFn, email: string, passwordHash: string) {
  const result = (await run("INSERT INTO users (email, password_hash) VALUES (?, ?)", [
    email,
    passwordHash,
  ])) as { lastID?: number };
  return result.lastID ?? null;
}

export async function createEvent(run: RunFn, data: { userId: number; title: string; lat?: number; lng?: number }) {
  const eventId = randomUUID();
  await run(
    `INSERT INTO events (id, user_id, title, start_date, end_date, description, rating, labels, visit_company, lat, lng)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      eventId,
      data.userId,
      data.title,
      "2026-03-10",
      null,
      "",
      null,
      "[]",
      "",
      data.lat ?? 40.7128,
      data.lng ?? -74.006,
    ],
  );
  return eventId;
}
