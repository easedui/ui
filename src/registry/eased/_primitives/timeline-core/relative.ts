"use client";

import { useCallback, useSyncExternalStore } from "react";
import { toMs, type TimeInput } from "./types";

export type RelativeOptions = {
  locale?: string;
  /** Intl.RelativeTimeFormat style. `short` gives "5 min. ago". Default `long`. */
  style?: Intl.RelativeTimeFormatStyle;
};

const UNITS: [Intl.RelativeTimeFormatUnit, number, number][] = [
  // unit, ms per unit, use it while |diff| < this many ms
  ["second", 1_000, 45_000],
  ["minute", 60_000, 45 * 60_000],
  ["hour", 3_600_000, 22 * 3_600_000],
  ["day", 86_400_000, 6.5 * 86_400_000],
  ["week", 7 * 86_400_000, 26 * 86_400_000],
  ["month", 30.44 * 86_400_000, 320 * 86_400_000],
  ["year", 365.25 * 86_400_000, Infinity],
];

const rtfCache = new Map<string, Intl.RelativeTimeFormat>();
const rtf = (locale: string | undefined, style: Intl.RelativeTimeFormatStyle) => {
  const id = `${locale}|${style}`;
  let f = rtfCache.get(id);
  if (!f) rtfCache.set(id, (f = new Intl.RelativeTimeFormat(locale, { numeric: "auto", style })));
  return f;
};

/**
 * "now", "5 minutes ago", "yesterday", "in 3 days", "last week": the closest unit, rounded,
 * localised by `Intl.RelativeTimeFormat` with `numeric: "auto"`. Under 45 seconds reads "now".
 */
export function formatRelative(at: TimeInput, now: TimeInput, { locale, style = "long" }: RelativeOptions = {}): string {
  const diff = toMs(at) - toMs(now);
  if (!Number.isFinite(diff)) return "";
  const f = rtf(locale, style);
  if (Math.abs(diff) < 45_000) return f.format(0, "second");
  for (const [unit, size, limit] of UNITS) {
    if (Math.abs(diff) < limit) return f.format(Math.round(diff / size), unit);
  }
  return "";
}

/** How often a relative label needs re-rendering at this distance: 10s under a minute, 30s under an hour, then 5 min. */
export function relativeRefreshMs(at: TimeInput, now: number): number {
  const d = Math.abs(toMs(at) - now);
  return d < 60_000 ? 10_000 : d < 3_600_000 ? 30_000 : 300_000;
}

type NowStore = { now: number | undefined; listeners: Set<() => void>; timer: number };
const stores = new Map<number, NowStore>();
const storeFor = (interval: number) => {
  let s = stores.get(interval);
  if (!s) stores.set(interval, (s = { now: undefined, listeners: new Set(), timer: 0 }));
  return s;
};

/**
 * The current time, shared by every caller with the same `intervalMs` (one timer per
 * interval, not per row) and paused while nobody is subscribed. Undefined on the server and
 * during hydration, so a relative label never mismatches the server HTML.
 */
export function useNow(intervalMs = 30_000): number | undefined {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const s = storeFor(intervalMs);
      s.listeners.add(onChange);
      if (s.listeners.size === 1) {
        s.now = Date.now();
        s.timer = window.setInterval(() => {
          s.now = Date.now();
          s.listeners.forEach((l) => l());
        }, intervalMs);
        queueMicrotask(onChange);
      }
      return () => {
        s.listeners.delete(onChange);
        if (s.listeners.size === 0) clearInterval(s.timer);
      };
    },
    [intervalMs],
  );
  return useSyncExternalStore(
    subscribe,
    () => {
      const s = storeFor(intervalMs);
      return (s.now ??= Date.now());
    },
    () => undefined,
  );
}

/**
 * A live relative label for `at` that refreshes at the cadence its distance needs. Pass `now`
 * to pin it (fixtures, screenshots). Undefined until mounted: render the absolute time, or
 * nothing, in its place.
 *
 *   const ago = useRelativeTime(event.at);   // "3 minutes ago"
 *   <time dateTime={iso}>{ago ?? time}</time>
 */
export function useRelativeTime(at: TimeInput, { now: pinned, ...options }: RelativeOptions & { now?: TimeInput } = {}): string | undefined {
  // Pick the cadence from the event's age at the last known time.
  const coarse = useNow(300_000);
  const interval = coarse === undefined ? 300_000 : relativeRefreshMs(at, coarse);
  const live = useNow(interval);
  const now = pinned ?? live;
  return now === undefined ? undefined : formatRelative(at, now, options);
}
