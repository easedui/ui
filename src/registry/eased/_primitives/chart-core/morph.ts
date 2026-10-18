"use client";

import { animate, type AnimationPlaybackControls, type Transition } from "motion/react";
import { useLayoutEffect, useRef, useState } from "react";
import { smooth } from "../../lib/motion";
import { lerp, type Domain } from "./scales";

export type Curve = "monotone" | "linear";

/* ---------- Sampling ------------------------------------------------------- */

// d3-shape's curveMonotoneX tangents (Steffen 1990) for evenly spaced points, so a sampled
// curve is the exact curve d3 would draw. With x evenly spaced the Bézier's x is linear in t,
// so each segment is a cubic Hermite in y and can be evaluated at any x directly.
function tangents(v: readonly number[]) {
  const n = v.length;
  const t = new Float64Array(n);
  if (n < 2) return t;
  const s = (i: number) => v[i + 1] - v[i]; // secant over one step
  for (let i = 1; i < n - 1; i++) {
    const s0 = s(i - 1);
    const s1 = s(i);
    const p = (s0 + s1) / 2;
    t[i] = (Math.sign(s0) + Math.sign(s1)) * Math.min(Math.abs(s0), Math.abs(s1), 0.5 * Math.abs(p)) || 0;
  }
  t[0] = n > 2 ? (3 * s(0) - t[1]) / 2 : s(0);
  t[n - 1] = n > 2 ? (3 * s(n - 2) - t[n - 2]) / 2 : s(0);
  return t;
}

/**
 * Samples a series of evenly spaced values at `count` evenly spaced positions across the
 * same span, along a monotone (d3 `curveMonotoneX`) or straight curve. Two series with
 * different lengths sampled at the same `count` share their x positions: that is what lets
 * a 7-point line morph into a 30-point one without inventing or dropping vertices.
 */
export function sampleSeries(values: readonly number[], count: number, curve: Curve = "monotone"): Float64Array {
  const out = new Float64Array(count);
  const n = values.length;
  if (n === 0) return out;
  if (n === 1 || count === 1) return out.fill(n === 1 ? values[0] : values[n - 1]);
  const t = curve === "monotone" ? tangents(values) : null;
  for (let k = 0; k < count; k++) {
    const pos = (k / (count - 1)) * (n - 1);
    const i = Math.min(n - 2, Math.floor(pos));
    const u = pos - i;
    const y0 = values[i];
    const y1 = values[i + 1];
    if (!t) {
      out[k] = y0 + (y1 - y0) * u;
      continue;
    }
    const u2 = u * u;
    const u3 = u2 * u;
    out[k] = (2 * u3 - 3 * u2 + 1) * y0 + (u3 - 2 * u2 + u) * t[i] + (-2 * u3 + 3 * u2) * y1 + (u3 - u2) * t[i + 1];
  }
  return out;
}

/** The sampled value at `u` ∈ [0, 1] along a sampled series (linear between samples). */
export function sampleAt(samples: ArrayLike<number>, u: number) {
  const n = samples.length;
  if (n === 0) return 0;
  if (n === 1) return samples[0];
  const pos = Math.max(0, Math.min(1, u)) * (n - 1);
  const i = Math.min(n - 2, Math.floor(pos));
  return lerp(samples[i], samples[i + 1], pos - i);
}

function resample(samples: Float64Array, count: number) {
  if (samples.length === count) return samples;
  const out = new Float64Array(count);
  for (let k = 0; k < count; k++) out[k] = sampleAt(samples, count === 1 ? 1 : k / (count - 1));
  return out;
}

const round = (n: number) => Math.round(n * 100) / 100;

/** An SVG path through the samples. `x(u)` maps 0–1 across the plot, `y(v)` a value to a pixel. */
export function samplesToPath(samples: ArrayLike<number>, x: (u: number) => number, y: (v: number) => number) {
  const n = samples.length;
  if (n === 0) return "";
  let d = "";
  for (let k = 0; k < n; k++) d += `${k ? "L" : "M"}${round(x(n === 1 ? 1 : k / (n - 1)))},${round(y(samples[k]))}`;
  return d;
}

/** The same line closed down to `baseY`, for an area fill. */
export function samplesToArea(samples: ArrayLike<number>, x: (u: number) => number, y: (v: number) => number, baseY: number) {
  if (samples.length === 0) return "";
  return `${samplesToPath(samples, x, y)}L${round(x(1))},${round(baseY)}L${round(x(0))},${round(baseY)}Z`;
}

/** Where a series rests when it enters or leaves: zero if the domain holds it, else the nearer edge. */
export const baselineOf = ([lo, hi]: Domain) => Math.min(hi, Math.max(lo, 0));

/* ---------- useMorphPath --------------------------------------------------- */

/** What the chart should show: each series' values (evenly spaced in x) and the value domain. */
export type MorphShape = { series: Readonly<Record<string, readonly number[]>>; domain: Domain };
/** What is on screen this frame: every series sampled on shared x positions, and the domain. */
export type MorphFrame = { series: Record<string, Float64Array>; domain: Domain };

export type UseMorphPathOptions = {
  /** Draws a frame: write `d` attributes and move gridlines here. Called outside React render. */
  onFrame: (frame: MorphFrame) => void;
  /** Shared x samples per series. Default 160; keep ≥ 8 per data segment for smooth curves. */
  samples?: number;
  curve?: Curve;
  /** The morph's transition. Default `smooth` (no overshoot: data should not wobble past its value). */
  transition?: Transition;
  /** False jumps to every new shape (reduced motion, scrubbing a slider). Default true. */
  animate?: boolean;
};

const signature = (shape: MorphShape, count: number, curve: Curve) => {
  let s = `${count}|${curve}|${shape.domain[0]},${shape.domain[1]}`;
  for (const key of Object.keys(shape.series)) s += `|${key}:${shape.series[key].join(",")}`;
  return s;
};

/**
 * Morphs a set of paths between shapes the way Arc does, without React re-rendering a frame:
 * every series is resampled onto the same x positions, so any shape tweens into any other
 * point for point, and the value domain rides the same progress so gridlines and lines stay
 * in register. A change mid-morph starts from what is on screen. Series that appear grow out
 * of the baseline; series that leave flatten into it and are then dropped from the frame.
 *
 *   const morph = useMorphPath({ series: { revenue }, domain }, { onFrame: (f) => {
 *     line.current?.setAttribute("d", samplesToPath(f.series.revenue, x, y));
 *   }});
 *
 * Returns `get()` (the current frame) and `redraw()` (re-emit it, e.g. after a resize).
 */
export function useMorphPath(shape: MorphShape, { onFrame, samples = 160, curve = "monotone", transition = smooth, animate: animated = true }: UseMorphPathOptions) {
  const frame = useRef<MorphFrame | null>(null);
  const anim = useRef<AnimationPlaybackControls | null>(null);
  const draw = useRef(onFrame);
  const shapeRef = useRef(shape);
  const options = useRef({ samples, curve, transition, animated });
  useLayoutEffect(() => {
    draw.current = onFrame;
    shapeRef.current = shape;
    options.current = { samples, curve, transition, animated };
  });

  const key = signature(shape, samples, curve);
  useLayoutEffect(() => {
    const { samples: count, curve: c, transition: tr, animated: anime } = options.current;
    const next = shapeRef.current;
    const target: MorphFrame = { series: {}, domain: next.domain };
    for (const k of Object.keys(next.series)) target.series[k] = sampleSeries(next.series[k], count, c);

    const from = frame.current;
    anim.current?.stop();
    if (!from || !anime) {
      frame.current = target;
      draw.current(target);
      return;
    }

    const keys = new Set([...Object.keys(from.series), ...Object.keys(target.series)]);
    const a: Record<string, Float64Array> = {};
    const b: Record<string, Float64Array> = {};
    for (const k of keys) {
      a[k] = from.series[k] ? resample(from.series[k], count) : new Float64Array(count).fill(baselineOf(from.domain));
      b[k] = target.series[k] ?? new Float64Array(count).fill(baselineOf(target.domain));
    }
    const live: MorphFrame = { series: {}, domain: from.domain };
    for (const k of keys) live.series[k] = new Float64Array(count);

    anim.current = animate(0, 1, {
      ...tr,
      onUpdate: (p) => {
        for (const k of keys) {
          const out = live.series[k];
          const s0 = a[k];
          const s1 = b[k];
          for (let i = 0; i < count; i++) out[i] = s0[i] + (s1[i] - s0[i]) * p;
        }
        live.domain = [lerp(from.domain[0], target.domain[0], p), lerp(from.domain[1], target.domain[1], p)];
        frame.current = live;
        draw.current(live);
      },
      onComplete: () => {
        frame.current = target;
        draw.current(target);
      },
    });
  }, [key]);

  useLayoutEffect(() => () => anim.current?.stop(), []);

  const [api] = useState(() => ({
    get: () => frame.current,
    redraw: () => {
      if (frame.current) draw.current(frame.current);
    },
  }));
  return api;
}
