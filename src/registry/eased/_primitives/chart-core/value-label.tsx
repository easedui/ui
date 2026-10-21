"use client";

import type { ReactNode, Ref } from "react";
import { NumberRoll, type NumberRollFormat } from "../number-roll/number-roll";

/* ---------- ChartValueLabel ------------------------------------------------ */

export type ValueLabelAlign = "start" | "center" | "end";

export type ChartValueLabelProps = NumberRollFormat & {
  value: number;
  /** Text before the number, e.g. the slice or series name. */
  label?: ReactNode;
  /** False shows a new value at once instead of rolling to it. Default true. */
  animated?: boolean;
  /** Fades the label back while another part of the chart is active. */
  dimmed?: boolean;
  ref?: Ref<HTMLDivElement>;
  className?: string;
};

/**
 * A value printed on a chart: an optional name, then the number, which rolls to each new
 * value (NumberRoll). It renders hidden at the top left of its positioned container; the
 * chart moves it each frame with `placeValueLabel`, so it rides a morph without React
 * re-rendering. `aria-hidden`: the chart's slider and data table already read every value.
 */
export function ChartValueLabel({ value, label, animated = true, dimmed = false, ref, className = "", ...format }: ChartValueLabelProps) {
  return (
    <div
      ref={ref}
      aria-hidden
      data-hidden=""
      data-dimmed={dimmed || undefined}
      className={`pointer-events-none absolute top-0 left-0 flex items-center gap-1.5 text-ui-xs whitespace-nowrap transition-opacity duration-150 ease-standard data-hidden:opacity-0 data-dimmed:not-data-hidden:opacity-35 reduced:transition-none ${className}`}
    >
      {label != null && <span className="min-w-0 truncate text-text-secondary">{label}</span>}
      <span className="shrink-0 font-medium text-text tabular-nums">
        <NumberRoll value={value} animated={animated} {...format} aria-hidden />
      </span>
    </div>
  );
}

export type ValueLabelPlacement = {
  /** The anchor point in the container, px; `align` says which edge of the label sits on it. */
  x: number;
  /** The label's vertical centre, px. */
  y: number;
  align: ValueLabelAlign;
  /** False fades the label out where it stands. */
  visible: boolean;
  /** Truncates the name past this width, px. */
  maxWidth?: number;
};

const SHIFT: Record<ValueLabelAlign, string> = { start: "0%", center: "-50%", end: "-100%" };

/** Moves a `ChartValueLabel` to its spot for this frame. Call it from a chart's `onFrame`. */
export function placeValueLabel(el: HTMLElement | null, { x, y, align, visible, maxWidth }: ValueLabelPlacement) {
  if (!el) return;
  el.style.transform = `translate(${Math.round(x * 2) / 2}px, ${Math.round(y * 2) / 2}px) translate(${SHIFT[align]}, -50%)`;
  el.style.maxWidth = maxWidth === undefined ? "" : `${Math.max(0, Math.floor(maxWidth))}px`;
  el.toggleAttribute("data-hidden", !visible);
}

/* ---------- Collision ------------------------------------------------------ */

export type SpreadItem = {
  key: string;
  /** Where the label wants to sit, px along the axis. */
  at: number;
  /** Which labels to keep when they do not all fit; higher stays. Default 0. */
  priority?: number;
};

/**
 * One-dimensional label collision: keeps each label as close to where it wants to be as it
 * can while every pair stays at least `pitch` apart inside [min, max]. When they do not all
 * fit, the lowest-priority labels drop out first. Returns the position of every label kept.
 * Works along any axis: a column of arc labels, a row of bar value labels.
 */
export function spreadLabels(items: readonly SpreadItem[], { min, max, pitch }: { min: number; max: number; pitch: number }): Map<string, number> {
  const fit = Math.max(0, Math.floor((max - min) / pitch) + 1);
  let kept = [...items].sort((a, b) => a.at - b.at);
  if (kept.length > fit) {
    const drop = new Set(
      [...kept]
        .sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0))
        .slice(0, kept.length - fit)
        .map((d) => d.key),
    );
    kept = kept.filter((d) => !drop.has(d.key));
  }
  const pos = kept.map((d) => Math.max(min, Math.min(max, d.at)));
  // Down from the top, then back up from the bottom: the smallest move that clears every overlap.
  for (let i = 1; i < pos.length; i++) pos[i] = Math.max(pos[i], pos[i - 1] + pitch);
  if (pos.length && pos[pos.length - 1] > max) {
    pos[pos.length - 1] = max;
    for (let i = pos.length - 2; i >= 0; i--) pos[i] = Math.min(pos[i], pos[i + 1] - pitch);
  }
  return new Map(kept.map((d, i) => [d.key, pos[i]]));
}
