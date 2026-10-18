import { SETTLED_STEP, type Step, type StepStatus } from "./types";

/** A run's summary, derived from its steps. Pure: call it in render. */
export type StepSummary = {
  /** Leaf and parent steps at the top level. */
  total: number;
  /** Top-level steps that have settled (complete, error or skipped). */
  settled: number;
  completed: number;
  errored: number;
  /** settled / total, 0–1: what a progress rail draws to. 0 for an empty run. */
  progress: number;
  /** The first active top-level step, or the first pending one if none is active yet. */
  current: Step | undefined;
  /** The run as one status: error if any step failed and nothing is still going, active while anything is pending or active, complete when all settled. */
  status: StepStatus;
  /** Epoch ms span from the first start to the last end, when the steps carry times. */
  durationMs: number | undefined;
};

/** Summarises a list of steps for a rail, a header ("4 of 7"), or a collapsed run ("7 steps · 45s"). */
export function summarizeSteps(steps: readonly Step[]): StepSummary {
  let settled = 0;
  let completed = 0;
  let errored = 0;
  let current: Step | undefined;
  let firstPending: Step | undefined;
  let start = Infinity;
  let end = -Infinity;
  for (const s of steps) {
    if (SETTLED_STEP.has(s.status)) settled++;
    if (s.status === "complete") completed++;
    if (s.status === "error") errored++;
    if (s.status === "active" && !current) current = s;
    if (s.status === "pending" && !firstPending) firstPending = s;
    if (s.startedAt !== undefined) start = Math.min(start, s.startedAt);
    if (s.endedAt !== undefined) end = Math.max(end, s.endedAt);
  }
  const total = steps.length;
  const running = settled < total;
  return {
    total,
    settled,
    completed,
    errored,
    progress: total ? settled / total : 0,
    current: current ?? firstPending,
    status: total === 0 ? "pending" : running ? (current || settled ? "active" : "pending") : errored ? "error" : "complete",
    durationMs: Number.isFinite(start) && Number.isFinite(end) && end >= start ? end - start : undefined,
  };
}

/**
 * Immutable update of one step by id, anywhere in the tree. Stamps `startedAt` when a step
 * becomes active and `endedAt` when it settles, unless the patch sets them.
 *
 *   setSteps((s) => updateStep(s, "search", { status: "complete", detail: "14 sources" }))
 */
export function updateStep(steps: readonly Step[], id: string, patch: Partial<Omit<Step, "id">>, now = Date.now()): Step[] {
  return steps.map((s) => {
    if (s.id === id) {
      const next = { ...s, ...patch };
      if (patch.status === "active" && s.status !== "active" && patch.startedAt === undefined) next.startedAt = now;
      if (patch.status && SETTLED_STEP.has(patch.status) && !SETTLED_STEP.has(s.status) && patch.endedAt === undefined) next.endedAt = now;
      return next;
    }
    return s.steps ? { ...s, steps: updateStep(s.steps, id, patch, now) } : s;
  });
}

/**
 * Settles the active step and activates the next pending one: the usual "next" in a linear run.
 * Returns the steps unchanged when nothing is left to advance.
 */
export function advanceSteps(steps: readonly Step[], outcome: "complete" | "error" | "skipped" = "complete", now = Date.now()): Step[] {
  const active = steps.find((s) => s.status === "active");
  let next: Step[] = [...steps];
  if (active) next = updateStep(next, active.id, { status: outcome }, now);
  const pending = next.find((s) => s.status === "pending");
  if (pending) next = updateStep(next, pending.id, { status: "active" }, now);
  return next;
}
