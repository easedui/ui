/**
 * What every industry fixture shares: the fixed "now", time helpers, seeded series and Intl
 * formatters (rule 93). Fixtures store raw numbers and epoch ms; format at render time with
 * these, so the server and the browser print the same thing.
 */
import { createRng, roundTo } from "../realtime-core/rng";

/** Sunday 18 Oct 2026, 14:30 UTC. Every fixture's "now"; pass it as `now`/`today` to the cores. */
export const FIXTURE_NOW = Date.UTC(2026, 9, 18, 14, 30);
/** Formatting defaults that don't depend on the viewer's machine. Override per call. */
export const FIXTURE_LOCALE = "en-US";
export const FIXTURE_TIME_ZONE = "UTC";

const MIN = 60_000;
const HOUR = 60 * MIN;
/** Epoch ms `n` minutes / hours / days before `FIXTURE_NOW` (negative for the future). */
export const minutesAgo = (n: number) => FIXTURE_NOW - n * MIN;
export const hoursAgo = (n: number) => FIXTURE_NOW - n * HOUR;
/** `n` days ago at `hh:mm` UTC. */
export const daysAgo = (n: number, hh = 14, mm = 30) => Date.UTC(2026, 9, 18 - n, hh, mm);
export const daysFromNow = (n: number, hh = 9, mm = 0) => daysAgo(-n, hh, mm);

export type SeriesOptions = {
  count: number;
  /** First value. */
  start: number;
  /** Total drift over the series as a share (0.18 = ends ≈ 18% up). Default 0. */
  trend?: number;
  /** Per-step noise as a share. Default 0.03. */
  noise?: number;
  /** Weekly seasonality amplitude as a share (dips on weekends). Default 0. */
  weekly?: number;
  decimals?: number;
  min?: number;
};

/** A seeded, realistic metric series: a trend, noise and optional weekly rhythm. */
export function series(seed: string, { count, start, trend = 0, noise = 0.03, weekly = 0, decimals = 0, min = 0 }: SeriesOptions): number[] {
  const rng = createRng(seed);
  const out: number[] = [];
  let level = start;
  const step = Math.pow(1 + trend, 1 / Math.max(1, count - 1));
  for (let i = 0; i < count; i++) {
    // Day i counts back from Sunday's FIXTURE_NOW: (count - 1 - i) days ago.
    const weekday = (7 - ((count - 1 - i) % 7)) % 7; // 0 = Sunday
    const season = weekday === 0 || weekday === 6 ? 1 - weekly : 1 + weekly * 0.4;
    out.push(roundTo(Math.max(min, level * season * (1 + noise * rng.normal())), decimals));
    level *= step;
  }
  return out;
}

/** Day timestamps (UTC 00:00) for the last `count` days, oldest first, ending today. */
export const lastDays = (count: number) => Array.from({ length: count }, (_, i) => daysAgo(count - 1 - i, 0, 0));
/** Month starts for the last `count` months, oldest first, ending this month. */
export const lastMonths = (count: number) => Array.from({ length: count }, (_, i) => Date.UTC(2026, 9 - (count - 1 - i), 1));

const cache = new Map<string, Intl.NumberFormat | Intl.DateTimeFormat>();
const nf = (locale: string, o: Intl.NumberFormatOptions) => {
  const k = `n|${locale}|${JSON.stringify(o)}`;
  let f = cache.get(k) as Intl.NumberFormat | undefined;
  if (!f) cache.set(k, (f = new Intl.NumberFormat(locale, o)));
  return f;
};
const df = (locale: string, o: Intl.DateTimeFormatOptions) => {
  const k = `d|${locale}|${JSON.stringify(o)}`;
  let f = cache.get(k) as Intl.DateTimeFormat | undefined;
  if (!f) cache.set(k, (f = new Intl.DateTimeFormat(locale, o)));
  return f;
};

type Loc = { locale?: string };
/** `$1,284.50`, `€0.92`, `-$42.00`; `compact` gives `$4.2M`. Decimals follow the currency unless set. */
export const formatMoney = (v: number, currency = "USD", { locale = FIXTURE_LOCALE, compact = false, decimals }: Loc & { compact?: boolean; decimals?: number } = {}) =>
  nf(locale, {
    style: "currency",
    currency,
    notation: compact ? "compact" : "standard",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals ?? (compact ? 1 : undefined),
  }).format(v);
/** `12,480`, `1.0842`, `4.2K` with `compact`. */
export const formatNumber = (v: number, { locale = FIXTURE_LOCALE, decimals, compact = false }: Loc & { decimals?: number; compact?: boolean } = {}) =>
  nf(locale, { notation: compact ? "compact" : "standard", minimumFractionDigits: decimals, maximumFractionDigits: decimals ?? (compact ? 1 : 3) }).format(v);
/** A share as a percent: `0.0342` → `3.4%`; `signed` gives `+3.4%` / `−1.2%`. */
export const formatPercent = (v: number, { locale = FIXTURE_LOCALE, decimals = 1, signed = false }: Loc & { decimals?: number; signed?: boolean } = {}) =>
  nf(locale, { style: "percent", minimumFractionDigits: decimals, maximumFractionDigits: decimals, signDisplay: signed ? "exceptZero" : "auto" }).format(v);
/** `Oct 18, 2026`; `short` gives `Oct 18`. */
export const formatDate = (t: number, { locale = FIXTURE_LOCALE, timeZone = FIXTURE_TIME_ZONE, short = false }: Loc & { timeZone?: string; short?: boolean } = {}) =>
  df(locale, { month: "short", day: "numeric", year: short ? undefined : "numeric", timeZone }).format(t);
/** `2:30 PM`. */
export const formatTime = (t: number, { locale = FIXTURE_LOCALE, timeZone = FIXTURE_TIME_ZONE }: Loc & { timeZone?: string } = {}) =>
  df(locale, { hour: "numeric", minute: "2-digit", timeZone }).format(t);
