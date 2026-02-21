import Database from "better-sqlite3"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const dbPath = process.env.SQLITE_DB_PATH
if (!dbPath) {
    console.error("Missing SQLITE_DB_PATH env var")
    process.exit(1)
}

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