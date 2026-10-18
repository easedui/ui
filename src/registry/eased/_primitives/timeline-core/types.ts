import type { StepStatus } from "../thinking-core/types";

/** A time: epoch ms, an ISO string, or a Date. */
export type TimeInput = number | string | Date;

/** The colour role of an event; renderers map it to `*-subtle` / `*-text` tokens. */
export type EventTone = "neutral" | "info" | "success" | "warning" | "danger";

/**
 * One thing that happened: a filing, a payment, a deploy log line, a comment, a page.
 * Spans (a lease, a hearing, a trace span) set `end` too.
 */
export type TimelineEvent<D = unknown> = {
  /** Stable id: rows are keyed by it, so live appends never re-mount older rows. */
  id: string;
  at: TimeInput;
  /** Spans only. */
  end?: TimeInput;
  title: string;
  detail?: string;
  /** A free-form category the block filters on: "filing", "deploy", "refund". */
  kind?: string;
  tone?: EventTone;
  /** For runs and deploys: thinking-core's frozen status. */
  status?: StepStatus;
  /** Who did it. */
  actor?: { name: string; avatarUrl?: string };
  data?: D;
};

/** Epoch ms from any `TimeInput`. Invalid input reads as NaN. */
export function toMs(t: TimeInput): number {
  return typeof t === "number" ? t : t instanceof Date ? t.getTime() : Date.parse(t);
}
