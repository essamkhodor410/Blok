import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus, Square, LogOut, ExternalLink, Trash2, PenLine, Loader2, Globe, Layers, MoreHorizontal,
} from "lucide-react";
import { api } from "../api.js";
import { useAuth } from "../auth.jsx";

const GRADS = [
  ["#2b59ff", "#6b8cff"], ["#0ea5e9", "#2b59ff"], ["#f97316", "#f43f5e"],
  ["#10b981", "#0ea5e9"], ["#8b5cf6", "#2b59ff"], ["#f59e0b", "#ef4444"],
  ["#111827", "#374151"], ["#e11d48", "#f97316"],
];
const gradFor = (s = "") => {
  let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) % GRADS.length;
  return GRADS[h];
};
const timeAgo = (d) => {
  const diff = (Date.now() - new Date(d).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

export default function Dashboard() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [menuFor, setMenuFor] = useState(null);

  const load = () => {
    setLoading(true);
    api.get("/projects").then((r) => setProjects(r.data.projects)).catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const create = async () => {
    const name = newName.trim() || "Untitled project";
    setCreating(true);
    try { const r = await api.post("/projects", { name }); nav(`/builder/${r.data.project.id}`); }
    catch (e) { alert(e.message); setCreating(false); }
  };

  const remove = async (id) => {
    if (!confirm("Delete this project and all its pages? This can’t be undone.")) return;
    setProjects((p) => p.filter((x) => x.id !== id));
    setMenuFor(null);
    try { await api.delete(`/projects/${id}`); } catch { load(); }
  };
  const rename = async (proj) => {
    const name = prompt("Rename project", proj.name);
    setMenuFor(null);
    if (!name || name === proj.name) return;
    setProjects((p) => p.map((x) => (x.id === proj.id ? { ...x, name } : x)));
    try { await api.put(`/projects/${proj.id}`, { name }); } catch { load(); }
  };

  return (
    <div className="dash" onClick={() => setMenuFor(null)}>
      <header className="dash-top">
        <div className="dash-brand"><span className="dash-brand-mark"><Square size={15} color="#fff" fill="#fff" /></span> Blok</div>
        <div className="dash-user">
          <div className="dash-avatar">{(user?.name || "?").charAt(0).toUpperCase()}</div>
          <span className="dash-username">{user?.name}</span>
          <button className="dash-logout" onClick={logout} title="Sign out"><LogOut size={16} /></button>
        </div>
      </header>

      <main className="dash-main">
        <div className="dash-head">
          <div>
            <h1>Your projects</h1>
            <p>{projects.length ? `${projects.length} project${projects.length === 1 ? "" : "s"}` : "Start your first site"}</p>
          </div>
          <button className="dash-new" onClick={() => { setNewName(""); setShowModal(true); }}><Plus size={17} /> New project</button>
        </div>

        {loading ? (
          <div className="dash-loading"><Loader2 size={22} className="spin" /></div>
        ) : projects.length === 0 ? (
          <div className="dash-empty">
            <div className="dash-empty-art"><Layers size={30} /></div>
            <h3>No projects yet</h3>
            <p>Create your first project and start dropping blocks onto the canvas.</p>
            <button className="dash-new" onClick={() => setShowModal(true)}><Plus size={17} /> New project</button>
          </div>
        ) : (
          <div className="dash-grid">
            {projects.map((p) => {
              const [a, b] = gradFor(p.slug);
              return (
                <div key={p.id} className="dash-card" onClick={() => nav(`/builder/${p.id}`)}>
                  <div className="dash-thumb" style={{ background: `linear-gradient(135deg, ${a}, ${b})` }}>
                    <div className="dash-thumb-glass">
                      <div className="dash-thumb-bar" /><div className="dash-thumb-line" /><div className="dash-thumb-line short" />
                    </div>
                    {!!p.is_published && <span className="dash-live"><Globe size={11} /> Live</span>}
                  </div>
                  <div className="dash-card-body">
                    <div className="dash-card-main">
                      <h3>{p.name}</h3>
                      <span className="dash-card-meta">{p.page_count} page{p.page_count === 1 ? "" : "s"} · {timeAgo(p.updated_at)}</span>
                    </div>
                    <div className="dash-card-menu">
                      <button className="dash-iconbtn" onClick={(e) => { e.stopPropagation(); setMenuFor(menuFor === p.id ? null : p.id); }}>
                        <MoreHorizontal size={17} />
                      </button>
                      {menuFor === p.id && (
                        <div className="dash-menu" onClick={(e) => e.stopPropagation()}>
                          <button onClick={() => nav(`/builder/${p.id}`)}><PenLine size={14} /> Open editor</button>
                          {!!p.is_published && <a href={`/sites/${p.slug}`} target="_blank" rel="noopener"><ExternalLink size={14} /> View live</a>}
                          <button onClick={() => rename(p)}><PenLine size={14} /> Rename</button>
                          <button className="danger" onClick={() => remove(p.id)}><Trash2 size={14} /> Delete</button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal modal-sm" onClick={(e) => e.stopPropagation()}>
            <div className="modal-pad">
              <h3 className="modal-title">Name your project</h3>
              <p className="modal-text">You can change this any time.</p>
              <input className="ui-input" autoFocus value={newName} placeholder="My new site"
                onChange={(e) => setNewName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && create()} />
            </div>
            <div className="modal-foot">
              <button className="bld-btn bld-btn-soft" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="bld-btn bld-btn-primary" onClick={create} disabled={creating}>
                {creating ? <Loader2 size={15} className="spin" /> : <Plus size={15} />} Create & open
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
