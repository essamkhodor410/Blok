import express from "express";
import cors from "cors";
import { config } from "./config.js";
import { assertConnection } from "./db.js";
import authRoutes from "./routes/auth.js";
import projectRoutes from "./routes/projects.js";
import pageRoutes from "./routes/pages.js";
import { publishRouter, siteRouter } from "./routes/publish.js";

const app = express();

app.use(cors({ origin: config.clientOrigin, credentials: true }));
app.use(express.json({ limit: "5mb" }));

// health
app.get("/api/health", (_req, res) => res.json({ ok: true, service: "blok-api" }));

// api
app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/projects", publishRouter); // publish/unpublish live under /api/projects/:id/...
app.use("/api/pages", pageRoutes);

// public published sites
app.use("/sites", siteRouter);

// 404 for unknown api routes
app.use("/api", (_req, res) => res.status(404).json({ error: "Not found" }));

// central error handler
app.use((err, _req, res, _next) => {
  console.error(err);
  if (err?.code === "ER_DUP_ENTRY") return res.status(409).json({ error: "That value is already taken" });
  res.status(500).json({ error: "Something went wrong on the server" });
});

async function start() {
  try {
    await assertConnection();
    console.log("✓ Connected to MySQL");
  } catch (e) {
    console.error("✗ Could not connect to MySQL. Check server/.env and that MySQL is running.");
    console.error("  " + e.message);
  }
  app.listen(config.port, () => {
    console.log(`✓ Blok API running at http://localhost:${config.port}`);
    console.log(`  Google sign-in: ${config.google.enabled ? "enabled" : "not configured (email/password works)"}`);
  });
}

start();
