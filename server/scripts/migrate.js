// ============================================================
//  migrate.js — create the database and tables
//
//  Runs database/schema.sql against your MySQL server. The
//  schema uses "IF NOT EXISTS" everywhere, so this is safe to
//  run repeatedly.
//
//    node scripts/migrate.js            # create db + tables
//    node scripts/migrate.js --fresh    # DROP the database first, then recreate
//
//  (from the project root: `npm run migrate` / `npm run migrate -- --fresh`)
// ============================================================

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mysql from "mysql2/promise";
import { config } from "../src/config.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const schemaPath = path.resolve(__dirname, "../../database/schema.sql");
const fresh = process.argv.includes("--fresh");

async function migrate() {
  // load the schema and honour DB_NAME (schema.sql hard-codes "blok")
  let sql = await fs.readFile(schemaPath, "utf8");
  if (config.db.database !== "blok") sql = sql.replace(/\bblok\b/g, config.db.database);

  // connect WITHOUT selecting a database — we may be creating it
  const conn = await mysql.createConnection({
    host: config.db.host,
    port: config.db.port,
    user: config.db.user,
    password: config.db.password,
    multipleStatements: true,
  });

  try {
    console.log(`→ MySQL ${config.db.host}:${config.db.port} as "${config.db.user}"`);

    if (fresh) {
      console.log(`⚠  --fresh: dropping database "${config.db.database}" (all data will be lost)`);
      await conn.query(`DROP DATABASE IF EXISTS \`${config.db.database}\``);
    }

    console.log(`→ Applying schema (${path.basename(schemaPath)})…`);
    await conn.query(sql);

    // report what exists now
    const [tables] = await conn.query(
      `SELECT table_name AS t FROM information_schema.tables WHERE table_schema = ?`,
      [config.db.database]
    );
    console.log(`✓ Database "${config.db.database}" ready with ${tables.length} tables: ${tables.map((r) => r.t).join(", ")}`);
    console.log("  Next: seed demo data with  npm run seed");
  } finally {
    await conn.end();
  }
}

migrate().catch((err) => {
  console.error("\n✗ Migration failed:", err.message);
  if (err.code === "ER_ACCESS_DENIED_ERROR") console.error("  → Check DB_USER / DB_PASSWORD in server/.env");
  if (err.code === "ECONNREFUSED") console.error("  → Is MySQL running? Check DB_HOST / DB_PORT in server/.env");
  if (err.code === "ENOENT") console.error("  → Could not find database/schema.sql");
  process.exit(1);
});
