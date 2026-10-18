"use client";

import { useInView } from "motion/react";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type RefObject } from "react";
import { useSafeReducedMotion } from "../../lib/motion";

export type ClockOptions = {
  /** Ms between ticks. Default 1000. */
  intervalMs?: number;
  /** Controlled pause (a pause button's state). Leave it out to use the returned `pause`/`resume`. */
  paused?: boolean;
  /** Uncontrolled initial pause. Default false. */
  defaultPaused?: boolean;
  /**
   * What `prefers-reduced-motion` does: `slow` ticks 4× less often (values still update, so the
   * data stays live, but far less flashes), `pause` waits for an explicit `resume`, `none`
   * ignores it. Default `slow`.
   */
  reducedMotion?: "slow" | "pause" | "none";
  /** Pause while this element is off screen (rule 85). */
  target?: RefObject<Element | null>;
  /** Stop for good after this many ticks: a scripted replay that ends. */
  maxTicks?: number;
};

export type Clock = {
  /** Ticks elapsed since mount: 0 on the server and the first client render. */
  tick: number;
  /** True while ticks are being emitted. */
  running: boolean;
  /** Why it isn't running, if it isn't. */
  reason: "paused" | "hidden" | "offscreen" | "reduced" | "ended" | null;
  /** The user paused it (controlled or not). */
  paused: boolean;
  pause(): void;
  resume(): void;
  toggle(): void;
  /** Back to tick 0. */
  reset(): void;
  /** `prefers-reduced-motion`, read after hydration: skip flashes and rolls when true. */
  reduced: boolean;
  /** The interval actually in use (slowed under reduced motion). */
  intervalMs: number;
};

const subscribeVisibility = (onChange: () => void) => {
  document.addEventListener("visibilitychange", onChange);
  return () => document.removeEventListener("visibilitychange", onChange);
};
const useDocumentVisible = () =>
  useSyncExternalStore(subscribeVisibility, () => document.visibilityState !== "hidden", () => true);

/**
 * A pausable tick counter for live data. It stops in a hidden tab and, given a `target`, while
 * that element is off screen; under reduced motion it slows (or pauses, if asked). It is a
 * counter, not a timestamp, so a seeded stream at `tick` renders the same on every machine.
 *
 *   const clock = useClock({ intervalMs: 1200, target: ref });
 *   <button onClick={clock.toggle}>{clock.paused ? "Resume" : "Pause"}</button>
 */
export function useClock({
  intervalMs = 1000,
  paused: pausedProp,
  defaultPaused = false,
  reducedMotion = "slow",
  target,
  maxTicks,
}: ClockOptions = {}): Clock {
  const reduced = useSafeReducedMotion();
  const visible = useDocumentVisible();
  const none = useRef<Element | null>(null);
  const inView = useInView(target ?? none, { initial: !target });
  const [pausedState, setPaused] = useState(defaultPaused);
  // Reduced-motion "pause" holds until the user resumes once.
  const [reducedResumed, setReducedResumed] = useState(false);
  const [tick, setTick] = useState(0);

  const paused = pausedProp ?? pausedState;
  const ended = maxTicks !== undefined && tick >= maxTicks;
  const reducedHold = reduced && reducedMotion === "pause" && !reducedResumed;
  const reason: Clock["reason"] = paused
    ? "paused"
    : ended
      ? "ended"
      : !visible
        ? "hidden"
        : target && !inView
          ? "offscreen"
          : reducedHold
            ? "reduced"
            : null;
  const running = reason === null;
  const interval = reduced && reducedMotion === "slow" ? intervalMs * 4 : intervalMs;

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      setTick((t) => (maxTicks !== undefined && t >= maxTicks ? t : t + 1));
    }, interval);
    return () => clearInterval(id);
  }, [running, interval, maxTicks]);

  const pause = useCallback(() => setPaused(true), []);
  const resume = useCallback(() => {
    setPaused(false);
    setReducedResumed(true);
  }, []);
  const toggle = useCallback(() => {
    setPaused((p) => !p);
    setReducedResumed(true);
  }, []);
  const reset = useCallback(() => setTick(0), []);

  return { tick, running, reason, paused, pause, resume, toggle, reset, reduced, intervalMs: interval };
}
