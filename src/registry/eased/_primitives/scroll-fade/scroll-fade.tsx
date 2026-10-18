"use client";

import { motion, type MotionValue } from "motion/react";
import { useEffect, type CSSProperties, type RefObject } from "react";

export type FadeAxis = "x" | "y" | "both";
export type BlurSide = "top" | "bottom" | "left" | "right";

/* ---------- Scroll fades ---------------------------------------------------------------- */

const EDGE_VARS = {
  x: ["--scroll-area-overflow-x-start", "--scroll-area-overflow-x-end"],
  y: ["--scroll-area-overflow-y-start", "--scroll-area-overflow-y-end"],
} as const;

const edgeGradient = (axis: "x" | "y", size: number) => {
  const [start, end] = EDGE_VARS[axis];
  const dir = axis === "y" ? "to bottom" : "to right";
  // Each feather grows with the distance left to scroll, so it fades in continuously as
  // content appears past the edge and is gone when the edge is reached: no fade, no step.
  return `linear-gradient(${dir}, transparent, #000 min(${size}px, var(${start}, 0px)), #000 calc(100% - min(${size}px, var(${end}, 0px))), transparent)`;
};

/**
 * A mask that feathers a scroller's edges only where there is more to scroll (R94). It reads
 * the distance-to-edge variables Base UI's ScrollArea.Viewport sets; `useScrollEdges` sets the
 * same variables on any other scroller. Put it on the scrolling element itself.
 */
export function scrollFadeMask(axis: FadeAxis = "y", size = 20): CSSProperties {
  const image = axis === "both" ? `${edgeGradient("y", size)}, ${edgeGradient("x", size)}` : edgeGradient(axis, size);
  const composite = axis === "both" ? { maskComposite: "intersect", WebkitMaskComposite: "source-in" } : {};
  return { maskImage: image, WebkitMaskImage: image, maskRepeat: "no-repeat", ...composite } as CSSProperties;
}

/**
 * Calls `update` whenever a scroller's own box or any of its children resize, including
 * children added or removed later (a list that grows). Returns the cleanup.
 */
export function observeScrollContent(el: HTMLElement, update: () => void) {
  const ro = new ResizeObserver(update);
  ro.observe(el);
  for (const child of el.children) ro.observe(child);
  const mo = new MutationObserver((records) => {
    for (const r of records) for (const node of r.addedNodes) if (node instanceof Element) ro.observe(node);
    update();
  });
  mo.observe(el, { childList: true });
  return () => {
    ro.disconnect();
    mo.disconnect();
  };
}

/**
 * Keeps `--scroll-area-overflow-{x,y}-{start,end}` on a plain scroller in sync with how far it
 * can still scroll each way, in px, so `scrollFadeMask` works without Base UI.
 */
export function useScrollEdges(ref: RefObject<HTMLElement | null>, axis: FadeAxis = "y") {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => {
      if (axis !== "x") {
        const top = el.scrollTop;
        el.style.setProperty(EDGE_VARS.y[0], `${Math.max(0, top)}px`);
        el.style.setProperty(EDGE_VARS.y[1], `${Math.max(0, el.scrollHeight - el.clientHeight - top)}px`);
      }
      if (axis !== "y") {
        const left = Math.abs(el.scrollLeft);
        el.style.setProperty(EDGE_VARS.x[0], `${Math.max(0, left)}px`);
        el.style.setProperty(EDGE_VARS.x[1], `${Math.max(0, el.scrollWidth - el.clientWidth - left)}px`);
      }
    };
    update();
    el.addEventListener("scroll", update, { passive: true });
    const unobserve = observeScrollContent(el, update);
    return () => {
      el.removeEventListener("scroll", update);
      unobserve();
    };
  }, [ref, axis]);
}

/* ---------- Progressive blur ------------------------------------------------------------ */

export type BlurLayer = {
  /** backdrop-filter blur radius, px. */
  blur: number;
  /** The mask band this layer is visible in. */
  mask: string;
};

const DIRECTION: Record<BlurSide, string> = { top: "to top", bottom: "to bottom", left: "to left", right: "to right" };

/**
 * The layers of a progressive blur. Each layer doubles the last one's radius and is masked to
 * an overlapping band, so blur ramps from 0 at the clear end to `maxBlur` at the `side` edge
 * without the visible step a single blurred strip has. Six layers to 20px is the Eased default.
 */
export function blurRamp({ side = "top", layers = 6, maxBlur = 20 }: { side?: BlurSide; layers?: number; maxBlur?: number } = {}): BlurLayer[] {
  const n = Math.max(2, Math.round(layers));
  const step = 100 / n;
  const pct = (k: number) => `${Math.min(100, Math.max(0, k * step)).toFixed(2)}%`;
  return Array.from({ length: n }, (_, i) => {
    const blur = maxBlur / 2 ** (n - 1 - i);
    // Band i fades in over [i, i+1] steps from the clear end, holds, then fades out over
    // [i+2, i+3]; bands past the edge simply stay solid there.
    const stops = [`transparent ${pct(i)}`, `#000 ${pct(i + 1)}`];
    if (i + 2 < n) stops.push(`#000 ${pct(i + 2)}`, `transparent ${pct(i + 3)}`);
    return { blur: Number(blur.toFixed(3)), mask: `linear-gradient(${DIRECTION[side]}, ${stops.join(", ")})` };
  });
}

export type BlurStackProps = {
  /** The edge the blur is strongest at. */
  side?: BlurSide;
  layers?: number;
  maxBlur?: number;
  /** 0–1. Fades every layer together; a MotionValue keeps scroll-linked strength off React's render. */
  strength?: number | MotionValue<number>;
  className?: string;
  style?: CSSProperties;
};

/**
 * The stacked, masked backdrop layers of `blurRamp`, filling their positioned parent. Strength
 * is applied as each layer's own opacity: an opacity, filter or mask on an ancestor would
 * become the backdrop root and blank the blur, so the parent must not set them.
 */
export function BlurStack({ side = "top", layers = 6, maxBlur = 20, strength = 1, className = "", style }: BlurStackProps) {
  const ramp = blurRamp({ side, layers, maxBlur });
  return (
    <div aria-hidden className={`pointer-events-none absolute inset-0 ${className}`} style={style}>
      {ramp.map((layer, i) => (
        <motion.div
          key={i}
          className="absolute inset-0"
          style={{
            opacity: strength,
            backdropFilter: `blur(${layer.blur}px)`,
            WebkitBackdropFilter: `blur(${layer.blur}px)`,
            maskImage: layer.mask,
            WebkitMaskImage: layer.mask,
          }}
        />
      ))}
    </div>
  );
}
