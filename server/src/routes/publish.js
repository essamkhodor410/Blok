import { Router } from "express";
import { query } from "../db.js";
import { config } from "../config.js";
import { requireAuth } from "../middleware/auth.js";
import { renderPage } from "../render.js";

// ---- authenticated: publish + status ----
export const publishRouter = Router();
publishRouter.use(requireAuth);

publishRouter.post("/:projectId/publish", async (req, res, next) => {
  try {
    const owned = await query("SELECT * FROM projects WHERE id = ? AND user_id = ?", [req.params.projectId, req.user.id]);
    if (!owned.length) return res.status(404).json({ error: "Project not found" });
    const project = owned[0];

    const pages = await query("SELECT * FROM pages WHERE project_id = ? ORDER BY sort_order, id", [project.id]);
    if (!pages.length) return res.status(400).json({ error: "Nothing to publish yet" });

    // pages.content comes back parsed (JSON column) with mysql2
    const parsed = pages.map((p) => ({ ...p, content: typeof p.content === "string" ? JSON.parse(p.content) : p.content }));

    // wipe previous snapshot, write a fresh one
    await query("DELETE FROM publications WHERE project_id = ?", [project.id]);
    const basePath = `/sites/${project.slug}`;
    for (const page of parsed) {
      const html = renderPage(page, parsed, basePath);
      await query(
        "INSERT INTO publications (project_id, page_path, html) VALUES (?,?,?)",
        [project.id, page.path, html]
      );
    }
    await query("UPDATE projects SET is_published = 1, published_at = NOW() WHERE id = ?", [project.id]);

    res.json({
      ok: true,
      url: `${config.publicBaseUrl}/sites/${project.slug}`,
      slug: project.slug,
      pages: parsed.length,
    });
  } catch (e) { next(e); }
});

publishRouter.post("/:projectId/unpublish", async (req, res, next) => {
  try {
    const owned = await query("SELECT id FROM projects WHERE id = ? AND user_id = ?", [req.params.projectId, req.user.id]);
    if (!owned.length) return res.status(404).json({ error: "Project not found" });
    await query("DELETE FROM publications WHERE project_id = ?", [req.params.projectId]);
    await query("UPDATE projects SET is_published = 0 WHERE id = ?", [req.params.projectId]);
    res.json({ ok: true });
  } catch (e) { next(e); }
});

// ---- public: serve the frozen snapshot (no auth) ----
export const siteRouter = Router();

async function serve(res, slug, path) {
  const proj = await query("SELECT id, is_published FROM projects WHERE slug = ?", [slug]);
  if (!proj.length || !proj[0].is_published) return res.status(404).send(notFound());
  const projectId = proj[0].id;

  let pagePath = path;
  if (!pagePath) {
    const home = await query(
      `SELECT pg.path FROM pages pg WHERE pg.project_id = ? ORDER BY pg.is_home DESC, pg.sort_order LIMIT 1`,
      [projectId]
    );
    pagePath = home.length ? home[0].path : "index";
  }

  const rows = await query("SELECT html FROM publications WHERE project_id = ? AND page_path = ?", [projectId, pagePath]);
  if (!rows.length) return res.status(404).send(notFound());
  res.set("Content-Type", "text/html; charset=utf-8").send(rows[0].html);
}

siteRouter.get("/:slug", (req, res, next) => serve(res, req.params.slug, null).catch(next));
siteRouter.get("/:slug/:path.html", (req, res, next) => serve(res, req.params.slug, req.params.path).catch(next));
siteRouter.get("/:slug/:path", (req, res, next) => serve(res, req.params.slug, req.params.path).catch(next));

function notFound() {
  return `<!doctype html><html><head><meta charset="utf-8"><title>Not found</title>
  <style>body{font-family:system-ui;display:grid;place-items:center;height:100vh;margin:0;background:#0b0d12;color:#fff}
  .b{text-align:center}h1{font-size:64px;margin:0}p{color:#8b93a1}</style></head>
  <body><div class="b"><h1>404</h1><p>This site isn't published, or the page doesn't exist.</p></div></body></html>`;
}
