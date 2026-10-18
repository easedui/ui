/**
 * Frozen cross-lane contracts (P11). Lane 2 (Chat) and later Thinking items import these;
 * add members only with a coordinated change, because consumers switch over them exhaustively.
 */

/**
 * Where one step of a run is.
 *
 *   pending   queued, not started
 *   active    running now (one per level, usually)
 *   complete  finished successfully
 *   error     failed; the run may continue or stop
 *   skipped   not needed after all (cancelled plan steps, short-circuited checks)
 */
export type StepStatus = "pending" | "active" | "complete" | "error" | "skipped";

/**
 * Where one tool call is. A superset of the AI SDK's tool-part states, collapsed to what the
 * UI distinguishes; map AI SDK parts with `toolStateFromPart`.
 *
 *   pending            input still streaming in, or queued
 *   awaiting-approval  needs the user to approve or deny before it runs
 *   running            executing
 *   done               returned output
 *   error              threw or returned an error
 *   denied             the user declined it
 */
export type ToolState = "pending" | "awaiting-approval" | "running" | "done" | "error" | "denied";

/** States after which a step or tool will not change again. */
export const SETTLED_STEP: ReadonlySet<StepStatus> = new Set(["complete", "error", "skipped"]);
export const SETTLED_TOOL: ReadonlySet<ToolState> = new Set(["done", "error", "denied"]);

/** One step of a run: a chain-of-thought line, a plan item, an agent action. */
export type Step = {
  /** Stable id: steps are keyed by it, so re-ordering moves rows instead of re-mounting them. */
  id: string;
  label: string;
  status: StepStatus;
  /** A secondary line: a URL read, a count found, an error message. */
  detail?: string;
  /** Epoch ms when the step became active. */
  startedAt?: number;
  /** Epoch ms when it settled. */
  endedAt?: number;
  /** Nested sub-steps. */
  steps?: Step[];
};

/** The AI SDK (v5+) tool-part `state` values `toolStateFromPart` understands. */
export type AISDKToolPartState =
  | "input-streaming"
  | "input-available"
  | "approval-requested"
  | "approval-responded"
  | "output-available"
  | "output-error"
  | "output-denied";

/**
 * Maps an AI SDK tool part to a `ToolState`, so `useChat` messages drive Eased tool UI directly:
 * `toolStateFromPart(part)` where `part.type` starts with `tool-`. Unknown states read as `pending`.
 */
export function toolStateFromPart(part: { state?: string; approval?: { approved?: boolean } }): ToolState {
  switch (part.state as AISDKToolPartState | undefined) {
    case "input-available":
      return "running";
    case "approval-requested":
      return "awaiting-approval";
    case "approval-responded":
      return part.approval?.approved === false ? "denied" : "running";
    case "output-available":
      return "done";
    case "output-error":
      return "error";
    case "output-denied":
      return "denied";
    default:
      return "pending";
  }
}
