import { createContext, useContext, useEffect, useRef } from "react";
import { Plus } from "lucide-react";
import { computeStyle, isContainer } from "../../lib/elements.js";

export const BuilderCtx = createContext(null);

/* ---- helpers ---- */
function toEmbed(url = "") {
  const yt = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([\w-]+)/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  const vm = url.match(/vimeo\.com\/(\d+)/);
  if (vm) return `https://player.vimeo.com/video/${vm[1]}`;
  return url;
}
const ICON_PATHS = {
  star: <path d="M12 2l3 6.5 7 .9-5 4.8 1.3 7L12 18l-6.6 3.2L6.7 14l-5-4.8 7-.9z" />,
  heart: <path d="M12 21s-7-4.5-9.5-9C.9 8.5 2.5 5 6 5c2 0 3.2 1.2 6 4 2.8-2.8 4-4 6-4 3.5 0 5.1 3.5 3.5 7-2.5 4.5-9.5 9-9.5 9z" />,
  bolt: <path d="M13 2L4 14h6l-1 8 9-12h-6z" />,
  check: <path d="M20 6L9 17l-5-5" />,
  globe: <><circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15 15 0 010 20 15 15 0 010-20" /></>,
  shield: <path d="M12 2l8 4v6c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6z" />,
};
function IconGlyph({ name }) {
  return (
    <svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {ICON_PATHS[name] || ICON_PATHS.star}
    </svg>
  );
}

/* ---- inline-editable text (uncontrolled while editing to preserve caret) ---- */
function Editable({ tag: Tag, node, style, ctx }) {
  const editing = ctx.editingId === node.id && !ctx.preview;
  const ref = useRef(null);
  useEffect(() => {
    if (editing && ref.current) {
      ref.current.focus();
      const r = document.createRange();
      r.selectNodeContents(ref.current);
      r.collapse(false);
      const s = window.getSelection();
      s.removeAllRanges();
      s.addRange(r);
    }
  }, [editing]);
  return (
    <Tag
      ref={ref}
      style={style}
      contentEditable={editing}
      suppressContentEditableWarning
      onClick={(e) => { if (!ctx.preview) { e.stopPropagation(); ctx.select(node.id); } }}
      onDoubleClick={(e) => { if (!ctx.preview) { e.stopPropagation(); ctx.setEditing(node.id); } }}
      onBlur={(e) => editing && ctx.commitText(node.id, e.currentTarget.innerText)}
      onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); e.currentTarget.blur(); } }}
    >
      {node.content}
    </Tag>
  );
}

export default function RenderNode({ node }) {
  const ctx = useContext(BuilderCtx);
  const style = computeStyle(node);
  const { preview } = ctx;
  const selected = !preview && ctx.selectedId === node.id;
  const hovered = !preview && ctx.hoverId === node.id && !selected;
  const isDrop = !preview && ctx.dropId === node.id;
  const cont = isContainer(node.type);

  const wrap = preview
    ? {}
    : {
        className: `bld-node${selected ? " selected" : ""}${hovered ? " hovered" : ""}${isDrop ? " droptarget" : ""}`,
        onClick: (e) => { e.stopPropagation(); ctx.select(node.id); },
        onMouseOver: (e) => { e.stopPropagation(); ctx.setHover(node.id); },
        onMouseOut: (e) => { e.stopPropagation(); ctx.setHover(null); },
        ...(cont && {
          onDragOver: (e) => { e.preventDefault(); e.stopPropagation(); ctx.setDrop(node.id); },
          onDrop: (e) => { e.preventDefault(); e.stopPropagation(); ctx.onDrop(node.id); },
        }),
      };

  const tag = selected ? <span className="bld-node-tag">{node.type}</span> : null;

  // ---- leaves ----
  if (node.type === "heading") {
    const H = "h" + (node.level || 2);
    return <div {...wrap} style={{ position: "relative" }}>{tag}<Editable tag={H} node={node} style={style} ctx={ctx} /></div>;
  }
  if (node.type === "text") {
    return <div {...wrap} style={{ position: "relative" }}>{tag}<Editable tag="p" node={node} style={style} ctx={ctx} /></div>;
  }
  if (node.type === "button" || node.type === "link") {
    const El = node.type === "button" ? "button" : "a";
    return (
      <div {...wrap} style={{ position: "relative", alignSelf: style.alignSelf || "flex-start" }}>
        {tag}
        <Editable tag={El} node={node} style={{ ...style, cursor: preview ? "pointer" : "text", textDecoration: style.textDecoration }} ctx={ctx} />
        {preview && node.href ? (
          <span onClick={(e) => { e.stopPropagation(); ctx.navigate(node.href); }}
            style={{ position: "absolute", inset: 0, cursor: "pointer" }} />
        ) : null}
      </div>
    );
  }
  if (node.type === "image") {
    return <div {...wrap} style={{ position: "relative", lineHeight: 0 }}>{tag}<img src={node.src} alt={node.alt || ""} style={style} draggable={false} /></div>;
  }
  if (node.type === "video") {
    return (
      <div {...wrap} style={{ position: "relative", lineHeight: 0 }}>
        {tag}
        <iframe src={toEmbed(node.embed)} style={style} allowFullScreen title="video" />
        {!preview && <span style={{ position: "absolute", inset: 0 }} />}
      </div>
    );
  }
  if (node.type === "icon") {
    return <div {...wrap} style={{ position: "relative", ...style }}>{tag}<IconGlyph name={node.icon} /></div>;
  }
  if (node.type === "divider") {
    return <div {...wrap} style={{ position: "relative" }}>{tag}<div style={{ ...style, height: 0 }} /></div>;
  }
  if (node.type === "spacer") {
    return (
      <div {...wrap} style={{ position: "relative", ...style,
        background: preview ? "transparent" : "repeating-linear-gradient(45deg,#f4f5f7,#f4f5f7 6px,#eceef1 6px,#eceef1 12px)" }}>
        {tag}
      </div>
    );
  }
  if (node.type === "input") {
    return (
      <div {...wrap} style={{ position: "relative", width: style.width || "100%" }}>
        {tag}
        <input type={node.inputType || "text"} placeholder={node.placeholder || ""} style={style} readOnly={!preview} />
      </div>
    );
  }

  // ---- containers ----
  const Tag = node.type === "form" ? "form" : "div";
  return (
    <Tag {...wrap} style={style} onSubmit={(e) => e.preventDefault()}>
      {tag}
      {(node.children || []).map((ch) => <RenderNode key={ch.id} node={ch} />)}
      {!preview && (!node.children || node.children.length === 0) && (
        <div className="bld-empty"><Plus size={15} /> Drop a block here</div>
      )}
    </Tag>
  );
}
