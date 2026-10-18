/** A half-open time interval [start, end). */
export type Interval = { start: Date | number; end: Date | number };
type Ms = { start: number; end: number };

const ms = (i: Interval): Ms => ({ start: +new Date(i.start), end: +new Date(i.end) });
const out = (i: Ms) => ({ start: new Date(i.start), end: new Date(i.end) });

/** Sorts and merges overlapping or touching intervals. */
export function mergeIntervals(intervals: readonly Interval[]): { start: Date; end: Date }[] {
  const sorted = intervals.map(ms).filter((i) => i.end > i.start).sort((a, b) => a.start - b.start);
  const merged: Ms[] = [];
  for (const i of sorted) {
    const last = merged[merged.length - 1];
    if (last && i.start <= last.end) last.end = Math.max(last.end, i.end);
    else merged.push({ ...i });
  }
  return merged.map(out);
}

/** The free time inside `within` once `busy` is taken out. */
export function subtractBusy(within: Interval, busy: readonly Interval[]): { start: Date; end: Date }[] {
  const w = ms(within);
  const free: Ms[] = [];
  let cursor = w.start;
  for (const b of mergeIntervals(busy).map(ms)) {
    if (b.end <= cursor) continue;
    if (b.start >= w.end) break;
    if (b.start > cursor) free.push({ start: cursor, end: Math.min(b.start, w.end) });
    cursor = Math.max(cursor, b.end);
  }
  if (cursor < w.end) free.push({ start: cursor, end: w.end });
  return free.map(out);
}

/**
 * When everyone is free: the intersection of each person's free intervals. The Interview
 * Scheduler's highlighted overlap.
 */
export function intersectAvailability(people: readonly (readonly Interval[])[]): { start: Date; end: Date }[] {
  if (!people.length) return [];
  let acc: Ms[] = mergeIntervals(people[0]).map(ms);
  for (const person of people.slice(1)) {
    const other = mergeIntervals(person).map(ms);
    const next: Ms[] = [];
    let i = 0;
    let j = 0;
    while (i < acc.length && j < other.length) {
      const start = Math.max(acc[i].start, other[j].start);
      const end = Math.min(acc[i].end, other[j].end);
      if (end > start) next.push({ start, end });
      if (acc[i].end < other[j].end) i++;
      else j++;
    }
    acc = next;
  }
  return acc.map(out);
}

/** Bookable slot starts of `durationMinutes` inside free intervals, every `stepMinutes` on the clock (local). */
export function slotsIn(free: readonly Interval[], { durationMinutes = 30, stepMinutes = durationMinutes }: { durationMinutes?: number; stepMinutes?: number } = {}): Date[] {
  const step = stepMinutes * 60_000;
  const dur = durationMinutes * 60_000;
  const slots: Date[] = [];
  for (const f of free.map(ms)) {
    const offset = new Date(f.start).getTimezoneOffset() * 60_000;
    let t = Math.ceil((f.start - offset) / step) * step + offset;
    for (; t + dur <= f.end; t += step) slots.push(new Date(t));
  }
  return slots;
}
