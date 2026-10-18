import { toMs, type TimeInput, type TimelineEvent } from "./types";

export type SortOrder = "desc" | "asc";

/** A copy sorted by time (newest first by default); ties keep their input order. */
export function sortEvents<E extends TimelineEvent>(events: readonly E[], order: SortOrder = "desc"): E[] {
  const k = order === "desc" ? -1 : 1;
  return events
    .map((e, i) => ({ e, i, t: toMs(e.at) }))
    .sort((a, b) => (a.t - b.t) * k || a.i - b.i)
    .map((x) => x.e);
}

const keyFormatters = new Map<string, Intl.DateTimeFormat>();
/**
 * The calendar day of `t` as `YYYY-MM-DD`, in `timeZone` (default: the runtime's). Pass a
 * `timeZone` when rendering on the server, so the server and the browser agree.
 */
export function dayKey(t: TimeInput, timeZone?: string): string {
  const id = timeZone ?? "";
  let fmt = keyFormatters.get(id);
  if (!fmt) {
    fmt = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" });
    keyFormatters.set(id, fmt);
  }
  const parts = fmt.formatToParts(toMs(t));
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

/** Whole calendar days from day key `a` to `b` (DST-proof: counted on UTC midnights). */
export function daysBetweenKeys(a: string, b: string): number {
  return Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86_400_000);
}

export type DayLabelOptions = {
  /** Reference time for "Today" / "Yesterday". Pass a fixed one for deterministic demos. */
  now: TimeInput;
  locale?: string;
  timeZone?: string;
};

const cap = (s: string, locale?: string) => s.charAt(0).toLocaleUpperCase(locale) + s.slice(1);

/**
 * A day header: "Today", "Yesterday", the weekday within the last week ("Monday"), else a
 * short date ("Mon, 12 Oct"), with the year when it isn't the current one. Localised by Intl.
 */
export function dayLabel(key: string, { now, locale, timeZone }: DayLabelOptions): string {
  const today = dayKey(now, timeZone);
  const diff = daysBetweenKeys(key, today);
  // Noon UTC of the key, formatted in UTC, is the key's own calendar day in every zone.
  const date = Date.parse(`${key}T12:00:00Z`);
  if (diff === 0 || diff === 1 || diff === -1) {
    return cap(new Intl.RelativeTimeFormat(locale, { numeric: "auto" }).format(-diff, "day"), locale);
  }
  if (diff > 1 && diff < 7) return new Intl.DateTimeFormat(locale, { weekday: "long", timeZone: "UTC" }).format(date);
  const sameYear = key.slice(0, 4) === today.slice(0, 4);
  return new Intl.DateTimeFormat(locale, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: sameYear ? undefined : "numeric",
    timeZone: "UTC",
  }).format(date);
}

export type DayGroup<E> = {
  /** `YYYY-MM-DD`. Key the sticky header by it. */
  key: string;
  label: string;
  events: E[];
};

/**
 * Events grouped by calendar day, with localised headers, newest day first by default; events
 * inside a day follow the same order. Pure: call it in render or a `useMemo`.
 *
 *   groupByDay(transactions, { now: FIXTURE_NOW, timeZone: "Europe/London" })
 *   // [{ key: "2026-10-18", label: "Today", events: [...] }, { key: "2026-10-17", label: "Yesterday", ... }]
 */
export function groupByDay<E extends TimelineEvent>(events: readonly E[], { order = "desc", ...label }: DayLabelOptions & { order?: SortOrder }): DayGroup<E>[] {
  const groups: DayGroup<E>[] = [];
  const byKey = new Map<string, DayGroup<E>>();
  for (const e of sortEvents(events, order)) {
    const key = dayKey(e.at, label.timeZone);
    let g = byKey.get(key);
    if (!g) {
      g = { key, label: dayLabel(key, label), events: [] };
      byKey.set(key, g);
      groups.push(g);
    }
    g.events.push(e);
  }
  return groups;
}
