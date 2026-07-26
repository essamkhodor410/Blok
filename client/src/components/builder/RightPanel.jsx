import { Collapsible, Num, Txt, Area, Sel, Color, Seg } from "./controls.jsx";
import {
  AlignLeft, AlignCenter, AlignRight, AlignJustify, Rows3, Columns3,
} from "lucide-react";
import { DEFAULTS, FONTS, WEIGHTS, ICON_NAMES, SHADOWS, isContainer, isTextual } from "../../lib/elements.js";

const A = <AlignLeft size={14} />;
const alignOpts = [
  ["left", <AlignLeft size={14} />], ["center", <AlignCenter size={14} />],
  ["right", <AlignRight size={14} />], ["justify", <AlignJustify size={14} />],
];

export default function RightPanel({ node, setStyle, setProp, setGradient, pages }) {
  if (!node) {
    return (
      <div className="ui-empty-panel">
        <div className="ui-empty-title">Nothing selected</div>
        Click a block on the canvas to edit it, or drop a new one from the left.
      </div>
    );
  }

  const s = node.style || {};
  const d = DEFAULTS[node.type] || {};
  const cont = isContainer(node.type);
  const textual = isTextual(node.type);
  const bgIsGradient = typeof s.backgroundImage === "string" && s.backgroundImage.includes("gradient");

  return (
    <>
      {/* ---------------- content ---------------- */}
      {textual && (
        <Collapsible title="Content">
          <Area label="Text" value={node.content} onChange={(v) => setProp("content", v)} />
          {node.type === "heading" && (
            <Sel label="Level" value={String(node.level || 2)} onChange={(v) => setProp("level", Number(v))}
              options={[["1", "H1 — largest"], ["2", "H2"], ["3", "H3"], ["4", "H4"], ["5", "H5"], ["6", "H6"]]} />
          )}
          {(node.type === "button" || node.type === "link") && (
            <Sel label="Links to" value={node.href || ""} onChange={(v) => setProp("href", v)}
              options={[["", "— none —"], ...pages.map((p) => [p.path, p.name])]} />
          )}
          {node.type === "link" && (
            <Sel label="Open in" value={node.target || "_self"} onChange={(v) => setProp("target", v)}
              options={[["_self", "Same tab"], ["_blank", "New tab"]]} />
          )}
        </Collapsible>
      )}
      {node.type === "image" && (
        <Collapsible title="Content">
          <Txt label="Image URL" value={node.src} onChange={(v) => setProp("src", v)} />
          <Txt label="Alt text" value={node.alt} onChange={(v) => setProp("alt", v)} />
        </Collapsible>
      )}
      {node.type === "video" && (
        <Collapsible title="Content">
          <Txt label="YouTube / Vimeo URL" value={node.embed} onChange={(v) => setProp("embed", v)} />
        </Collapsible>
      )}
      {node.type === "icon" && (
        <Collapsible title="Content">
          <Seg label="Icon" value={node.icon || "star"} onChange={(v) => setProp("icon", v)} cols={3}
            options={ICON_NAMES.map((i) => [i, <span style={{ fontSize: 10 }}>{i}</span>])} />
        </Collapsible>
      )}
      {node.type === "input" && (
        <Collapsible title="Content">
          <Sel label="Type" value={node.inputType || "text"} onChange={(v) => setProp("inputType", v)}
            options={["text", "email", "password", "number", "tel", "url"]} />
          <Txt label="Placeholder" value={node.placeholder} onChange={(v) => setProp("placeholder", v)} />
        </Collapsible>
      )}

      {/* ---------------- layout (containers) ---------------- */}
      {cont && (
        <Collapsible title="Layout">
          {(node.type === "columns" || node.type === "grid") ? (
            <Sel label="Columns" value={String(node.columns || (node.type === "grid" ? 2 : 3))}
              onChange={(v) => setProp("columns", Number(v))}
              options={[["1", "1"], ["2", "2"], ["3", "3"], ["4", "4"], ["5", "5"], ["6", "6"]]} />
          ) : (
            <Seg label="Direction" value={s.flexDirection || d.flexDirection}
              onChange={(v) => setStyle("flexDirection", v)}
              options={[["column", <Rows3 size={14} />], ["row", <Columns3 size={14} />]]} />
          )}
          <Num label="Gap" value={s.gap} onChange={(v) => setStyle("gap", v)} placeholder="16" />
          {node.type !== "columns" && node.type !== "grid" && (
            <>
              <Seg label="Align" value={s.alignItems || "stretch"} onChange={(v) => setStyle("alignItems", v)} cols={4}
                options={[["flex-start", "S"], ["center", "C"], ["flex-end", "E"], ["stretch", "F"]].map(([v, t]) => [v, <b style={{ fontSize: 11 }}>{t}</b>])} />
              <Seg label="Justify" value={s.justifyContent || "flex-start"} onChange={(v) => setStyle("justifyContent", v)} cols={4}
                options={[["flex-start", "S"], ["center", "C"], ["flex-end", "E"], ["space-between", "B"]].map(([v, t]) => [v, <b style={{ fontSize: 11 }}>{t}</b>])} />
            </>
          )}
        </Collapsible>
      )}

      {/* ---------------- typography ---------------- */}
      {textual && (
        <Collapsible title="Typography">
          <Sel label="Font" value={s.fontFamily || d.fontFamily} onChange={(v) => setStyle("fontFamily", v)} options={FONTS} />
          <div className="ui-row2">
            <Sel label="Weight" value={String(s.fontWeight || d.fontWeight)} onChange={(v) => setStyle("fontWeight", v)} options={WEIGHTS} />
            <Num label="Size" value={s.fontSize} onChange={(v) => setStyle("fontSize", v)} placeholder={String(d.fontSize)} />
          </div>
          <div className="ui-row2">
            <Num label="Line height" value={s.lineHeight} onChange={(v) => setStyle("lineHeight", v)} step={0.1} placeholder="1.5" />
            <Num label="Letter sp." value={s.letterSpacing} onChange={(v) => setStyle("letterSpacing", v)} step={0.1} placeholder="0" />
          </div>
          <Seg label="Align" value={s.textAlign || "left"} onChange={(v) => setStyle("textAlign", v)} cols={4} options={alignOpts} />
          <Seg label="Transform" value={s.textTransform || "none"} onChange={(v) => setStyle("textTransform", v)} cols={4}
            options={[["none", "—"], ["uppercase", "AA"], ["capitalize", "Aa"], ["lowercase", "aa"]].map(([v, t]) => [v, <span style={{ fontSize: 11 }}>{t}</span>])} />
          <Color label="Colour" value={s.color} onChange={(v) => setStyle("color", v)} />
        </Collapsible>
      )}

      {/* ---------------- background ---------------- */}
      {node.type !== "divider" && node.type !== "spacer" && (
        <Collapsible title="Background" defaultOpen={cont || node.type === "button"}>
          <Seg label="Type" value={bgIsGradient ? "gradient" : "solid"}
            onChange={(v) => setGradient(v === "gradient")}
            options={[["solid", <span style={{ fontSize: 11 }}>Solid</span>], ["gradient", <span style={{ fontSize: 11 }}>Gradient</span>]]} />
          {!bgIsGradient ? (
            <Color label="Fill" value={s.backgroundColor} onChange={(v) => setStyle("backgroundColor", v)} />
          ) : (
            <>
              <div className="ui-row2">
                <Color label="From" value={node.grad?.from || "#2b59ff"} onChange={(v) => setGradient(true, { from: v })} />
                <Color label="To" value={node.grad?.to || "#7c3aed"} onChange={(v) => setGradient(true, { to: v })} />
              </div>
              <Num label="Angle" value={node.grad?.angle ?? 135} onChange={(v) => setGradient(true, { angle: v ?? 0 })} placeholder="135" />
            </>
          )}
        </Collapsible>
      )}

      {/* ---------------- spacing ---------------- */}
      <Collapsible title="Spacing" defaultOpen={false}>
        {node.type !== "spacer" && node.type !== "divider" && (
          <>
            <span className="ui-sub">Padding</span>
            <div className="ui-row4">
              <Num label="T" value={s.paddingTop} onChange={(v) => setStyle("paddingTop", v)} />
              <Num label="R" value={s.paddingRight} onChange={(v) => setStyle("paddingRight", v)} />
              <Num label="B" value={s.paddingBottom} onChange={(v) => setStyle("paddingBottom", v)} />
              <Num label="L" value={s.paddingLeft} onChange={(v) => setStyle("paddingLeft", v)} />
            </div>
          </>
        )}
        <span className="ui-sub">Margin</span>
        <div className="ui-row4">
          <Num label="T" value={s.marginTop} onChange={(v) => setStyle("marginTop", v)} />
          <Num label="R" value={s.marginRight} onChange={(v) => setStyle("marginRight", v)} />
          <Num label="B" value={s.marginBottom} onChange={(v) => setStyle("marginBottom", v)} />
          <Num label="L" value={s.marginLeft} onChange={(v) => setStyle("marginLeft", v)} />
        </div>
      </Collapsible>

      {/* ---------------- size ---------------- */}
      <Collapsible title="Size" defaultOpen={false}>
        <div className="ui-row2">
          <Txt label="Width" value={s.width} onChange={(v) => setStyle("width", v)} placeholder="auto" />
          <Txt label="Max width" value={s.maxWidth} onChange={(v) => setStyle("maxWidth", v)} placeholder="none" />
        </div>
        {node.type === "spacer"
          ? <Num label="Height" value={s.height} onChange={(v) => setStyle("height", v)} placeholder="36" />
          : <Txt label="Height" value={s.height} onChange={(v) => setStyle("height", v)} placeholder="auto" />}
        {cont && <Num label="Min height" value={s.minHeight} onChange={(v) => setStyle("minHeight", v)} placeholder="0" />}
      </Collapsible>

      {/* ---------------- border & effects ---------------- */}
      <Collapsible title="Border & effects" defaultOpen={false}>
        <div className="ui-row2">
          <Num label="Radius" value={s.borderRadius} onChange={(v) => setStyle("borderRadius", v)} />
          <Num label="Border width" value={s.borderWidth} onChange={(v) => setStyle("borderWidth", v)} />
        </div>
        <div className="ui-row2">
          <Sel label="Border style" value={s.borderStyle || "solid"} onChange={(v) => setStyle("borderStyle", v)}
            options={["solid", "dashed", "dotted", "none"]} />
          <Color label="Border colour" value={s.borderColor} onChange={(v) => { setStyle("borderColor", v); if (!s.borderStyle) setStyle("borderStyle", "solid"); }} />
        </div>
        <Seg label="Shadow" value={shadowKey(s.boxShadow)} onChange={(v) => setStyle("boxShadow", SHADOWS[v] === "none" ? undefined : SHADOWS[v])} cols={5}
          options={Object.keys(SHADOWS).map((k) => [k, <span style={{ fontSize: 10 }}>{k}</span>])} />
        <Num label="Opacity (%)" value={s.opacity !== undefined ? Math.round(s.opacity * 100) : undefined}
          onChange={(v) => setStyle("opacity", v === undefined ? undefined : Math.max(0, Math.min(100, v)) / 100)} placeholder="100" />
      </Collapsible>
    </>
  );
}

function shadowKey(val) {
  if (!val) return "none";
  const entry = Object.entries(SHADOWS).find(([, v]) => v === val);
  return entry ? entry[0] : "none";
}
