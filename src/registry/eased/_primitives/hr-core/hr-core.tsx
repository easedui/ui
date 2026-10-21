"use client";

/**
 * hr-core: what every Eased HR / recruiting block shares, so a pipeline, a profile and a
 * scorecard read as one product: the 1–4 interview scale, its four-pip meter, and the short
 * "3d in stage" clock. Import from here.
 */
import { motion } from "motion/react";
import { smooth, useSafeReducedMotion } from "../../lib/motion";

/** Default locale for every HR format. Pass your own. */
export const HR_LOCALE = "en-US";

/* ---------- The interview scale ---------------------------------------------------------- */

/** The four points Greenhouse and Ashby use. There is no middle: a panelist has to lean. */
export const RATING_LABELS = ["Strong no", "No", "Yes", "Strong yes"] as const;

/** "Strong yes" for 4, "Yes" for 3.4 (rounded), "" for no rating. */
export function ratingLabel(rating: number | null | undefined) {
  if (!rating) return "";
  return RATING_LABELS[Math.min(4, Math.max(1, Math.round(rating))) - 1];
}

/** Colour role of a rating: yes leans success, no leans warning (a "no" is information, not an error). */
export function ratingTone(rating: number | null | undefined): "success" | "warning" | "neutral" {
  if (!rating) return "neutral";
  return rating >= 2.5 ? "success" : "warning";
}

const PIP_FILL = { success: "bg-success", warning: "bg-warning", neutral: "bg-text-muted" } as const;

export type RatingPipsProps = {
  /** 1–4, fractional for a mean (3.4 fills three and a half pips). Null: empty. */
  value: number | null | undefined;
  /** Spoken label, e.g. "Jonas Lindqvist". The value and its word are added. */
  label?: string;
  locale?: Intl.LocalesArgument;
  /** Set the width here (default `w-16`); the pips share it. */
  className?: string;
};

/**
 * Four pips that fill to a rating: each pip's fill slides in on the smooth spring (a
 * transform, so a half pip keeps its rounded end), tinted success for yes and warning for no.
 * A `meter` with the value and its word spoken.
 */
export function RatingPips({ value, label, locale = HR_LOCALE, className = "w-16" }: RatingPipsProps) {
  const reduced = useSafeReducedMotion();
  const v = value ?? 0;
  const fill = PIP_FILL[ratingTone(value)];
  const nf = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 });
  return (
    <span
      role="meter"
      aria-label={label}
      aria-valuemin={1}
      aria-valuemax={4}
      aria-valuenow={value ?? undefined}
      aria-valuetext={value ? `${nf.format(v)} of 4, ${ratingLabel(v)}` : "Not rated"}
      className={`inline-grid shrink-0 grid-cols-4 gap-0.5 ${className}`}
    >
      {[0, 1, 2, 3].map((i) => {
        const share = Math.min(1, Math.max(0, v - i));
        return (
          <span key={i} aria-hidden className="relative h-1.5 overflow-hidden rounded-pill bg-surface-active">
            <motion.span
              className={`absolute inset-0 rounded-pill transition-colors duration-200 ease-standard ${fill}`}
              initial={false}
              animate={{ x: `${(share - 1) * 100}%` }}
              transition={reduced ? { duration: 0 } : { ...smooth, delay: share > 0 ? i * 0.03 : (3 - i) * 0.03 }}
            />
          </span>
        );
      })}
    </span>
  );
}

/* ---------- Time in stage ---------------------------------------------------------------- */

/** "5h", "3d", "2w": how long something has sat in a stage, for dense cards. */
export function timeIn(since: number, now: number) {
  const h = Math.max(0, (now - since) / 3_600_000);
  if (h < 24) return `${Math.max(1, Math.round(h))}h`;
  const d = Math.round(h / 24);
  return d < 14 ? `${d}d` : `${Math.round(d / 7)}w`;
}

/** "5 hours", "3 days", for the spoken copy of `timeIn`. */
export function timeInLong(since: number, now: number) {
  const short = timeIn(since, now);
  const n = Number.parseInt(short, 10);
  const unit = short.endsWith("h") ? "hour" : short.endsWith("d") ? "day" : "week";
  return `${n} ${unit}${n === 1 ? "" : "s"}`;
}
