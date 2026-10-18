"use client";

import { animate, useInView, useMotionValue } from "motion/react";
import { useEffect, type RefObject } from "react";
import { ease } from "../../lib/motion";

export type DrawInOptions = {
  reduced?: boolean;
  /** Seconds. Default 0.9: a chart is read left to right, so it is drawn at reading pace. */
  duration?: number;
  delay?: number;
  /** Share of the chart that must be on screen. Default 0.35. */
  amount?: number;
};

/**
 * 0 → 1 once, the first time `ref` scrolls into view; then never again (rule 83: entrances
 * run once per mount). Drive a left-to-right clip, bar heights or dot opacity from it.
 * Reduced motion starts at 1.
 */
export function useDrawIn(ref: RefObject<Element | null>, { reduced = false, duration = 0.9, delay = 0, amount = 0.35 }: DrawInOptions = {}) {
  const progress = useMotionValue(0);
  const inView = useInView(ref, { once: true, amount });
  useEffect(() => {
    if (reduced) {
      progress.jump(1);
      return;
    }
    if (!inView) return;
    const controls = animate(progress, 1, { duration, delay, ease: ease.inOut });
    return () => controls.stop();
  }, [inView, reduced, progress, duration, delay]);
  return progress;
}
