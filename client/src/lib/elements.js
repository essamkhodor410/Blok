// ============================================================
//  Element system — defaults, factory, palette, style compute
//  (kept in sync with server/src/render.js)
// ============================================================

let counter = 0;
export const uid = () =>
  `el_${Date.now().toString(36)}${(counter++).toString(36)}${Math.floor(Math.random() * 46656).toString(36)}`;

export const CONTAINER_TYPES = ["section", "container", "columns", "grid", "form"];
export const isContainer = (t) => CONTAINER_TYPES.includes(t);
export const isTextual = (t) => ["heading", "text", "button", "link"].includes(t);

export const FONTS = ["Space Grotesk", "Outfit", "Georgia", "Times New Roman", "Courier New", "Arial", "Verdana", "Trebuchet MS"];
export const WEIGHTS = [["300", "Light"], ["400", "Regular"], ["500", "Medium"], ["600", "Semibold"], ["700", "Bold"]];
export const ICON_NAMES = ["star", "heart", "bolt", "check", "globe", "shield"];

export const SHADOWS = {
  none: "none",
  sm: "0 1px 2px rgba(16,20,30,.08)",
  md: "0 6px 16px -6px rgba(16,20,30,.16)",
  lg: "0 16px 40px -12px rgba(16,20,30,.22)",
  xl: "0 30px 70px -20px rgba(16,20,30,.34)",
};

export const DEFAULTS = {
  section:   { display: "flex", flexDirection: "column", gap: 18, paddingTop: 56, paddingBottom: 56, paddingLeft: 40, paddingRight: 40, width: "100%", backgroundColor: "#ffffff", alignItems: "stretch", justifyContent: "flex-start" },
  container: { display: "flex", flexDirection: "column", gap: 14, maxWidth: "960px", width: "100%", marginLeft: "auto", marginRight: "auto", backgroundColor: "transparent", alignItems: "stretch" },
  columns:   { display: "grid", gap: 20, width: "100%", backgroundColor: "transparent" },
  grid:      { display: "grid", gap: 16, width: "100%", backgroundColor: "transparent" },
  form:      { display: "flex", flexDirection: "column", gap: 12, width: "100%", maxWidth: "440px" },
  heading:   { fontFamily: "Space Grotesk", fontSize: 38, fontWeight: "700", color: "#12141a", lineHeight: 1.12, textAlign: "left", letterSpacing: -0.5, margin: 0 },
  text:      { fontFamily: "Outfit", fontSize: 16, fontWeight: "400", color: "#4a4f5c", lineHeight: 1.6, textAlign: "left", margin: 0 },
  button:    { fontFamily: "Outfit", fontSize: 15, fontWeight: "600", color: "#ffffff", backgroundColor: "#2b59ff", paddingTop: 12, paddingBottom: 12, paddingLeft: 22, paddingRight: 22, borderRadius: 10, alignSelf: "flex-start", display: "inline-flex", border: "none" },
  link:      { fontFamily: "Outfit", fontSize: 15, fontWeight: "500", color: "#2b59ff", textDecoration: "underline", alignSelf: "flex-start" },
  image:     { width: "100%", height: "auto", borderRadius: 14, display: "block" },
  video:     { width: "100%", borderRadius: 14 },
  icon:      { width: 40, height: 40, color: "#2b59ff" },
  divider:   { marginTop: 8, marginBottom: 8, borderTopWidth: 1, borderColor: "#e6e8ec", width: "100%" },
  spacer:    { height: 36 },
  input:     { width: "100%", fontFamily: "Outfit", fontSize: 15, color: "#12141a", paddingTop: 11, paddingBottom: 11, paddingLeft: 14, paddingRight: 14, borderRadius: 10, borderWidth: 1, borderColor: "#d7dae0", borderStyle: "solid", backgroundColor: "#ffffff" },
};

const PX = new Set(["fontSize", "letterSpacing", "paddingTop", "paddingRight", "paddingBottom", "paddingLeft",
  "marginTop", "marginBottom", "marginLeft", "marginRight", "gap", "borderRadius", "borderWidth", "borderTopWidth", "minHeight"]);
const DIMENSION = new Set(["width", "height", "maxWidth", "minWidth"]); // number => px, string passes through

export function computeStyle(node) {
  const merged = { ...(DEFAULTS[node.type] || {}), ...(node.style || {}) };
  const css = {};
  for (const [k, v] of Object.entries(merged)) {
    if (v === undefined || v === null || v === "") continue;
    if (PX.has(k) && typeof v === "number") css[k] = v + "px";
    else if (DIMENSION.has(k) && typeof v === "number") css[k] = v + "px";
    else css[k] = v;
  }
  if (node.type === "columns") css.gridTemplateColumns = `repeat(${node.columns || 3}, minmax(0,1fr))`;
  if (node.type === "grid") css.gridTemplateColumns = `repeat(${node.columns || 2}, minmax(0,1fr))`;
  if (node.type === "video") { css.aspectRatio = "16 / 9"; css.border = "none"; }
  if (node.type === "divider") { css.borderTopStyle = css.borderTopStyle || "solid"; css.height = 0; }
  return css;
}

// build a fresh node with sensible starter content
export function makeNode(type) {
  const base = { id: uid(), type, style: {} };
  switch (type) {
    case "heading": return { ...base, content: "New heading", level: 2 };
    case "text": return { ...base, content: "Write something here. Double-click on the canvas to edit inline, or use the Content field on the right." };
    case "button": return { ...base, content: "Click me", href: "" };
    case "link": return { ...base, content: "Learn more", href: "", target: "_self" };
    case "image": return { ...base, src: `https://picsum.photos/seed/${Math.random().toString(36).slice(2, 8)}/900/560`, alt: "Image" };
    case "video": return { ...base, embed: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" };
    case "icon": return { ...base, icon: "star" };
    case "input": return { ...base, inputType: "email", placeholder: "you@email.com" };
    case "columns": return {
      ...base, columns: 3, children: [colChild(), colChild(), colChild()],
    };
    case "grid": return { ...base, columns: 2, children: [] };
    case "form": return {
      ...base, children: [
        { ...makeNode("input") },
        { ...makeNode("button"), content: "Subscribe" },
      ],
    };
    default: // section, container
      return { ...base, children: [] };
  }
}

function colChild() {
  return {
    id: uid(), type: "container", style: { gap: 8, paddingTop: 20, paddingBottom: 20, paddingLeft: 20, paddingRight: 20, backgroundColor: "#f5f6f8", borderRadius: 14 },
    children: [
      { id: uid(), type: "heading", content: "Column heading", level: 3, style: { fontSize: 20 } },
      { id: uid(), type: "text", content: "Supporting copy for this column goes here.", style: { fontSize: 14.5 } },
    ],
  };
}

// palette shown in the left panel
export const PALETTE = [
  { group: "Layout", items: [
    ["section", "Section"], ["container", "Container"], ["columns", "Columns"], ["grid", "Grid"],
  ]},
  { group: "Typography", items: [
    ["heading", "Heading"], ["text", "Text"], ["button", "Button"], ["link", "Link"],
  ]},
  { group: "Media", items: [
    ["image", "Image"], ["video", "Video"], ["icon", "Icon"],
  ]},
  { group: "Forms", items: [
    ["form", "Form"], ["input", "Input"],
  ]},
  { group: "Elements", items: [
    ["divider", "Divider"], ["spacer", "Spacer"],
  ]},
];
