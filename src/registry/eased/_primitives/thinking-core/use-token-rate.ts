"use client";

import { useMotionValue, type MotionValue } from "motion/react";
import { useEffect, useRef } from "react";

export type UseTokenRateOptions = {
  /** Tokens per second that reads as full speed (`rate` = 1). Default 60, a fast model's stream. */
  max?: number;
  /**
   * Smoothing time constant in seconds. Streams arrive in bursts; the rate follows the average
   * over roughly this window, so a 40-token chunk reads as a surge, not a spike. Default 0.6.
   */
  smoothing?: number;
  /** Characters per token when `source` is a string. Default 4 (English prose). */
  charsPerToken?: number;
};

export type TokenRate = {
  /** Smoothed tokens per second. */
  tps: MotionValue<number>;
  /** `tps / max`, clamped to 0–1: feed it to anything that should move with the stream. */
  rate: MotionValue<number>;
};

/**
 * How fast a stream is flowing, as motion values, so an orb or a meter can follow it without
 * re-rendering. Pass the streaming text (or a running token count); every change counts the
 * new tokens, and a frame loop turns them into a smoothed tokens-per-second that rises with
 * bursts and decays to 0 when the stream pauses. The loop runs only while the rate is
 * non-zero. If the text shrinks (a new message), it starts over.
 *
 *   const { rate } = useTokenRate(message.text);
 *   <AgentOrb state="speaking" rate={rate} />
 */
export function useTokenRate(source: string | number, { max = 60, smoothing = 0.6, charsPerToken = 4 }: UseTokenRateOptions = {}): TokenRate {
  const tps = useMotionValue(0);
  const rate = useMotionValue(0);
  const last = useRef<number | null>(null);
  const pending = useRef(0);
  const frame = useRef(0);
  const opts = useRef({ max, smoothing });

  useEffect(() => {
    opts.current = { max, smoothing };
  });

  useEffect(() => {
    const count = typeof source === "number" ? source : source.length / charsPerToken;
    const prev = last.current;
    last.current = count;
    if (prev === null || count < prev) return; // first sight, or a reset
    pending.current += count - prev;
    if (frame.current) return;

    let then = performance.now();
    const step = (now: number) => {
      const dt = Math.min(0.1, Math.max(0.001, (now - then) / 1000));
      then = now;
      const observed = pending.current / dt;
      pending.current = 0;
      const { max, smoothing } = opts.current;
      const k = 1 - Math.exp(-dt / Math.max(0.05, smoothing));
      const next = tps.get() + (observed - tps.get()) * k;
      if (next < 0.05) {
        tps.set(0);
        rate.set(0);
        frame.current = 0;
        return;
      }
      tps.set(next);
      rate.set(Math.min(1, next / max));
      frame.current = requestAnimationFrame(step);
    };
    frame.current = requestAnimationFrame(step);
  }, [source, charsPerToken, tps, rate]);

  useEffect(
    () => () => {
      cancelAnimationFrame(frame.current);
      frame.current = 0;
    },
    [],
  );

  return { tps, rate };
}
