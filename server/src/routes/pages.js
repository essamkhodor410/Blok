import { Router } from "express";
import { query } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { starterBlank } from "../templates.js";

const router = Router();
router.use(requireAuth);

async function ownsProject(userId, projectId) {
  const rows = await query("SELECT id FROM projects WHERE id = $1 AND user_id = $2", [projectId, userId]);
  return rows.length > 0;
}
async function ownsPage(userId, pageId) {
  const rows = await query(
    `SELECT pg.* FROM pages pg JOIN projects p ON p.id = pg.project_id
     WHERE pg.id = $1 AND p.user_id = $2`,
    [pageId, userId]
  );
  return rows[0] || null;
}

const cleanPath = (s) =>
  String(s || "page").toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-|-$/g, "").slice(0, 100) || "page";

// create a page in a project
router.post("/project/:projectId", async (req, res, next) => {
  try {
    const { projectId } = req.params;
    if (!(await ownsProject(req.user.id, projectId)))
      return res.status(404).json({ error: "Project not found" });

    const name = (req.body?.name || "New page").trim().slice(0, 160);
    let path = cleanPath(req.body?.path || name);

    const existing = await query("SELECT path FROM pages WHERE project_id = $1", [projectId]);
    const taken = new Set(existing.map((r) => r.path));
    if (taken.has(path)) {
      let i = 2;
      while (taken.has(`${path}-${i}`)) i++;
      path = `${path}-${i}`;
    }

    const orderRow = await query("SELECT COALESCE(MAX(sort_order),0)+1 AS n FROM pages WHERE project_id = $1", [projectId]);
    const content = req.body?.content ?? starterBlank();
    const rows = await query(
      "INSERT INTO pages (project_id, name, path, content, is_home, sort_order) VALUES ($1,$2,$3,$4::jsonb, false, $5) RETURNING *",
      [projectId, name, path, JSON.stringify(content), orderRow[0].n]
    );
    res.status(201).json({ page: rows[0] });
  } catch (e) { next(e); }
});

// update a page's content and/or meta
router.put("/:pageId", async (req, res, next) => {
  try {
    const page = await ownsPage(req.user.id, req.params.pageId);
    if (!page) return res.status(404).json({ error: "Page not found" });

    const { content, name } = req.body || {};
    let path = req.body?.path;
    if (path !== undefined) path = cleanPath(path);

    if (path && path !== page.path) {
      const dup = await query("SELECT id FROM pages WHERE project_id = $1 AND path = $2 AND id <> $3", [page.project_id, path, page.id]);
      if (dup.length) return res.status(409).json({ error: "Another page already uses that path" });
    }

    const rows = await query(
      `UPDATE pages SET content = COALESCE($1::jsonb, content), name = COALESCE($2, name), path = COALESCE($3, path)
       WHERE id = $4 RETURNING *`,
      [content !== undefined ? JSON.stringify(content) : null, name ?? null, path ?? null, page.id]
    );
    res.json({ page: rows[0] });
  } catch (e) { next(e); }
});

// set a page as the home page (unset others)
router.put("/:pageId/home", async (req, res, next) => {
  try {
    const page = await ownsPage(req.user.id, req.params.pageId);
    if (!page) return res.status(404).json({ error: "Page not found" });
    await query("UPDATE pages SET is_home = false WHERE project_id = $1", [page.project_id]);
    await query("UPDATE pages SET is_home = true WHERE id = $1", [page.id]);
    res.json({ ok: true });
  } catch (e) { next(e); }
});

// delete a page
router.delete("/:pageId", async (req, res, next) => {
  try {
    const page = await ownsPage(req.user.id, req.params.pageId);
    if (!page) return res.status(404).json({ error: "Page not found" });
    const count = await query("SELECT COUNT(*)::int AS c FROM pages WHERE project_id = $1", [page.project_id]);
    if (count[0].c <= 1) return res.status(400).json({ error: "A project needs at least one page" });
    await query("DELETE FROM pages WHERE id = $1", [page.id]);
    if (page.is_home) {
      const nxt = await query("SELECT id FROM pages WHERE project_id = $1 ORDER BY sort_order, id LIMIT 1", [page.project_id]);
      if (nxt.length) await query("UPDATE pages SET is_home = true WHERE id = $1", [nxt[0].id]);
    }
    res.json({ ok: true });
  } catch (e) { next(e); }
});

export default router;
