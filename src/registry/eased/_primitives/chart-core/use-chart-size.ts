"use client";

import { useLayoutEffect, useRef, useState, type RefObject } from "react";

export type ChartSize = { width: number; height: number };

/**
 * The content-box size of an element, kept current with a ResizeObserver and rounded to
 * whole pixels so sub-pixel jitter never re-renders a chart. 0 × 0 until measured (and on the
 * server), so draw nothing until `width > 0`.
 */
export function useChartSize<T extends HTMLElement = HTMLDivElement>(): [RefObject<T | null>, ChartSize] {
  const ref = useRef<T>(null);
  const [size, setSize] = useState<ChartSize>({ width: 0, height: 0 });

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = (width: number, height: number) => {
      const w = Math.round(width);
      const h = Math.round(height);
      setSize((s) => (s.width === w && s.height === h ? s : { width: w, height: h }));
    };
    const rect = el.getBoundingClientRect();
    update(rect.width, rect.height);
    const ro = new ResizeObserver(([entry]) => update(entry.contentRect.width, entry.contentRect.height));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return [ref, size];
}
