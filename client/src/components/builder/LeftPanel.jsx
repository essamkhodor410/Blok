import {
  Plus, Trash2, Home, FileText, Square, Box, Columns as Cols, Grid3x3, Type, AlignLeft,
  MousePointerClick, Link2, Image, Video, Star, Minus, MoveVertical, TextCursorInput,
  RectangleHorizontal, ChevronRight,
} from "lucide-react";
import { PALETTE, isContainer } from "../../lib/elements.js";
import { flatten } from "../../lib/tree.js";

const ICONS = {
  section: Square, container: Box, columns: Cols, grid: Grid3x3,
  heading: Type, text: AlignLeft, button: MousePointerClick, link: Link2,
  image: Image, video: Video, icon: Star, form: RectangleHorizontal, input: TextCursorInput,
  divider: Minus, spacer: MoveVertical,
};

export default function LeftPanel({
  tab, pages, activePageId, content, selectedId,
  onAdd, onDragType, onSelectPage, onAddPage, onRenamePage, onDeletePage, onSetHome, onSelectNode,
}) {
  if (tab === "add") {
    return (
      <div className="bld-lp">
        <div className="bld-lp-title">Add blocks</div>
        {PALETTE.map(({ group, items }) => (
          <div key={group} className="bld-pal-group">
            <div className="bld-pal-grouplabel">{group}</div>
            <div className="bld-pal-grid">
              {items.map(([type, label]) => {
                const Icon = ICONS[type] || Square;
                return (
                  <div key={type} className="bld-pal-item" draggable
                    onDragStart={() => onDragType(type)} onDragEnd={() => onDragType(null)}
                    onClick={() => onAdd(type)}>
                    <Icon size={18} strokeWidth={1.7} />
                    <span>{label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
        <div className="bld-hint">Drag onto a container to nest it, or click to drop into the selected block.</div>
      </div>
    );
  }

  if (tab === "pages") {
    return (
      <div className="bld-lp">
        <div className="bld-lp-header">
          <span className="bld-lp-title" style={{ margin: 0 }}>Pages</span>
          <button className="bld-iconbtn" title="Add page" onClick={onAddPage}><Plus size={16} /></button>
        </div>
        <div className="bld-pagelist">
          {pages.map((p) => (
            <div key={p.id} className={`bld-pagechip${p.id === activePageId ? " on" : ""}`} onClick={() => onSelectPage(p.id)}>
              {p.is_home ? <Home size={15} /> : <FileText size={15} />}
              <span className="bld-pagechip-name"
                onDoubleClick={(e) => { e.stopPropagation(); const n = prompt("Rename page", p.name); if (n) onRenamePage(p.id, n); }}>
                {p.name}
              </span>
              <span className="bld-pagechip-path">/{p.is_home ? "" : p.path}</span>
              <div className="bld-pagechip-actions">
                {!p.is_home && <button title="Set as home" onClick={(e) => { e.stopPropagation(); onSetHome(p.id); }}><Home size={13} /></button>}
                <button title="Delete" className="danger" onClick={(e) => { e.stopPropagation(); onDeletePage(p.id); }}><Trash2 size={13} /></button>
              </div>
            </div>
          ))}
        </div>
        <div className="bld-hint">Double-click to rename. Select a button and set “Links to” to connect pages.</div>
      </div>
    );
  }

  // layers
  const flat = flatten(content);
  return (
    <div className="bld-lp">
      <div className="bld-lp-title">Layers</div>
      <div className="bld-layers">
        {flat.length === 0 && <div className="bld-hint" style={{ marginTop: 4 }}>Empty page. Add a block to begin.</div>}
        {flat.map(({ node, depth }) => {
          const Icon = ICONS[node.type] || Square;
          return (
            <div key={node.id} className={`bld-layer${selectedId === node.id ? " on" : ""}`}
              style={{ paddingLeft: 8 + depth * 14 }} onClick={() => onSelectNode(node.id)}>
              {isContainer(node.type) ? <ChevronRight size={12} className="bld-layer-caret" /> : <span style={{ width: 12, display: "inline-block" }} />}
              <Icon size={13} strokeWidth={1.7} />
              <span className="bld-layer-name">{node.type}{node.content ? ` · ${node.content.slice(0, 16)}` : ""}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
