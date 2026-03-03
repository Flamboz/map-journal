import initSqlJs, { Database } from "sql.js";
import fs from "fs";
import path from "path";

const DB_PATH = process.env.SQLITE_PATH || path.join(process.cwd(), "data.sqlite");

let SQL: any;
let db: Database | null = null;

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

  persist();
}

function persist() {
  if (!db) return;
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
}

function run(sql: string, params: any[] = []) {
  if (!db) throw new Error("DB not initialized");
  const stmt = db.prepare(sql);
  try {
    stmt.bind(params);
    stmt.step();
    // fetch last insert id
    const res = db.exec("SELECT last_insert_rowid() as id;");
    persist();
    const lastID = res && res[0] && res[0].values && res[0].values[0] ? res[0].values[0][0] : null;
    return Promise.resolve({ lastID });
  } finally {
    stmt.free();
  }
}

function get(sql: string, params: any[] = []) {
  if (!db) throw new Error("DB not initialized");
  const stmt = db.prepare(sql);
  const out: any = {};
  try {
    stmt.bind(params);
    const ok = stmt.step();
    if (!ok) return Promise.resolve(null);
    const row = stmt.getAsObject();
    return Promise.resolve(row);
  } finally {
    stmt.free();
  }
}

function all(sql: string, params: any[] = []) {
  if (!db) throw new Error("DB not initialized");
  const stmt = db.prepare(sql);
  const rows: any[] = [];
  try {
    stmt.bind(params);
    while (stmt.step()) {
      rows.push(stmt.getAsObject());
    }
    return Promise.resolve(rows);
  } finally {
    stmt.free();
  }
}

export { init, run, get, all };
