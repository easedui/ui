"use client";

import { Progress as BaseProgress } from "@base-ui/react/progress";
import { AnimatePresence, motion, useInView } from "motion/react";
import { useRef, type ReactNode } from "react";
import { NumberRoll } from "../_primitives/number-roll/number-roll";
import { enter, exit, instant, reducedFade, smooth, useSafeReducedMotion } from "../lib/motion";

export type ProgressProps = {
  /** Current value, from `min` to `max`. `null` is indeterminate: the length of the task is unknown. */
  value: number | null;
  min?: number;
  max?: number;
  /** Visible label, also the progressbar's accessible name. Without one, pass `aria-label`. */
  label?: ReactNode;
  "aria-label"?: string;
  /** Show the rolling value on the right of the label row. Default true; hidden while indeterminate. */
  showValue?: boolean;
  /** Formats the value, e.g. `{ style: "unit", unit: "megabyte" }`. Default: the percentage. */
  format?: Intl.NumberFormatOptions;
  locale?: Intl.LocalesArgument;
  /** Spoken value, e.g. `(formatted) => \`${formatted} uploaded\``. */
  getAriaValueText?: (formattedValue: string, value: number | null) => string;
  /** Track thickness: 4px (`sm`) or 6px (`md`). Default `md`. */
  size?: "sm" | "md";
  /** Turn the bar success-green when it reaches `max`. Default true. */
  successOnComplete?: boolean;
  className?: string;
};

const TRACK = { sm: "h-1", md: "h-1.5" } as const;

/**
 * A progress bar on Base UI's Progress. The determinate bar rides a spring (no overshoot, so it
 * never reads past the real value) and its value rolls; an unknown length sweeps with an
 * accelerate–decelerate curve, then hands over to the bar the moment a value arrives.
 */
export function Progress({
  value,
  min = 0,
  max = 100,
  label,
  "aria-label": ariaLabel,
  showValue = true,
  format,
  locale,
  getAriaValueText,
  size = "md",
  successOnComplete = true,
  className = "",
}: ProgressProps) {
  const reduced = useSafeReducedMotion();
  const track = useRef<HTMLDivElement>(null);
  const inView = useInView(track);
  const known = value != null && Number.isFinite(value);
  const clamped = known ? Math.min(max, Math.max(min, value)) : min;
  const fraction = max > min ? (clamped - min) / (max - min) : 0;
  const complete = known && clamped === max;

  return (
    <BaseProgress.Root
      value={value}
      min={min}
      max={max}
      format={format}
      locale={locale}
      getAriaValueText={getAriaValueText}
      aria-label={label ? undefined : ariaLabel}
      className={`flex w-full min-w-0 flex-col gap-2 ${className}`}
    >
      {(label || (showValue && known)) && (
        <div className="flex min-w-0 items-baseline justify-between gap-3 text-ui-sm">
          {label ? <BaseProgress.Label className="min-w-0 truncate text-text-secondary">{label}</BaseProgress.Label> : <span />}
          {showValue && (
            <span className="shrink-0 text-text-muted tabular-nums">
              <AnimatePresence initial={false}>
                {known && (
                  <motion.span
                    className="inline-block"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1, transition: reduced ? reducedFade : enter }}
                    exit={{ opacity: 0, transition: reduced ? reducedFade : exit }}
                  >
                    <NumberRoll
                      aria-hidden
                      value={format ? clamped : fraction}
                      locale={locale}
                      format={format ?? { style: "percent", maximumFractionDigits: 0 }}
                    />
                  </motion.span>
                )}
              </AnimatePresence>
            </span>
          )}
        </div>
      )}

      <BaseProgress.Track
        ref={track}
        className={`relative w-full overflow-clip rounded-pill bg-surface-sunken inset-shadow-well ${TRACK[size]}`}
      >
        {/* Determinate: a full-width bar slid in from the left, so its rounded end never squashes. */}
        <motion.div
          className={`absolute inset-0 rounded-pill transition-colors duration-150 ease-standard ${
            complete && successOnComplete ? "bg-success" : "bg-brand"
          }`}
          initial={false}
          animate={{ x: `${(fraction - 1) * 100}%`, opacity: known ? 1 : 0 }}
          transition={reduced ? instant : { ...smooth, opacity: known ? enter : exit }}
        />
        {/* Indeterminate: a 40% segment that accelerates in and decelerates out, then repeats. */}
        <AnimatePresence initial={false}>
          {!known && (
            <motion.div
              key="sweep"
              className="absolute inset-y-0 left-0 w-2/5 animate-[eased-progress-sweep_1600ms_var(--eased-ease-in-out)_infinite] rounded-pill bg-brand reduced:w-full reduced:animate-none"
              style={{ animationPlayState: inView ? "running" : "paused" }}
              initial={{ opacity: 0 }}
              animate={{ opacity: reduced ? 0.4 : 1, transition: reduced ? reducedFade : enter }}
              exit={{ opacity: 0, transition: reduced ? reducedFade : exit }}
            />
          )}
        </AnimatePresence>
        <style href="eased-progress" precedence="default">
          {"@keyframes eased-progress-sweep { from { translate: -100% 0; } to { translate: 250% 0; } }"}
        </style>
      </BaseProgress.Track>
    </BaseProgress.Root>
  );
}
