import { summarizeSteps, type StepSummary } from "../thinking-core/steps";
import { SETTLED_STEP, type StepStatus } from "../thinking-core/types";
import type { FlowEdge, FlowGraph, FlowNode } from "./types";

const statusOf = (n: FlowNode | undefined): StepStatus => n?.status ?? "pending";

/**
 * An edge's status from its two nodes, so a renderer only has to set node statuses:
 *
 *   from complete, to active          → active    (the hand-off is happening: fill and flow)
 *   from complete, to skipped         → skipped
 *   from complete, anything else      → complete  (the dependency is met)
 *   from error or skipped             → skipped   (nothing will flow down it)
 *   from pending or active            → pending
 */
export function edgeStatus(from: StepStatus, to: StepStatus): StepStatus {
  if (from === "complete") return to === "active" ? "active" : to === "skipped" ? "skipped" : "complete";
  if (from === "error" || from === "skipped") return "skipped";
  return "pending";
}

/** `edgeStatus` for an edge in a graph, honouring an explicit `edge.status`. */
export function resolveEdgeStatus(graph: FlowGraph, edge: FlowEdge, byId = nodeMap(graph)): StepStatus {
  return edge.status ?? edgeStatus(statusOf(byId.get(edge.from)), statusOf(byId.get(edge.to)));
}

/** Where an edge's `pathLength` should be for a status: drawn for active and complete, empty otherwise. */
export function edgeProgressTarget(status: StepStatus): number {
  return status === "active" || status === "complete" ? 1 : 0;
}

export const nodeMap = <D>(graph: FlowGraph<D>) => new Map(graph.nodes.map((n) => [n.id, n]));

/** Ids of the nodes upstream of `id`. */
export function predecessors(graph: FlowGraph, id: string): string[] {
  return graph.edges.filter((e) => e.to === id).map((e) => e.from);
}

/** Every node reachable downstream of `id` (not including it). */
export function descendants(graph: FlowGraph, id: string): Set<string> {
  const seen = new Set<string>();
  const stack = [id];
  while (stack.length) {
    const v = stack.pop()!;
    for (const e of graph.edges) {
      if (e.from !== v || seen.has(e.to) || e.to === id) continue;
      seen.add(e.to);
      stack.push(e.to);
    }
  }
  return seen;
}

/** Pending nodes whose predecessors have all completed (or were skipped): what can start next. */
export function readyNodes<D>(graph: FlowGraph<D>): FlowNode<D>[] {
  const byId = nodeMap(graph);
  return graph.nodes.filter(
    (n) =>
      statusOf(n) === "pending" &&
      predecessors(graph, n.id).every((p) => {
        const s = statusOf(byId.get(p));
        return s === "complete" || s === "skipped";
      }) &&
      // A node downstream of a failure never becomes ready.
      !predecessors(graph, n.id).some((p) => statusOf(byId.get(p)) === "error"),
  );
}

/**
 * Immutable status change for one node, stamping `startedAt` / `endedAt` like thinking-core's
 * `updateStep`. Setting `error` marks everything downstream that hasn't settled as `skipped`
 * unless `skipDownstream` is false.
 */
export function setNodeStatus<D>(graph: FlowGraph<D>, id: string, status: StepStatus, { now = Date.now(), skipDownstream = true } = {}): FlowGraph<D> {
  const downstream = status === "error" && skipDownstream ? descendants(graph, id) : new Set<string>();
  return {
    ...graph,
    nodes: graph.nodes.map((n) => {
      if (n.id === id) return stamp(n, status, now);
      if (downstream.has(n.id) && !SETTLED_STEP.has(statusOf(n))) return stamp(n, "skipped", now);
      return n;
    }),
  };
}

function stamp<D>(n: FlowNode<D>, status: StepStatus, now: number): FlowNode<D> {
  const prev = statusOf(n);
  if (prev === status) return n;
  const next = { ...n, status };
  if (status === "active" || status === "pending") {
    next.startedAt = status === "active" ? now : undefined;
    next.endedAt = undefined;
  }
  if (SETTLED_STEP.has(status) && !SETTLED_STEP.has(prev)) next.endedAt = now;
  return next;
}

/**
 * One beat of a run: settles every active node (`outcome` decides each one's fate, default
 * complete) and starts every node that became ready. Parallel branches advance together, a
 * failure skips its downstream. Drive a scripted CI or agent-run demo with it on a clock.
 *
 *   setGraph((g) => stepFlow(g, { outcome: (n) => (n.id === "e2e" ? "error" : "complete") }));
 */
export function stepFlow<D>(
  graph: FlowGraph<D>,
  { outcome = () => "complete", now = Date.now() }: { outcome?: (node: FlowNode<D>) => "complete" | "error" | "skipped"; now?: number } = {},
): FlowGraph<D> {
  let g = graph;
  const active = g.nodes.filter((n) => statusOf(n) === "active");
  for (const n of active) g = setNodeStatus(g, n.id, outcome(n), { now });
  // On the very first beat nothing is active yet: start the sources.
  for (const n of readyNodes(g)) g = setNodeStatus(g, n.id, "active", { now });
  return g;
}

/** Every node back to pending, times cleared: the "retry" rewind. */
export function resetFlow<D>(graph: FlowGraph<D>): FlowGraph<D> {
  return { ...graph, nodes: graph.nodes.map((n) => ({ ...n, status: "pending", startedAt: undefined, endedAt: undefined })) };
}

/** thinking-core's `summarizeSteps` over the nodes: progress, current, status, durationMs. */
export function summarizeFlow(graph: FlowGraph): StepSummary {
  return summarizeSteps(graph.nodes.map((n) => ({ id: n.id, label: n.label, status: statusOf(n), startedAt: n.startedAt, endedAt: n.endedAt })));
}
