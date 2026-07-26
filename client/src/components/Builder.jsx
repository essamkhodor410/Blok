import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import {
  Plus, Layers as LayersIcon, FileText, Copy, Trash2, ChevronUp, ChevronDown,
  X, Check, Globe, ExternalLink, Loader2, PenLine,
} from "lucide-react";
import { api } from "../api.js";
import { makeNode, isContainer } from "../lib/elements.js";
import { updateById, removeById, duplicateById, moveWithin, smartInsert, findNode } from "../lib/tree.js";
import RenderNode, { BuilderCtx } from "./builder/RenderNode.jsx";
import TopBar from "./builder/TopBar.jsx";
import LeftPanel from "./builder/LeftPanel.jsx";
import RightPanel from "./builder/RightPanel.jsx";

const DEVICE = { desktop: "100%", tablet: 820, mobile: 390 };
const HISTORY_MAX = 60;

export default function Builder() {
  const { projectId } = useParams();
  const [project, setProject] = useState(null);
  const [projName, setProjName] = useState("");
  const [pages, setPages] = useState([]);
  const [activePageId, setActivePageId] = useState(null);

  const [selectedId, setSelectedId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [hoverId, setHoverId] = useState(null);
  const [dropId, setDropId] = useState(null);

  const [device, setDevice] = useState("desktop");
  const [preview, setPreview] = useState(false);
  const [leftTab, setLeftTab] = useState("add");

  const [history, setHistory] = useState([]);
  const [future, setFuture] = useState([]);
  const [saveState, setSaveState] = useState("idle");

  const [loading, setLoading] = useState(true);
  const [loadErr, setLoadErr] = useState("");
  const [toast, setToast] = useState(null);
  const [publishResult, setPublishResult] = useState(null);
  const [publishing, setPublishing] = useState(false);

  const dragType = useRef(null);
  const saveTimer = useRef(null);
  const nameTimer = useRef(null);

  const activePage = useMemo(() => pages.find((p) => p.id === activePageId) || null, [pages, activePageId]);
  const content = activePage?.content || [];
  const selected = selectedId ? findNode(content, selectedId) : null;

  const flash = useCallback((m) => { setToast(m); setTimeout(() => setToast(null), 1600); }, []);

  /* ---------------- load ---------------- */
  useEffect(() => {
    let alive = true;
    setLoading(true);
    api.get(`/projects/${projectId}`)
      .then((r) => {
        if (!alive) return;
        const parsed = r.data.pages.map((p) => ({ ...p, content: normalize(p.content) }));
        setProject(r.data.project);
        setProjName(r.data.project.name);
        setPages(parsed);
        const home = parsed.find((p) => p.is_home) || parsed[0];
        setActivePageId(home?.id || null);
      })
      .catch((e) => alive && setLoadErr(e.message))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [projectId]);

  /* ---------------- autosave (page content) ---------------- */
  const scheduleSave = useCallback((pageId, nextContent) => {
    clearTimeout(saveTimer.current);
    setSaveState("saving");
    saveTimer.current = setTimeout(async () => {
      try {
        await api.put(`/pages/${pageId}`, { content: nextContent });
        setSaveState("saved");
      } catch {
        setSaveState("error");
      }
    }, 700);
  }, []);

  /* ---------------- project name save ---------------- */
  const onName = (v) => {
    setProjName(v);
    clearTimeout(nameTimer.current);
    nameTimer.current = setTimeout(() => api.put(`/projects/${projectId}`, { name: v }).catch(() => {}), 600);
  };

  /* ---------------- content mutation ---------------- */
  const setContent = useCallback((pageId, nextContent, record = true) => {
    setPages((prev) => prev.map((p) => (p.id === pageId ? { ...p, content: nextContent } : p)));
    scheduleSave(pageId, nextContent);
    if (record) {
      setHistory((h) => [...h.slice(-HISTORY_MAX), content]);
      setFuture([]);
    }
  }, [content, scheduleSave]);

  const commit = useCallback((updater) => {
    if (!activePage) return;
    const next = updater(activePage.content);
    setContent(activePage.id, next, true);
  }, [activePage, setContent]);

  /* element ops */
  const addElement = useCallback((type, targetId = selectedId) => {
    const node = makeNode(type);
    commit((c) => smartInsert(c, targetId === activePage?.id ? null : targetId, node));
    setSelectedId(node.id);
    setLeftTab((t) => t); // keep
    flash("Block added");
  }, [commit, selectedId, activePage, flash]);

  const onDrop = useCallback((targetId) => {
    if (dragType.current) { addElement(dragType.current, targetId); dragType.current = null; setDropId(null); }
  }, [addElement]);

  const setStyle = (k, v) => commit((c) => updateById(c, selectedId, (n) => {
    const style = { ...n.style };
    if (v === undefined) delete style[k]; else style[k] = v;
    return { ...n, style };
  }));

  const setProp = (k, v) => commit((c) => updateById(c, selectedId, (n) => ({ ...n, [k]: v })));

  const setGradient = (enable, patch = {}) => commit((c) => updateById(c, selectedId, (n) => {
    if (!enable) {
      const style = { ...n.style }; delete style.backgroundImage;
      return { ...n, style };
    }
    const grad = { angle: 135, from: "#2b59ff", to: "#7c3aed", ...(n.grad || {}), ...patch };
    return { ...n, grad, style: { ...n.style, backgroundImage: `linear-gradient(${grad.angle}deg, ${grad.from}, ${grad.to})` } };
  }));

  const commitText = (id, text) => { commit((c) => updateById(c, id, (n) => ({ ...n, content: text }))); setEditingId(null); };
  const del = (id) => { commit((c) => removeById(c, id)); if (selectedId === id) setSelectedId(null); flash("Deleted"); };
  const dup = (id) => { commit((c) => duplicateById(c, id)); flash("Duplicated"); };
  const move = (id, dir) => commit((c) => moveWithin(c, id, dir));

  /* undo / redo */
  const undo = useCallback(() => {
    setHistory((h) => {
      if (!h.length || !activePage) return h;
      const prev = h[h.length - 1];
      setFuture((f) => [activePage.content, ...f].slice(0, HISTORY_MAX));
      setContent(activePage.id, prev, false);
      return h.slice(0, -1);
    });
  }, [activePage, setContent]);

  const redo = useCallback(() => {
    setFuture((f) => {
      if (!f.length || !activePage) return f;
      const next = f[0];
      setHistory((h) => [...h, activePage.content].slice(-HISTORY_MAX));
      setContent(activePage.id, next, false);
      return f.slice(1);
    });
  }, [activePage, setContent]);

  /* ---------------- pages ---------------- */
  const switchPage = (id) => {
    clearTimeout(saveTimer.current);
    if (activePage) api.put(`/pages/${activePage.id}`, { content: activePage.content }).catch(() => {});
    setActivePageId(id); setSelectedId(null); setEditingId(null); setHistory([]); setFuture([]);
  };
  const addPage = async () => {
    try {
      const r = await api.post(`/pages/project/${projectId}`, { name: `Page ${pages.length + 1}` });
      const page = { ...r.data.page, content: normalize(r.data.page.content) };
      setPages((p) => [...p, page]); setActivePageId(page.id); setSelectedId(null);
      flash("Page added");
    } catch (e) { flash(e.message); }
  };
  const renamePage = async (id, name) => {
    setPages((p) => p.map((x) => (x.id === id ? { ...x, name } : x)));
    try { await api.put(`/pages/${id}`, { name }); } catch (e) { flash(e.message); }
  };
  const deletePage = async (id) => {
    if (pages.length <= 1) return flash("Keep at least one page");
    if (!confirm("Delete this page?")) return;
    try {
      await api.delete(`/pages/${id}`);
      const rest = pages.filter((p) => p.id !== id);
      setPages(rest);
      if (activePageId === id) setActivePageId((rest.find((p) => p.is_home) || rest[0]).id);
      flash("Page deleted");
    } catch (e) { flash(e.message); }
  };
  const setHome = async (id) => {
    try {
      await api.put(`/pages/${id}/home`);
      setPages((p) => p.map((x) => ({ ...x, is_home: x.id === id ? 1 : 0 })));
      flash("Home page set");
    } catch (e) { flash(e.message); }
  };

  /* ---------------- publish ---------------- */
  const publish = async () => {
    setPublishing(true);
    try {
      if (activePage) await api.put(`/pages/${activePage.id}`, { content: activePage.content });
      const r = await api.post(`/projects/${projectId}/publish`);
      setPublishResult(r.data);
    } catch (e) { flash(e.message); }
    finally { setPublishing(false); }
  };

  /* ---------------- keyboard ---------------- */
  useEffect(() => {
    const onKey = (e) => {
      const el = document.activeElement;
      const typing = el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable);
      if (typing) return;
      const meta = e.metaKey || e.ctrlKey;
      if (meta && e.key.toLowerCase() === "z") { e.preventDefault(); e.shiftKey ? redo() : undo(); }
      else if (meta && e.key.toLowerCase() === "d" && selectedId) { e.preventDefault(); dup(selectedId); }
      else if ((e.key === "Delete" || e.key === "Backspace") && selectedId) { e.preventDefault(); del(selectedId); }
      else if (e.key === "Escape") { setSelectedId(null); setEditingId(null); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  /* ---------------- context for renderer ---------------- */
  const ctxValue = useMemo(() => ({
    preview, selectedId, hoverId, dropId, editingId,
    select: (id) => { setSelectedId(id); if (editingId && editingId !== id) setEditingId(null); },
    setHover: (id) => { if (!editingId) setHoverId(id); },
    setEditing: setEditingId,
    setDrop: setDropId,
    onDrop,
    commitText,
    navigate: (path) => { const pg = pages.find((p) => p.path === path); if (pg) setActivePageId(pg.id); },
  }), [preview, selectedId, hoverId, dropId, editingId, pages, onDrop]);

  if (loading) return <FullMessage><Loader2 size={22} className="spin" /> Loading your project…</FullMessage>;
  if (loadErr) return <FullMessage>Couldn’t load this project: {loadErr}</FullMessage>;

  return (
    <div className="bld-root">
      <TopBar
        project={project} name={projName} onName={onName} device={device} setDevice={setDevice}
        canUndo={history.length > 0} canRedo={future.length > 0} onUndo={undo} onRedo={redo}
        saveState={saveState} preview={preview} setPreview={setPreview} onPublish={publish} publishing={publishing}
      />

      <div className="bld-body">
        {!preview && (
          <>
            <div className="bld-rail">
              {[["add", Plus], ["pages", FileText], ["layers", LayersIcon]].map(([t, I]) => (
                <button key={t} className={`bld-rail-btn${leftTab === t ? " on" : ""}`} onClick={() => setLeftTab(t)} title={t}><I size={18} /></button>
              ))}
            </div>
            <div className="bld-leftpanel">
              <LeftPanel
                tab={leftTab} pages={pages} activePageId={activePageId} content={content} selectedId={selectedId}
                onAdd={addElement} onDragType={(t) => (dragType.current = t)} onSelectPage={switchPage}
                onAddPage={addPage} onRenamePage={renamePage} onDeletePage={deletePage} onSetHome={setHome}
                onSelectNode={setSelectedId}
              />
            </div>
          </>
        )}

        {/* canvas */}
        <div className="bld-canvas-wrap" style={{ padding: preview ? 0 : 28 }}
          onClick={() => { if (!preview) { setSelectedId(activePage?.id || null); setEditingId(null); } }}>
          <div className="bld-frame" style={{
            width: device === "desktop" ? "100%" : DEVICE[device],
            maxWidth: "100%",
            borderRadius: preview ? 0 : 12,
            boxShadow: preview ? "none" : "0 12px 44px -14px rgba(10,14,25,.22)",
            minHeight: preview ? "100dvh" : "78%",
          }}
            onClick={(e) => { if (!preview) { e.stopPropagation(); setSelectedId(activePage?.id || null); } }}>
            <BuilderCtx.Provider value={ctxValue}>
              {content.map((n) => <RenderNode key={n.id} node={n} />)}
              {content.length === 0 && !preview && (
                <div className="bld-blank">
                  <div className="bld-blank-title">Blank page</div>
                  Drag a Section from the left, or click a block to start building.
                </div>
              )}
            </BuilderCtx.Provider>
          </div>
        </div>

        {/* right panel */}
        {!preview && (
          <div className="bld-rightpanel">
            <div className="bld-selbar">
              {selected ? (
                <>
                  <span className="bld-selbar-name">{selected.type}</span>
                  <button className="bld-iconbtn" onClick={() => move(selected.id, -1)} title="Move up"><ChevronUp size={16} /></button>
                  <button className="bld-iconbtn" onClick={() => move(selected.id, 1)} title="Move down"><ChevronDown size={16} /></button>
                  <button className="bld-iconbtn" onClick={() => dup(selected.id)} title="Duplicate (Ctrl/Cmd+D)"><Copy size={15} /></button>
                  <button className="bld-iconbtn danger" onClick={() => del(selected.id)} title="Delete"><Trash2 size={15} /></button>
                </>
              ) : <span className="bld-selbar-hint">Styles</span>}
            </div>
            <div className="bld-rightpanel-body">
              <RightPanel node={selected} setStyle={setStyle} setProp={setProp} setGradient={setGradient} pages={pages} />
            </div>
          </div>
        )}
      </div>

      {preview && (
        <button className="bld-btn bld-btn-primary bld-preview-exit" onClick={() => setPreview(false)}>
          <PenLine size={16} /> Back to editor
        </button>
      )}

      {toast && <div className="bld-toast"><Check size={15} /> {toast}</div>}

      {publishResult && <PublishModal result={publishResult} onClose={() => setPublishResult(null)} flash={flash} />}
    </div>
  );
}

/* ---------- helpers / small components ---------- */
function normalize(content) {
  if (Array.isArray(content)) return content;
  if (typeof content === "string") { try { return JSON.parse(content); } catch { return []; } }
  return [];
}

function FullMessage({ children }) {
  return <div className="bld-full">{children}</div>;
}

function PublishModal({ result, onClose, flash }) {
  const url = result.url;
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-pad">
          <div className="modal-badge success"><Globe size={22} /></div>
          <h3 className="modal-title">You’re live</h3>
          <p className="modal-text">
            {result.pages} page{result.pages === 1 ? "" : "s"} published as a frozen snapshot. Anyone with the link can view it.
          </p>
          <div className="modal-urlrow">
            <input className="ui-input" readOnly value={url} onFocus={(e) => e.target.select()} />
            <button className="bld-btn bld-btn-soft" onClick={() => { navigator.clipboard?.writeText(url); flash("Link copied"); }}>Copy</button>
          </div>
        </div>
        <div className="modal-foot">
          <button className="bld-btn bld-btn-soft" onClick={onClose}>Close</button>
          <a className="bld-btn bld-btn-primary" href={url} target="_blank" rel="noopener"><ExternalLink size={15} /> Open live site</a>
        </div>
      </div>
    </div>
  );
}
