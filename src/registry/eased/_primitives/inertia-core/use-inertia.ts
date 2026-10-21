"use client";

import { animate, type AnimationPlaybackControls, type MotionValue, type Transition } from "motion/react";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { useSafeReducedMotion } from "../../lib/motion";
import { DECELERATION, clamp, nearest, project } from "../gesture/gesture-math";

/**
 * Where a coast is allowed to stop: a list of points, a step (every multiple of it, from
 * `min` or 0), or a function that rounds a resting position.
 */
export type InertiaSnap = readonly number[] | number | ((resting: number) => number);

export type InertiaOptions = {
  /** Resting points. Unset: the coast stops wherever friction leaves it. */
  snap?: InertiaSnap;
  /** Hard ends. The coast never rests past them. */
  min?: number;
  max?: number;
  /** UIScrollView friction per ms. Default `DECELERATION.normal` (0.998); wheels and pagers want `fast`. */
  decelerationRate?: number;
  /**
   * Below this release speed (px/s) a flick does not coast: the value rests where it was let go,
   * unless it is within `magnet` of a snap point. Default 0 (every release coasts).
   */
  minVelocity?: number;
  /** A slow release this close (px) to a snap point is pulled onto it. Default 0. */
  magnet?: number;
  /**
   * How the value travels to its resting point. `"spring"` (default) rides `transition`
   * carrying the release velocity; `"decay"` is iOS scroll friction that eases onto the point
   * (releases below `minVelocity` still settle on the spring).
   */
  mode?: "spring" | "decay";
  /** The spring for `"spring"` mode. Default a smooth spring that carries velocity. */
  transition?: Transition;
  /** Called once the value has come to rest, with where it rests. */
  onRest?: (value: number) => void;
};

const coast = { type: "spring", visualDuration: 0.45, bounce: 0.08 } as const;

/** Rounds `value` onto `snap`, inside `[min, max]`. */
export function resolveSnap(value: number, snap: InertiaSnap | undefined, min = -Infinity, max = Infinity) {
  const inside = clamp(value, min, max);
  if (snap === undefined) return inside;
  if (typeof snap === "function") return clamp(snap(inside), min, max);
  if (typeof snap === "number") {
    if (snap <= 0) return inside;
    const origin = Number.isFinite(min) ? min : 0;
    return clamp(origin + Math.round((inside - origin) / snap) * snap, min, max);
  }
  if (!snap.length) return inside;
  return clamp(snap[nearest(inside, snap)], min, max);
}

/**
 * Where a release at `position` moving at `velocity` (px/s) comes to rest: the snap point
 * nearest to where friction would carry it, not the one nearest the finger. Pure, so a
 * component can show the destination (a label, a tick) before the value gets there.
 */
export function inertiaTarget(position: number, velocity: number, options: InertiaOptions = {}) {
  const { snap, min = -Infinity, max = Infinity, decelerationRate = DECELERATION.normal, minVelocity = 0, magnet = 0 } = options;
  if (Math.abs(velocity) < minVelocity) {
    const resting = clamp(position, min, max);
    if (snap === undefined || magnet <= 0) return resting;
    const snapped = resolveSnap(resting, snap, min, max);
    return Math.abs(snapped - resting) <= magnet ? snapped : resting;
  }
  return resolveSnap(position + project(velocity, decelerationRate), snap, min, max);
}

export type UseInertia = {
  /**
   * Release the value with a velocity (px/s): it coasts and rests on a snap point inside the
   * bounds. Returns the resting position. Per-call options override the hook's.
   */
  release: (velocity: number, options?: InertiaOptions) => number;
  /** Animate to a position, carrying an optional velocity (keyboard steps, clicks, controlled values). */
  to: (target: number, options?: { velocity?: number; transition?: Transition; immediate?: boolean }) => void;
  /** Stop wherever the value is, e.g. when a finger catches it mid-coast. */
  stop: () => void;
  /** True while a coast or `to` animation runs. */
  isAnimating: () => boolean;
};

/**
 * Momentum for a MotionValue that something else drags: hand it the release velocity and it
 * coasts, with UIScrollView friction, to the snap point the flick would reach. Pairs with
 * `useDrag({ onRelease: () => false })` from the gesture kit. Under reduced motion every
 * release and `to` jumps straight to its resting point.
 *
 *   const inertia = useInertia(x, { snap: [0, 160, 320], min: 0, max: 320 });
 *   useDrag({ value: x, onRelease: ({ value, velocity }) => (inertia.release(velocity), false) });
 */
export function useInertia(value: MotionValue<number>, options: InertiaOptions = {}): UseInertia {
  const reduced = useSafeReducedMotion();
  const opts = useRef(options);
  const live = useRef({ value, reduced });
  useLayoutEffect(() => {
    opts.current = options;
    live.current = { value, reduced };
  });
  const anim = useRef<AnimationPlaybackControls | null>(null);

  const stop = useCallback(() => {
    anim.current?.stop();
    anim.current = null;
  }, []);

  const finish = useCallback((controls: AnimationPlaybackControls, onRest?: (v: number) => void) => {
    anim.current = controls;
    controls.finished.then(() => {
      if (anim.current !== controls) return;
      anim.current = null;
      onRest?.(live.current.value.get());
    });
  }, []);

  const to = useCallback<UseInertia["to"]>(
    (target, { velocity = 0, transition, immediate } = {}) => {
      const { value, reduced } = live.current;
      stop();
      if (immediate || reduced) {
        value.jump(target);
        opts.current.onRest?.(target);
        return;
      }
      finish(animate(value, target, { ...(transition ?? opts.current.transition ?? coast), velocity }), opts.current.onRest);
    },
    [finish, stop],
  );

  const release = useCallback<UseInertia["release"]>(
    (velocity, override) => {
      const o = { ...opts.current, ...override };
      const { value, reduced } = live.current;
      const from = value.get();
      const target = inertiaTarget(from, velocity, o);
      stop();
      if (reduced) {
        value.jump(target);
        o.onRest?.(target);
        return target;
      }
      // Released past an end: pull back without the outward velocity.
      const outside = from < (o.min ?? -Infinity) || from > (o.max ?? Infinity);
      const v = outside && Math.sign(velocity) === Math.sign(from - target) ? 0 : velocity;
      // A release slower than `minVelocity` has nothing to coast on: the spring settles it.
      if (o.mode === "decay" && Math.abs(velocity) >= (o.minVelocity ?? 0)) {
        const rate = o.decelerationRate ?? DECELERATION.normal;
        // Inertia only reads the origin, but Motion skips any animation whose keyframes are
        // all equal, so the keyframe must be the target rather than `from`.
        finish(
          animate(value, target, {
            type: "inertia",
            velocity: v,
            power: rate / (1 - rate) / 1000,
            timeConstant: 240,
            restDelta: 0.5,
            modifyTarget: () => target,
            min: o.min,
            max: o.max,
            bounceStiffness: 520,
            bounceDamping: 38,
          }),
          o.onRest,
        );
      } else {
        finish(animate(value, target, { ...(o.transition ?? coast), velocity: v }), o.onRest);
      }
      return target;
    },
    [finish, stop],
  );

  const isAnimating = useCallback(() => anim.current?.state === "running", []);

  useEffect(() => stop, [stop]);

  return useMemo(() => ({ release, to, stop, isAnimating }), [release, to, stop, isAnimating]);
}

export { DECELERATION } from "../gesture/gesture-math";
