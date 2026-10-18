import { scaleLinear } from "d3-scale";

/** A value domain, low to high. */
export type Domain = readonly [number, number];

export type NiceScaleOptions = {
  /** Keep zero inside the domain. Bars and areas need it; lines may drop it. Default true. */
  zero?: boolean;
  /** Roughly how many gridlines. Default 4. */
  ticks?: number;
};

/**
 * A clean value domain and its gridline values for a set of numbers: rounded to tick steps
 * (0 / 2K / 4K …), zero kept by default, and a flat or empty series still gets a usable range.
 */
export function niceScale(values: Iterable<number>, { zero = true, ticks = 4 }: NiceScaleOptions = {}) {
  let lo = Infinity;
  let hi = -Infinity;
  for (const v of values) {
    if (!Number.isFinite(v)) continue;
    if (v < lo) lo = v;
    if (v > hi) hi = v;
  }
  if (lo === Infinity) [lo, hi] = [0, 1];
  if (zero) [lo, hi] = [Math.min(0, lo), Math.max(0, hi)];
  if (lo === hi) [lo, hi] = lo === 0 ? [0, 1] : [lo - Math.abs(lo) * 0.1, hi + Math.abs(hi) * 0.1];
  // d3's tick count is a hint; step it down until there are at most `ticks + 1` lines.
  for (let count = ticks; ; count--) {
    const scale = scaleLinear().domain([lo, hi]).nice(count);
    const t = scale.ticks(count);
    if (t.length <= ticks + 1 || count <= 1) {
      const [a, b] = scale.domain();
      return { domain: [a, b] as Domain, ticks: t };
    }
  }
}

/** Maps a value in `domain` to a pixel in `range`; `range` may run high to low (y grows down). */
export function linear(domain: Domain, range: Domain) {
  const [d0, d1] = domain;
  const [r0, r1] = range;
  const k = d1 === d0 ? 0 : (r1 - r0) / (d1 - d0);
  return (v: number) => r0 + (v - d0) * k;
}

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/**
 * Which of `count` evenly spaced x labels to show at `width`: at most one per `minGap` px
 * (Arc's 76), always keeping the newest, then stepping back from it so the gaps stay even.
 */
export function thinLabels(count: number, width: number, minGap = 76): number[] {
  if (count <= 0) return [];
  if (count === 1) return [0];
  const spacing = width / (count - 1);
  const step = Math.max(1, Math.ceil(minGap / Math.max(spacing, 0.0001)));
  const out: number[] = [];
  for (let i = count - 1; i >= 0; i -= step) out.unshift(i);
  return out;
}

/** Evenly spaced bands for bars: the band width, each band's left edge, and a bar width capped at 24px with ≥ 2px air. */
export function bands(count: number, width: number, { maxBar = 24, gap = 0.32 }: { maxBar?: number; gap?: number } = {}) {
  const band = count > 0 ? width / count : width;
  const bar = Math.max(1, Math.min(maxBar, band - Math.max(2, band * gap)));
  return { band, bar, left: (i: number) => i * band, center: (i: number) => i * band + band / 2 };
}
