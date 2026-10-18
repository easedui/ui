"use client";

import { animate, motion, useMotionValue, type MotionValue } from "motion/react";
import { useEffect } from "react";
import { ease, useSafeReducedMotion } from "../../lib/motion";
import type { StepStatus } from "../thinking-core/types";
import { edgeProgressTarget } from "./status";

export type EdgeProgressOptions = {
  /** Seconds to draw an edge. Default 0.5: a hand-off, read at a glance. */
  duration?: number;
  /** Seconds before drawing starts, e.g. after the source node's check has drawn. Default 0. */
  delay?: number;
  /** Override the reduced-motion read (it is read after hydration by default). */
  reduced?: boolean;
};

/**
 * An edge's `pathLength` (0–1) as a motion value that follows its status: it draws from the
 * source to the target when the edge becomes active or complete, and rewinds faster (≤ 0.75 ×
 * the draw) when a retry resets it. Interruptible: it always continues from what's on screen.
 * Reduced motion jumps. A complete edge on mount starts drawn, so a finished run doesn't replay.
 */
export function useEdgeProgress(status: StepStatus, { duration = 0.5, delay = 0, reduced: reducedProp }: EdgeProgressOptions = {}): MotionValue<number> {
  const reducedRead = useSafeReducedMotion();
  const reduced = reducedProp ?? reducedRead;
  const target = edgeProgressTarget(status);
  const progress = useMotionValue(status === "complete" ? 1 : 0);
  useEffect(() => {
    if (progress.get() === target) return;
    if (reduced) {
      progress.jump(target);
      return;
    }
    const rewinding = target < progress.get();
    const controls = animate(progress, target, {
      duration: rewinding ? duration * 0.6 : duration,
      delay: rewinding ? 0 : delay,
      ease: rewinding ? ease.exit : ease.inOut,
    });
    return () => controls.stop();
  }, [target, reduced, duration, delay, progress]);
  return progress;
}

export type FlowEdgePathProps = EdgeProgressOptions & {
  /** SVG path data, e.g. `PlacedEdge.path`. */
  d: string;
  status: StepStatus;
  /** Classes for the drawn stroke. Default `stroke-text-secondary`; tint it per status. */
  className?: string;
  /** Classes for the undrawn track. Default `stroke-line`; skipped edges are dashed. */
  trackClassName?: string;
  strokeWidth?: number;
};

/**
 * The one piece of UI flow-core ships: an edge as a track plus a stroke drawn along it by
 * `useEdgeProgress`. Everything else (nodes, labels, colours per status) is the builder's.
 */
export function FlowEdgePath({ d, status, className = "stroke-text-secondary", trackClassName = "stroke-line", strokeWidth = 1.5, ...options }: FlowEdgePathProps) {
  const progress = useEdgeProgress(status, options);
  return (
    <g fill="none" strokeLinecap="round" strokeLinejoin="round" data-status={status}>
      <path d={d} className={trackClassName} strokeWidth={strokeWidth} strokeDasharray={status === "skipped" ? "2 4" : undefined} />
      <motion.path d={d} className={className} strokeWidth={strokeWidth} style={{ pathLength: progress, opacity: status === "skipped" ? 0 : 1 }} />
    </g>
  );
}
