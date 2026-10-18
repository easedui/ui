import { edgeId, type FlowEdge, type FlowGraph, type FlowNode } from "./types";

export type FlowDirection = "LR" | "TB";

export type FlowLayoutOptions = {
  /** Left to right (pipelines, payment routes) or top to bottom (org charts, approval chains). Default `LR`. */
  direction?: FlowDirection;
  /** Default node size; a node's own `width`/`height` wins. Default 152 × 40. */
  nodeWidth?: number;
  nodeHeight?: number;
  /** Space between ranks (columns in LR). Default 40. */
  rankGap?: number;
  /** Space between siblings in a rank. Default 12. */
  nodeGap?: number;
  /** Space around the whole graph. Default 0. */
  padding?: number;
  /** `curve` is a smooth S-bezier; `step` is orthogonal with rounded corners (GitHub Actions). Default `curve`. */
  edgeShape?: "curve" | "step";
  /** Corner radius of `step` edges. Default 8. */
  cornerRadius?: number;
};

export type PlacedNode<D = unknown> = {
  node: FlowNode<D>;
  id: string;
  /** Top-left corner and size, in layout px. */
  x: number;
  y: number;
  width: number;
  height: number;
  /** Column (LR) or row (TB) index, from 0 at the sources. */
  rank: number;
  /** Position inside its rank, after crossing reduction. */
  order: number;
};

export type PlacedEdge = {
  edge: FlowEdge;
  id: string;
  from: string;
  to: string;
  /** SVG path data. Draw it with `pathLength` progress (`FlowEdgePath`, `useEdgeProgress`). */
  path: string;
  /** Start (source port) and end (target port). */
  start: { x: number; y: number };
  end: { x: number; y: number };
  /** Points against the ranking: a cycle was broken here. Drawn, but not used for layout. */
  back: boolean;
};

export type FlowLayout<D = unknown> = {
  nodes: PlacedNode<D>[];
  edges: PlacedEdge[];
  /** Node ids per rank, in order. */
  ranks: string[][];
  width: number;
  height: number;
  byId: Map<string, PlacedNode<D>>;
};

/**
 * Lays out a small DAG (up to a few dozen nodes): longest-path ranks, barycentre sweeps to
 * reduce crossings, ranks centred on each other, edges from the trailing port of a node to the
 * leading port of the next. Pure and deterministic (input order breaks ties), so call it in a
 * `useMemo` and it gives the same picture on the server and the client. Cycles are tolerated:
 * the closing edge is marked `back` and skipped for ranking.
 *
 *   const layout = useMemo(() => layoutFlow(pipeline, { edgeShape: "step" }), [pipeline]);
 */
export function layoutFlow<D>(graph: FlowGraph<D>, options: FlowLayoutOptions = {}): FlowLayout<D> {
  const {
    direction = "LR",
    nodeWidth = 152,
    nodeHeight = 40,
    rankGap = 40,
    nodeGap = 12,
    padding = 0,
    edgeShape = "curve",
    cornerRadius = 8,
  } = options;
  const lr = direction === "LR";
  const nodes = graph.nodes;
  const index = new Map(nodes.map((n, i) => [n.id, i]));
  const edges = graph.edges.filter((e) => index.has(e.from) && index.has(e.to) && e.from !== e.to);

  // 1. Break cycles: DFS in input order; an edge to a node on the stack is a back edge.
  const out: number[][] = nodes.map(() => []);
  edges.forEach((e, i) => out[index.get(e.from)!].push(i));
  const back = new Set<number>();
  const state = new Uint8Array(nodes.length); // 0 new, 1 on stack, 2 done
  const visit = (v: number) => {
    state[v] = 1;
    for (const ei of out[v]) {
      const w = index.get(edges[ei].to)!;
      if (state[w] === 1) back.add(ei);
      else if (state[w] === 0) visit(w);
    }
    state[v] = 2;
  };
  nodes.forEach((_, v) => state[v] === 0 && visit(v));
  const forward = edges.map((e, i) => ({ e, i, from: index.get(e.from)!, to: index.get(e.to)! })).filter((x) => !back.has(x.i));

  // 2. Longest-path ranks (Kahn's order).
  const preds: number[][] = nodes.map(() => []);
  const succs: number[][] = nodes.map(() => []);
  for (const f of forward) {
    preds[f.to].push(f.from);
    succs[f.from].push(f.to);
  }
  const rank = new Array<number>(nodes.length).fill(0);
  const indeg = preds.map((p) => p.length);
  const queue = nodes.map((_, i) => i).filter((i) => indeg[i] === 0);
  for (let q = 0; q < queue.length; q++) {
    const v = queue[q];
    for (const w of succs[v]) {
      rank[w] = Math.max(rank[w], rank[v] + 1);
      if (--indeg[w] === 0) queue.push(w);
    }
  }
  // Pull sources forward to sit just before their first consumer (a lone "lint" next to "test", not at column 0).
  for (let i = queue.length - 1; i >= 0; i--) {
    const v = queue[i];
    if (preds[v].length === 0 && succs[v].length) rank[v] = Math.min(...succs[v].map((w) => rank[w])) - 1;
  }

  const rankCount = nodes.length ? Math.max(...rank) + 1 : 0;
  const ranks: number[][] = Array.from({ length: rankCount }, () => []);
  nodes.forEach((_, v) => ranks[rank[v]].push(v));

  // 3. Crossing reduction: barycentre sweeps down then up, ties kept in input order.
  const pos = new Array<number>(nodes.length);
  const setPos = () => ranks.forEach((r) => r.forEach((v, i) => (pos[v] = i)));
  setPos();
  const sweep = (r: number[], neighbours: number[][]) => {
    const bary = new Map<number, number>();
    for (const v of r) {
      const ns = neighbours[v];
      bary.set(v, ns.length ? ns.reduce((s, w) => s + pos[w], 0) / ns.length : pos[v]);
    }
    r.sort((a, b) => bary.get(a)! - bary.get(b)! || pos[a] - pos[b]);
    r.forEach((v, i) => (pos[v] = i));
  };
  for (let iter = 0; iter < 4; iter++) {
    for (let r = 1; r < rankCount; r++) sweep(ranks[r], preds);
    for (let r = rankCount - 2; r >= 0; r--) sweep(ranks[r], succs);
  }

  // 4. Coordinates. "Along" is the rank axis (x in LR), "across" stacks a rank's nodes.
  const size = (v: number) => ({ w: nodes[v].width ?? nodeWidth, h: nodes[v].height ?? nodeHeight });
  const alongSize = (v: number) => (lr ? size(v).w : size(v).h);
  const acrossSize = (v: number) => (lr ? size(v).h : size(v).w);
  const rankDepth = ranks.map((r) => Math.max(0, ...r.map(alongSize)));
  const rankSpan = ranks.map((r) => r.reduce((s, v) => s + acrossSize(v), 0) + Math.max(0, r.length - 1) * nodeGap);
  const maxSpan = Math.max(0, ...rankSpan);
  const placed: PlacedNode<D>[] = new Array(nodes.length);
  let along = padding;
  ranks.forEach((r, ri) => {
    let across = padding + (maxSpan - rankSpan[ri]) / 2;
    for (const v of r) {
      const { w, h } = size(v);
      const a = along + (rankDepth[ri] - alongSize(v)) / 2;
      placed[v] = { node: nodes[v], id: nodes[v].id, x: lr ? a : across, y: lr ? across : a, width: w, height: h, rank: ri, order: pos[v] };
      across += acrossSize(v) + nodeGap;
    }
    along += rankDepth[ri] + rankGap;
  });
  const totalAlong = rankCount ? along - rankGap + padding : 2 * padding;
  const width = lr ? totalAlong : maxSpan + 2 * padding;
  const height = lr ? maxSpan + 2 * padding : totalAlong;

  // 5. Edges.
  const placedEdges: PlacedEdge[] = edges.map((e, i) => {
    const a = placed[index.get(e.from)!];
    const b = placed[index.get(e.to)!];
    const isBack = back.has(i);
    const start = lr ? { x: a.x + a.width, y: a.y + a.height / 2 } : { x: a.x + a.width / 2, y: a.y + a.height };
    const end = lr ? { x: b.x, y: b.y + b.height / 2 } : { x: b.x + b.width / 2, y: b.y };
    return {
      edge: e,
      id: edgeId(e),
      from: e.from,
      to: e.to,
      start,
      end,
      back: isBack,
      path: edgeShape === "step" ? stepPath(start, end, lr, cornerRadius) : curvePath(start, end, lr),
    };
  });

  return {
    nodes: placed,
    edges: placedEdges,
    ranks: ranks.map((r) => r.map((v) => nodes[v].id)),
    width,
    height,
    byId: new Map(placed.map((p) => [p.id, p])),
  };
}

type Pt = { x: number; y: number };
const f = (n: number) => Math.round(n * 100) / 100;

/** A smooth S-curve between two ports, tangent to the flow direction at both ends. */
export function curvePath(a: Pt, b: Pt, lr = true): string {
  if (lr) {
    const dx = Math.max(16, Math.abs(b.x - a.x) / 2);
    return `M${f(a.x)},${f(a.y)} C${f(a.x + dx)},${f(a.y)} ${f(b.x - dx)},${f(b.y)} ${f(b.x)},${f(b.y)}`;
  }
  const dy = Math.max(16, Math.abs(b.y - a.y) / 2);
  return `M${f(a.x)},${f(a.y)} C${f(a.x)},${f(a.y + dy)} ${f(b.x)},${f(b.y - dy)} ${f(b.x)},${f(b.y)}`;
}

/** An orthogonal edge that turns once at the midpoint with rounded corners. */
export function stepPath(a: Pt, b: Pt, lr = true, radius = 8): string {
  // Work in "along/across" space so one routine serves both directions.
  const A = lr ? [a.x, a.y] : [a.y, a.x];
  const B = lr ? [b.x, b.y] : [b.y, b.x];
  const pt = (al: number, ac: number) => (lr ? `${f(al)},${f(ac)}` : `${f(ac)},${f(al)}`);
  const d = B[1] - A[1];
  if (Math.abs(d) < 0.5) return `M${pt(A[0], A[1])} L${pt(B[0], B[1])}`;
  const mid = (A[0] + B[0]) / 2;
  const s = Math.sign(d);
  const r = Math.max(0, Math.min(radius, Math.abs(d) / 2, Math.abs(B[0] - A[0]) / 2));
  return [
    `M${pt(A[0], A[1])}`,
    `L${pt(mid - r, A[1])}`,
    `Q${pt(mid, A[1])} ${pt(mid, A[1] + s * r)}`,
    `L${pt(mid, B[1] - s * r)}`,
    `Q${pt(mid, B[1])} ${pt(mid + r, B[1])}`,
    `L${pt(B[0], B[1])}`,
  ].join(" ");
}

/**
 * A view transform that fits the layout (or centres one node, for "search glides the viewport
 * to the match") inside a `width × height` viewport. Apply as `translate(x, y) scale(scale)`;
 * spring between two results to glide.
 */
export function fitView(
  layout: Pick<FlowLayout, "width" | "height" | "byId">,
  viewport: { width: number; height: number },
  { focus, padding = 16, maxScale = 1, minScale = 0.25 }: { focus?: string; padding?: number; maxScale?: number; minScale?: number } = {},
) {
  const fit = Math.min((viewport.width - 2 * padding) / Math.max(1, layout.width), (viewport.height - 2 * padding) / Math.max(1, layout.height));
  const scale = Math.max(minScale, Math.min(maxScale, fit));
  const node = focus ? layout.byId.get(focus) : undefined;
  const cx = node ? node.x + node.width / 2 : layout.width / 2;
  const cy = node ? node.y + node.height / 2 : layout.height / 2;
  return { scale, x: viewport.width / 2 - cx * scale, y: viewport.height / 2 - cy * scale };
}
