import { Router } from "express";
import { query } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { starterBlank } from "../templates.js";

const router = Router();
router.use(requireAuth);

// verify the user owns the project a page belongs to
async function ownsProject(userId, projectId) {
  const rows = await query("SELECT id FROM projects WHERE id = ? AND user_id = ?", [projectId, userId]);
  return rows.length > 0;
}
async function ownsPage(userId, pageId) {
  const rows = await query(
    `SELECT pg.* FROM pages pg JOIN projects p ON p.id = pg.project_id
     WHERE pg.id = ? AND p.user_id = ?`,
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

    // ensure unique path within the project
    const existing = await query("SELECT path FROM pages WHERE project_id = ?", [projectId]);
    const taken = new Set(existing.map((r) => r.path));
    if (taken.has(path)) {
      let i = 2;
      while (taken.has(`${path}-${i}`)) i++;
      path = `${path}-${i}`;
    }

    const orderRow = await query("SELECT COALESCE(MAX(sort_order),0)+1 AS n FROM pages WHERE project_id = ?", [projectId]);
    const content = req.body?.content ?? starterBlank();
    const result = await query(
      "INSERT INTO pages (project_id, name, path, content, is_home, sort_order) VALUES (?,?,?,?,0,?)",
      [projectId, name, path, JSON.stringify(content), orderRow[0].n]
    );
    const rows = await query("SELECT * FROM pages WHERE id = ?", [result.insertId]);
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

    // don't allow duplicate paths
    if (path && path !== page.path) {
      const dup = await query("SELECT id FROM pages WHERE project_id = ? AND path = ? AND id <> ?", [page.project_id, path, page.id]);
      if (dup.length) return res.status(409).json({ error: "Another page already uses that path" });
    }

    await query(
      "UPDATE pages SET content = COALESCE(?, content), name = COALESCE(?, name), path = COALESCE(?, path) WHERE id = ?",
      [content !== undefined ? JSON.stringify(content) : null, name ?? null, path ?? null, page.id]
    );
    const rows = await query("SELECT * FROM pages WHERE id = ?", [page.id]);
    res.json({ page: rows[0] });
  } catch (e) { next(e); }
});

// set a page as the home page (unset others)
router.put("/:pageId/home", async (req, res, next) => {
  try {
    const page = await ownsPage(req.user.id, req.params.pageId);
    if (!page) return res.status(404).json({ error: "Page not found" });
    await query("UPDATE pages SET is_home = 0 WHERE project_id = ?", [page.project_id]);
    await query("UPDATE pages SET is_home = 1 WHERE id = ?", [page.id]);
    res.json({ ok: true });
  } catch (e) { next(e); }
});

// delete a page
router.delete("/:pageId", async (req, res, next) => {
  try {
    const page = await ownsPage(req.user.id, req.params.pageId);
    if (!page) return res.status(404).json({ error: "Page not found" });
    const count = await query("SELECT COUNT(*) AS c FROM pages WHERE project_id = ?", [page.project_id]);
    if (count[0].c <= 1) return res.status(400).json({ error: "A project needs at least one page" });
    await query("DELETE FROM pages WHERE id = ?", [page.id]);
    if (page.is_home) {
      const next = await query("SELECT id FROM pages WHERE project_id = ? ORDER BY sort_order, id LIMIT 1", [page.project_id]);
      if (next.length) await query("UPDATE pages SET is_home = 1 WHERE id = ?", [next[0].id]);
    }
    res.json({ ok: true });
  } catch (e) { next(e); }
});

export default router;
