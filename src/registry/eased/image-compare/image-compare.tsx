"use client";

import { animate, motion, useMotionValue, useMotionValueEvent, useTransform, type MotionValue } from "motion/react";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { useInertia } from "../_primitives/inertia-core/use-inertia";
import { useDrag } from "../_primitives/gesture/use-drag";
import { clamp } from "../_primitives/gesture/gesture-math";
import { snappy, useSafeReducedMotion } from "../lib/motion";

export type ImageCompareProps = {
  /** The first layer: left of the divider (or above it when vertical). Any element: an image, a component, a whole theme. */
  before: ReactNode;
  /** The second layer: right of the divider (or below it). It sets the frame's size unless you size the root. */
  after: ReactNode;
  /** Tag over the first layer. `null` hides it. Default "Before". */
  beforeLabel?: ReactNode;
  /** Tag over the second layer. `null` hides it. Default "After". */
  afterLabel?: ReactNode;
  /** Divider position, 0–100 (% of the frame from the start edge). Controlled. */
  value?: number;
  /** Uncontrolled starting position. Default 50. */
  defaultValue?: number;
  /** Called with the position (0–100) whenever the divider comes to rest. */
  onValueChange?: (value: number) => void;
  /** Where a flick may rest, in %. `false` lets every release coast freely. Default `[0, 50, 100]`. */
  snap?: readonly number[] | false;
  /** `horizontal` (default) splits left and right; `vertical` splits top and bottom. */
  orientation?: "horizontal" | "vertical";
  /** Let pointer and keyboard reach the layers' content. Default false: both layers are inert pictures. */
  interactive?: boolean;
  /** Names the slider, e.g. "Compare light and dark theme". Default "Compare". */
  "aria-label"?: string;
  /** Appended to the root's classes. Size the root here when neither layer has an intrinsic size. */
  className?: string;
};

/** Below this release speed (px/s) a drag rests where it was let go instead of coasting. */
const FLICK = 380;
/** A slow release within this share of the frame lands on the snap point. */
const MAGNET = 0.035;
/** Knob radius plus a breath, so the knob never clips at the ends while the line runs on. */
const KNOB_INSET = 22;
/** Pointer-follow for the hover lean: a 2% pull toward the pointer at most. */
const LEAN_MAX = 2;
const LEAN_GAIN = 0.06;
/** How far (px) a label fades over as the divider reaches it. */
const LABEL_FEATHER = 28;
/** Labels' inset from the frame edge, matching `top-3 left-3` below. */
const LABEL_INSET = 12;

const FINE = "(hover: hover) and (pointer: fine)";

/**
 * Two layers of anything, one divider between them. The top layer is cut with `clip-path`
 * from a MotionValue, so dragging never re-renders; a flick coasts to the nearest snap point
 * (0, 50, 100), a slow release rests where it was let go, and the tags fade as the line
 * passes under them. The knob is a keyboard slider.
 */
export function ImageCompare({
  before,
  after,
  beforeLabel = "Before",
  afterLabel = "After",
  value: controlled,
  defaultValue = 50,
  onValueChange,
  snap = [0, 50, 100],
  orientation = "horizontal",
  interactive = false,
  "aria-label": ariaLabel = "Compare",
  className = "",
}: ImageCompareProps) {
  const horizontal = orientation === "horizontal";
  const axis = horizontal ? "x" : "y";
  const reduced = useSafeReducedMotion();
  const start = clamp(controlled ?? defaultValue, 0, 100);

  const root = useRef<HTMLDivElement | null>(null);
  const knob = useRef<HTMLDivElement | null>(null);
  const beforeTag = useRef<HTMLSpanElement | null>(null);
  const afterTag = useRef<HTMLSpanElement | null>(null);

  // The frame's length on the axis, and the tags' extents, measured (0 until mounted).
  const [size, setSize] = useState(0);
  const sizeMv = useMotionValue(0);
  const tagsMv = useMotionValue({ before: 0, after: 0 });

  // px drives the gesture; pct is what everything draws from (SSR-safe before measuring).
  const px = useMotionValue(0);
  const pct = useMotionValue(start);
  const lean = useMotionValue(0);
  const shown = useTransform(() => pct.get() + lean.get());
  const resting = useRef(start);
  const aim = useRef<number | null>(null);

  const [dragging, setDragging] = useState(false);

  const snapPx = snap === false ? undefined : snap.map((p) => (clamp(p, 0, 100) / 100) * size);

  const commit = useCallback(
    (v: number) => {
      const next = Math.round(v * 10) / 10;
      if (next === resting.current) return;
      resting.current = next;
      onValueChange?.(next);
    },
    [onValueChange],
  );

  const inertia = useInertia(px, {
    snap: snapPx,
    min: 0,
    max: size,
    minVelocity: FLICK,
    magnet: size * MAGNET,
    onRest: (v) => commit(size ? (v / size) * 100 : resting.current),
  });

  // px → pct, every frame of a drag or coast.
  useMotionValueEvent(px, "change", (v) => {
    const s = sizeMv.get();
    if (s > 0) pct.set((v / s) * 100);
  });

  // aria-valuenow and valuetext follow the line without re-rendering.
  useMotionValueEvent(pct, "change", (v) => {
    const el = knob.current;
    if (!el) return;
    const p = Math.round(clamp(v, 0, 100));
    el.setAttribute("aria-valuenow", String(p));
    el.setAttribute("aria-valuetext", valueText(p, beforeLabel, afterLabel));
  });

  // Measure the frame and the tags; a resize keeps the divider at the same percentage.
  useLayoutEffect(() => {
    const el = root.current;
    if (!el) return;
    const measure = () => {
      const s = horizontal ? el.clientWidth : el.clientHeight;
      const tag = (t: HTMLElement | null) => (t ? (horizontal ? t.offsetWidth : t.offsetHeight) : 0);
      tagsMv.set({ before: tag(beforeTag.current), after: tag(afterTag.current) });
      if (s === sizeMv.get()) return;
      const p = pct.get();
      sizeMv.set(s);
      setSize(s);
      inertia.stop();
      px.jump((clamp(p, 0, 100) / 100) * s);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    if (beforeTag.current) ro.observe(beforeTag.current);
    if (afterTag.current) ro.observe(afterTag.current);
    return () => ro.disconnect();
  }, [horizontal, inertia, pct, px, sizeMv, tagsMv]);

  // A controlled value that moves on its own glides there.
  useEffect(() => {
    if (controlled === undefined) return;
    const target = clamp(controlled, 0, 100);
    resting.current = target;
    const s = sizeMv.get();
    if (!s) {
      pct.set(target);
      return;
    }
    if (Math.abs((px.get() / s) * 100 - target) < 0.05) return;
    inertia.to((target / 100) * s, { transition: { type: "spring", visualDuration: 0.5, bounce: 0 } });
  }, [controlled, inertia, pct, px, sizeMv]);

  const { ref: dragRef } = useDrag({
    axis,
    value: px,
    min: 0,
    max: size,
    dimension: 24,
    threshold: 3,
    scrollHandoff: false,
    disabled: size === 0,
    onDragStart: () => {
      inertia.stop();
      setDragging(true);
      animate(lean, 0, reduced ? { duration: 0 } : snappy);
    },
    onRelease: ({ velocity }) => {
      setDragging(false);
      inertia.release(velocity);
      return false;
    },
  });

  const setRoot = useCallback(
    (el: HTMLDivElement | null) => {
      root.current = el;
      return dragRef(el);
    },
    [dragRef],
  );

  const pointerPct = (e: { clientX: number; clientY: number }) => {
    const r = root.current?.getBoundingClientRect();
    if (!r) return null;
    return clamp(horizontal ? ((e.clientX - r.left) / r.width) * 100 : ((e.clientY - r.top) / r.height) * 100, 0, 100);
  };

  // A finger that lands mid-coast catches the line where it is.
  const onPointerDownCapture = () => {
    if (inertia.isAnimating()) inertia.stop();
  };

  // A tap on the frame sends the line there (a drag never also clicks).
  const onClick = (e: ReactMouseEvent) => {
    if (!size || (knob.current && knob.current.contains(e.target as Node))) return;
    const p = pointerPct(e);
    if (p === null) return;
    inertia.to((p / 100) * size, { transition: { type: "spring", visualDuration: 0.42, bounce: 0.1 } });
  };

  // Under a fine pointer, the line leans a little toward it before a drag starts.
  const onPointerMove = (e: ReactPointerEvent) => {
    if (reduced || dragging || e.pointerType !== "mouse" || !window.matchMedia(FINE).matches) return;
    const p = pointerPct(e);
    if (p === null) return;
    const d = p - pct.get();
    animate(lean, Math.sign(d) * Math.min(Math.abs(d) * LEAN_GAIN, LEAN_MAX), snappy);
  };
  const onPointerLeave = () => {
    animate(lean, 0, reduced ? { duration: 0 } : snappy);
  };

  const onKeyDown = (e: ReactKeyboardEvent) => {
    const big = e.shiftKey ? 10 : 1;
    const back = horizontal ? "ArrowLeft" : "ArrowUp";
    const fwd = horizontal ? "ArrowRight" : "ArrowDown";
    // Held or repeated keys step from where the line is heading, not where it is mid-glide.
    const here = size ? (px.get() / size) * 100 : pct.get();
    const now = clamp(Math.round(inertia.isAnimating() && aim.current !== null ? aim.current : here), 0, 100);
    const next =
      e.key === back || (horizontal ? e.key === "ArrowDown" : e.key === "ArrowLeft") ? now - big
      : e.key === fwd || (horizontal ? e.key === "ArrowUp" : e.key === "ArrowRight") ? now + big
      : e.key === "PageDown" ? now - 10
      : e.key === "PageUp" ? now + 10
      : e.key === "Home" ? 0
      : e.key === "End" ? 100
      : undefined;
    if (next === undefined) return;
    e.preventDefault();
    const target = clamp(next, 0, 100);
    if (!size) return;
    aim.current = target;
    inertia.to((target / 100) * size, { transition: snappy });
  };

  const clip = useTransform(() => {
    const cut = 100 - clamp(shown.get(), 0, 100);
    return horizontal ? `inset(0 ${cut}% 0 0)` : `inset(0 0 ${cut}% 0)`;
  });
  const lineShift = useTransform(() => `${shown.get()}%`);
  // The knob rides the line but stops short of the ends so it never clips.
  const knobShift = useTransform(() => {
    const s = sizeMv.get();
    if (!s) return `${shown.get()}%`;
    return `${clamp((shown.get() / 100) * s, KNOB_INSET, s - KNOB_INSET)}px`;
  });

  // Each tag fades out as the line approaches it, and back as the line moves on.
  const beforeOpacity = useTagOpacity(shown, sizeMv, tagsMv, "before");
  const afterOpacity = useTagOpacity(shown, sizeMv, tagsMv, "after");

  const startPct = Math.round(start);
  const layer = "[grid-area:1/1] min-w-0 min-h-0";
  const tag =
    "pointer-events-none absolute inline-flex h-6 items-center rounded-control-xs bg-surface-raised/85 px-2 text-ui-xs font-medium text-text shadow-resting backdrop-blur-sm";

  return (
    <div
      ref={setRoot}
      onPointerDownCapture={onPointerDownCapture}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      onClick={onClick}
      data-orientation={orientation}
      data-dragging={dragging || undefined}
      className={`relative grid min-w-0 overflow-hidden select-none ${horizontal ? "cursor-ew-resize" : "cursor-ns-resize"} ${className}`}
    >
      <div className={layer} inert={!interactive}>
        {after}
      </div>
      <motion.div className={`${layer} relative`} style={{ clipPath: clip }} inert={!interactive}>
        {before}
      </motion.div>

      {beforeLabel !== null && (
        <motion.span ref={beforeTag} aria-hidden className={`${tag} top-3 left-3`} style={{ opacity: beforeOpacity }}>
          {beforeLabel}
        </motion.span>
      )}
      {afterLabel !== null && (
        <motion.span
          ref={afterTag}
          aria-hidden
          className={`${tag} ${horizontal ? "top-3 right-3" : "bottom-3 left-3"}`}
          style={{ opacity: afterOpacity }}
        >
          {afterLabel}
        </motion.span>
      )}

      {/* The line: a full-frame layer translated by the position, so % is of the frame. */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={horizontal ? { x: lineShift } : { y: lineShift }}
      >
        <div
          className={`absolute bg-(--compare-line,var(--eased-surface-raised)) shadow-thumb ${
            horizontal ? "inset-y-0 left-0 w-0.5 -translate-x-1/2" : "inset-x-0 top-0 h-0.5 -translate-y-1/2"
          }`}
        />
      </motion.div>

      <motion.div
        className={`pointer-events-none absolute ${horizontal ? "inset-y-0 left-0" : "inset-x-0 top-0"}`}
        style={horizontal ? { x: knobShift } : { y: knobShift }}
      >
        <motion.div
          ref={knob}
          role="slider"
          tabIndex={0}
          aria-label={ariaLabel}
          aria-orientation={orientation}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={startPct}
          aria-valuetext={valueText(startPct, beforeLabel, afterLabel)}
          onKeyDown={onKeyDown}
          animate={{ scale: dragging && !reduced ? 0.92 : 1 }}
          transition={snappy}
          className={`pointer-events-auto absolute flex size-9 items-center justify-center rounded-pill border border-line bg-surface-raised text-text-secondary shadow-floating focus-ring ${
            horizontal ? "top-1/2 -mt-[18px] -ml-[18px]" : "left-1/2 -mt-[18px] -ml-[18px]"
          } ${dragging ? "cursor-grabbing" : horizontal ? "cursor-ew-resize" : "cursor-ns-resize"}`}
        >
          <svg
            viewBox="0 0 16 16"
            className={`size-4 ${horizontal ? "" : "rotate-90"}`}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M5.5 4.5 2 8l3.5 3.5M10.5 4.5 14 8l-3.5 3.5" />
          </svg>
        </motion.div>
      </motion.div>
    </div>
  );
}

function plain(label: ReactNode, fallback: string) {
  return typeof label === "string" || typeof label === "number" ? String(label) : fallback;
}

function valueText(p: number, beforeLabel: ReactNode, afterLabel: ReactNode) {
  return `${p}% ${plain(beforeLabel, "before")}, ${100 - p}% ${plain(afterLabel, "after")}`;
}

function useTagOpacity(
  shown: MotionValue<number>,
  size: MotionValue<number>,
  tags: MotionValue<{ before: number; after: number }>,
  which: "before" | "after",
) {
  return useTransform(() => {
    const s = size.get();
    if (!s) return 1;
    const line = (shown.get() / 100) * s;
    const extent = tags.get()[which];
    // The before tag sits at the start edge: it hides as the line comes back over it.
    // The after tag sits at the end edge: it hides as the line moves out over it.
    const gap = which === "before" ? line - (LABEL_INSET + extent) : s - LABEL_INSET - extent - line;
    return clamp(gap / LABEL_FEATHER, 0, 1);
  });
}
