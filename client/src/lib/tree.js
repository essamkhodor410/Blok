import { uid, isContainer } from "./elements.js";

export const findNode = (nodes, id) => {
  for (const n of nodes) {
    if (n.id === id) return n;
    if (n.children) { const f = findNode(n.children, id); if (f) return f; }
  }
  return null;
};

export const updateById = (nodes, id, fn) =>
  nodes.map((n) => (n.id === id ? fn(n) : n.children ? { ...n, children: updateById(n.children, id, fn) } : n));

export const removeById = (nodes, id) => {
  const out = [];
  for (const n of nodes) {
    if (n.id === id) continue;
    out.push(n.children ? { ...n, children: removeById(n.children, id) } : n);
  }
  return out;
};

export const appendChild = (nodes, parentId, node) =>
  nodes.map((n) =>
    n.id === parentId
      ? { ...n, children: [...(n.children || []), node] }
      : n.children
      ? { ...n, children: appendChild(n.children, parentId, node) }
      : n
  );

export const insertAfter = (nodes, siblingId, node) => {
  const out = [];
  for (const n of nodes) {
    out.push(n.children ? { ...n, children: insertAfter(n.children, siblingId, node) } : n);
    if (n.id === siblingId) out.push(node);
  }
  return out;
};

export const moveWithin = (nodes, id, dir) => {
  const i = nodes.findIndex((n) => n.id === id);
  if (i !== -1) {
    const j = i + dir;
    if (j < 0 || j >= nodes.length) return nodes;
    const copy = [...nodes];
    const [it] = copy.splice(i, 1);
    copy.splice(j, 0, it);
    return copy;
  }
  return nodes.map((n) => (n.children ? { ...n, children: moveWithin(n.children, id, dir) } : n));
};

export const cloneNew = (n) => ({
  ...n,
  id: uid(),
  children: n.children ? n.children.map(cloneNew) : undefined,
});

export const duplicateById = (nodes, id) => {
  const out = [];
  for (const n of nodes) {
    out.push(n.children ? { ...n, children: duplicateById(n.children, id) } : n);
    if (n.id === id) out.push(cloneNew(n));
  }
  return out;
};

// insert a node relative to a target: into it if it's a container, else after it
export const smartInsert = (nodes, targetId, node) => {
  if (!targetId) return [...nodes, node];
  const target = findNode(nodes, targetId);
  if (!target) return [...nodes, node];
  if (isContainer(target.type)) return appendChild(nodes, targetId, node);
  return insertAfter(nodes, targetId, node);
};

// build a flat list [{node, depth}] for the layers panel
export const flatten = (nodes, depth = 0, out = []) => {
  for (const n of nodes) {
    out.push({ node: n, depth });
    if (n.children) flatten(n.children, depth + 1, out);
  }
  return out;
};
