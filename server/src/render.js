// ============================================================
//  Server-side renderer: element tree (JSON) -> standalone HTML
//  Mirrors the client's computeStyle so published output matches
//  the editor canvas.
// ============================================================

const DEFAULTS = {
  section:   { display:"flex", flexDirection:"column", gap:18, paddingTop:56, paddingBottom:56, paddingLeft:40, paddingRight:40, width:"100%", backgroundColor:"#ffffff", alignItems:"stretch" },
  container: { display:"flex", flexDirection:"column", gap:14, maxWidth:"960px", width:"100%", marginLeft:"auto", marginRight:"auto", backgroundColor:"transparent" },
  columns:   { display:"grid", gap:20, width:"100%", backgroundColor:"transparent" },
  grid:      { display:"grid", gap:16, width:"100%", backgroundColor:"transparent" },
  form:      { display:"flex", flexDirection:"column", gap:12, width:"100%", maxWidth:"440px" },
  heading:   { fontFamily:"Space Grotesk", fontSize:38, fontWeight:"700", color:"#12141a", lineHeight:1.12, textAlign:"left", letterSpacing:-0.5, margin:0 },
  text:      { fontFamily:"Outfit", fontSize:16, fontWeight:"400", color:"#4a4f5c", lineHeight:1.6, textAlign:"left", margin:0 },
  button:    { fontFamily:"Outfit", fontSize:15, fontWeight:"600", color:"#ffffff", backgroundColor:"#2b59ff", paddingTop:12, paddingBottom:12, paddingLeft:22, paddingRight:22, borderRadius:10, alignSelf:"flex-start", display:"inline-flex", textDecoration:"none", cursor:"pointer", border:"none" },
  link:      { fontFamily:"Outfit", fontSize:15, fontWeight:"500", color:"#2b59ff", textDecoration:"underline" },
  image:     { width:"100%", height:"auto", borderRadius:14, display:"block" },
  video:     { width:"100%", aspectRatio:"16 / 9", borderRadius:14, border:"none" },
  icon:      { width:40, height:40, color:"#2b59ff" },
  divider:   { marginTop:8, marginBottom:8, borderTopWidth:1, borderColor:"#e6e8ec", width:"100%" },
  spacer:    { height:36 },
  input:     { width:"100%", fontFamily:"Outfit", fontSize:15, color:"#12141a", paddingTop:11, paddingBottom:11, paddingLeft:14, paddingRight:14, borderRadius:10, borderWidth:1, borderColor:"#d7dae0", borderStyle:"solid", backgroundColor:"#ffffff" },
};

const PX = new Set(["fontSize","letterSpacing","paddingTop","paddingRight","paddingBottom","paddingLeft",
  "marginTop","marginBottom","marginLeft","marginRight","gap","borderRadius","borderWidth","borderTopWidth","minHeight"]);
const DIMENSION = new Set(["width","height","maxWidth","minWidth"]); // number => px, string passes through

function computeStyle(node) {
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
  if (node.type === "divider") { css.borderTopStyle = "solid"; css.height = "0"; }
  return css;
}

function styleToCss(obj) {
  return Object.entries(obj)
    .map(([k, v]) => `${k.replace(/[A-Z]/g, (m) => "-" + m.toLowerCase())}:${v}`)
    .join(";");
}

const esc = (s = "") =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// map a page's internal path to a public href
const hrefFor = (target, pathToFile) => {
  if (!target) return null;
  if (/^https?:\/\//i.test(target) || target.startsWith("#") || target.startsWith("mailto:")) return target;
  return pathToFile(target);
};

function nodeToHtml(node, ctx, indent = "  ") {
  const st = ` style="${styleToCss(computeStyle(node))}"`;
  const t = node.type;

  if (t === "heading") { const H = "h" + (node.level || 2); return `${indent}<${H}${st}>${esc(node.content)}</${H}>`; }
  if (t === "text")     return `${indent}<p${st}>${esc(node.content)}</p>`;
  if (t === "link") {
    const href = hrefFor(node.href, ctx.pathToFile) || "#";
    const tgt = node.target === "_blank" ? ' target="_blank" rel="noopener"' : "";
    return `${indent}<a href="${esc(href)}"${tgt}${st}>${esc(node.content)}</a>`;
  }
  if (t === "button") {
    const href = hrefFor(node.href, ctx.pathToFile);
    if (href) return `${indent}<a href="${esc(href)}" role="button"${st}>${esc(node.content)}</a>`;
    return `${indent}<button type="button"${st}>${esc(node.content)}</button>`;
  }
  if (t === "image")   return `${indent}<img src="${esc(node.src)}" alt="${esc(node.alt || "")}"${st}/>`;
  if (t === "video") {
    const src = toEmbed(node.embed || "");
    return `${indent}<iframe src="${esc(src)}" allowfullscreen loading="lazy"${st}></iframe>`;
  }
  if (t === "icon")    return `${indent}<div${st}>${iconSvg(node.icon)}</div>`;
  if (t === "divider") return `${indent}<hr${st}/>`;
  if (t === "spacer")  return `${indent}<div${st}></div>`;
  if (t === "input")   return `${indent}<input type="${esc(node.inputType || "text")}" placeholder="${esc(node.placeholder || "")}"${st}/>`;

  // containers
  const inner = (node.children || []).map((c) => nodeToHtml(c, ctx, indent + "  ")).join("\n");
  const tag = t === "form" ? "form" : "div";
  return `${indent}<${tag}${st}>\n${inner}\n${indent}</${tag}>`;
}

function toEmbed(url) {
  const yt = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([\w-]+)/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  const vm = url.match(/vimeo\.com\/(\d+)/);
  if (vm) return `https://player.vimeo.com/video/${vm[1]}`;
  return url;
}

function iconSvg(name) {
  const icons = {
    star: '<path d="M12 2l3 6.5 7 .9-5 4.8 1.3 7L12 18l-6.6 3.2L6.7 14l-5-4.8 7-.9z"/>',
    heart: '<path d="M12 21s-7-4.5-9.5-9C.9 8.5 2.5 5 6 5c2 0 3.2 1.2 6 4 2.8-2.8 4-4 6-4 3.5 0 5.1 3.5 3.5 7-2.5 4.5-9.5 9-9.5 9z"/>',
    bolt: '<path d="M13 2L4 14h6l-1 8 9-12h-6z"/>',
    check: '<path d="M20 6L9 17l-5-5"/>',
    globe: '<circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 010 20 15 15 0 010-20"/>',
    shield: '<path d="M12 2l8 4v6c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6z"/>',
  };
  const path = icons[name] || icons.star;
  return `<svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${path}</svg>`;
}

/**
 * Render one page to a full standalone HTML document.
 * @param {object} page   - { name, path, content }
 * @param {array}  pages  - all pages of the project (for link resolution)
 */
export function renderPage(page, pages, basePath = "/") {
  const base = basePath.endsWith("/") ? basePath : basePath + "/";
  // Resolve an internal target path -> absolute public URL
  const pathToFile = (targetPath) => {
    const p = pages.find((x) => x.path === targetPath);
    if (!p) return "#";
    return p.is_home ? base : base + p.path;
  };

  const content = Array.isArray(page.content) ? page.content : [];
  const body = content.map((n) => nodeToHtml(n, { pathToFile }, "    ")).join("\n");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${esc(page.name || "Page")}</title>
  <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
  <style>
    *{margin:0;box-sizing:border-box}
    html,body{width:100%}
    body{font-family:'Outfit',system-ui,sans-serif;-webkit-font-smoothing:antialiased}
    a[role=button]{text-decoration:none;display:inline-flex;align-items:center}
    img{max-width:100%}
    @media (max-width:640px){
      [style*="grid-template-columns"]{grid-template-columns:1fr !important}
    }
  </style>
</head>
<body>
${body}
</body>
</html>`;
}

export { computeStyle, styleToCss };
