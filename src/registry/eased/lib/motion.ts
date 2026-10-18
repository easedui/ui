/**
 * Eased motion tokens for Motion (motion/react), mirroring `eased.css`.
 * The CSS springs (`--eased-spring-*`) are these same springs sampled as linear(),
 * so a CSS transition and a Motion animation with the same name feel identical.
 *
 *   snappy  presses, toggles, thumbs, indicators, text swaps, rolling digits, focus ring
 *   smooth  layout, FLIP, panels, toast and tooltip position (no overshoot)
 *   bouncy  shape morphs and playful reveals only; never exits
 */

import { useSyncExternalStore } from "react";

export const snappy = { type: "spring", stiffness: 520, damping: 38 } as const;
export const smooth = { type: "spring", visualDuration: 0.4, bounce: 0 } as const;
export const bouncy = { type: "spring", stiffness: 400, damping: 26 } as const;

/** Cubic-bezier curves, same as `--eased-ease-enter`, `--eased-ease-standard`, `--eased-ease-exit`, `--eased-ease-in-out`. */
export const ease = {
  enter: [0.16, 1, 0.3, 1],
  standard: [0.22, 1, 0.36, 1],
  exit: [0.7, 0, 0.84, 0],
  inOut: [0.65, 0, 0.35, 1],
} as const;

/** Seconds, same as `--eased-duration-*`. */
export const duration = {
  instant: 0.1,
  fast: 0.15,
  standard: 0.2,
  slow: 0.3,
  sheet: 0.5,
  /** Before an image fallback (Avatar initials) shows, so a fast load never flashes it. */
  fallback: 0.4,
} as const;

/** Seconds between staggered children (rule 83); keep the total ≤ 0.4s. */
export const stagger = { char: 0.016, item: 0.035, word: 0.04, line: 0.08 } as const;

/** Blur radii in motion: `soft` for text and icon swaps; `text` is the most anything may blur. */
export const blur = { subtle: "2px", soft: "4px", text: "8px" } as const;

/** Things that appear: opacity and blur alongside a spring. */
export const enter = { duration: duration.standard, ease: ease.enter } as const;
/** Opacity and colour while something stays on screen. */
export const fade = { duration: duration.fast, ease: ease.standard } as const;
/** Things that leave: ≤ 0.75 × `enter`, ease-in, never overshoots. */
export const exit = { duration: duration.fast, ease: ease.exit } as const;
/** Small things that leave: buttons, chips, the outgoing half of a swap. */
export const exitFast = { duration: duration.instant, ease: ease.exit } as const;
/** The reduced-motion branch: opacity only, at `--eased-duration-instant`. */
export const reducedFade = { duration: duration.instant } as const;
export const instant = { duration: 0 } as const;

/** Text and icon swaps (rule 82): out up 3px, in from 4px below, blur tweened apart from the spring. */
export const swapIn = { opacity: 0, y: 4, filter: `blur(${blur.soft})` } as const;
export const swapShown = { opacity: 1, y: 0, filter: "blur(0px)" } as const;
export const swapOut = { opacity: 0, y: -3, filter: `blur(${blur.soft})` } as const;
export const swap = { ...snappy, opacity: fade, filter: fade } as const;

const REDUCE = "(prefers-reduced-motion: reduce)";
const subscribeReduced = (onChange: () => void) => {
  const mq = window.matchMedia(REDUCE);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
};

/**
 * `prefers-reduced-motion`, read after hydration (rule 86): false on the server and during
 * hydration, the real value from then on, and live when the setting changes. Use this, not
 * Motion's `useReducedMotion`, which reads the media query during the first client render
 * and so mismatches the server HTML for reduced-motion users.
 */
export function useSafeReducedMotion() {
  return useSyncExternalStore(subscribeReduced, () => window.matchMedia(REDUCE).matches, () => false);
}
