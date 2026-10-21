"use client";

/**
 * health-core: the pieces every Eased health block shares, so vitals, labs and schedules read
 * as one product: where a value sits against its range, the flag that says so, and clinic
 * clock times. Out of range reads `warning`, never `danger`: it is information for the
 * patient and their care team, not an error (rule 119). Import from here.
 */
import { AnimatePresence, motion } from "motion/react";
import { exitFast, reducedFade, snappy, useSafeReducedMotion } from "../../lib/motion";
import { TextSwap } from "../text-swap/text-swap";

/** Default locale and clinic time zone for every health format. Pass your own. */
export const HEALTH_LOCALE = "en-US";
export const HEALTH_TIME_ZONE = "UTC";

/* ---------- Ranges ----------------------------------------------------------------------- */

export type RangeStatus = "low" | "normal" | "high";
export type Range = { low: number; high: number };

/** Where `value` sits against a reference range (inclusive at both ends). */
export function rangeStatus(value: number, { low, high }: Range): RangeStatus {
  return value < low ? "low" : value > high ? "high" : "normal";
}

/** Text colour for a value in this state: in range stays `text-text`, out of range is `warning`. */
export const rangeText = (status: RangeStatus) => (status === "normal" ? "text-text" : "text-warning-text");

const FLAG_LABEL: Record<RangeStatus, string> = { low: "Low", normal: "In range", high: "High" };

export type RangeFlagProps = {
  status: RangeStatus;
  /** Show the "In range" chip too. Default false: only flags appear, and they pop in and out. */
  showNormal?: boolean;
  /** Override the labels, e.g. `{ high: "Above range" }`. */
  labels?: Partial<Record<RangeStatus, string>>;
  className?: string;
};

/**
 * A 20px flag for a value outside its range. It pops in on the snappy spring when a value
 * leaves the range and shrinks away when it returns; between Low and High its label swaps.
 */
export function RangeFlag({ status, showNormal = false, labels, className = "" }: RangeFlagProps) {
  const reduced = useSafeReducedMotion();
  const shown = status !== "normal" || showNormal;
  const label = labels?.[status] ?? FLAG_LABEL[status];
  const tone = status === "normal" ? "bg-success-subtle text-success-text" : "bg-warning-subtle text-warning-text";
  return (
    <AnimatePresence initial={false}>
      {shown && (
        <motion.span
          initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={reduced ? { opacity: 0, transition: reducedFade } : { opacity: 0, scale: 0.9, transition: exitFast }}
          transition={reduced ? reducedFade : snappy}
          className={`inline-flex h-5 shrink-0 items-center rounded-control-xs px-1.5 text-ui-xs font-medium whitespace-nowrap transition-colors duration-150 ease-standard ${tone} ${className}`}
        >
          <TextSwap>{label}</TextSwap>
        </motion.span>
      )}
    </AnimatePresence>
  );
}

/* ---------- Clinic time ------------------------------------------------------------------ */

/** "08:30" → 510 minutes after midnight. */
export const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + (m || 0);
};

const timeFmt = new Map<string, Intl.DateTimeFormat>();
/** Epoch ms → "8:30 AM" in the clinic's time zone. */
export function formatClock(t: number, { locale = HEALTH_LOCALE, timeZone = HEALTH_TIME_ZONE }: { locale?: string; timeZone?: string } = {}) {
  const k = `${locale}|${timeZone}`;
  let f = timeFmt.get(k);
  if (!f) timeFmt.set(k, (f = new Intl.DateTimeFormat(locale, { hour: "numeric", minute: "2-digit", timeZone })));
  return f.format(t);
}

/** Minutes after midnight → "9:00 PM", without a date. */
export const formatMinutes = (minutes: number, locale = HEALTH_LOCALE) => formatClock(Date.UTC(2026, 0, 1, 0, minutes), { locale, timeZone: "UTC" });
