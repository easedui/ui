"use client";

import {
  AnimatePresence,
  animate,
  motion,
  useIsPresent,
  useMotionValue,
  type AnimationPlaybackControls,
} from "motion/react";
import { useLayoutEffect, useRef, type ComponentPropsWithoutRef, type ReactNode } from "react";
import { exitFast, reducedFade, smooth, swap, swapIn, swapOut, swapShown, useSafeReducedMotion } from "../../lib/motion";

export type TextSwapProps = Omit<ComponentPropsWithoutRef<"span">, "children"> & {
  /** The text (or icon + text) to show. A new value swaps out the old one. */
  children: ReactNode;
  /**
   * What counts as "new content". Defaults to `children` when it is a string or number, so
   * `<TextSwap>{saved ? "Saved" : "Save"}</TextSwap>` just works. Pass a key when the
   * children are elements, e.g. `swapKey={status}`.
   */
  swapKey?: string | number;
  /** 1 (default): the new text rises from below, the old leaves upward. -1 reverses it, e.g. for a count going down. */
  direction?: 1 | -1;
  /** Spring the box's width to fit the new text, so neighbours glide instead of jumping. Default true. */
  animateWidth?: boolean;
  /** Animate the first render too. Default false: content that is already there does not perform. */
  initial?: boolean;
};

/**
 * The Eased text-change primitive (rule 82): the outgoing text lifts 3px and blurs out, the
 * incoming text rises 4px from below and sharpens, and the box springs to the new width.
 * Position rides the snappy spring; opacity and blur are tweened on their own clock so blur
 * can never overshoot below zero. Under reduced motion it is a 100ms cross-fade and the
 * width changes at once. The outgoing copy is hidden from assistive tech while it leaves.
 *
 * Text never wraps inside a swap: it is for labels, statuses and short values.
 */
export function TextSwap({
  children,
  swapKey,
  direction = 1,
  animateWidth = true,
  initial = false,
  className = "",
  style,
  ...props
}: TextSwapProps) {
  const reduced = useSafeReducedMotion();
  const key = swapKey ?? (typeof children === "string" || typeof children === "number" ? children : "static");
  const width = useMotionValue<number | "auto">("auto");
  const current = useRef<HTMLSpanElement | null>(null);
  const settings = useRef({ reduced });
  useLayoutEffect(() => {
    settings.current = { reduced };
  });

  // Follow the entering copy's intrinsic width (it is nowrap, so the box never squeezes it).
  // ResizeObserver reports after layout and before paint, so the first frame is already right.
  useLayoutEffect(() => {
    const el = current.current;
    if (!el || !animateWidth) {
      width.jump("auto");
      return;
    }
    let spring: AnimationPlaybackControls | undefined;
    const ro = new ResizeObserver(() => {
      const to = el.offsetWidth;
      if (width.get() === "auto" || settings.current.reduced) width.jump(to);
      else spring = animate(width, to, smooth);
    });
    ro.observe(el);
    return () => {
      ro.disconnect();
      spring?.stop();
    };
  }, [key, animateWidth, width]);

  return (
    // A spring on `width` is a deliberate exception to rule 75: one inline box, a handful of
    // frames, and it is what lets the siblings glide rather than snap.
    <motion.span
      {...(props as ComponentPropsWithoutRef<typeof motion.span>)}
      style={{ ...style, width }}
      className={`relative inline-flex max-w-full items-center gap-[inherit] align-baseline ${className}`}
    >
      <AnimatePresence mode="popLayout" initial={initial}>
        <SwapItem key={key} itemRef={current} direction={direction} reduced={reduced}>
          {children}
        </SwapItem>
      </AnimatePresence>
    </motion.span>
  );
}

// `ref` is forwarded: AnimatePresence's popLayout needs it to lift the outgoing copy out of flow.
function SwapItem({
  children,
  itemRef,
  direction,
  reduced,
  ref,
}: {
  children: ReactNode;
  itemRef: React.RefObject<HTMLSpanElement | null>;
  direction: 1 | -1;
  reduced: boolean;
  ref?: React.Ref<HTMLSpanElement>;
}) {
  const present = useIsPresent();
  return (
    <motion.span
      ref={(el) => {
        if (present) itemRef.current = el;
        if (typeof ref === "function") ref(el);
        else if (ref) ref.current = el;
      }}
      aria-hidden={present ? undefined : true}
      initial={reduced ? { opacity: 0 } : { ...swapIn, y: swapIn.y * direction }}
      animate={reduced ? { opacity: 1 } : swapShown}
      exit={
        reduced
          ? { opacity: 0, transition: reducedFade }
          : { ...swapOut, y: swapOut.y * direction, transition: { ...swap, opacity: exitFast, filter: exitFast } }
      }
      transition={reduced ? reducedFade : swap}
      className="inline-flex shrink-0 items-center gap-[inherit] whitespace-nowrap"
    >
      {children}
    </motion.span>
  );
}
