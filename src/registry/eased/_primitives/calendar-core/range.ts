"use client";

import { useCallback, useEffect, useState, type KeyboardEvent, type PointerEvent } from "react";
import { addDays, addMinutes, differenceInCalendarDays, startOfDay, toDayKey } from "./dates";

/** Whole days (bookings, leave, deadlines) or fixed-length time slots (tours, shifts). */
export type Granularity = "day" | { minutes: number };

/** An inclusive range of units: `end` is the last selected day, or the start of the last selected slot. */
export type DateRange = { start: Date; end: Date };

const isDay = (g: Granularity): g is "day" => g === "day";
const unitStart = (d: Date | number, g: Granularity) => {
  if (isDay(g)) return startOfDay(d);
  const ms = g.minutes * 60_000;
  const t = +new Date(d);
  const local = t - new Date(t).getTimezoneOffset() * 60_000;
  return new Date(t - (((local % ms) + ms) % ms));
};
const unitAdd = (d: Date, n: number, g: Granularity) => (isDay(g) ? addDays(d, n) : addMinutes(d, n * g.minutes));
const unitDiff = (a: Date, b: Date, g: Granularity) => (isDay(g) ? differenceInCalendarDays(a, b) : Math.round((+a - +b) / (g.minutes * 60_000)));
const sameUnit = (a: Date, b: Date, g: Granularity) => unitDiff(a, b, g) === 0;

/** Orders two dates into a range, snapped to whole units. */
export function normalizeRange(a: Date | number, b: Date | number, granularity: Granularity = "day"): DateRange {
  const x = unitStart(a, granularity);
  const y = unitStart(b, granularity);
  return +x <= +y ? { start: x, end: y } : { start: y, end: x };
}

/** Units in a range, inclusive: a one-night booking selected as two days is 2. */
export function rangeLength(r: DateRange, granularity: Granularity = "day"): number {
  return unitDiff(r.end, r.start, granularity) + 1;
}

export function isInRange(d: Date | number, r: DateRange | null | undefined, granularity: Granularity = "day"): boolean {
  if (!r) return false;
  const u = unitStart(d, granularity);
  return +u >= +r.start && +u <= +r.end;
}

export type RangePosition = "single" | "start" | "middle" | "end";

/** Where a cell sits in a range, for the pill shape: rounded ends, square middle. */
export function rangePosition(d: Date | number, r: DateRange | null | undefined, granularity: Granularity = "day"): RangePosition | null {
  if (!r || !isInRange(d, r, granularity)) return null;
  const u = unitStart(d, granularity);
  const s = sameUnit(u, r.start, granularity);
  const e = sameUnit(u, r.end, granularity);
  return s && e ? "single" : s ? "start" : e ? "end" : "middle";
}

export type RangeConstraints = {
  granularity?: Granularity;
  /** Units that can't be selected (booked nights, weekends, past days). A range never spans one. */
  isDisabled?: (d: Date) => boolean;
  /** Fewest units in a committed range. Default 1. */
  minLength?: number;
  /** Most units. Default unlimited. */
  maxLength?: number;
};

/**
 * The range from `anchor` towards `target` that the constraints allow: it stops before the
 * first disabled unit (a stay can't span a booked night), caps at `maxLength`, and stretches
 * to `minLength` in the drag's direction when it can. Null when the anchor itself is disabled
 * or `minLength` can't be met.
 */
export function constrainRange(anchor: Date | number, target: Date | number, { granularity = "day", isDisabled, minLength = 1, maxLength = Infinity }: RangeConstraints = {}): DateRange | null {
  const a = unitStart(anchor, granularity);
  const t = unitStart(target, granularity);
  if (isDisabled?.(a)) return null;
  const dir = +t >= +a ? 1 : -1;
  const want = Math.max(minLength, Math.min(maxLength, Math.abs(unitDiff(t, a, granularity)) + 1));
  let end = a;
  let n = 1;
  while (n < want) {
    const next = unitAdd(end, dir, granularity);
    if (isDisabled?.(next)) break;
    end = next;
    n++;
  }
  if (n < minLength) return null;
  return normalizeRange(a, end, granularity);
}

export type UseRangeSelectionOptions = RangeConstraints & {
  /** Controlled committed range. */
  value?: DateRange | null;
  defaultValue?: DateRange | null;
  onChange?: (range: DateRange | null) => void;
};

export type CellState = {
  /** In the committed range. */
  selected: boolean;
  /** In the range being chosen (between the anchor and the pointer). */
  previewing: boolean;
  /** Position in whichever range is showing (the preview while choosing): drives the pill shape. */
  position: RangePosition | null;
  disabled: boolean;
  /** The first click / drag start of the range being chosen. */
  anchor: boolean;
};

type Pending = { anchor: Date | null; hover: Date | null; dragging: boolean; moved: boolean };
const idle: Pending = { anchor: null, hover: null, dragging: false, moved: false };

/**
 * Range selection for day grids and time grids. Click a start and an end, or press and drag
 * across cells (touch too: give the grid `touch-action: none`); Enter or Space on a focused cell
 * acts as a click, Escape cancels. While choosing, `preview` follows the pointer and respects
 * the constraints, so a guest sees exactly the stay they would get.
 *
 *   const sel = useRangeSelection({ isDisabled: (d) => booked.has(toDayKey(d)), maxLength: 14 });
 *   <button {...sel.cellProps(day.date)} data-position={sel.stateOf(day.date).position ?? undefined} />
 */
export function useRangeSelection(options: UseRangeSelectionOptions = {}) {
  const { value: controlled, defaultValue = null, onChange, granularity = "day", isDisabled, minLength, maxLength } = options;
  const [uncontrolled, setUncontrolled] = useState<DateRange | null>(defaultValue);
  const [pending, setPending] = useState<Pending>(idle);
  const value = controlled !== undefined ? controlled : uncontrolled;
  const constraints: RangeConstraints = { granularity, isDisabled, minLength, maxLength };

  const commit = (range: DateRange | null) => {
    if (controlled === undefined) setUncontrolled(range);
    onChange?.(range);
    setPending(idle);
  };

  const preview = pending.anchor ? constrainRange(pending.anchor, pending.hover ?? pending.anchor, constraints) : null;

  /** A click (or Enter/Space): starts a range, or ends the one being chosen. */
  const select = (d: Date) => {
    if (isDisabled?.(unitStart(d, granularity))) return;
    if (!pending.anchor) return setPending({ anchor: unitStart(d, granularity), hover: null, dragging: false, moved: false });
    const range = constrainRange(pending.anchor, d, constraints);
    if (range) commit(range);
  };
  const hover = (d: Date | null) => setPending((p) => (p.anchor ? { ...p, hover: d, moved: p.moved || (d !== null && !sameUnit(d, p.anchor, granularity)) } : p));
  const cancel = () => setPending(idle);
  const clear = () => commit(null);

  // A drag that ends outside the grid still ends.
  const dragging = pending.dragging;
  const endDrag = useCallback(() => {
    setPending((p) => (p.dragging ? { ...p, dragging: false } : p));
  }, []);
  useEffect(() => {
    if (!dragging) return;
    window.addEventListener("pointerup", endDrag);
    window.addEventListener("pointercancel", endDrag);
    return () => {
      window.removeEventListener("pointerup", endDrag);
      window.removeEventListener("pointercancel", endDrag);
    };
  }, [dragging, endDrag]);

  const cellProps = (date: Date) => ({
    "data-date": isDay(granularity) ? toDayKey(date) : unitStart(date, granularity).toISOString(),
    "aria-selected": isInRange(date, value, granularity),
    "aria-disabled": isDisabled?.(unitStart(date, granularity)) || undefined,
    onPointerDown: (e: PointerEvent<HTMLElement>) => {
      if (e.button !== 0) return;
      // Release touch's implicit capture so the cells under the finger get pointerenter.
      if (e.currentTarget.hasPointerCapture?.(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
      if (pending.anchor && !pending.dragging) return select(date);
      if (isDisabled?.(unitStart(date, granularity))) return;
      setPending({ anchor: unitStart(date, granularity), hover: date, dragging: true, moved: false });
    },
    onPointerEnter: () => {
      if (pending.anchor) hover(date);
    },
    onPointerUp: () => {
      if (!pending.dragging || !pending.anchor) return;
      // A press without movement leaves the anchor for click-click; a drag commits.
      if (!pending.moved && sameUnit(date, pending.anchor, granularity)) return setPending((p) => ({ ...p, dragging: false }));
      const range = constrainRange(pending.anchor, date, constraints);
      if (range) commit(range);
      else cancel();
    },
    onKeyDown: (e: KeyboardEvent<HTMLElement>) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        select(date);
      } else if (e.key === "Escape" && pending.anchor) {
        e.preventDefault();
        cancel();
      }
    },
    onFocus: () => {
      if (pending.anchor) hover(date);
    },
  });

  const stateOf = (date: Date): CellState => {
    const showing = preview ?? value;
    return {
      selected: isInRange(date, value, granularity),
      previewing: isInRange(date, preview, granularity),
      position: rangePosition(date, showing, granularity),
      disabled: !!isDisabled?.(unitStart(date, granularity)),
      anchor: !!pending.anchor && sameUnit(date, pending.anchor, granularity),
    };
  };

  return { value, preview, anchor: pending.anchor, selecting: !!pending.anchor, select, hover, cancel, clear, setValue: commit, cellProps, stateOf };
}

/**
 * The date a roving-focus grid moves to for a key (WAI-ARIA date grid): arrows ±1 day / ±1
 * week, Home/End to the week's ends, PageUp/PageDown ±1 month (Shift: ±1 year). Null for other keys.
 */
export function nextFocusDate(date: Date, key: string, { weekStartsOn = 1, shift = false }: { weekStartsOn?: number; shift?: boolean } = {}): Date | null {
  const month = (n: number) => {
    const d = new Date(date);
    const day = d.getDate();
    d.setDate(1);
    d.setMonth(d.getMonth() + n);
    d.setDate(Math.min(day, new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()));
    return d;
  };
  const offset = (date.getDay() - weekStartsOn + 7) % 7;
  switch (key) {
    case "ArrowLeft":
      return addDays(date, -1);
    case "ArrowRight":
      return addDays(date, 1);
    case "ArrowUp":
      return addDays(date, -7);
    case "ArrowDown":
      return addDays(date, 7);
    case "Home":
      return addDays(date, -offset);
    case "End":
      return addDays(date, 6 - offset);
    case "PageUp":
      return month(shift ? -12 : -1);
    case "PageDown":
      return month(shift ? 12 : 1);
    default:
      return null;
  }
}
