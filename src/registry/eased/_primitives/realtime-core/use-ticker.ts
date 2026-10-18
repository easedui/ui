"use client";

import { useMemo } from "react";
import { useClock, type Clock, type ClockOptions } from "./clock";
import type { Tick, TickStream } from "./stream";

export type UseTickerOptions = ClockOptions & {
  /** The stream index shown at mount, so a chart opens with history. Default `history - 1`. */
  startIndex?: number;
  /** How many ticks `history` keeps, oldest first. Default 60. */
  history?: number;
};

export type Ticker = Clock & {
  /** The stream index on screen now: `startIndex + clock.tick`. */
  index: number;
  /** The current tick. */
  current: Tick;
  /** The tick before it (same as `current` at index 0). */
  previous: Tick;
  /** The last `history` ticks, oldest first. */
  history: Tick[];
  /** One series over `history`, oldest first: hand it to a Sparkline or Line Chart as `values`. */
  series(id: string): number[];
};

/**
 * Drives a seeded `TickStream` from a `useClock`: the live board's one hook. Hydration-safe,
 * because the first render on both sides is `startIndex`, and deterministic, because every
 * value comes from the seed, never from `Math.random` or the wall clock.
 *
 *   const stream = useMemo(() => createTickStream({ seed: "fx", series }), []);
 *   const fx = useTicker(stream, { intervalMs: 1500, target: ref });
 *   fx.current.values.EURUSD; fx.series("EURUSD"); fx.toggle();
 */
export function useTicker(stream: TickStream, { startIndex, history = 60, ...clockOptions }: UseTickerOptions = {}): Ticker {
  const clock = useClock({ intervalMs: stream.intervalMs, ...clockOptions });
  const index = (startIndex ?? history - 1) + clock.tick;
  const slice = useMemo(() => stream.window(index, history), [stream, index, history]);
  const current = slice[slice.length - 1];
  const previous = slice[slice.length - 2] ?? current;
  return {
    ...clock,
    index,
    current,
    previous,
    history: slice,
    series: (id) => slice.map((t) => t.values[id]),
  };
}
