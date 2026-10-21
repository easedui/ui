"use client";

import { arc as d3arc } from "d3-shape";
import { animate, type AnimationPlaybackControls, type Transition } from "motion/react";
import { useLayoutEffect, useRef, useState } from "react";
import { smooth } from "../../lib/motion";
import { lerp } from "./scales";
import { spreadLabels } from "./value-label";

/*
 * Angles follow d3-shape: radians, clockwise, zero at 12 o'clock. A full turn is `TAU`.
 */

export const TAU = Math.PI * 2;

/** One keyed arc: where it starts and ends, in radians. */
export type ArcSlice = { key: string; start: number; end: number };

/** The point at `angle` and `radius` from the centre (y grows down, as in SVG). */
export function polar(angle: number, radius: number): [number, number] {
  return [Math.sin(angle) * radius, -Math.cos(angle) * radius];
}

/**
 * The angle of an offset from the centre, in [0, TAU): the inverse of `polar`, for hit testing.
 * Arcs laid out from a negative `startAngle` (a gauge from −0.75π) carry negative angles, so
 * test them against `a > Math.PI ? a - TAU : a`, or whichever turn their sweep covers.
 */
export function angleOf(dx: number, dy: number) {
  const a = Math.atan2(dx, -dy);
  return a < 0 ? a + TAU : a;
}

export const midAngle = (s: { start: number; end: number }) => (s.start + s.end) / 2;

export type PieLayoutOptions = {
  /** Where the first slice starts. Default 0 (12 o'clock). */
  startAngle?: number;
  /** Where the last slice ends. Default `TAU`; a gauge might sweep from −0.75π to 0.75π. */
  endAngle?: number;
};

/**
 * Splits a sweep between keyed values in the order given, never sorted, so the same key
 * keeps its place from one dataset to the next and morphs in place. A zero, negative or
 * missing value is a zero-width slice on its seam: it stays in the layout, so it can grow
 * back out of the same place.
 */
export function pieLayout(items: readonly { key: string; value: number }[], { startAngle = 0, endAngle = TAU }: PieLayoutOptions = {}): ArcSlice[] {
  const values = items.map((d) => (Number.isFinite(d.value) && d.value > 0 ? d.value : 0));
  const total = values.reduce((s, v) => s + v, 0);
  const k = total > 0 ? (endAngle - startAngle) / total : 0;
  let at = startAngle;
  return items.map((d, i) => {
    const start = at;
    at += values[i] * k;
    return { key: d.key, start, end: at };
  });
}

export type ArcShape = {
  outerRadius: number;
  /** 0 draws a pie wedge. Default 0. */
  innerRadius?: number;
  /** Rounds the arc's four corners, px; d3 clamps it to half the ring's thickness. Default 0. */
  cornerRadius?: number;
  /** Surface gap between neighbouring arcs, px, constant from the inner to the outer edge. Default 0. */
  gap?: number;
};

type ArcArgs = ArcShape & { start: number; end: number };
const ARC = d3arc<ArcArgs>()
  .innerRadius((a) => a.innerRadius ?? 0)
  .outerRadius((a) => a.outerRadius)
  .cornerRadius((a) => a.cornerRadius ?? 0)
  .padRadius((a) => a.outerRadius)
  .padAngle((a) => (a.gap ? a.gap / a.outerRadius : 0))
  .startAngle((a) => a.start)
  .endAngle((a) => a.end)
  .digits(2);

/** The SVG path of one arc around (0, 0), or "" when it has no width to draw. */
export function arcPath(shape: ArcShape, start: number, end: number) {
  if (!(end - start > 1e-4) || shape.outerRadius <= 0) return "";
  return ARC({ ...shape, start, end }) ?? "";
}

/* ---------- useArcMorph ---------------------------------------------------- */

export type UseArcMorphOptions = {
  /** Draws a frame: write `d` attributes and move labels here. Called outside React render. */
  onFrame: (slices: readonly ArcSlice[]) => void;
  /** The morph's transition. Default `smooth` (no overshoot). */
  transition?: Transition;
  /** False jumps to every new layout (reduced motion). Default true. */
  animate?: boolean;
  /**
   * Where a key with no partner grows out of and closes into: `"seam"` (default), its place
   * in a ring of touching slices; `"start"`, its own start angle, for arcs that each start at
   * the same angle (concentric rings, gauges).
   */
  grow?: "seam" | "start";
};

/** Each key's start and end on both sides of a morph. */
type Pair = { key: string; a: { start: number; end: number }; b: { start: number; end: number } };

/**
 * Where a slice with no partner on the other side sits: zero-width on the seam it grows out
 * of or closes into, i.e. the end of the nearest key before it that both sides share (else
 * the start of the nearest one after it, else its own start).
 */
function seam(order: readonly ArcSlice[], index: number, other: ReadonlyMap<string, ArcSlice>) {
  for (let j = index - 1; j >= 0; j--) {
    const s = other.get(order[j].key);
    if (s) return s.end;
  }
  for (let j = index + 1; j < order.length; j++) {
    const s = other.get(order[j].key);
    if (s) return s.start;
  }
  return order[index].start;
}

function pairsOf(from: readonly ArcSlice[], to: readonly ArcSlice[], grow: "seam" | "start"): Pair[] {
  const before = new Map(from.map((s) => [s.key, s]));
  const after = new Map(to.map((s) => [s.key, s]));
  const pairs: Pair[] = to.map((s, i) => {
    const a = before.get(s.key);
    const at = a ? 0 : grow === "start" ? s.start : seam(to, i, before);
    return { key: s.key, a: a ?? { start: at, end: at }, b: s };
  });
  // Leaving keys keep their place: after the nearest key before them that is still there.
  from.forEach((s, i) => {
    if (after.has(s.key)) return;
    const at = grow === "start" ? s.start : seam(from, i, after);
    let index = 0;
    for (let j = i - 1; j >= 0; j--) {
      const k = pairs.findIndex((p) => p.key === from[j].key);
      if (k !== -1) {
        index = k + 1;
        break;
      }
    }
    pairs.splice(index, 0, { key: s.key, a: s, b: { start: at, end: at } });
  });
  return pairs;
}

const sameKeys = (a: readonly string[], b: readonly string[]) => a.length === b.length && a.every((k, i) => k === b[i]);

/**
 * Morphs keyed arcs between layouts without React re-rendering a frame: every key tweens its
 * start and end angle on one progress, from whatever is on screen. A key that appears grows
 * out of the seam where it will sit; a key that leaves closes into its seam and is then
 * dropped. A change mid-morph starts from the frame on screen.
 *
 *   const { keys } = useArcMorph(pieLayout(items), { onFrame: (slices) => {
 *     for (const s of slices) paths.current[s.key]?.setAttribute("d", arcPath(shape, s.start, s.end));
 *   }});
 *
 * `keys` are the slices on screen, leaving ones included, in drawing order: render one
 * element per key. `get()` is the current frame; `redraw()` re-emits it, e.g. after a resize.
 */
export function useArcMorph(slices: readonly ArcSlice[], { onFrame, transition = smooth, animate: animated = true, grow = "seam" }: UseArcMorphOptions) {
  const frame = useRef<ArcSlice[] | null>(null);
  const anim = useRef<AnimationPlaybackControls | null>(null);
  const draw = useRef(onFrame);
  const latest = useRef({ slices, transition, animated, grow });
  const [keys, setKeys] = useState<readonly string[]>(() => slices.map((s) => s.key));
  useLayoutEffect(() => {
    draw.current = onFrame;
    latest.current = { slices, transition, animated, grow };
  });

  const settle = (next: readonly string[]) => setKeys((k) => (sameKeys(k, next) ? k : next));
  const signature = slices.map((s) => `${s.key}:${s.start.toFixed(5)}:${s.end.toFixed(5)}`).join("|");
  useLayoutEffect(() => {
    const { slices, transition: tr, animated: anime, grow: g } = latest.current;
    const target = slices.map((s) => ({ ...s }));
    const from = frame.current;
    anim.current?.stop();
    if (!from || !anime) {
      frame.current = target;
      settle(target.map((s) => s.key));
      draw.current(target);
      return;
    }
    const pairs = pairsOf(from, target, g);
    settle(pairs.map((p) => p.key));
    const live: ArcSlice[] = pairs.map((p) => ({ key: p.key, ...p.a }));
    anim.current = animate(0, 1, {
      ...tr,
      onUpdate: (t) => {
        pairs.forEach((p, i) => {
          live[i].start = lerp(p.a.start, p.b.start, t);
          live[i].end = lerp(p.a.end, p.b.end, t);
        });
        frame.current = live;
        draw.current(live);
      },
      onComplete: () => {
        frame.current = target;
        settle(target.map((s) => s.key));
        draw.current(target);
      },
    });
  }, [signature]);

  useLayoutEffect(() => () => anim.current?.stop(), []);
  // A key that just mounted has an element now: give it this frame's shape.
  useLayoutEffect(() => {
    if (frame.current) draw.current(frame.current);
  }, [keys]);

  const [api] = useState(() => ({
    get: () => frame.current as readonly ArcSlice[] | null,
    redraw: () => {
      if (frame.current) draw.current(frame.current);
    },
  }));
  return { keys, get: api.get, redraw: api.redraw };
}

/* ---------- Outside labels ------------------------------------------------- */

export type ArcLabelPlacement = {
  key: string;
  /** Which column the label sits in. */
  side: "left" | "right";
  /** Where the label's text starts (right) or ends (left), and its vertical centre, relative to the centre. */
  x: number;
  y: number;
  /** The leader line, relative to the centre: out from the arc, an elbow, then level into the label. */
  leader: string;
};

export type ArcLabelOptions = {
  /** The arcs' outer radius, px. */
  radius: number;
  /** How far the leader runs out from the arc before it turns, px. Default 12. */
  elbow?: number;
  /** The gap between the ring and each label column, px. Default 28. */
  column?: number;
  /** The space above and below the centre the labels may use, px. */
  top: number;
  bottom: number;
  /** A label's line height plus the air it needs, px. Default 20. */
  pitch?: number;
  /** Arcs narrower than this (radians) get no label. Default 0.02. */
  minAngle?: number;
};

/**
 * Outside labels for a ring: a column each side, each label level with the middle of its arc
 * where there is room, and spread apart (`spreadLabels`) where there is not. When a column
 * cannot hold them all, the labels of the narrowest arcs drop out. Returns a placement per
 * labelled arc; arcs that got none are left out.
 */
export function arcLabelLayout(slices: readonly ArcSlice[], { radius, elbow = 12, column = 28, top, bottom, pitch = 20, minAngle = 0.02 }: ArcLabelOptions): ArcLabelPlacement[] {
  const out: ArcLabelPlacement[] = [];
  for (const side of ["right", "left"] as const) {
    const items = slices
      .filter((s) => s.end - s.start >= minAngle && (Math.sin(midAngle(s)) >= 0) === (side === "right"))
      .map((s) => ({ key: s.key, at: polar(midAngle(s), radius + elbow)[1], priority: s.end - s.start, slice: s }));
    const placed = spreadLabels(items, { min: top + pitch / 2, max: bottom - pitch / 2, pitch });
    const dir = side === "right" ? 1 : -1;
    const x = dir * (radius + column);
    for (const item of items) {
      const y = placed.get(item.key);
      if (y === undefined) continue;
      const mid = midAngle(item.slice);
      const [x0, y0] = polar(mid, radius + 3);
      const [x1] = polar(mid, radius + elbow);
      const r = (n: number) => Math.round(n * 100) / 100;
      out.push({ key: item.key, side, x, y, leader: `M${r(x0)},${r(y0)}L${r(x1)},${r(y)}L${r(x - dir * 4)},${r(y)}` });
    }
  }
  return out;
}
