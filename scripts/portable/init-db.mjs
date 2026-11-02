// Crea la base de datos del portable si no existe.
// Se ejecuta con el node.exe embebido, resolviendo better-sqlite3
// desde el node_modules del servidor standalone (app/).

import fs from "node:fs"
import path from "node:path"
import { createRequire } from "node:module"
import { fileURLToPath } from "node:url"

const RUNTIME_DIR = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(RUNTIME_DIR, "..")
const APP_DIR = path.join(ROOT, "app")

const require = createRequire(path.join(APP_DIR, "server.js"))
const Database = require("better-sqlite3")

const dbPath = process.env.SQLITE_DB_PATH || path.join(ROOT, "data", "pizzeria.sqlite")

fs.mkdirSync(path.dirname(dbPath), { recursive: true })

const db = new Database(dbPath)
db.pragma("foreign_keys = ON")

const schema = fs.readFileSync(
  path.join(ROOT, "sql", "001-create-tables-sqlite.sql"),
  "utf8"
)
db.exec(schema)

// Migraciones para bases creadas por versiones anteriores
const productColumns = db.pragma("table_info(products)").map((c) => c.name)
if (!productColumns.includes("category")) {
  db.exec("ALTER TABLE products ADD COLUMN category TEXT NOT NULL DEFAULT ''")
}

const orderColumns = db.pragma("table_info(orders)").map((c) => c.name)
if (orderColumns.length && !orderColumns.includes("payment_method")) {
  db.exec("ALTER TABLE orders ADD COLUMN payment_method TEXT NOT NULL DEFAULT 'efectivo'")
}

db.close()
console.log("DB lista:", dbPath)
