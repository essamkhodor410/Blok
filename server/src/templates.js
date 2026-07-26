// Starter element trees for newly-created projects and pages.
// IDs are generated fresh on the client too; these are seeds.

let n = 0;
const id = () => `s${Date.now().toString(36)}${(n++).toString(36)}`;

export function starterHome() {
  return [
    { id: id(), type: "section", style: { backgroundColor: "#0b0d12", paddingTop: 84, paddingBottom: 84, alignItems: "center", gap: 22 }, children: [
      { id: id(), type: "container", style: { maxWidth: "760px", alignItems: "center", gap: 20 }, children: [
        { id: id(), type: "heading", content: "Your idea deserves a real website", level: 1, style: { fontSize: 54, color: "#ffffff", textAlign: "center", lineHeight: 1.04 } },
        { id: id(), type: "text", content: "Start from this blank canvas and shape every block until it's exactly yours. No templates you can't escape.", style: { fontSize: 19, color: "#aab2c0", textAlign: "center" } },
        { id: id(), type: "button", content: "Get started", href: "", style: { marginTop: 6, fontSize: 16, paddingTop: 14, paddingBottom: 14, paddingLeft: 28, paddingRight: 28 } },
      ]},
    ]},
    { id: id(), type: "section", style: { paddingTop: 64, paddingBottom: 64, gap: 24, backgroundColor: "#ffffff" }, children: [
      { id: id(), type: "container", style: { maxWidth: "960px", gap: 10 }, children: [
        { id: id(), type: "heading", content: "A section to make your own", level: 2, style: { fontSize: 32 } },
        { id: id(), type: "text", content: "Drag blocks in from the left, then edit type, colour, spacing and more on the right.", style: {} },
      ]},
    ]},
  ];
}

export function starterBlank() {
  return [
    { id: id(), type: "section", style: { paddingTop: 64, paddingBottom: 64, backgroundColor: "#ffffff", gap: 16 }, children: [
      { id: id(), type: "container", style: { maxWidth: "960px", gap: 12 }, children: [
        { id: id(), type: "heading", content: "New page", level: 1, style: { fontSize: 40 } },
        { id: id(), type: "text", content: "This page is empty. Start adding blocks.", style: {} },
      ]},
    ]},
  ];
}
