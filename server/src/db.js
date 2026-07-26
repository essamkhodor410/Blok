import pg from "pg";
import { config } from "./config.js";

const { Pool } = pg;

// Neon (and most hosted Postgres) require SSL; local Postgres doesn't.
const isLocal = /localhost|127\.0\.0\.1/.test(config.databaseUrl || "");

export const pool = new Pool({
  connectionString: config.databaseUrl,
  ssl: isLocal ? false : { rejectUnauthorized: false },
  max: 10,
});

// Helper that returns rows directly (parity with the previous mysql helper).
export async function query(sql, params = []) {
  const res = await pool.query(sql, params);
  return res.rows;
}

export async function assertConnection() {
  const client = await pool.connect();
  try {
    await client.query("SELECT 1");
  } finally {
    client.release();
  }
}
