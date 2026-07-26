import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, Monitor, Tablet, Smartphone, Undo2, Redo2, Eye, PenLine,
  Globe, Check, Loader2, Cloud, CloudOff, Square,
} from "lucide-react";

export default function TopBar({
  project, name, onName, device, setDevice, canUndo, canRedo, onUndo, onRedo,
  saveState, preview, setPreview, onPublish, publishing,
}) {
  const nav = useNavigate();
  return (
    <div className="bld-topbar">
      <button className="bld-iconbtn" title="Back to dashboard" onClick={() => nav("/dashboard")}><ArrowLeft size={18} /></button>
      <div className="bld-brand"><div className="bld-brand-mark"><Square size={13} color="#fff" fill="#fff" /></div></div>
      <div className="bld-div" />
      <input className="bld-projname" value={name} onChange={(e) => onName(e.target.value)} spellCheck={false} />
      <SaveBadge state={saveState} />

      <div style={{ flex: 1 }} />

      <div className="bld-seg">
        {[["desktop", Monitor], ["tablet", Tablet], ["mobile", Smartphone]].map(([d, I]) => (
          <button key={d} className={device === d ? "on" : ""} onClick={() => setDevice(d)} title={d}><I size={16} /></button>
        ))}
      </div>
      <div className="bld-div" />
      <button className="bld-iconbtn" onClick={onUndo} disabled={!canUndo} title="Undo (Ctrl/Cmd+Z)"><Undo2 size={17} /></button>
      <button className="bld-iconbtn" onClick={onRedo} disabled={!canRedo} title="Redo (Shift+Ctrl/Cmd+Z)"><Redo2 size={17} /></button>
      <div className="bld-div" />
      <button className="bld-btn bld-btn-soft" onClick={() => setPreview((p) => !p)}>
        {preview ? <><PenLine size={15} /> Editor</> : <><Eye size={15} /> Preview</>}
      </button>
      <button className="bld-btn bld-btn-primary" onClick={onPublish} disabled={publishing}>
        {publishing ? <Loader2 size={15} className="spin" /> : <Globe size={15} />} Publish
      </button>
    </div>
  );
}

function SaveBadge({ state }) {
  const map = {
    saving: [<Loader2 key="s" size={13} className="spin" />, "Saving", "muted"],
    saved: [<Check key="c" size={13} />, "Saved", "ok"],
    error: [<CloudOff key="e" size={13} />, "Offline", "err"],
    idle: [<Cloud key="i" size={13} />, "Synced", "muted"],
  };
  const [icon, label, tone] = map[state] || map.idle;
  return <span className={`bld-save ${tone}`}>{icon}{label}</span>;
}
