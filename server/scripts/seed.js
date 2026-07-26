// ============================================================
//  seed.js — populate demo data
//
//  Creates a demo account with a ready-made project (Home +
//  About pages) so you can sign in and see the builder in use.
//  Run AFTER `npm run migrate` (the tables must exist).
//
//    node scripts/seed.js
//    (from the project root: `npm run seed`)
//
//  Re-running is safe: the demo project is rebuilt each time,
//  and the demo user is reused if it already exists.
// ============================================================

import bcrypt from "bcryptjs";
import { pool, query, assertConnection } from "../src/db.js";
import { starterHome, starterBlank } from "../src/templates.js";

const DEMO = {
  name: "Demo User",
  email: "demo@blok.dev",
  password: "password123",
  projectName: "Demo Site",
  slug: "demo-site", // fixed slug so re-seeding is idempotent
};

async function seed() {
  await assertConnection();

  // 1. demo user (create if missing, otherwise reuse)
  let userId;
  const existing = await query("SELECT id FROM users WHERE email = ?", [DEMO.email]);
  if (existing.length) {
    userId = existing[0].id;
    console.log(`• Demo user already exists (id ${userId})`);
  } else {
    const hash = await bcrypt.hash(DEMO.password, 10);
    const r = await query(
      "INSERT INTO users (name, email, password_hash, provider) VALUES (?,?,?, 'local')",
      [DEMO.name, DEMO.email, hash]
    );
    userId = r.insertId;
    console.log(`✓ Created demo user (id ${userId})`);
  }

  // 2. fresh demo project (delete any previous one by slug — cascades to pages/publications)
  await query("DELETE FROM projects WHERE slug = ?", [DEMO.slug]);
  const proj = await query(
    "INSERT INTO projects (user_id, name, slug, settings) VALUES (?,?,?,?)",
    [userId, DEMO.projectName, DEMO.slug, JSON.stringify({ font: "Outfit" })]
  );
  const projectId = proj.insertId;
  console.log(`✓ Created project "${DEMO.projectName}" (id ${projectId}, slug "${DEMO.slug}")`);

  // 3. pages — reuse the same starter templates the app uses
  await query(
    "INSERT INTO pages (project_id, name, path, content, is_home, sort_order) VALUES (?,?,?,?,1,0)",
    [projectId, "Home", "index", JSON.stringify(starterHome())]
  );
  await query(
    "INSERT INTO pages (project_id, name, path, content, is_home, sort_order) VALUES (?,?,?,?,0,1)",
    [projectId, "About", "about", JSON.stringify(starterBlank())]
  );
  console.log("✓ Added 2 pages (Home, About)");

  console.log("\n─────────────────────────────────────────");
  console.log(" Seed complete. Sign in at http://localhost:5173/login");
  console.log(`   email:    ${DEMO.email}`);
  console.log(`   password: ${DEMO.password}`);
  console.log("─────────────────────────────────────────");
}

seed()
  .catch((err) => {
    console.error("\n✗ Seed failed:", err.message);
    if (err.code === "ER_NO_SUCH_TABLE") console.error("  → Tables missing. Run `npm run migrate` first.");
    if (err.code === "ER_BAD_DB_ERROR") console.error("  → Database missing. Run `npm run migrate` first.");
    if (err.code === "ECONNREFUSED") console.error("  → Is MySQL running? Check server/.env");
    process.exitCode = 1;
  })
  .finally(() => pool.end());
