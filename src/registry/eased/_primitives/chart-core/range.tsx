"use client";

import type { Transition } from "motion/react";
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { smooth } from "../../lib/motion";

/**
 * The shared date range of a page of charts. Changing it is one coordinated beat: every chart
 * under the provider morphs on the same transition, starting in the same frame.
 *
 * Frozen contract (lane 5 → Range Picker, Metrics Dashboard):
 *   range       the selected range key, e.g. "7d"
 *   setRange    select another range
 *   beat        increments on every change; key per-change effects off it
 *   transition  the morph every chart under the provider uses
 *   compare     whether a previous-period series is shown
 *   setCompare  toggle it
 */
export type ChartRangeValue<R extends string = string> = {
  range: R;
  setRange: (range: R) => void;
  beat: number;
  transition: Transition;
  compare: boolean;
  setCompare: (compare: boolean) => void;
};

export const ChartRangeContext = createContext<ChartRangeValue | null>(null);

export type ChartRangeProviderProps<R extends string> = {
  /** Controlled range. */
  value?: R;
  /** Uncontrolled initial range. */
  defaultValue?: R;
  onValueChange?: (range: R) => void;
  compare?: boolean;
  defaultCompare?: boolean;
  onCompareChange?: (compare: boolean) => void;
  /** The morph shared by every chart below. Default `smooth`. */
  transition?: Transition;
  children: ReactNode;
};

export function ChartRangeProvider<R extends string>({
  value,
  defaultValue,
  onValueChange,
  compare: compareProp,
  defaultCompare = false,
  onCompareChange,
  transition = smooth,
  children,
}: ChartRangeProviderProps<R>) {
  const [inner, setInner] = useState(defaultValue as R);
  const [innerCompare, setInnerCompare] = useState(defaultCompare);
  const [beat, setBeat] = useState(0);
  const range = value ?? inner;
  const compare = compareProp ?? innerCompare;

  const setRange = useCallback(
    (next: R) => {
      if (next === range) return;
      setInner(next);
      setBeat((b) => b + 1);
      onValueChange?.(next);
    },
    [range, onValueChange],
  );
  const setCompare = useCallback(
    (next: boolean) => {
      setInnerCompare(next);
      onCompareChange?.(next);
    },
    [onCompareChange],
  );

  const ctx = useMemo(
    () => ({ range, setRange, beat, transition, compare, setCompare }) as unknown as ChartRangeValue,
    [range, setRange, beat, transition, compare, setCompare],
  );
  return <ChartRangeContext.Provider value={ctx}>{children}</ChartRangeContext.Provider>;
}

/** The surrounding range, or null outside a `ChartRangeProvider`. */
export function useChartRange<R extends string = string>() {
  return useContext(ChartRangeContext) as ChartRangeValue<R> | null;
}

/** The morph transition a chart should use: the provider's, else `fallback`. */
export function useChartTransition(fallback: Transition = smooth) {
  return useContext(ChartRangeContext)?.transition ?? fallback;
}
