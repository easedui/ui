/**
 * The maths behind Eased gestures. Pure functions, so sliders, sheets, pagers and canvases
 * all resist, fling and settle the same way.
 */

/** UIScrollView's rubber-band constant: how stiff an overscroll feels. Lower is stiffer. */
export const RUBBER_BAND = 0.55;

/** UIScrollView's deceleration rates, per millisecond. `normal` for sheets, `fast` for pagers. */
export const DECELERATION = { normal: 0.998, fast: 0.99 } as const;

/**
 * Apple's rubber-band curve. Maps how far a pointer has travelled past an edge to how far the
 * element follows it: almost 1:1 at first, then flattening toward `dimension` and never reaching it.
 *
 *   f(x) = (1 − 1 / (x·c / d + 1)) · d
 */
export function rubberband(overshoot: number, dimension: number, constant = RUBBER_BAND) {
  if (overshoot === 0 || dimension <= 0) return 0;
  const x = Math.abs(overshoot);
  return Math.sign(overshoot) * (1 - 1 / ((x * constant) / dimension + 1)) * dimension;
}

/** The inverse of `rubberband`: the pointer travel that produces a displayed overshoot. */
export function rubberbandInverse(displayed: number, dimension: number, constant = RUBBER_BAND) {
  if (displayed === 0 || dimension <= 0) return 0;
  const f = Math.min(Math.abs(displayed), dimension * 0.999);
  return Math.sign(displayed) * ((dimension / constant) * f) / (dimension - f);
}

/** `value` inside [min, max], rubber-banded past either end instead of clamped. */
export function rubberbandClamp(value: number, min: number, max: number, dimension: number, constant = RUBBER_BAND) {
  if (value < min) return min - rubberband(min - value, dimension, constant);
  if (value > max) return max + rubberband(value - max, dimension, constant);
  return value;
}

/** The inverse of `rubberbandClamp`, used to pick a gesture up from an overshot position. */
export function rubberbandUnclamp(value: number, min: number, max: number, dimension: number, constant = RUBBER_BAND) {
  if (value < min) return min - rubberbandInverse(min - value, dimension, constant);
  if (value > max) return max + rubberbandInverse(value - max, dimension, constant);
  return value;
}

export const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/**
 * Velocity projection: how far a flick would carry before friction stops it, as UIScrollView
 * decelerates. `velocity` is px/s; at `DECELERATION.normal` a 1000px/s flick travels ≈ 500px.
 */
export function project(velocity: number, decelerationRate: number = DECELERATION.normal) {
  return ((velocity / 1000) * decelerationRate) / (1 - decelerationRate);
}

/** Index of the point nearest `value`. Ties go to the earlier point. */
export function nearest(value: number, points: readonly number[]) {
  let best = 0;
  for (let i = 1; i < points.length; i++) {
    if (Math.abs(points[i] - value) < Math.abs(points[best] - value)) best = i;
  }
  return best;
}

/**
 * Where a release settles: the snap point nearest to where the flick would carry the element,
 * not where the finger let go. A slow release lands on the nearest point; a flick skips ahead.
 */
export function pickSnap(position: number, velocity: number, points: readonly number[], decelerationRate: number = DECELERATION.normal) {
  return nearest(position + project(velocity, decelerationRate), points);
}

type Sample = { t: number; p: number };

/**
 * Pointer velocity in px/s over the last `window` ms, the way Motion's pan gesture measures it.
 * Returns 0 if the pointer has rested longer than `rest` ms, so a held-then-released drag
 * does not fling.
 */
export function createVelocityTracker(window = 100, rest = 60) {
  let samples: Sample[] = [];
  return {
    reset() {
      samples = [];
    },
    add(p: number, t = performance.now()) {
      samples.push({ t, p });
      while (samples.length > 2 && t - samples[1].t > window) samples.shift();
    },
    velocity(now = performance.now()) {
      if (samples.length < 2) return 0;
      const last = samples[samples.length - 1];
      if (now - last.t > rest) return 0;
      const first = samples[0];
      const dt = (last.t - first.t) / 1000;
      return dt > 0 ? (last.p - first.p) / dt : 0;
    },
  };
}
