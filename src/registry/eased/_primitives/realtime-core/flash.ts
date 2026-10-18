"use client";

import { useEffect, useRef, useState } from "react";

export type FlashDirection = "up" | "down";

/** How long a changed cell stays washed: 0.9s, long enough to catch, short enough not to pile up. */
export const FLASH_MS = 900;

/** `up`, `down`, or null when the change is within `epsilon` (or there is no previous value). */
export function flashDirection(prev: number | undefined, next: number, epsilon = 0): FlashDirection | null {
  if (prev === undefined || !Number.isFinite(prev) || !Number.isFinite(next)) return null;
  if (next - prev > epsilon) return "up";
  if (prev - next > epsilon) return "down";
  return null;
}

export type Flash = {
  /** The direction of the latest change while it is washing, else null. */
  direction: FlashDirection | null;
  /** Increments on every change: key a one-shot wash element by it to restart the wash. */
  key: number;
};

type FlashState = { values: Record<string, number>; flashes: Record<string, Flash> };

/**
 * Flash-on-change for many cells at once (an FX board, an order book): each id reports `up` or
 * `down` for `duration` ms after its value changes, then null. The first render reports
 * nothing, so a board doesn't flash on mount. Colour only: pair it with `bg-success-subtle` /
 * `bg-danger-subtle` on a background-colour transition, which reduced motion may keep.
 *
 *   const flashes = useFlashMap(Object.fromEntries(rows.map((r) => [r.id, r.price])));
 *   <td data-flash={flashes[row.id]?.direction ?? undefined}>
 */
export function useFlashMap(values: Record<string, number>, { duration = FLASH_MS, epsilon = 0 } = {}): Record<string, Flash> {
  const [state, setState] = useState<FlashState>(() => ({ values, flashes: {} }));

  // Adjust state while rendering when the inputs change (React's documented pattern), so the
  // wash starts on the same frame as the new value, not one effect later.
  let changed: Record<string, Flash> | null = null;
  for (const id in values) {
    const dir = flashDirection(state.values[id], values[id], epsilon);
    if (dir || state.values[id] !== values[id]) {
      changed ??= { ...state.flashes };
      if (dir) changed[id] = { direction: dir, key: (state.flashes[id]?.key ?? 0) + 1 };
    }
  }
  if (changed) setState({ values, flashes: changed });

  const flashes = changed ?? state.flashes;
  const signature = Object.entries(flashes)
    .filter(([, f]) => f.direction)
    .map(([id, f]) => `${id}:${f.key}`)
    .join("|");

  // One timer per wash, so each cell clears `duration` after its own change.
  const timers = useRef(new Map<string, number>());
  useEffect(() => {
    if (!signature) return;
    for (const part of signature.split("|")) {
      const cut = part.lastIndexOf(":");
      const id = part.slice(0, cut);
      const key = Number(part.slice(cut + 1));
      const scheduled = `${id}:${key}`;
      if (timers.current.has(scheduled)) continue;
      const timer = window.setTimeout(() => {
        timers.current.delete(scheduled);
        setState((s) =>
          s.flashes[id]?.key === key ? { ...s, flashes: { ...s.flashes, [id]: { direction: null, key } } } : s,
        );
      }, duration);
      timers.current.set(scheduled, timer);
    }
  }, [signature, duration]);
  useEffect(() => {
    const map = timers.current;
    return () => {
      for (const t of map.values()) clearTimeout(t);
      map.clear();
    };
  }, []);

  return flashes;
}

/** Flash-on-change for one value. */
export function useFlash(value: number, options?: { duration?: number; epsilon?: number }): Flash {
  const flashes = useFlashMap({ v: value }, options);
  return flashes.v ?? { direction: null, key: 0 };
}
