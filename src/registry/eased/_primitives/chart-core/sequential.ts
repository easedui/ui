import type { Domain } from "./scales";
import { chartColor } from "./tokens";

/**
 * The colour of a cell with no value (null, NaN, or 0 when zero is empty): the line colour, one
 * step firmer than the chart grid so an empty cell still reads as a cell (1.44:1 on a light
 * surface, 1.65:1 on a dark one).
 */
export const SEQUENTIAL_EMPTY = "var(--eased-line)";

export type SequentialStop = {
  /** 0 for the lightest step. */
  step: number;
  color: string;
  /** The step covers values from `from` (inclusive) to `to` (exclusive; the last step includes it). */
  from: number;
  to: number;
};

export type SequentialScale = {
  domain: Domain;
  steps: number;
  /** The colour for missing values. */
  empty: string;
  /** One per step, lightest first: a legend draws these. */
  stops: readonly SequentialStop[];
  /** The step a value falls in, clamped to the domain, or -1 when it is empty. */
  step: (value: number | null | undefined) => number;
  /** The step's colour, or `empty`. */
  color: (value: number | null | undefined) => string;
};

export type SequentialScaleOptions = {
  /** How many colour steps the domain splits into, 2 to 9. Default 5. */
  steps?: number;
  /** The hue the ramp builds to. Default `chartColor(1)`. */
  color?: string;
  /** Draw a value of exactly 0 as empty, not as the lightest step: counts, where nothing happened. Default true. */
  zeroIsEmpty?: boolean;
};

/**
 * The ramp alone: `steps` colours from just past the empty cell to past the hue. The first
 * steps mix the hue into the empty colour in even shares (at most half for the first of two);
 * the last leans 30% toward the text colour, one more even lightness step past the hue. Mixed
 * in Oklab, so the ramp keeps one hue and its lightness changes evenly (Oklab L 0.80 → 0.47 in
 * light, 0.43 → 0.72 in dark): darker means more on a light surface, brighter on a dark one,
 * and it reads under every colour vision deficiency. With five steps, neighbouring steps differ
 * by 1.28–1.56:1 in contrast, and the first sits 1.28:1 from empty: tell values apart in the
 * tooltip or table, not by shade alone.
 */
export function sequentialColors(steps = 5, color = chartColor(1)): string[] {
  const n = Math.max(2, Math.min(9, Math.round(steps)));
  return Array.from({ length: n }, (_, i) =>
    i === n - 1
      ? `color-mix(in oklab, ${color} 70%, var(--eased-text))`
      : `color-mix(in oklab, ${color} ${Math.round(((i + 1) / Math.max(2, n - 1)) * 1000) / 10}%, ${SEQUENTIAL_EMPTY})`,
  );
}

/**
 * A sequential colour scale for magnitudes: heatmaps, cohort and retention tables. Splits
 * `domain` into `steps` equal bins, each a token-built colour, and returns the bins as legend
 * stops. Pass a fixed domain (e.g. [0, 1] for retention) when two datasets should share colours.
 */
export function sequentialScale(domain: Domain, { steps = 5, color = chartColor(1), zeroIsEmpty = true }: SequentialScaleOptions = {}): SequentialScale {
  const colors = sequentialColors(steps, color);
  const n = colors.length;
  const [lo, hi] = domain;
  const span = hi - lo;
  const step = (value: number | null | undefined) => {
    if (value == null || !Number.isFinite(value) || (zeroIsEmpty && value === 0)) return -1;
    if (span <= 0) return n - 1;
    return Math.max(0, Math.min(n - 1, Math.floor(((value - lo) / span) * n)));
  };
  return {
    domain,
    steps: n,
    empty: SEQUENTIAL_EMPTY,
    stops: colors.map((c, i) => ({ step: i, color: c, from: lo + (span * i) / n, to: lo + (span * (i + 1)) / n })),
    step,
    color: (value) => {
      const s = step(value);
      return s === -1 ? SEQUENTIAL_EMPTY : colors[s];
    },
  };
}
