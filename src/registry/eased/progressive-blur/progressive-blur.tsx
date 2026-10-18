"use client";

import { motion, useMotionValue, type MotionValue } from "motion/react";
import { useEffect, useLayoutEffect, useState, type CSSProperties, type RefObject } from "react";
import { BlurStack, observeScrollContent, type BlurSide } from "../_primitives/scroll-fade/scroll-fade";

export type ProgressiveBlurProps = {
  /** The edge the blur is strongest at; it sits flush against that edge of its positioned parent. Default "top". */
  side?: BlurSide;
  /** How far the ramp reaches in from the edge, px. Default 80. */
  size?: number;
  /** Blur at the edge, px. Default 20. */
  maxBlur?: number;
  /** Stacked layers; more is smoother and costs more. Default 6. */
  layers?: number;
  /** Lay a surface-coloured scrim under the ramp so text over busy content stays legible. Default true. */
  tint?: boolean;
  /**
   * Scroll-linked strength: the blur fades in as content scrolls under the edge and is gone
   * when nothing is there (top: scrolled to the start; bottom: scrolled to the end). A ref or
   * the element itself; a ref whose scroller mounts later links on the next render, and an
   * element held in state (from a callback ref) links as soon as it exists.
   */
  scrollRef?: RefObject<HTMLElement | null> | HTMLElement | null;
  /** Scroll distance (px) over which a scroll-linked blur reaches full strength. Default `size`. */
  scrollRange?: number;
  /** Manual strength, 0–1, when there is no `scrollRef`. Default 1. */
  strength?: number | MotionValue<number>;
  /** Position and stacking, e.g. `z-10`. Do not set opacity, filter or mask here: they blank the blur. */
  className?: string;
};

const PLACE: Record<BlurSide, string> = {
  top: "inset-x-0 top-0",
  bottom: "inset-x-0 bottom-0",
  left: "inset-y-0 left-0",
  right: "inset-y-0 right-0",
};

const TINT: Record<BlurSide, string> = {
  top: "bg-linear-to-b",
  bottom: "bg-linear-to-t",
  left: "bg-linear-to-r",
  right: "bg-linear-to-l",
};

/**
 * Progressive Blur: a blur that ramps from nothing to `maxBlur` over `size` px toward an edge,
 * built from stacked masked backdrop layers, for headers, bottom bars and composers. Linked to a
 * scroller, it only appears once there is content underneath to blur.
 */
export function ProgressiveBlur({
  side = "top",
  size = 80,
  maxBlur = 20,
  layers = 6,
  tint = true,
  scrollRef,
  scrollRange,
  strength = 1,
  className = "",
}: ProgressiveBlurProps) {
  const linked = useMotionValue(scrollRef ? 0 : 1);
  const range = scrollRange ?? size;

  // Resolve the scroller after commit, so a ref filled by a later-mounting scroller still links.
  const [el, setEl] = useState<HTMLElement | null>(null);
  // No deps on purpose: a ref's `.current` changes without a render to key on.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useLayoutEffect(() => {
    const next = scrollRef instanceof HTMLElement ? scrollRef : (scrollRef?.current ?? null);
    if (next !== el) setEl(next);
  });

  useEffect(() => {
    if (!el) return;
    const update = () => {
      const vertical = side === "top" || side === "bottom";
      const pos = vertical ? el.scrollTop : Math.abs(el.scrollLeft);
      const max = vertical ? el.scrollHeight - el.clientHeight : el.scrollWidth - el.clientWidth;
      const under = side === "top" || side === "left" ? pos : max - pos;
      linked.set(Math.min(1, Math.max(0, under / range)));
    };
    update();
    el.addEventListener("scroll", update, { passive: true });
    const unobserve = observeScrollContent(el, update);
    return () => {
      el.removeEventListener("scroll", update);
      unobserve();
    };
  }, [el, side, range, linked]);

  const level = scrollRef ? linked : strength;
  const extent: CSSProperties = side === "top" || side === "bottom" ? { height: size } : { width: size };

  return (
    <div aria-hidden className={`pointer-events-none absolute ${PLACE[side]} ${className}`} style={extent}>
      {tint && <motion.div className={`absolute inset-0 ${TINT[side]} from-surface/75 via-surface/30 to-transparent`} style={{ opacity: level }} />}
      <BlurStack side={side} layers={layers} maxBlur={maxBlur} strength={level} />
    </div>
  );
}
