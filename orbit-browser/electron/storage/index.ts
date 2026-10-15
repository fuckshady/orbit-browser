import initSqlJs, { type Database } from "sql.js";
import { app } from "electron";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
let db: Database;
let file: string;
export async function openStorage() {
  const require = createRequire(__filename);
  const SQL = await initSqlJs({
    locateFile: () => require.resolve("sql.js/dist/sql-wasm.wasm"),
  });
  file = path.join(app.getPath("userData"), "orbit.sqlite");
  db = fs.existsSync(file)
    ? new SQL.Database(fs.readFileSync(file))
    : new SQL.Database();
  db.run(
    "CREATE TABLE IF NOT EXISTS state (key TEXT PRIMARY KEY, value TEXT NOT NULL); CREATE TABLE IF NOT EXISTS history (id TEXT PRIMARY KEY,url TEXT,title TEXT,date INTEGER,favicon TEXT,space TEXT); CREATE TABLE IF NOT EXISTS bookmarks (id TEXT PRIMARY KEY,url TEXT,title TEXT,date INTEGER,folder TEXT,space TEXT)",
  );
}
export function get<T>(key: string, fallback: T): T {
  const stmt = db.prepare("SELECT value FROM state WHERE key=?");
  try {
    stmt.bind([key]);
    return stmt.step() ? JSON.parse(String(stmt.get()[0])) : fallback;
  } finally {
    stmt.free();
  }
}
export function put(key: string, value: unknown) {
  db.run("INSERT OR REPLACE INTO state VALUES (?,?)", [
    key,
    JSON.stringify(value),
  ]);
  flush();
}
export function rows(table: "history" | "bookmarks") {
  return db
    .exec(`SELECT * FROM ${table} ORDER BY date DESC LIMIT 2000`)
    .flatMap((r) =>
      r.values.map((v) =>
        Object.fromEntries(r.columns.map((c, i) => [c, v[i]])),
      ),
    );
}
export function insert(
  table: "history" | "bookmarks",
  r: Record<string, string | number>,
) {
  const keys =
    table === "history"
      ? ["id", "url", "title", "date", "favicon", "space"]
      : ["id", "url", "title", "date", "folder", "space"];
  db.run(
    `INSERT OR REPLACE INTO ${table} (${keys.join(",")}) VALUES (${keys.map(() => "?").join(",")})`,
    keys.map((k) => r[k] ?? ""),
  );
  flush();
}
export function remove(table: "history" | "bookmarks", id?: string) {
  if (id) db.run(`DELETE FROM ${table} WHERE id=?`, [id]);
  else db.run(`DELETE FROM ${table}`);
  flush();
}
export function flush() {
  if (db) {
    const tmp = file + ".tmp";
    fs.writeFileSync(tmp, db.export());
    fs.renameSync(tmp, file);
  }
}

export function updateVisit(id: string, title: string, favicon: string) {
  db.run("UPDATE history SET title=?,favicon=? WHERE id=?", [
    title,
    favicon,
    id,
  ]);
  flush();
}
