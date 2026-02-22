import Database from "better-sqlite3"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PROJECT_ROOT = path.resolve(__dirname, "..")

const rawDbPath = process.env.SQLITE_DB_PATH
if (!rawDbPath) {
    console.error("Missing SQLITE_DB_PATH env var")
    process.exit(1)
}

// Resolve relative paths against the project root so the script works
// regardless of the working directory from which it is invoked.
const dbPath = path.isAbsolute(rawDbPath)
    ? rawDbPath
    : path.resolve(PROJECT_ROOT, rawDbPath)

fs.mkdirSync(path.dirname(dbPath), { recursive: true })

const db = new Database(dbPath)
db.pragma("foreign_keys = ON")

const schema = fs.readFileSync(
    path.join(__dirname, "001-create-tables-sqlite.sql"),
    "utf8"
)

db.exec(schema)
db.close()

console.log("✅ SQLite DB initialized:", dbPath)