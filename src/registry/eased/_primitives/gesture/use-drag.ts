"use client";

import { animate, useMotionValue, type AnimationPlaybackControls, type MotionValue, type Transition } from "motion/react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { isEditable } from "../../lib/dom";
import { instant, smooth, useSafeReducedMotion } from "../../lib/motion";
import {
  DECELERATION,
  RUBBER_BAND,
  clamp,
  createVelocityTracker,
  nearest,
  project,
  rubberbandClamp,
  rubberbandUnclamp,
} from "./gesture-math";

export type DragAxis = "x" | "y";

export type DragInfo = {
  /** The displayed position, after rubber-banding. */
  value: number;
  /** Pointer travel along the axis since the drag started. */
  offset: number;
  /** Pointer velocity along the axis, px/s. */
  velocity: number;
  /** Where a release right now would carry the element: `value` plus the velocity projection. */
  projected: number;
};

export type DragReleaseInfo = DragInfo & {
  /** The snap point the release picked, or -1 without snap points. */
  index: number;
  /** The position the release will settle at. */
  target: number;
};

export type UseDragOptions = {
  /** The axis the element moves on. Default "y". The other axis is left to the page. */
  axis?: DragAxis;
  /** Drive your own MotionValue instead of the one the hook creates. */
  value?: MotionValue<number>;
  /** Positions (px) a release settles on, chosen by velocity projection. */
  snapPoints?: readonly number[];
  /** Uncontrolled starting snap point. Default 0. */
  defaultIndex?: number;
  /** Controlled snap point. Changing it animates there. */
  index?: number;
  /** Called when a release, a key or `snapTo` picks a new snap point. */
  onIndexChange?: (index: number) => void;
  /** Hard ends. Default: the lowest and highest snap point, or unbounded without snap points. */
  min?: number;
  max?: number;
  /** Resist past `min`/`max` with Apple's rubber-band (true, default), a custom constant, or clamp (false). */
  rubberBand?: boolean | number;
  /** The distance the rubber-band flattens toward. Default: the element's size on the axis. */
  dimension?: number;
  /** Friction for velocity projection. Default `DECELERATION.normal` (0.998); pagers want `fast`. */
  decelerationRate?: number;
  /** Without snap points, keep gliding after release (Motion inertia) instead of stopping. Default false. */
  momentum?: boolean;
  /** Pointer travel (px) before a press becomes a drag, so taps and clicks still work. Default 4. */
  threshold?: number;
  /**
   * Hand scrolling over to the drag, as an iOS sheet does: inside a scroller on the same axis,
   * the content scrolls until it reaches its start, then the same pull drags the element.
   * Give the scroller `overscroll-behavior: contain`. Default true.
   */
  scrollHandoff?: boolean;
  /** CSS touch-action the hook sets on the element. Default "pan-x" for y, "pan-y" for x; false leaves it alone. */
  touchAction?: string | false;
  disabled?: boolean;
  /** How a release settles. Default the smooth spring, carrying the release velocity. */
  transition?: Transition;
  onDragStart?: (info: DragInfo) => void;
  onDrag?: (info: DragInfo) => void;
  /**
   * Called on release before the element settles. Return a snap index to go there instead,
   * or `false` to skip settling and animate the value yourself.
   */
  onRelease?: (info: DragReleaseInfo) => number | false | void;
  onDragEnd?: (info: DragReleaseInfo) => void;
};

export type UseDrag = {
  /** Attach to the draggable element. */
  ref: (el: HTMLElement | null) => () => void;
  /** The position. Bind it to `style.x` or `style.y`. */
  value: MotionValue<number>;
  /** True while a pointer drags the element. */
  dragging: boolean;
  /** The current snap point, or -1 without snap points. */
  index: number;
  /** Animate to a snap point. `immediate` jumps (layout changes, reduced motion). */
  snapTo: (index: number, immediate?: boolean) => void;
  /**
   * Put on the element's keyboard handle (a button or slider): arrows step between snap points
   * in screen order, Home and End jump to the ends.
   */
  onKeyDown: (e: ReactKeyboardEvent) => void;
};

type Session = {
  id: number;
  type: string;
  startX: number;
  startY: number;
  phase: "pending" | "dragging" | "ignored";
  scroller: HTMLElement | null;
  /** The release animation this press interrupted, if any. */
  interrupted: boolean;
  dragStart: number;
  origin: number;
  dimension: number;
  last: DragInfo;
};

const scrollPos = (el: HTMLElement, axis: DragAxis) => (axis === "y" ? el.scrollTop : Math.abs(el.scrollLeft));

/** The nearest element between `from` and `root` that scrolls on `axis`. */
function findScroller(from: EventTarget | null, root: HTMLElement, axis: DragAxis) {
  let el = from instanceof Element ? from : null;
  while (el && el !== root) {
    if (el instanceof HTMLElement) {
      const overflow = getComputedStyle(el)[axis === "y" ? "overflowY" : "overflowX"];
      const scrolls = axis === "y" ? el.scrollHeight > el.clientHeight + 1 : el.scrollWidth > el.clientWidth + 1;
      if (scrolls && /auto|scroll|overlay/.test(overflow)) return el;
    }
    el = el.parentElement;
  }
  return null;
}

/**
 * Eased's drag gesture: one axis, Apple's rubber-band past the ends, velocity projection onto
 * snap points, scroll handoff, and a release that carries the finger's velocity into a spring.
 * Built on Motion values and Motion's spring and inertia animations, so a drag can catch an
 * element mid-flight and any Motion style can read it.
 *
 *   const drag = useDrag({ snapPoints: [0, 240, 400] });
 *   <motion.div ref={drag.ref} style={{ y: drag.value }} />
 */
export function useDrag(options: UseDragOptions = {}): UseDrag {
  const {
    axis = "y",
    snapPoints,
    defaultIndex = 0,
    index: controlledIndex,
    touchAction,
  } = options;
  const reduced = useSafeReducedMotion();
  const own = useMotionValue(snapPoints?.[controlledIndex ?? defaultIndex] ?? 0);
  const value = options.value ?? own;

  const [dragging, setDragging] = useState(false);
  const [index, setIndex] = useState(snapPoints ? (controlledIndex ?? defaultIndex) : -1);

  // Listeners are bound once per element; they read the latest options from here.
  const opts = useRef(options);
  const motion = useRef({ reduced, value });
  // Layout effect, so a press straight after a render already sees the new options.
  useLayoutEffect(() => {
    opts.current = options;
    motion.current = { reduced, value };
  });

  const current = useRef(index);
  const anim = useRef<AnimationPlaybackControls | null>(null);
  const session = useRef<Session | null>(null);

  const bounds = useCallback(() => {
    const o = opts.current;
    const pts = o.snapPoints ?? [];
    const min = o.min ?? (pts.length ? Math.min(...pts) : -Infinity);
    const max = o.max ?? (pts.length ? Math.max(...pts) : Infinity);
    return { min, max };
  }, []);

  const settle = useCallback((target: number, velocity = 0, immediate = false) => {
    const { reduced, value } = motion.current;
    anim.current?.stop();
    if (immediate) {
      value.jump(target);
      return;
    }
    anim.current = animate(value, target, { ...(reduced ? instant : (opts.current.transition ?? smooth)), velocity });
  }, []);

  // Set below, once snapTo exists: re-syncs to a controlled index the parent did not accept.
  const resync = useRef<() => void>(() => {});

  const choose = useCallback((next: number) => {
    if (next === current.current) return;
    current.current = next;
    setIndex(next);
    opts.current.onIndexChange?.(next);
    // Controlled: if the parent keeps its old index, go back to it.
    if (opts.current.index !== undefined) requestAnimationFrame(() => resync.current());
  }, []);

  const snapTo = useCallback(
    (next: number, immediate = false) => {
      const pts = opts.current.snapPoints;
      if (!pts?.length) return;
      const i = clamp(Math.round(next), 0, pts.length - 1);
      choose(i);
      settle(pts[i], 0, immediate || motion.current.reduced);
    },
    [choose, settle],
  );

  // A controlled index that moves on its own animates there (never under a finger).
  useEffect(() => {
    resync.current = () => {
      const want = opts.current.index;
      if (want === undefined || want === current.current || session.current?.phase === "dragging") return;
      snapTo(want);
    };
  }, [snapTo]);
  useEffect(() => {
    resync.current();
  }, [controlledIndex]);

  // Snap points that move (a resize, a measured container) carry the element with them.
  const pointsKey = snapPoints?.join(",") ?? "";
  useEffect(() => {
    const pts = opts.current.snapPoints;
    if (!pts?.length || session.current?.phase === "dragging") return;
    const i = clamp(current.current, 0, pts.length - 1);
    if (current.current < 0) choose(i);
    if (anim.current?.state !== "running") motion.current.value.jump(pts[i]);
    else settle(pts[i]);
  }, [pointsKey, choose, settle]);

  const ref = useCallback(
    (el: HTMLElement | null) => {
      if (!el) return () => {};
      const ax = opts.current.axis ?? "y";
      const action = opts.current.touchAction ?? (ax === "y" ? "pan-x" : "pan-y");
      if (action !== false) el.style.touchAction = action;

      const tracker = createVelocityTracker();
      let restoreSelect = "";

      const infoFor = (s: Session, pointer: number): DragInfo => {
        const o = opts.current;
        const { min, max } = bounds();
        const raw = s.origin + (pointer - s.dragStart);
        const band = o.rubberBand ?? true;
        const shown =
          band === false ? clamp(raw, min, max) : rubberbandClamp(raw, min, max, s.dimension, band === true ? RUBBER_BAND : band);
        const velocity = tracker.velocity();
        return { value: shown, offset: pointer - s.dragStart, velocity, projected: shown + project(velocity, o.decelerationRate ?? DECELERATION.normal) };
      };

      // The scroller keeps the gesture while it has content to scroll back to, or while the
      // element is already at its far end; otherwise the pull drags the element.
      const scrollerWins = (scroller: HTMLElement, dir: number) => {
        if (scrollPos(scroller, ax) > 1) return true;
        if (dir > 0) return false;
        return motion.current.value.get() <= bounds().min + 0.5;
      };

      const begin = (s: Session, pointer: number) => {
        const o = opts.current;
        const { min, max } = bounds();
        const band = o.rubberBand ?? true;
        s.phase = "dragging";
        s.dragStart = pointer;
        s.dimension = o.dimension ?? (ax === "y" ? el.offsetHeight : el.offsetWidth);
        s.origin =
          band === false ? motion.current.value.get() : rubberbandUnclamp(motion.current.value.get(), min, max, s.dimension, band === true ? RUBBER_BAND : band);
        anim.current?.stop();
        tracker.reset();
        tracker.add(pointer);
        restoreSelect = document.documentElement.style.userSelect;
        document.documentElement.style.userSelect = "none";
        window.getSelection()?.removeAllRanges();
        el.style.willChange = "transform";
        setDragging(true);
        s.last = infoFor(s, pointer);
        o.onDragStart?.(s.last);
      };

      const finish = (s: Session, cancelled: boolean) => {
        const o = opts.current;
        const pts = o.snapPoints ?? [];
        const { min, max } = bounds();
        document.documentElement.style.userSelect = restoreSelect;
        el.style.willChange = "";
        setDragging(false);

        // A drag is never also a click on whatever it started on.
        const swallow = (e: MouseEvent) => {
          e.stopPropagation();
          e.preventDefault();
        };
        window.addEventListener("click", swallow, { capture: true, once: true });
        window.setTimeout(() => window.removeEventListener("click", swallow, { capture: true }), 0);

        const info = s.last;
        const velocity = cancelled ? 0 : info.velocity;
        const projected = info.value + project(velocity, o.decelerationRate ?? DECELERATION.normal);
        let target = clamp(info.value, min, max);
        let i = -1;
        if (pts.length) {
          i = nearest(projected, pts);
          target = pts[i];
        }
        const release: DragReleaseInfo = { ...info, velocity, projected, index: i, target };
        const override = o.onRelease?.(release);
        if (override === false) {
          o.onDragEnd?.(release);
          return;
        }
        if (typeof override === "number" && pts.length) {
          release.index = clamp(override, 0, pts.length - 1);
          release.target = pts[release.index];
        }
        if (release.index >= 0) choose(release.index);

        // Out of bounds, the spring pulls back without the outward velocity.
        const inside = info.value >= min && info.value <= max;
        if (!pts.length && o.momentum && inside && !motion.current.reduced) {
          anim.current?.stop();
          const rate = o.decelerationRate ?? DECELERATION.normal;
          anim.current = animate(motion.current.value, info.value, {
            type: "inertia",
            velocity,
            power: rate / (1 - rate) / 1000,
            timeConstant: 325,
            min: Number.isFinite(min) ? min : undefined,
            max: Number.isFinite(max) ? max : undefined,
            bounceStiffness: 520,
            bounceDamping: 38,
          });
        } else settle(release.target, inside ? velocity : 0);
        o.onDragEnd?.(release);
      };

      const onMove = (e: PointerEvent) => {
        const s = session.current;
        if (!s || e.pointerId !== s.id || s.phase === "ignored") return;
        const dx = e.clientX - s.startX;
        const dy = e.clientY - s.startY;
        const main = ax === "y" ? dy : dx;
        const cross = ax === "y" ? dx : dy;
        const pointer = ax === "y" ? e.clientY : e.clientX;

        if (s.phase === "pending") {
          const threshold = opts.current.threshold ?? 4;
          // A touch inside a scroller is decided on its first move, before the browser commits
          // to scrolling; everything else waits for the threshold so taps stay taps.
          const decideNow = s.scroller && s.type === "touch" && (main !== 0 || cross !== 0);
          if (!decideNow && Math.abs(main) < threshold) {
            if (Math.abs(cross) >= threshold) s.phase = "ignored";
            return;
          }
          if (Math.abs(cross) > Math.abs(main)) {
            s.phase = "ignored";
            return;
          }
          if (s.scroller && scrollerWins(s.scroller, Math.sign(main))) {
            s.phase = "ignored";
            return;
          }
          begin(s, pointer);
          return;
        }

        tracker.add(pointer);
        s.last = infoFor(s, pointer);
        motion.current.value.set(s.last.value);
        opts.current.onDrag?.(s.last);
      };

      const end = (e: PointerEvent) => {
        const s = session.current;
        if (!s || e.pointerId !== s.id) return;
        session.current = null;
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", end);
        window.removeEventListener("pointercancel", end);
        el.removeEventListener("touchmove", onTouchMove);
        if (s.phase === "dragging") {
          tracker.add(ax === "y" ? e.clientY : e.clientX);
          if (e.type === "pointerup") s.last = { ...s.last, velocity: tracker.velocity() };
          finish(s, e.type === "pointercancel");
        } else if (s.interrupted) {
          // A tap that caught the element mid-flight lets it finish where it was going.
          const pts = opts.current.snapPoints;
          const v = motion.current.value;
          if (pts?.length && current.current >= 0) settle(pts[current.current], v.getVelocity());
          else {
            const { min, max } = bounds();
            const inside = clamp(v.get(), min, max);
            if (inside !== v.get()) settle(inside, v.getVelocity());
          }
        }
      };

      const onDown = (e: PointerEvent) => {
        const o = opts.current;
        if (o.disabled || session.current) return;
        if (e.pointerType === "mouse" && e.button !== 0) return;
        if (isEditable(e.target) || (e.target instanceof Element && e.target.closest("[data-drag-ignore]"))) return;
        const interrupted = anim.current?.state === "running";
        if (interrupted) anim.current?.stop();
        session.current = {
          id: e.pointerId,
          type: e.pointerType,
          startX: e.clientX,
          startY: e.clientY,
          phase: "pending",
          scroller: (o.scrollHandoff ?? true) ? findScroller(e.target, el, ax) : null,
          interrupted,
          dragStart: 0,
          origin: 0,
          dimension: 1,
          last: { value: motion.current.value.get(), offset: 0, velocity: 0, projected: motion.current.value.get() },
        };
        window.addEventListener("pointermove", onMove);
        window.addEventListener("pointerup", end);
        window.addEventListener("pointercancel", end);
        // Non-passive only while a finger is down (pointerdown fires before touchstart, so it is
        // in place for this gesture); an idle element keeps compositor-threaded scrolling.
        if (e.pointerType === "touch") el.addEventListener("touchmove", onTouchMove, { passive: false });
      };

      // Touch scrolling is only cancellable from touchmove: once a pull is claimed as a drag,
      // the scroller under it must not also scroll or overscroll.
      const onTouchMove = (e: TouchEvent) => {
        if (session.current?.phase === "dragging" && e.cancelable) e.preventDefault();
      };

      el.addEventListener("pointerdown", onDown);
      return () => {
        el.removeEventListener("pointerdown", onDown);
        el.removeEventListener("touchmove", onTouchMove);
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", end);
        window.removeEventListener("pointercancel", end);
        // Torn down mid-drag (unmount, or a new axis): give the page its selection back and
        // put the element back on a resting point.
        if (session.current?.phase === "dragging") {
          document.documentElement.style.userSelect = restoreSelect;
          el.style.willChange = "";
          setDragging(false);
          const pts = opts.current.snapPoints;
          const { min, max } = bounds();
          const v = motion.current.value;
          settle(pts?.length && current.current >= 0 ? pts[current.current] : clamp(v.get(), min, max), 0, true);
        }
        session.current = null;
      };
    },
    // Re-bind only when the axis or touch-action changes; everything else is read live.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [axis, touchAction === false ? "off" : (touchAction ?? ""), bounds, choose, settle],
  );

  useEffect(() => () => anim.current?.stop(), []);

  const onKeyDown = useCallback(
    (e: ReactKeyboardEvent) => {
      const pts = opts.current.snapPoints;
      if (!pts?.length) return;
      const ax = opts.current.axis ?? "y";
      const back = ax === "y" ? "ArrowUp" : "ArrowLeft";
      const forward = ax === "y" ? "ArrowDown" : "ArrowRight";
      // Screen order, so "up" always means toward the top whatever order the points are in.
      const order = pts.map((_, i) => i).sort((a, b) => pts[a] - pts[b]);
      const at = Math.max(0, order.indexOf(current.current));
      const to =
        e.key === back ? order[Math.max(0, at - 1)]
        : e.key === forward ? order[Math.min(order.length - 1, at + 1)]
        : e.key === "Home" ? order[0]
        : e.key === "End" ? order[order.length - 1]
        : undefined;
      if (to === undefined) return;
      e.preventDefault();
      snapTo(to);
    },
    [snapTo],
  );

  return { ref, value, dragging, index, snapTo, onKeyDown };
}
