// ============================================================
//  migrate.js — create the tables in your PostgreSQL database
//
//  Runs database/schema.sql against DATABASE_URL. Safe to run
//  repeatedly (uses IF NOT EXISTS).
//
//    node scripts/migrate.js            # create tables
//    node scripts/migrate.js --fresh    # DROP tables first, then recreate
//
//  (from the project root: `npm run migrate` / `npm run migrate -- --fresh`)
// ============================================================

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { config } from "../src/config.js";

const { Client } = pg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const schemaPath = path.resolve(__dirname, "../../database/schema.sql");
const fresh = process.argv.includes("--fresh");

async function migrate() {
  if (!config.databaseUrl) {
    console.error("✗ DATABASE_URL is not set. Add it to server/.env (copy from your Neon dashboard).");
    process.exit(1);
  }

  const sql = await fs.readFile(schemaPath, "utf8");
  const isLocal = /localhost|127\.0\.0\.1/.test(config.databaseUrl);
  const client = new Client({
    connectionString: config.databaseUrl,
    ssl: isLocal ? false : { rejectUnauthorized: false },
  });

  await client.connect();
  try {
    console.log("→ Connected to PostgreSQL");

    if (fresh) {
      console.log("⚠  --fresh: dropping existing tables (all data will be lost)");
      await client.query("DROP TABLE IF EXISTS publications, pages, projects, users CASCADE");
    }

    console.log("→ Applying schema…");
    await client.query(sql);

    const { rows } = await client.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name"
    );
    console.log(`✓ Ready with ${rows.length} tables: ${rows.map((r) => r.table_name).join(", ")}`);
    console.log("  Next: seed demo data with  npm run seed");
  } finally {
    await client.end();
  }
}

migrate().catch((err) => {
  console.error("\n✗ Migration failed:", err.message);
  if (/password|auth/i.test(err.message)) console.error("  → Check the credentials in DATABASE_URL");
  if (err.code === "ENOTFOUND" || err.code === "ECONNREFUSED") console.error("  → Check the host in DATABASE_URL / that the database is reachable");
  if (err.code === "ENOENT") console.error("  → Could not find database/schema.sql");
  process.exit(1);
});
