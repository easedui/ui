"use client";

import { AnimatePresence, motion, useInView } from "motion/react";
import { useRef, type ReactNode } from "react";
import { NumberRoll } from "../_primitives/number-roll/number-roll";
import { exitFast, reducedFade, snappy, useSafeReducedMotion } from "../lib/motion";

export type BadgeTone = "neutral" | "brand" | "success" | "warning" | "danger" | "info";

export type BadgeProps = {
  /** The label, e.g. "Beta" or "Operational". Optional when the badge is only a count. */
  children?: ReactNode;
  /** A number that rolls when it changes. Shown after the label. */
  count?: number;
  /** Counts above this show as `max+`. Default 99. */
  max?: number;
  /**
   * A count-only badge leaves (scale and fade) when its count is 0, and returns when it rises.
   * Keep it mounted and let this drive presence. Default false.
   */
  showZero?: boolean;
  /** A status dot before the label. `"live"` breathes slowly (2.4s) and stops under reduced motion. */
  dot?: boolean | "live";
  tone?: BadgeTone;
  /** 20px (`sm`, default) or 24px (`md`) tall. */
  size?: "sm" | "md";
  locale?: Intl.LocalesArgument;
  /** Spoken in place of the visible text, e.g. "3 unread messages". */
  "aria-label"?: string;
  className?: string;
};

// Status badges are subtle fill + state text (R31); the dot takes the text colour.
const TONES: Record<BadgeTone, string> = {
  neutral: "bg-surface-active text-text-secondary",
  brand: "bg-brand-subtle text-brand-text",
  success: "bg-success-subtle text-success-text",
  warning: "bg-warning-subtle text-warning-text",
  danger: "bg-danger-subtle text-danger-text",
  info: "bg-info-subtle text-info-text",
};

const SIZES = {
  sm: { box: "h-5 gap-1 px-1.5 text-ui-xs", count: "min-w-5", dot: "size-1.5" },
  md: { box: "h-6 gap-1.5 px-2 text-ui-sm", count: "min-w-6", dot: "size-2" },
} as const;

/**
 * A status or count chip. Counts roll their digits in the direction of change; a count-only
 * badge pops in when it rises above zero and leaves when it is cleared; a live dot breathes.
 */
export function Badge({
  children,
  count,
  max = 99,
  showZero = false,
  dot = false,
  tone = "neutral",
  size = "sm",
  locale,
  "aria-label": ariaLabel,
  className = "",
}: BadgeProps) {
  const reduced = useSafeReducedMotion();
  const s = SIZES[size];
  const hasLabel = children !== undefined && children !== null && children !== false;
  const countOnly = !hasLabel && count !== undefined;
  const visible = !countOnly || showZero || (count ?? 0) > 0;
  const shown = count === undefined ? undefined : Math.min(count, max);
  const over = count !== undefined && count > max;

  return (
    <AnimatePresence initial={false}>
      {visible && (
        <motion.span
          initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={reduced ? { opacity: 0, transition: reducedFade } : { opacity: 0, scale: 0.9, transition: exitFast }}
          transition={reduced ? reducedFade : snappy}
          className={`inline-flex shrink-0 items-center justify-center font-medium whitespace-nowrap tabular-nums ${s.box} ${
            countOnly ? `${s.count} rounded-pill` : "rounded-control-xs"
          } ${TONES[tone]} ${className}`}
        >
          {ariaLabel && <span className="sr-only">{ariaLabel}</span>}
          {dot && <Dot live={dot === "live"} className={s.dot} />}
          {hasLabel && (
            <span aria-hidden={ariaLabel ? true : undefined} className="min-w-0 truncate">
              {children}
            </span>
          )}
          {shown !== undefined && (
            <span aria-hidden={ariaLabel ? true : undefined} className="inline-flex">
              <NumberRoll value={shown} locale={locale} aria-hidden={!!ariaLabel} />
              {over && "+"}
            </span>
          )}
        </motion.span>
      )}
    </AnimatePresence>
  );
}

function Dot({ live, className }: { live: boolean; className: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref);
  return (
    <span ref={ref} aria-hidden className={`relative shrink-0 rounded-pill bg-current ${className}`}>
      {live && (
        <>
          {/* A halo the dot's colour that swells and fades back; it pauses off-screen and under reduced motion. */}
          <span
            className="absolute inset-0 animate-[eased-breathe_2400ms_var(--eased-ease-in-out)_infinite] rounded-pill bg-current opacity-0 reduced:animate-none"
            style={{ animationPlayState: inView ? "running" : "paused" }}
          />
          <style href="eased-badge" precedence="default">
            {"@keyframes eased-breathe { 0%, 100% { opacity: 0; scale: 1; } 50% { opacity: 0.35; scale: 2.25; } }"}
          </style>
        </>
      )}
    </span>
  );
}
