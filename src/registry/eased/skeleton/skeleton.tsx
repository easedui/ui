"use client";

import { AnimatePresence, motion, type TargetAndTransition } from "motion/react";
import { useLayoutEffect, useRef, type ReactNode } from "react";
import { enter, exit, reducedFade, useSafeReducedMotion } from "../lib/motion";

export type SkeletonProps = {
  /** While true the shimmer shows; set it false and the shimmer hands off to `children`. Default true. */
  loading?: boolean;
  /**
   * The real content. While loading it is laid out but invisible (and inert), so the
   * placeholder is exactly its size and nothing shifts at the handoff. Pass stand-in text
   * of a typical length while the data is missing, e.g. `{user?.name ?? "Maya Okafor"}`.
   * Without children the skeleton is a plain block: size it with `className`.
   */
  children?: ReactNode;
  /** Size and radius classes. Default radius `rounded-control-xs`; pass `rounded-pill` for avatars. */
  className?: string;
  /** Lay the wrapper out as a block (`grid`) instead of inline, for cards and rows. Default false. */
  block?: boolean;
  /**
   * Wrapping text: the bar covers the middle 60% of each line box (roughly the x-height plus
   * ascenders) instead of the full line height, so it reads as a line of text. Default false.
   */
  text?: boolean;
};

/*
 * One shimmer for the whole page: the highlight is painted in viewport space
 * (background-attachment: fixed) and every skeleton's animation is pinned to the same start
 * time, so a single band sweeps across all of them in sync instead of each one flashing on
 * its own beat. The highlight is the base tone lifted 6% in lightness, in both themes.
 */
const CSS = `
@keyframes eased-shimmer { from { background-position: -170vw 0; } 70%, to { background-position: -30vw 0; } }
.eased-skeleton {
  background-color: var(--eased-surface-hover);
  background-image: linear-gradient(90deg, transparent 46%, oklch(from var(--eased-surface-hover) calc(l + 0.06) c h) 50%, transparent 54%);
  background-size: 300vw 100%;
  background-attachment: fixed;
  background-repeat: no-repeat;
  animation: eased-shimmer 2000ms linear infinite;
}
@media (prefers-reduced-motion: reduce) { .eased-skeleton { animation: none; background-image: none; } }
`;

/** Pins every running shimmer to the document timeline's zero, so they share one phase. */
function useSharedPhase<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  useLayoutEffect(() => {
    for (const a of ref.current?.getAnimations() ?? []) a.startTime = 0;
  }, []);
  return ref;
}

/**
 * A loading placeholder with one page-wide shimmer. Wrap the real content and flip
 * `loading` off: the shimmer fades out as the content fades in from a soft blur, in place.
 */
export function Skeleton({ loading = true, children, className = "", block = false, text = false }: SkeletonProps) {
  const reduced = useSafeReducedMotion();
  const radius = /\brounded-/.test(className) ? "" : "rounded-control-xs";

  if (children === undefined) {
    return (
      <AnimatePresence initial={false}>
        {loading && (
          <Block
            key="block"
            className={`block ${radius} ${className}`}
            exit={{ opacity: 0, transition: reduced ? reducedFade : exit }}
          />
        )}
      </AnimatePresence>
    );
  }

  return (
    <span aria-busy={loading || undefined} className={`relative ${block ? "grid" : "inline-grid"} max-w-full ${className}`}>
      <motion.span
        inert={loading}
        className="col-start-1 row-start-1 min-w-0"
        initial={false}
        animate={
          loading
            ? { opacity: 0, filter: reduced ? "blur(0px)" : "blur(4px)" }
            : { opacity: 1, filter: "blur(0px)", transitionEnd: { filter: "none" } }
        }
        transition={reduced ? reducedFade : loading ? { duration: 0 } : enter}
      >
        {children}
      </motion.span>
      <AnimatePresence initial={false}>
        {loading && (
          <Block
            key="block"
            className={`absolute ${text ? "inset-x-0 inset-y-[0.2lh]" : "inset-0"} ${radius} ${className.match(/\brounded-\S+/g)?.join(" ") ?? ""}`}
            exit={{ opacity: 0, transition: reduced ? reducedFade : exit }}
          />
        )}
      </AnimatePresence>
    </span>
  );
}

function Block({ className, exit: exitTo }: { className: string; exit: TargetAndTransition }) {
  const ref = useSharedPhase<HTMLSpanElement>();
  return (
    <motion.span ref={ref} aria-hidden className={`eased-skeleton ${className}`} exit={exitTo}>
      <style href="eased-skeleton" precedence="default">
        {CSS}
      </style>
    </motion.span>
  );
}

export type SkeletonTextProps = {
  /** Number of lines. Default 3; the last one is shorter, like a paragraph's. */
  lines?: number;
  loading?: boolean;
  className?: string;
};

/** Lines sized for 13–14px text: 12px bars on a 20px rhythm. */
export function SkeletonText({ lines = 3, loading = true, className = "" }: SkeletonTextProps) {
  return (
    <span aria-hidden className={`flex flex-col gap-2 py-1 ${className}`}>
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton key={i} loading={loading} className={`h-3 ${i === lines - 1 && lines > 1 ? "w-3/5" : "w-full"}`} />
      ))}
    </span>
  );
}
