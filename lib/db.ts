import Database from "better-sqlite3"
import fs from "node:fs"
import path from "node:path"

let db: Database.Database | null = null

function getDb(): Database.Database {
  if (!db) {
    let dbPath = process.env.SQLITE_DB_PATH

    // Check if we are running in Electron
    const isElectron = !!process.versions.electron
    if (isElectron) {
      // In Electron, we want to store the database in the userData folder
      const { app } = require("electron")
      const userDataPath = app.getPath("userData")
      dbPath = path.join(userDataPath, "pizzeria.sqlite")
    } else if (!dbPath) {
      // For the standalone launcher, use a local data folder
      dbPath = path.join(process.cwd(), "data", "pizzeria.sqlite")
    }

    if (!dbPath) throw new Error("SQLITE_DB_PATH environment variable is not set")

    // Ensure directory exists
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
  return Promise.resolve(stmt.all(params) as T[])
}

export function dbRun(sql: string, params: unknown[] = []): Promise<void> {
  const database = getDb()
  const stmt = database.prepare(sql)
  stmt.run(params)
  return Promise.resolve()
}