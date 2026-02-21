import Database from "better-sqlite3"
import fs from "node:fs"
import path from "node:path"

let db: Database.Database | null = null

function getDb(): Database.Database {
  if (!db) {
    const dbPath = process.env.SQLITE_DB_PATH
    if (!dbPath) throw new Error("SQLITE_DB_PATH environment variable is not set")

    fs.mkdirSync(path.dirname(dbPath), { recursive: true })
    db = new Database(dbPath)
    db.pragma("foreign_keys = ON")
  }
  return db
}

export function dbAll<T = unknown>(sql: string, params: unknown[] = []): Promise<T[]> {
  const database = getDb()
  const stmt = database.prepare(sql)
  return Promise.resolve(stmt.all(params) as T[])
}

export function dbRun(sql: string, params: unknown[] = []): Promise<void> {
  const database = getDb()
  const stmt = database.prepare(sql)
  stmt.run(params)
  return Promise.resolve()
}