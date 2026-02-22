import Database from "better-sqlite3"
import fs from "node:fs"
import path from "node:path"

let db: Database.Database | null = null

function getDb(): Database.Database {
  if (!db) {
    let dbPath = process.env.SQLITE_DB_PATH?.trim()

    const root = process.env.PROJECT_ROOT || process.cwd()

    if (!dbPath) {
      dbPath = path.resolve(root, "data", "pizzeria.sqlite")
    } else {
      dbPath = path.resolve(root, dbPath)
    }

    console.log(`[SISTEMA] Base de datos conectada en: ${dbPath}`)

    const dbDir = path.dirname(dbPath)
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true })
    }

    db = new Database(dbPath)
    db.pragma("foreign_keys = ON")
  }
  return db
}

export function dbAll<T = unknown>(sql: string, params: unknown[] = []): Promise<T[]> {
  const database = getDb()
  const stmt = database.prepare(sql)
  return Promise.resolve(stmt.all(...params) as T[])
}

export function dbRun(sql: string, params: unknown[] = []): Promise<void> {
  const database = getDb()
  const stmt = database.prepare(sql)
  stmt.run(...params)
  return Promise.resolve()
}

/** Runs a statement and returns lastInsertRowid and changes. Use for INSERT/UPDATE/DELETE when you need the result. */
export function dbRunReturn(
  sql: string,
  params: unknown[] = []
): Promise<{ lastInsertRowid: number; changes: number }> {
  const database = getDb()
  const stmt = database.prepare(sql)
  const result = stmt.run(...params) as { lastInsertRowid: number | bigint; changes: number }
  const lastInsertRowid = Number(result.lastInsertRowid ?? 0)
  const changes = result.changes ?? 0
  return Promise.resolve({ lastInsertRowid, changes })
}

/** Runs multiple operations inside a transaction. On throw, rolls back automatically. */
export function dbTransaction<T>(fn: (database: Database.Database) => T): Promise<T> {
  try {
    const database = getDb()
    // Use better-sqlite3's native transaction() which handles BEGIN/COMMIT/ROLLBACK
    // correctly, supports savepoints for nested calls, and is exception-safe.
    const result = database.transaction(fn)(database)
    return Promise.resolve(result)
  } catch (e) {
    return Promise.reject(e)
  }
}
