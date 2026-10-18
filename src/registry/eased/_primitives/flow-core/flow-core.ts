/**
 * flow-core: node/edge graphs for CI pipelines, agent runs, payment routes, org charts and
 * approval flows. A typed graph model whose statuses are thinking-core's `StepStatus`, a small
 * DAG auto layout, status propagation, and edges drawn on `pathLength`.
 * Import from here; the files behind it may move.
 */
export { edgeId, type FlowEdge, type FlowGraph, type FlowNode, type StepStatus } from "./types";
export {
  curvePath,
  fitView,
  layoutFlow,
  stepPath,
  type FlowDirection,
  type FlowLayout,
  type FlowLayoutOptions,
  type PlacedEdge,
  type PlacedNode,
} from "./layout";
export {
  descendants,
  edgeProgressTarget,
  edgeStatus,
  nodeMap,
  predecessors,
  readyNodes,
  resetFlow,
  resolveEdgeStatus,
  setNodeStatus,
  stepFlow,
  summarizeFlow,
} from "./status";
export { FlowEdgePath, useEdgeProgress, type EdgeProgressOptions, type FlowEdgePathProps } from "./edge-progress";
