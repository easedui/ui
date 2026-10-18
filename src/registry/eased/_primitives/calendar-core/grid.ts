import {
  addDays,
  addMinutes,
  differenceInCalendarDays,
  endOfMonth,
  isSameDay,
  isSameMonth,
  isWeekend,
  startOfDay,
  startOfMonth,
  startOfWeek,
  toDayKey,
  type WeekStart,
} from "./dates";

export type CalendarDay = {
  date: Date;
  /** `YYYY-MM-DD`, local: key cells by it. */
  key: string;
  /** Day of month, 1–31. */
  day: number;
  /** 0 Sunday … 6 Saturday. */
  weekday: number;
  /** False for the leading/trailing days of neighbouring months in a month grid. */
  inMonth: boolean;
  isToday: boolean;
  isWeekend: boolean;
};

export type GridOptions = {
  /** 0 Sunday … 6 Saturday. Default 1 (Monday); `localeWeekStart(locale)` reads the locale's. */
  weekStartsOn?: WeekStart;
  /** "Today", for the today mark. Pass a fixed date for deterministic demos; default none. */
  today?: Date | number;
  locale?: string;
};

const dayOf = (date: Date, month: Date | null, today: Date | number | undefined): CalendarDay => ({
  date,
  key: toDayKey(date),
  day: date.getDate(),
  weekday: date.getDay(),
  inMonth: month ? isSameMonth(date, month) : true,
  isToday: today !== undefined && isSameDay(date, today),
  isWeekend: isWeekend(date),
});

/** Weekday headers in display order: `{ narrow: "M", short: "Mon", long: "Monday" }`. */
export function weekdays({ weekStartsOn = 1, locale }: Pick<GridOptions, "weekStartsOn" | "locale"> = {}) {
  // 4 Jan 1970 was a Sunday.
  const base = new Date(1970, 0, 4 + weekStartsOn);
  const f = (weekday: "narrow" | "short" | "long") => new Intl.DateTimeFormat(locale, { weekday });
  const [n, s, l] = [f("narrow"), f("short"), f("long")];
  return Array.from({ length: 7 }, (_, i) => {
    const d = addDays(base, i);
    return { weekday: d.getDay(), narrow: n.format(d), short: s.format(d), long: l.format(d) };
  });
}

/**
 * A month as weeks of days, padded with the neighbouring months' days. `fixedWeeks` (default
 * true) always returns six weeks, so paging months never changes the grid's height.
 *
 *   const { title, weeks, weekdays } = monthGrid(new Date(2026, 9), { today: FIXTURE_NOW });
 */
export function monthGrid(month: Date | number, { weekStartsOn = 1, today, locale, fixedWeeks = true }: GridOptions & { fixedWeeks?: boolean } = {}) {
  const first = startOfMonth(month);
  const start = startOfWeek(first, { weekStartsOn });
  const span = differenceInCalendarDays(endOfMonth(first), start) + 1;
  const weekCount = fixedWeeks ? 6 : Math.ceil(span / 7);
  const weeks: CalendarDay[][] = Array.from({ length: weekCount }, (_, w) => Array.from({ length: 7 }, (_, d) => dayOf(addDays(start, w * 7 + d), first, today)));
  return {
    title: new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }).format(first),
    month: first,
    weeks,
    days: weeks.flat(),
    weekdays: weekdays({ weekStartsOn, locale }),
    start,
    end: addDays(start, weekCount * 7 - 1),
  };
}

export type TimeGridOptions = GridOptions & {
  /** Days shown. Default 7 (a week grid); 5 for a work week; 1 for a day. */
  days?: number;
  /** First and last hour shown (end exclusive). Default 8 → 20. */
  startHour?: number;
  endHour?: number;
  /** Slot length. Default 30. */
  slotMinutes?: number;
  /** Start on `anchor` itself instead of its week start (day views, rolling 3-day views). */
  fromAnchor?: boolean;
};

export type TimeSlot = {
  index: number;
  /** Minutes after midnight. */
  minutes: number;
  /** Localised label ("09:00" or "9 AM"), on whole hours only; empty otherwise. */
  label: string;
  hourStart: boolean;
};

/**
 * A week (or day) time grid: day columns and time slots, plus `slotStart(day, slot)` to turn
 * a cell back into a Date. The basis of Week Calendar, Tour and Interview Schedulers.
 */
export function timeGrid(anchor: Date | number, options: TimeGridOptions = {}) {
  const { weekStartsOn = 1, today, locale, days = 7, startHour = 8, endHour = 20, slotMinutes = 30, fromAnchor = false } = options;
  const first = fromAnchor ? startOfDay(anchor) : startOfWeek(anchor, { weekStartsOn });
  const dayList = Array.from({ length: days }, (_, i) => dayOf(addDays(first, i), null, today));
  const hourFmt = new Intl.DateTimeFormat(locale, { hour: "numeric", minute: "2-digit" });
  const slotCount = Math.max(0, Math.round(((endHour - startHour) * 60) / slotMinutes));
  const slots: TimeSlot[] = Array.from({ length: slotCount }, (_, index) => {
    const minutes = startHour * 60 + index * slotMinutes;
    const hourStart = minutes % 60 === 0;
    return { index, minutes, hourStart, label: hourStart ? hourFmt.format(new Date(1970, 0, 1, minutes / 60)) : "" };
  });
  const last = dayList[dayList.length - 1]?.date ?? first;
  const rangeFmt = new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", year: "numeric" });
  return {
    title: days === 1 ? new Intl.DateTimeFormat(locale, { weekday: "long", day: "numeric", month: "long" }).format(first) : rangeFmt.formatRange(first, last),
    days: dayList,
    slots,
    slotMinutes,
    startHour,
    endHour,
    /** The Date a cell starts at. */
    slotStart: (dayIndex: number, slotIndex: number) => addMinutes(startOfDay(dayList[dayIndex].date), startHour * 60 + slotIndex * slotMinutes),
    /** The cell a Date falls in, or null when it is outside the grid. */
    cellOf: (t: Date | number) => {
      const d = new Date(t);
      const dayIndex = dayList.findIndex((x) => isSameDay(x.date, d));
      const m = d.getHours() * 60 + d.getMinutes() - startHour * 60;
      if (dayIndex < 0 || m < 0 || m >= slotCount * slotMinutes) return null;
      return { dayIndex, slotIndex: Math.floor(m / slotMinutes) };
    },
  };
}

export type TimedItem = { id: string; start: Date | number; end: Date | number };

export type PlacedItem<T> = {
  item: T;
  /** 0–1 share of the visible hours: `top: ${top * 100}%`. */
  top: number;
  height: number;
  /** Side-by-side columns for overlapping items. */
  column: number;
  columns: number;
};

/**
 * Places one day's timed items (appointments, shifts, tours) on a time grid: top and height as
 * shares of the visible hours (clipped to them), and overlapping items in side-by-side columns
 * whose count is per cluster, not per day.
 */
export function placeDayItems<T extends TimedItem>(items: readonly T[], day: Date | number, { startHour = 8, endHour = 20 }: { startHour?: number; endHour?: number } = {}): PlacedItem<T>[] {
  const dayStart = startOfDay(day).getTime();
  const lo = dayStart + startHour * 3_600_000;
  const hi = dayStart + endHour * 3_600_000;
  const span = hi - lo;
  const visible = items
    .map((item) => ({ item, s: Math.max(lo, +new Date(item.start)), e: Math.min(hi, +new Date(item.end)) }))
    .filter((x) => x.e > x.s)
    .sort((a, b) => a.s - b.s || b.e - a.e);
  const out: PlacedItem<T>[] = [];
  let cluster: { x: (typeof visible)[number]; column: number }[] = [];
  let clusterEnd = -Infinity;
  const flush = () => {
    const columns = Math.max(1, ...cluster.map((c) => c.column + 1));
    for (const c of cluster) out.push({ item: c.x.item, top: (c.x.s - lo) / span, height: (c.x.e - c.x.s) / span, column: c.column, columns });
    cluster = [];
  };
  for (const x of visible) {
    if (x.s >= clusterEnd) {
      flush();
      clusterEnd = -Infinity;
    }
    const taken = new Set(cluster.filter((c) => c.x.e > x.s).map((c) => c.column));
    let column = 0;
    while (taken.has(column)) column++;
    cluster.push({ x, column });
    clusterEnd = Math.max(clusterEnd, x.e);
  }
  flush();
  return out;
}

/**
 * Items bucketed by the local days they touch, for month grids: a three-day leave shows on
 * each of its days. Keys are `YYYY-MM-DD`.
 */
export function itemsByDay<T extends TimedItem>(items: readonly T[]): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const s = startOfDay(item.start);
    // An item ending exactly at midnight doesn't touch that day; a zero-length item still shows on its day.
    const days = Math.max(0, differenceInCalendarDays(+new Date(item.end) - 1, s));
    for (let i = 0; i <= days; i++) {
      const k = toDayKey(addDays(s, i));
      const list = map.get(k);
      if (list) list.push(item);
      else map.set(k, [item]);
    }
  }
  return map;
}
