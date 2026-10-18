"use client";

import { useInView } from "motion/react";
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { TextSwap } from "../_primitives/text-swap/text-swap";

export type ShimmerTextProps = {
  /** The text. Loading labels end with "…" (R47). */
  children: ReactNode;
  /**
   * Sweep while true. Turning it off fades the band out where it is (300ms) instead of cutting
   * it mid-sweep, leaving plain text in the base colour. Default true.
   */
  active?: boolean;
  /** Seconds per cycle: the sweep takes the first 70%, then the band rests off the right edge. Default 2.4. */
  duration?: number;
  /**
   * Route text changes through Text Swap, so "Searching…" → "Reading 4 pages…" lifts and blurs
   * instead of popping, and the box springs to the new width. Default: on when `children` is a
   * string or number. Swapped text does not wrap; set `swap={false}` for multi-line copy.
   */
  swap?: boolean;
  /**
   * Colour classes. The text colour is the base the band sweeps over (default
   * `text-text-muted`); set `[--shimmer-highlight:…]` to change the band (default the
   * `text` token, so it lifts toward full contrast in both themes).
   */
  className?: string;
  style?: CSSProperties;
};

/*
 * The base colour is `currentColor` (text-fill is transparent, `color` is untouched), so the
 * text takes any text-* class. The band is a fixed 5em wide whatever the label's length, so a
 * short label and a long one shine with the same light. Its colour is a registered property,
 * so `active` turning off fades it out in place. Forced colours draw plain text.
 */
const CSS = `
@property --eased-shimmer-hl { syntax: "<color>"; inherits: true; initial-value: transparent; }
@keyframes eased-shimmer-sweep {
  from { background-position: calc(0% - var(--eased-shimmer-band)) 0, 0 0; }
  70%, to { background-position: calc(100% + var(--eased-shimmer-band)) 0, 0 0; }
}
.eased-shimmer {
  --eased-shimmer-band: 5em;
  -webkit-text-fill-color: transparent;
  background-image: linear-gradient(90deg, transparent, var(--eased-shimmer-hl) 50%, transparent), linear-gradient(currentColor, currentColor);
  background-size: var(--eased-shimmer-band) 100%, 100% 100%;
  background-position: calc(0% - var(--eased-shimmer-band)) 0, 0 0;
  background-repeat: no-repeat;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-box-decoration-break: clone;
  box-decoration-break: clone;
  transition: --eased-shimmer-hl 300ms var(--eased-ease-standard), color 150ms var(--eased-ease-standard);
}
.eased-shimmer[data-on] { --eased-shimmer-hl: var(--shimmer-highlight, var(--eased-text)); }
.eased-shimmer[data-sweep] { animation: eased-shimmer-sweep var(--eased-shimmer-dur, 2.4s) cubic-bezier(0.45, 0, 0.3, 1) infinite; }
@media (prefers-reduced-motion: reduce) { .eased-shimmer[data-sweep] { animation: none; } }
@media (forced-colors: active) { .eased-shimmer { -webkit-text-fill-color: currentColor; background: none; } }
`;

/**
 * Text with one soft band of light sweeping across it, the "working on it" state for labels
 * and statuses. Every shimmer on the page shares one phase (pinned to the document timeline),
 * so a status that swaps mid-sweep carries the band on rather than restarting it, and a list
 * of them shines together. Pauses off-screen; under reduced motion it is plain text.
 */
export function ShimmerText({ children, active = true, duration = 2.4, swap, className = "", style }: ShimmerTextProps) {
  const color = /(^|\s)text-(text|brand|success|warning|danger|info|on-|current|inherit)/.test(className) ? "" : "text-text-muted";
  const swapping = swap ?? (typeof children === "string" || typeof children === "number");
  const band = (
    <Band active={active} duration={duration} className={`${color} ${className}`} style={style}>
      {children}
    </Band>
  );
  if (!swapping) return band;
  // Clip horizontally while the width springs, so a longer status is revealed left to right
  // instead of spilling over whatever follows it.
  return (
    <TextSwap swapKey={typeof children === "string" || typeof children === "number" ? children : undefined} className="overflow-x-clip">
      {band}
    </TextSwap>
  );
}

function Band({
  active,
  duration,
  className,
  style,
  children,
}: {
  active: boolean;
  duration: number;
  className: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref);
  // Keep sweeping through the 300ms fade-out after `active` turns off, then stop painting.
  const [sweep, setSweep] = useState(active);
  if (active && !sweep) setSweep(true);
  useEffect(() => {
    if (active) return;
    const t = window.setTimeout(() => setSweep(false), 320);
    return () => clearTimeout(t);
  }, [active]);

  const running = sweep && inView;

  // One phase for every shimmer: start each cycle on the document timeline's zero.
  useLayoutEffect(() => {
    if (!running) return;
    for (const a of ref.current?.getAnimations() ?? []) a.startTime = 0;
  }, [running, duration]);

  return (
    <span
      ref={ref}
      data-on={active ? "" : undefined}
      data-sweep={running ? "" : undefined}
      className={`eased-shimmer ${className}`}
      style={{ ...style, "--eased-shimmer-dur": `${duration}s` } as CSSProperties}
    >
      {children}
      <style href="eased-shimmer-text" precedence="default">
        {CSS}
      </style>
    </span>
  );
}
