"use client";

/**
 * saas-core: the small pieces every Eased SaaS-admin block shares, so a dashboard, a drilldown
 * and a billing page read as one product: the delta chip, the usage meter, relative times and
 * metric formats. Import from here.
 */
import { motion } from "motion/react";
import { minusFormatter } from "../../lib/format";
import { smooth, snappy, useSafeReducedMotion } from "../../lib/motion";
import { NumberRoll } from "../number-roll/number-roll";

/** Default locale for every SaaS format. Pass your own. */
export const SAAS_LOCALE = "en-US";

/* ---------- Formats ---------------------------------------------------------------------- */

/** Compact money for tiles and axes: `$207.9K`, `$1.2M`. */
export const compactMoney = (currency = "USD"): Intl.NumberFormatOptions => ({
  style: "currency",
  currency,
  currencyDisplay: "narrowSymbol",
  notation: "compact",
  maximumFractionDigits: 1,
});

/** `12 min ago`, `3 hr ago`, `yesterday`, `Oct 14`: short, for feeds and audit rows. */
export function relativeTime(at: number, now: number, locale: Intl.LocalesArgument = SAAS_LOCALE) {
  const min = Math.round((now - at) / 60_000);
  if (min < 1) return "Just now";
  if (min < 60) return `${min} min ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr} hr ago`;
  const day = Math.round(hr / 24);
  if (day < 2) return "Yesterday";
  if (day < 7) return new Intl.DateTimeFormat(locale, { weekday: "long", timeZone: "UTC" }).format(at);
  return new Intl.DateTimeFormat(locale, { month: "short", day: "numeric", timeZone: "UTC" }).format(at);
}

/** "up 4.9%" / "down 0.6%" / "flat", for screen readers. */
export function deltaText(delta: number, locale: Intl.LocalesArgument = SAAS_LOCALE) {
  if (Math.abs(delta) < 0.0005) return "flat";
  const pct = new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 1 }).format(Math.abs(delta));
  return `${delta > 0 ? "up" : "down"} ${pct}`;
}

/* ---------- Delta chip ------------------------------------------------------------------- */

export type DeltaChipProps = {
  /** Change as a ratio: 0.049 is +4.9%. */
  delta: number;
  /** Lower is better (churn, latency, cost): a fall reads as good. */
  invert?: boolean;
  locale?: Intl.LocalesArgument;
  /** Spoken after the change, e.g. "vs. prior 30 days". */
  caption?: string;
  className?: string;
};

/**
 * The change chip Stat Tile uses, on its own: the arrow turns on the snappy spring and the
 * percentage rolls. A metric the user owns falls in `warning`, never `danger` (rule 119).
 */
export function DeltaChip({ delta, invert = false, locale = SAAS_LOCALE, caption, className = "" }: DeltaChipProps) {
  const reduced = useSafeReducedMotion();
  const flat = Math.abs(delta) < 0.0005;
  const up = delta > 0;
  const good = invert ? !up : up;
  const tone = flat ? "bg-surface-hover text-text-secondary" : good ? "bg-success-subtle text-success-text" : "bg-warning-subtle text-warning-text";
  return (
    <span
      role="img"
      aria-label={`${deltaText(delta, locale)}${caption ? ` ${caption}` : ""}`}
      className={`inline-flex h-5 shrink-0 items-center gap-0.5 rounded-control-xs pr-1.5 pl-1 text-ui-xs font-medium tabular-nums transition-colors duration-150 ease-standard ${tone} ${className}`}
    >
      <motion.svg aria-hidden viewBox="0 0 16 16" className="size-3.5" initial={false} animate={{ rotate: flat ? 90 : up ? 0 : 180 }} transition={reduced ? { duration: 0 } : snappy}>
        <path d="M8 12.5V3.5M4 7.5l4-4 4 4" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      </motion.svg>
      <NumberRoll value={Math.abs(delta)} locale={locale} format={{ style: "percent", maximumFractionDigits: 1 }} animated={!reduced} aria-hidden />
    </span>
  );
}

/* ---------- Usage meter ------------------------------------------------------------------ */

export type UsageMeterProps = {
  label: string;
  used: number;
  limit: number;
  /** Formats `used` and `limit`. Default compact numbers. */
  format?: (value: number) => string;
  /** Share at which the meter turns warning. Default 0.8. */
  warnAt?: number;
  locale?: Intl.LocalesArgument;
  className?: string;
};

/**
 * Used against a limit: a sunken 6px track whose fill slides in to the share (a transform,
 * never width, so its rounded end keeps its shape) and turns warning at `warnAt`. Past the limit it stays full and says how far over.
 * A `meter` role with a spoken value.
 */
export function UsageMeter({ label, used, limit, format, warnAt = 0.8, locale = SAAS_LOCALE, className = "" }: UsageMeterProps) {
  const reduced = useSafeReducedMotion();
  const fmt = format ?? ((v: number) => new Intl.NumberFormat(locale, { notation: "compact", maximumFractionDigits: 2 }).format(v));
  const share = limit > 0 ? used / limit : 0;
  const warn = share >= warnAt;
  const pct = new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 0 });
  return (
    <div className={`flex min-w-0 flex-col gap-2 ${className}`}>
      <div className="flex min-w-0 items-baseline justify-between gap-3">
        <span className="truncate text-ui-sm text-text">{label}</span>
        <span className="shrink-0 text-ui-sm text-text-secondary tabular-nums">
          <span className="text-text">{fmt(used)}</span>
          <span className="text-text-muted"> of {fmt(limit)}</span>
        </span>
      </div>
      <div
        role="meter"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={limit}
        aria-valuenow={Math.min(used, limit)}
        aria-valuetext={`${fmt(used)} of ${fmt(limit)}, ${pct.format(share)}`}
        className="relative h-1.5 overflow-hidden rounded-pill bg-surface-sunken inset-shadow-well"
      >
        <motion.span
          aria-hidden
          className={`absolute inset-0 rounded-pill transition-colors duration-200 ease-standard ${warn ? "bg-warning" : "bg-brand"}`}
          initial={false}
          animate={{ x: `${(Math.min(1, Math.max(0, share)) - 1) * 100}%` }}
          transition={reduced ? { duration: 0 } : smooth}
        />
      </div>
    </div>
  );
}

/** A signed currency formatter with the true minus, for invoice lines and credits. */
export const signedMoney = (currency = "USD", locale: Intl.LocalesArgument = SAAS_LOCALE) =>
  minusFormatter(locale, { style: "currency", currency, currencyDisplay: "narrowSymbol" });
