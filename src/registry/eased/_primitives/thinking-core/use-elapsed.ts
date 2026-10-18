"use client";

import { useEffect, useRef, useState } from "react";

export type UseElapsedOptions = {
  /** Counting while true. When it turns false the value freezes (at `endedAt` if given). Default true. */
  running?: boolean;
  /** When the clock started (epoch ms or Date). Omit to start when `running` first turns true. */
  startedAt?: number | Date;
  /** When it stopped. Use it to show a finished run's exact duration, e.g. from the server. */
  endedAt?: number | Date;
};

const ms = (t: number | Date | undefined) => (t === undefined ? undefined : typeof t === "number" ? t : t.getTime());

/**
 * Whole seconds since a start, ticking exactly on each second boundary of the start time (not
 * of the wall clock), so "1s" appears one second after the start, not up to two. It reads
 * `Date.now()` on every tick rather than counting ticks, so a throttled background tab is
 * still right when it returns. Re-renders once a second while running, and never on the
 * server (it returns 0 until mounted).
 *
 *   const seconds = useElapsed({ running: status === "thinking", startedAt });
 */
export function useElapsed({ running = true, startedAt, endedAt }: UseElapsedOptions = {}): number {
  const start = useRef<number | undefined>(ms(startedAt));
  const frozen = useRef<number | undefined>(undefined);
  const [seconds, setSeconds] = useState(0);

  const startMs = ms(startedAt);
  const endMs = ms(endedAt);

  useEffect(() => {
    if (startMs !== undefined) start.current = startMs;
    const from = () => start.current ?? Date.now();
    if (!running) {
      // Freeze: at the given end, else at the moment it stopped.
      if (start.current === undefined && endMs === undefined) return;
      const stop = endMs ?? frozen.current ?? Date.now();
      frozen.current = stop;
      setSeconds(Math.max(0, Math.floor((stop - from()) / 1000)));
      return;
    }
    // Without a `startedAt`, every new run (running false → true) starts from now.
    if (startMs === undefined && (start.current === undefined || frozen.current !== undefined)) start.current = Date.now();
    frozen.current = undefined;
    let timer = 0;
    const tick = () => {
      const elapsed = Date.now() - from();
      setSeconds(Math.max(0, Math.floor(elapsed / 1000)));
      // Next boundary of the start's own second grid, plus a hair so floor() lands on it.
      timer = window.setTimeout(tick, 1000 - (((elapsed % 1000) + 1000) % 1000) + 4);
    };
    tick();
    return () => clearTimeout(timer);
  }, [running, startMs, endMs]);

  return seconds;
}

/**
 * Seconds as a compact duration: `12s`, `1m 4s`, `1h 2m`. Every digit is a digit, so it rolls
 * cleanly when passed to Number Roll as a `formatter`.
 */
export function formatElapsed(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ${s % 60}s`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
}
