import initSqlJs, { Database, type QueryExecResult, type SqlJsStatic, type SqlValue } from "sql.js";
import fs from "fs";
import path from "path";

const DB_PATH = process.env.SQLITE_PATH || path.join(process.cwd(), "data.sqlite");

type SqlParams = readonly SqlValue[];
type SqlRow = Record<string, SqlValue>;
type RunResult = { lastID: number | null };

let SQL: SqlJsStatic | null = null;
let db: Database | null = null;
let transactionDepth = 0;

async function init() {
  SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    const filebuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(new Uint8Array(filebuffer));
  } else {
    db = new SQL.Database();
  }

  // create tables if needed
  await run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS profiles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      bio TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);

  await ensureEventsAndPhotosSchema();

  await run(`
    CREATE TABLE IF NOT EXISTS map_positions (
      user_id INTEGER PRIMARY KEY,
      lat REAL NOT NULL,
      lng REAL NOT NULL,
      zoom INTEGER NOT NULL,
      updated_at TEXT DEFAULT (datetime('now'))
    );
  `);

  persist();
}

async function ensureColumn(tableName: string, columnSql: string) {
  try {
    await run(`ALTER TABLE ${tableName} ADD COLUMN ${columnSql};`);
  } catch {
    // Column already exists.
  }
}

async function tableExists(tableName: string): Promise<boolean> {
  const row = await get<{ name?: string }>(`SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?`, [tableName]);
  return Boolean(row?.name);
}

async function getTableColumns(tableName: string): Promise<string[]> {
  const rows = await all<{ name?: string }>(`PRAGMA table_info(${tableName})`);
  return rows
    .map((row) => row.name)
    .filter((columnName): columnName is string => typeof columnName === "string" && columnName.length > 0);
}

async function createEventsTable() {
  await run(`
    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL,
      title TEXT DEFAULT '',
      start_date TEXT,
      end_date TEXT,
      description TEXT DEFAULT '',
      rating INTEGER,
      labels TEXT DEFAULT '[]',
      visit_company TEXT DEFAULT '',
      city TEXT DEFAULT '',
      lat REAL NOT NULL,
      lng REAL NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);
}

async function createEventPhotosTable() {
  await run(`
    CREATE TABLE IF NOT EXISTS event_photos (
      id TEXT PRIMARY KEY,
      event_id TEXT NOT NULL,
      file_path TEXT NOT NULL,
      sort_order INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY(event_id) REFERENCES events(id)
    );
  `);
}

async function createEventSharesTable() {
  await run(`
    CREATE TABLE IF NOT EXISTS event_shares (
      event_id TEXT NOT NULL,
      shared_with_user_id INTEGER NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      PRIMARY KEY (event_id, shared_with_user_id),
      FOREIGN KEY(event_id) REFERENCES events(id),
      FOREIGN KEY(shared_with_user_id) REFERENCES users(id)
    );
  `);
}

async function ensureEventSharesSchema() {
  const hasEventSharesTable = await tableExists("event_shares");
  if (!hasEventSharesTable) {
    await createEventSharesTable();
    return;
  }

  const columns = await getTableColumns("event_shares");
  const hasEventId = columns.includes("event_id");
  const hasSharedWithUserId = columns.includes("shared_with_user_id");

  if (hasEventId && hasSharedWithUserId) {
    return;
  }

  const hasLegacyUserId = columns.includes("user_id");
  const temporaryTableName = `event_shares_legacy_${Date.now()}`;

  await run(`ALTER TABLE event_shares RENAME TO ${temporaryTableName}`);
  await createEventSharesTable();

  if (hasEventId && (hasSharedWithUserId || hasLegacyUserId)) {
    const sourceUserColumn = hasSharedWithUserId ? "shared_with_user_id" : "user_id";
    const hasCreatedAt = columns.includes("created_at");
    const createdAtSelect = hasCreatedAt ? "created_at" : "datetime('now')";

    await run(`
      INSERT OR IGNORE INTO event_shares (event_id, shared_with_user_id, created_at)
      SELECT event_id, ${sourceUserColumn}, ${createdAtSelect}
      FROM ${temporaryTableName}
      WHERE event_id IS NOT NULL
        AND ${sourceUserColumn} IS NOT NULL
    `);
  }

  await run(`DROP TABLE ${temporaryTableName}`);
}

async function ensureEventsAndPhotosSchema() {
  const hasEventsTable = await tableExists("events");
  if (!hasEventsTable) {
    await createEventsTable();
    await createEventPhotosTable();
  } else {
    await ensureColumn("events", "start_date TEXT");
    await ensureColumn("events", "end_date TEXT");
    await ensureColumn("events", "description TEXT DEFAULT ''");
    await ensureColumn("events", "rating INTEGER");
    await ensureColumn("events", "labels TEXT DEFAULT '[]'");
    await ensureColumn("events", "visit_company TEXT DEFAULT ''");
    await ensureColumn("events", "city TEXT DEFAULT ''");

    const hasEventPhotosTable = await tableExists("event_photos");
    if (!hasEventPhotosTable) {
      await createEventPhotosTable();
    } else {
      await ensureColumn("event_photos", "sort_order INTEGER DEFAULT 0");
      await ensureColumn("event_photos", "mime_type TEXT");
      await ensureColumn("event_photos", "original_name TEXT");
      await ensureColumn("event_photos", "size_bytes INTEGER");
    }

  }

  await ensureEventSharesSchema();

  await run(`
    CREATE INDEX IF NOT EXISTS idx_event_photos_event_id ON event_photos(event_id);
  `);

  await run(`
    CREATE INDEX IF NOT EXISTS idx_event_shares_shared_with_user_id ON event_shares(shared_with_user_id);
  `);

  await run(`
    CREATE INDEX IF NOT EXISTS idx_event_shares_event_id ON event_shares(event_id);
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS geocode_cache (
      key TEXT PRIMARY KEY,
      lat REAL NOT NULL,
      lon REAL NOT NULL,
      city TEXT DEFAULT '',
      updated_at TEXT DEFAULT (datetime('now'))
    );
  `);
}

function persist() {
  if (!db) return;
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
}

function getLastInsertId(results: QueryExecResult[]): number | null {
  const lastInsertId = results[0]?.values[0]?.[0];
  return typeof lastInsertId === "number" ? lastInsertId : null;
}

function run(sql: string, params: SqlParams = []): Promise<RunResult> {
  if (!db) throw new Error("DB not initialized");
  const stmt = db.prepare(sql);
  try {
    stmt.bind(params);
    stmt.step();
    const res = db.exec("SELECT last_insert_rowid() as id;");
    if (transactionDepth === 0) {
      persist();
    }
    const lastID = getLastInsertId(res);
    return Promise.resolve({ lastID });
  } finally {
    stmt.free();
  }
}

function get<TRow extends SqlRow = SqlRow>(sql: string, params: SqlParams = []): Promise<TRow | null> {
  if (!db) throw new Error("DB not initialized");
  const stmt = db.prepare(sql);
  try {
    stmt.bind(params);
    const ok = stmt.step();
    if (!ok) return Promise.resolve(null);
    const row = stmt.getAsObject() as TRow;
    return Promise.resolve(row);
  } finally {
    stmt.free();
  }
}

function all<TRow extends SqlRow = SqlRow>(sql: string, params: SqlParams = []): Promise<TRow[]> {
  if (!db) throw new Error("DB not initialized");
  const stmt = db.prepare(sql);
  const rows: TRow[] = [];
  try {
    stmt.bind(params);
    while (stmt.step()) {
      rows.push(stmt.getAsObject() as TRow);
    }
    return Promise.resolve(rows);
  } finally {
    stmt.free();
  }
}

async function withTransaction<T>(operation: () => Promise<T>): Promise<T> {
  if (transactionDepth !== 0) {
    throw new Error("Nested transactions are not supported.");
  }

  transactionDepth = 1;

  try {
    await run("BEGIN");
    const result = await operation();
    await run("COMMIT");
    transactionDepth = 0;
    persist();
    return result;
  } catch (error) {
    try {
      await run("ROLLBACK");
    } finally {
      transactionDepth = 0;
    }
    throw error;
  }
}

export { init, run, get, all, withTransaction };
export type { SqlValue };
