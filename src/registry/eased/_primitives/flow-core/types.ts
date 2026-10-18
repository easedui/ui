import type { StepStatus } from "../thinking-core/types";

export type { StepStatus };

/** One node of a flow: a CI job, an agent step, a payment hop, an approver. */
export type FlowNode<D = unknown> = {
  /** Stable id: edges refer to it and renderers key by it. */
  id: string;
  label: string;
  /** Where the node is. Shares thinking-core's frozen `StepStatus`. Default `pending`. */
  status?: StepStatus;
  /** A secondary line: "2m 14s", "0.3% fee", "Partner". */
  detail?: string;
  /** Epoch ms when it became active / settled (stamped by `setNodeStatus` and `stepFlow`). */
  startedAt?: number;
  endedAt?: number;
  /** Size override for this node in the layout. */
  width?: number;
  height?: number;
  /** Anything the renderer needs: an icon, an avatar, a fee. */
  data?: D;
};

/** A directed edge `from → to`. */
export type FlowEdge = {
  /** Defaults to `from->to`. */
  id?: string;
  from: string;
  to: string;
  label?: string;
  /** Forces the edge's status; otherwise it is derived from its two nodes (`edgeStatus`). */
  status?: StepStatus;
};

export type FlowGraph<D = unknown> = { nodes: FlowNode<D>[]; edges: FlowEdge[] };

export const edgeId = (e: FlowEdge) => e.id ?? `${e.from}->${e.to}`;
