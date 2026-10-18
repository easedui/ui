"use client";

import { AnimatePresence, motion, useInView } from "motion/react";
import { useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { NumberRoll } from "../_primitives/number-roll/number-roll";
import { useTableDensity } from "../_primitives/table-core/table-core";
import { Avatar } from "../avatar/avatar";
import { Badge, type BadgeTone } from "../badge/badge";
import { instant, reducedFade, smooth, swap, swapIn, swapOut, swapShown, useSafeReducedMotion } from "../lib/motion";
import { pressIcon } from "../lib/press";

/* ---------- Person ------------------------------------------------------------------------ */

export type PersonCellProps = {
  name: string;
  /** Avatar image URL; initials show without one. */
  src?: string;
  /** A second line (email, role). Shown in comfortable tables only: a 36px row has room for one line. */
  detail?: ReactNode;
};

/** Avatar with name. 24px avatar in dense tables, 32px in comfortable ones. */
export function PersonCell({ name, src, detail }: PersonCellProps) {
  const comfortable = useTableDensity() === "comfortable";
  return (
    <span className="flex min-w-0 items-center gap-2">
      <Avatar name={name} src={src} size={comfortable ? "md" : "sm"} />
      <span className="flex min-w-0 flex-col">
        <span className="truncate">{name}</span>
        {comfortable && detail && <span className="truncate text-ui-xs font-normal text-text-muted">{detail}</span>}
      </span>
    </span>
  );
}

/* ---------- Status ------------------------------------------------------------------------ */

export type StatusCellProps = {
  children: ReactNode;
  tone?: BadgeTone;
  /** The dot breathes: for states that are happening now ("Running", "Live"). */
  live?: boolean;
};

/** A status badge with a dot. Left-aligned in its column so every badge starts on one edge. */
export function StatusCell({ children, tone = "neutral", live = false }: StatusCellProps) {
  return (
    <Badge tone={tone} dot={live ? "live" : true}>
      {children}
    </Badge>
  );
}

/* ---------- Number with delta ------------------------------------------------------------- */

export type DeltaCellProps = {
  value: number;
  /** Change as a fraction: 0.124 is +12.4%. */
  delta: number;
  /** How `value` is formatted, e.g. `{ style: "currency", currency: "USD", maximumFractionDigits: 0 }`. */
  format?: Intl.NumberFormatOptions;
  locale?: Intl.LocalesArgument;
  /** For metrics where down is good (churn, latency): a fall reads green. */
  invert?: boolean;
};

/**
 * A number and its change. The value rolls when it updates; the delta sits in a fixed track
 * so values and deltas each keep one right edge down the column. A rise is success, a fall is
 * warning, never danger (red is for errors).
 */
export function DeltaCell({ value, delta, format, locale, invert = false }: DeltaCellProps) {
  const sign = Math.abs(delta) < 0.0005 ? 0 : Math.sign(delta);
  const good = invert ? sign < 0 : sign > 0;
  const tone = sign === 0 ? "text-text-muted" : good ? "text-success-text" : "text-warning-text";
  const pct = new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 1, minimumFractionDigits: 1 }).format(
    Math.abs(delta),
  );
  const spoken = sign === 0 ? "unchanged" : `${sign > 0 ? "up" : "down"} ${pct}`;
  return (
    <span className="inline-grid grid-cols-[auto_3.75rem] items-center justify-end gap-2 tabular-nums">
      <NumberRoll value={value} format={format} locale={locale} className="justify-self-end" />
      <span className={`inline-flex items-center justify-end gap-0.5 text-ui-xs ${tone}`}>
        <span className="sr-only">{spoken}</span>
        <svg
          viewBox="0 0 12 12"
          aria-hidden
          className={`size-3 shrink-0 fill-none stroke-current ${sign === 0 ? "hidden" : ""} ${sign < 0 ? "rotate-180" : ""}`}
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M6 9.5v-7M3 5.25 6 2.25l3 3" />
        </svg>
        <span aria-hidden>{sign === 0 ? "0%" : pct}</span>
      </span>
    </span>
  );
}

/* ---------- Progress ---------------------------------------------------------------------- */

export type ProgressCellProps = {
  value: number;
  max?: number;
  /** The meter's accessible name, e.g. "Onboarding". */
  label?: string;
  locale?: Intl.LocalesArgument;
};

/**
 * A slim meter and its percentage. The bar fills from empty the first time it scrolls into
 * view and glides on updates (smooth spring, no overshoot); it turns green at 100%. The track
 * and label have fixed widths, so every row's bar starts and ends on the same lines.
 */
export function ProgressCell({ value, max = 100, label, locale }: ProgressCellProps) {
  const reduced = useSafeReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const fraction = max > 0 ? Math.min(1, Math.max(0, value / max)) : 0;
  const done = fraction === 1;
  return (
    <span
      ref={ref}
      role="meter"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      className="inline-grid grid-cols-[4rem_2rem] items-center gap-2 tabular-nums"
    >
      <span className="relative h-1 overflow-clip rounded-pill bg-surface-sunken inset-shadow-well">
        <motion.span
          className={`absolute inset-0 origin-left rounded-pill transition-colors duration-150 ease-standard ${done ? "bg-success" : "bg-brand"}`}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: inView ? fraction : 0 }}
          transition={reduced ? instant : smooth}
        />
      </span>
      <span aria-hidden className="text-right text-ui-xs text-text-muted">
        {new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 0 }).format(fraction)}
      </span>
    </span>
  );
}

/* ---------- Relative time ----------------------------------------------------------------- */

const subscribeMinute = (onTick: () => void) => {
  const id = window.setInterval(onTick, 30_000);
  return () => window.clearInterval(id);
};
const minuteNow = () => Math.floor(Date.now() / 30_000) * 30_000;

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 31_536_000_000],
  ["month", 2_592_000_000],
  ["week", 604_800_000],
  ["day", 86_400_000],
  ["hour", 3_600_000],
  ["minute", 60_000],
];

/** "just now", "5 min. ago", "yesterday", "in 3 days". */
export function formatRelative(date: Date, now: number, locale?: Intl.LocalesArgument) {
  const diff = date.getTime() - now;
  if (Math.abs(diff) < 45_000) return "just now";
  const rtf = new Intl.RelativeTimeFormat(locale as string | undefined, { numeric: "auto", style: "short" });
  for (const [unit, ms] of UNITS) if (Math.abs(diff) >= ms || unit === "minute") return rtf.format(Math.round(diff / ms), unit);
  return "";
}

export type RelativeTimeCellProps = {
  date: Date | string | number;
  /** Render relative to this instant instead of a live clock (tests, fixtures, server output). */
  now?: Date | number;
  locale?: Intl.LocalesArgument;
};

/**
 * A relative time ("2h ago") in a `<time>` element with the full date as its tooltip and
 * machine value. It keeps itself current on a shared 30-second clock; before hydration it
 * shows the short date, so server and client markup agree.
 */
export function RelativeTimeCell({ date, now, locale }: RelativeTimeCellProps) {
  const d = new Date(date);
  const clock = useSyncExternalStore(subscribeMinute, minuteNow, () => null);
  const at = now !== undefined ? new Date(now).getTime() : clock;
  const full = new Intl.DateTimeFormat(locale as string | undefined, { dateStyle: "medium", timeStyle: "short" }).format(d);
  return (
    <time dateTime={d.toISOString()} title={full} className="whitespace-nowrap tabular-nums">
      {at === null
        ? new Intl.DateTimeFormat(locale as string | undefined, { month: "short", day: "numeric" }).format(d)
        : formatRelative(d, at, locale)}
    </time>
  );
}

/* ---------- Mono ID ----------------------------------------------------------------------- */

export type IdCellProps = {
  id: string;
  /** Show a copy button on row hover or focus. Default false. */
  copyable?: boolean;
};

/**
 * An identifier in mono with slashed zeros. With `copyable`, a copy button waits beside it,
 * invisible until the row is hovered or the button focused (it always holds its space, so
 * nothing shifts), and swaps to a tick when the ID is copied.
 */
export function IdCell({ id, copyable = false }: IdCellProps) {
  const reduced = useSafeReducedMotion();
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(id);
    } catch {
      return;
    }
    setCopied(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), 1400);
  };

  return (
    <span className="inline-flex max-w-full min-w-0 items-center gap-1">
      <span className="truncate font-mono text-ui-xs text-text-muted tabular-nums slashed-zero">{id}</span>
      {copyable && (
        <button
          type="button"
          onClick={copy}
          aria-label={copied ? "Copied" : `Copy ${id}`}
          className={`relative inline-flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-control-xs text-text-muted opacity-0 group-hover-fine:opacity-100 focus-visible:opacity-100 hover-fine:bg-surface-active hover-fine:text-text ${
            copied ? "opacity-100" : ""
          } ${pressIcon}`}
        >
          {/* Both icons share one grid cell, so the swap never changes the layout (popLayout cannot lift an SVG out of flow). */}
          <span className="inline-grid shrink-0 place-items-center *:col-start-1 *:row-start-1">
            <AnimatePresence initial={false}>
              <motion.svg
                key={copied ? "done" : "copy"}
                viewBox="0 0 14 14"
                aria-hidden
                className="size-3.5 fill-none stroke-current"
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={reduced ? { opacity: 0 } : swapIn}
                animate={reduced ? { opacity: 1 } : swapShown}
                exit={reduced ? { opacity: 0 } : swapOut}
                transition={reduced ? reducedFade : swap}
              >
                {copied ? (
                  <path d="M3 7.5 5.75 10 11 4" />
                ) : (
                  <>
                    <rect x="4.75" y="4.75" width="7" height="7" rx="1.5" />
                    <path d="M9.25 2.75h-5a1.5 1.5 0 0 0-1.5 1.5v5" />
                  </>
                )}
              </motion.svg>
            </AnimatePresence>
          </span>
          <span aria-live="polite" className="sr-only">
            {copied ? "Copied" : ""}
          </span>
        </button>
      )}
    </span>
  );
}
