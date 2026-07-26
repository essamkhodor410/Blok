import { Router } from "express";
import { customAlphabet } from "nanoid";
import { query } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { starterHome } from "../templates.js";

const router = Router();
router.use(requireAuth);

const slugId = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 8);
const slugify = (s) =>
  String(s || "site").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "site";

// list my projects (with a page count)
router.get("/", async (req, res, next) => {
  try {
    const rows = await query(
      `SELECT p.*, (SELECT COUNT(*) FROM pages pg WHERE pg.project_id = p.id) AS page_count
       FROM projects p WHERE p.user_id = ? ORDER BY p.updated_at DESC`,
      [req.user.id]
    );
    res.json({ projects: rows });
  } catch (e) { next(e); }
});

// create a project + its home page
router.post("/", async (req, res, next) => {
  try {
    const name = (req.body?.name || "Untitled project").trim().slice(0, 160);
    const slug = `${slugify(name)}-${slugId()}`;
    const result = await query(
      "INSERT INTO projects (user_id, name, slug, settings) VALUES (?,?,?,?)",
      [req.user.id, name, slug, JSON.stringify({ font: "Outfit" })]
    );
    const projectId = result.insertId;
    await query(
      "INSERT INTO pages (project_id, name, path, content, is_home, sort_order) VALUES (?,?,?,?,1,0)",
      [projectId, "Home", "index", JSON.stringify(starterHome())]
    );
    const rows = await query("SELECT * FROM projects WHERE id = ?", [projectId]);
    res.status(201).json({ project: rows[0] });
  } catch (e) { next(e); }
});

// get a single project with all pages
router.get("/:id", async (req, res, next) => {
  try {
    const rows = await query("SELECT * FROM projects WHERE id = ? AND user_id = ?", [req.params.id, req.user.id]);
    if (!rows.length) return res.status(404).json({ error: "Project not found" });
    const pages = await query(
      "SELECT * FROM pages WHERE project_id = ? ORDER BY sort_order, id",
      [req.params.id]
    );
    res.json({ project: rows[0], pages });
  } catch (e) { next(e); }
});

// rename / update settings
router.put("/:id", async (req, res, next) => {
  try {
    const owned = await query("SELECT id FROM projects WHERE id = ? AND user_id = ?", [req.params.id, req.user.id]);
    if (!owned.length) return res.status(404).json({ error: "Project not found" });
    const { name, settings } = req.body || {};
    await query(
      "UPDATE projects SET name = COALESCE(?, name), settings = COALESCE(?, settings) WHERE id = ?",
      [name ?? null, settings ? JSON.stringify(settings) : null, req.params.id]
    );
    const rows = await query("SELECT * FROM projects WHERE id = ?", [req.params.id]);
    res.json({ project: rows[0] });
  } catch (e) { next(e); }
});

// delete a project
router.delete("/:id", async (req, res, next) => {
  try {
    const result = await query("DELETE FROM projects WHERE id = ? AND user_id = ?", [req.params.id, req.user.id]);
    if (!result.affectedRows) return res.status(404).json({ error: "Project not found" });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

export default router;
