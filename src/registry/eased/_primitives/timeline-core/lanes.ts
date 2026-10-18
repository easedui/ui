import { toMs, type TimeInput } from "./types";

export type Span = { id: string; at: TimeInput; end?: TimeInput };

/**
 * Packs overlapping spans into the fewest lanes (greedy, earliest start first), so a lease,
 * matter or trace timeline stacks only what actually overlaps. Points (no `end`) take `minMs`.
 *
 *   const { laneOf, count } = packLanes(leases);   // laneOf.get("l-3") → 1
 */
export function packLanes(spans: readonly Span[], { gapMs = 0, minMs = 0 }: { gapMs?: number; minMs?: number } = {}) {
  const items = spans
    .map((s, i) => {
      const start = toMs(s.at);
      return { id: s.id, i, start, end: Math.max(start + minMs, s.end === undefined ? start : toMs(s.end)) };
    })
    .sort((a, b) => a.start - b.start || a.i - b.i);
  const laneEnds: number[] = [];
  const laneOf = new Map<string, number>();
  for (const it of items) {
    let lane = laneEnds.findIndex((end) => end + gapMs <= it.start);
    if (lane === -1) lane = laneEnds.push(0) - 1;
    laneEnds[lane] = it.end;
    laneOf.set(it.id, lane);
  }
  return { laneOf, count: laneEnds.length };
}

const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;
const STEPS = [MIN, 5 * MIN, 15 * MIN, 30 * MIN, HOUR, 3 * HOUR, 6 * HOUR, 12 * HOUR, DAY, 2 * DAY, 7 * DAY, 14 * DAY, 30 * DAY, 91 * DAY, 365 * DAY];

/**
 * A linear time axis for lane timelines: `x(t)` in px, the today line's x, and evenly stepped
 * ticks (1 min … 1 year) with at most one per `minGap` px. Ticks under a day are on whole
 * minutes/hours of UTC; day and longer ticks are on UTC midnights (format them with your zone).
 */
export function timeAxis(start: TimeInput, end: TimeInput, width: number, { minGap = 72, now }: { minGap?: number; now?: TimeInput } = {}) {
  const s = toMs(start);
  const e = Math.max(s + 1, toMs(end));
  const k = width / (e - s);
  const x = (t: TimeInput) => (toMs(t) - s) * k;
  const step = STEPS.find((st) => st * k >= minGap) ?? STEPS[STEPS.length - 1];
  const ticks: number[] = [];
  for (let t = Math.ceil(s / step) * step; t <= e; t += step) ticks.push(t);
  return { x, ticks, step, nowX: now === undefined ? undefined : x(now) };
}
