"use client";

import {
  LayoutGroup,
  motion,
  useMotionValue,
  type HTMLMotionProps,
  type Transition,
} from "motion/react";
import { createContext, use, useId, useLayoutEffect, useMemo, useRef, type ReactNode } from "react";
import { instant, snappy, useSafeReducedMotion } from "../../lib/motion";

type IndicatorContextValue = { id: string; transition: Transition };

const IndicatorContext = createContext<IndicatorContextValue | null>(null);

export type IndicatorGroupProps = {
  children: ReactNode;
  /**
   * The spring every indicator in the group travels on. Default `snappy` (indicators are
   * feedback for a choice). Reduced motion always jumps, whatever you pass.
   */
  transition?: Transition;
};

/**
 * Scopes a set of indicators. Every `<Indicator>` with the same `name` inside one group is
 * the same visual element: render it inside whichever item is active and it travels there.
 * Groups never collide, so two segmented controls on a page move independently.
 */
export function IndicatorGroup({ children, transition = snappy }: IndicatorGroupProps) {
  const id = useId();
  const reduced = useSafeReducedMotion();
  const value = useMemo(() => ({ id, transition: reduced ? instant : transition }), [id, reduced, transition]);
  return (
    <LayoutGroup id={id}>
      <IndicatorContext value={value}>{children}</IndicatorContext>
    </LayoutGroup>
  );
}

export type IndicatorProps = Omit<HTMLMotionProps<"span">, "layoutId" | "layout"> & {
  /**
   * Indicators with the same name are one element. Use two names for two layers that move
   * independently, such as a selected thumb and a hover highlight. Default "indicator".
   */
  name?: string;
  /**
   * The corner radius, e.g. `"var(--eased-radius-control-sm)"`. Default: whatever your classes
   * resolve to, re-read whenever the indicator resizes. Pass it when the radius can change
   * without a resize (a theme that retunes `--eased-radius-*`).
   */
  radius?: string;
};

const CORNERS = ["borderTopLeftRadius", "borderTopRightRadius", "borderBottomRightRadius", "borderBottomLeftRadius"] as const;

/**
 * The shared-layout highlight. Render it, absolutely positioned, inside the active item
 * (the item needs `position: relative` and should draw its label above it); when another
 * item becomes active, render it there instead and it glides across.
 *
 * Interruptible: a new target mid-flight redirects from wherever the highlight is.
 * The corners stay round while it stretches between items of different widths: the
 * radius your classes resolve to (or `radius`) is handed to Motion's scale correction, and
 * re-read when the indicator resizes, so a responsive radius class stays correct.
 * Decorative: `aria-hidden` and `pointer-events: none`; the item carries the state.
 */
export function Indicator({ name = "indicator", radius, className = "", transition, style, ...props }: IndicatorProps) {
  const group = use(IndicatorContext);
  if (!group) throw new Error("<Indicator> must be rendered inside an <IndicatorGroup>.");
  const ref = useRef<HTMLSpanElement>(null);
  const tl = useMotionValue("");
  const tr = useMotionValue("");
  const br = useMotionValue("");
  const bl = useMotionValue("");

  // Before the first frame of a layout animation: corners set in `style` are scale-corrected.
  // To re-read the class radius, drop the inline corners for the read, then hand them back.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const corners = [tl, tr, br, bl];
    const read = () => {
      if (radius !== undefined) return corners.forEach((corner) => corner.set(radius));
      CORNERS.forEach((k) => (el.style[k] = ""));
      const computed = getComputedStyle(el);
      corners.forEach((corner, i) => {
        const value = computed[CORNERS[i]];
        el.style[CORNERS[i]] = value;
        corner.set(value);
      });
    };
    read();
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  }, [radius, tl, tr, br, bl]);

  return (
    <motion.span
      ref={ref}
      aria-hidden
      layoutId={`${group.id}-${name}`}
      // One highlight moving, not two cross-fading: the old one hands over at full opacity.
      layoutCrossfade={false}
      transition={group.transition === instant ? instant : (transition ?? group.transition)}
      className={`pointer-events-none absolute ${className}`}
      style={{ borderTopLeftRadius: tl, borderTopRightRadius: tr, borderBottomRightRadius: br, borderBottomLeftRadius: bl, ...style }}
      {...props}
    />
  );
}
