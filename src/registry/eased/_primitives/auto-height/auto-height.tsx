"use client";

import { animate, type AnimationPlaybackControlsWithThen, type Transition } from "motion/react";
import { useLayoutEffect, useRef, useState, type CSSProperties, type HTMLAttributes, type ReactNode } from "react";
import { duration, ease, exitFast, reducedFade, smooth, useSafeReducedMotion } from "../../lib/motion";

export type AutoHeightProps = Omit<HTMLAttributes<HTMLDivElement>, "children"> & {
  children: ReactNode;
  /**
   * `false` collapses to 0 and hides the content (`visibility: hidden`, so it leaves the tab
   * order and the accessibility tree once closed; `inert` while closing). Default `true`.
   */
  open?: boolean;
  /** Fade the content in once the height is mostly there, and out before it closes. Default `true`. */
  fade?: boolean;
  /** The height spring. Default `smooth`: no overshoot, so content never bounces past its edge. */
  transition?: Transition;
  /** Classes for the measured inner wrapper. Put padding here, never on the root. */
  innerClassName?: string;
  /** Fires when an open or close has fully settled. */
  onOpenChangeComplete?: (open: boolean) => void;
};

/** Start the content fade this far into the height spring, so it lands just after the height does. */
const FADE_DELAY = 0.12;

/**
 * Animates its own height to whatever its content measures: a `height: auto` spring.
 * Content that grows or shrinks while open springs to its new height (a list filtering, an
 * error appearing); `open` collapses it to 0 and back. At rest the root is `height: auto`
 * with no clipping, so focus rings and shadows inside are never cut off; it clips the
 * vertical axis only while moving. Interruptible: a change mid-flight continues from the
 * current height. Reduced motion snaps the height and fades opacity only.
 */
export function AutoHeight({
  open = true,
  fade = true,
  transition = smooth,
  className = "",
  innerClassName = "",
  style,
  onOpenChangeComplete,
  children,
  ...props
}: AutoHeightProps) {
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const reduced = useSafeReducedMotion();
  // Styles that describe the first frame only; afterwards the element is driven imperatively.
  const [initialOpen] = useState(open);
  const prevOpen = useRef(open);
  const openRef = useRef(open);
  const contentHeight = useRef<number | null>(null);
  const heightAnim = useRef<AnimationPlaybackControlsWithThen | null>(null);
  const run = useRef(0);
  const latest = useRef({ reduced, transition, fade, onOpenChangeComplete });

  useLayoutEffect(() => {
    latest.current = { reduced, transition, fade, onOpenChangeComplete };
  });

  /** Spring the root from `from` to `to` px, then release it to `auto` (open) or keep it at 0 (closed). */
  const springHeight = (from: number, to: number, settledOpen: boolean | null) => {
    const el = outerRef.current;
    const content = innerRef.current;
    if (!el || !content) return;
    const { reduced, transition, onOpenChangeComplete } = latest.current;
    const token = ++run.current;
    heightAnim.current?.stop();
    el.style.overflowY = "clip";
    el.style.height = `${from}px`;
    const settle = () => {
      if (token !== run.current) return;
      heightAnim.current = null;
      if (openRef.current) {
        el.style.height = "";
        el.style.overflowY = "";
      } else {
        el.style.height = "0px";
        content.style.visibility = "hidden";
      }
      if (settledOpen !== null) onOpenChangeComplete?.(settledOpen);
    };
    if (reduced || Math.abs(from - to) < 0.5) {
      el.style.height = `${to}px`;
      settle();
      return;
    }
    heightAnim.current = animate(el, { height: [from, to] }, transition);
    heightAnim.current.then(settle);
  };

  /** The root's rendered height right now: mid-animation it is whatever the spring has reached. */
  const currentHeight = () => {
    const el = outerRef.current!;
    return el.style.height && el.style.height !== "auto" ? parseFloat(getComputedStyle(el).height) : el.offsetHeight;
  };

  // Open and close.
  useLayoutEffect(() => {
    if (prevOpen.current === open) return;
    prevOpen.current = open;
    openRef.current = open;
    const el = outerRef.current;
    const content = innerRef.current;
    if (!el || !content) return;
    const { reduced, fade } = latest.current;
    const from = heightAnim.current ? currentHeight() : open ? 0 : el.offsetHeight;
    if (open) {
      content.style.visibility = "";
      const to = content.offsetHeight;
      contentHeight.current = to;
      if (fade) {
        animate(
          content,
          { opacity: [Number(getComputedStyle(content).opacity), 1] },
          reduced ? reducedFade : { duration: duration.standard, ease: ease.enter, delay: FADE_DELAY },
        );
      } else content.style.opacity = "";
      springHeight(from, to, true);
    } else {
      if (fade) animate(content, { opacity: 0 }, reduced ? reducedFade : exitFast);
      springHeight(from, 0, false);
    }
  }, [open]);

  // Content resizing while open.
  useLayoutEffect(() => {
    const content = innerRef.current;
    if (!content) return;
    contentHeight.current = content.offsetHeight;
    const observer = new ResizeObserver(() => {
      const next = content.offsetHeight;
      const prev = contentHeight.current;
      contentHeight.current = next;
      if (!openRef.current || prev === null || prev === next) return;
      // At rest the root is already `auto` (it has jumped this frame, before paint): start from the old height.
      springHeight(heightAnim.current ? currentHeight() : prev, next, null);
    });
    observer.observe(content);
    return () => observer.disconnect();
  }, []);

  const rootStyle: CSSProperties = initialOpen ? { ...style } : { height: 0, overflowY: "clip", ...style };
  const innerStyle: CSSProperties | undefined = initialOpen ? undefined : { visibility: "hidden", opacity: fade ? 0 : undefined };

  return (
    <div ref={outerRef} className={className} style={rootStyle} {...props}>
      <div ref={innerRef} inert={!open} className={`flow-root ${innerClassName}`} style={innerStyle}>
        {children}
      </div>
    </div>
  );
}
