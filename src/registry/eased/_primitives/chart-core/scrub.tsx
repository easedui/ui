"use client";

import { animate, motion, useMotionValue, type MotionValue, type Transition } from "motion/react";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type FocusEvent,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from "react";
import { enter, exitFast, instant, smooth, snappy } from "../../lib/motion";

/* ---------- Active index store --------------------------------------------- */

/**
 * The scrubbed index, outside React state: the plot never re-renders while you scrub.
 * Only the pieces that show the value (tooltip, headline) subscribe.
 */
export type ActiveStore = {
  get(): number | null;
  set(index: number | null): void;
  subscribe(listener: () => void): () => void;
};

export function createActiveStore(): ActiveStore {
  let value: number | null = null;
  const listeners = new Set<() => void>();
  return {
    get: () => value,
    set(next) {
      if (next === value) return;
      value = next;
      for (const l of listeners) l();
    },
    subscribe(l) {
      listeners.add(l);
      return () => listeners.delete(l);
    },
  };
}

/** One store per chart, stable across renders. */
export function useActiveStore() {
  const [store] = useState(createActiveStore);
  return store;
}

/** Subscribe a component to the scrubbed index (re-renders only that component). */
export function useActiveIndex(store: ActiveStore) {
  return useSyncExternalStore(store.subscribe, store.get, () => null);
}

/* ---------- Scrub: pointer, keyboard, crosshair ---------------------------- */

export type UseChartScrubOptions = {
  /** Number of points (or bars). */
  count: number;
  store: ActiveStore;
  /** The pixel x of point `i`, relative to the scrub surface. */
  xOf: (index: number) => number;
  /** The nearest index to a pixel x on the scrub surface. */
  indexAt: (x: number) => number;
  /** What a screen reader hears for point `i`: date, then every visible value. */
  valueText: (index: number) => string;
  /** The figure's name, e.g. "Revenue, last 30 days". */
  label: string;
  onActiveChange?: (index: number | null) => void;
  reduced?: boolean;
  /** How the crosshair glides between points. Default `snappy`. */
  transition?: Transition;
};

/**
 * The interaction model every Eased chart shares (Arc's, kept): the plot is one
 * `role="slider"` whose value is the scrubbed point. Pointer and touch scrub it (vertical
 * page scroll still works); arrows step, PageUp/PageDown jump a tenth, Home/End go to the
 * ends, Escape lets go. `aria-valuetext` reads the date and every value, updated in place.
 *
 * Returns props to spread on the scrub surface (a div exactly over the plot) and the
 * crosshair's motion values: `x` glides to the active point, `opacity` fades it in and out.
 */
export function useChartScrub({ count, store, xOf, indexAt, valueText, label, onActiveChange, reduced = false, transition = snappy }: UseChartScrubOptions) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const opacity = useMotionValue(0);
  const latest = useRef({ count, xOf, valueText, onActiveChange, reduced, transition });
  useLayoutEffect(() => {
    latest.current = { count, xOf, valueText, onActiveChange, reduced, transition };
  });

  // Follow the store: glide the crosshair, keep ARIA current, notify.
  useEffect(() => {
    let shown = store.get() !== null;
    const sync = () => {
      const i = store.get();
      const { xOf, valueText, onActiveChange, reduced, transition, count } = latest.current;
      const el = ref.current;
      if (el && count > 0) {
        const now = i ?? count - 1;
        el.setAttribute("aria-valuenow", String(now));
        el.setAttribute("aria-valuetext", valueText(now));
      }
      if (i === null) {
        animate(opacity, 0, reduced ? instant : exitFast);
        shown = false;
      } else {
        const target = xOf(i);
        if (!shown || reduced) x.jump(target);
        else animate(x, target, transition);
        animate(opacity, 1, reduced ? instant : { duration: 0.12 });
        shown = true;
      }
      onActiveChange?.(i);
    };
    return store.subscribe(sync);
  }, [store, x, opacity]);

  // Data or size changed under an active point: clamp it and re-seat the crosshair.
  useLayoutEffect(() => {
    const i = store.get();
    if (i === null) return;
    if (i > count - 1) store.set(count > 0 ? count - 1 : null);
    else animate(x, xOf(i), reduced ? instant : smooth);
  }, [count, xOf, store, x, reduced]);

  const fromPointer = useCallback(
    (e: PointerEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const i = indexAt(e.clientX - rect.left);
      store.set(Math.max(0, Math.min(count - 1, i)));
    },
    [count, indexAt, store],
  );

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (count === 0) return;
    const i = store.get() ?? count - 1;
    const page = Math.max(1, Math.round(count / 10));
    const next: Record<string, number | null> = {
      ArrowRight: i + 1,
      ArrowUp: i + 1,
      ArrowLeft: i - 1,
      ArrowDown: i - 1,
      PageUp: i + page,
      PageDown: i - page,
      Home: 0,
      End: count - 1,
      Escape: null,
    };
    if (!(e.key in next)) return;
    e.preventDefault();
    const n = next[e.key];
    store.set(n === null ? null : Math.max(0, Math.min(count - 1, n)));
  };

  const last = Math.max(0, count - 1);
  const props = {
    ref,
    role: "slider",
    tabIndex: count > 0 ? 0 : -1,
    "aria-label": label,
    "aria-valuemin": 0,
    "aria-valuemax": last,
    "aria-valuenow": last,
    "aria-valuetext": count > 0 ? valueText(last) : undefined,
    "aria-orientation": "horizontal" as const,
    onKeyDown,
    onFocus: (e: FocusEvent<HTMLDivElement>) => {
      // Keyboard focus lands on the newest point; pointer focus is handled by the pointer.
      if (e.currentTarget.matches(":focus-visible") && store.get() === null && count > 0) store.set(count - 1);
    },
    onBlur: () => store.set(null),
    onPointerDown: fromPointer,
    onPointerMove: fromPointer,
    onPointerLeave: () => store.set(null),
    onPointerCancel: () => store.set(null),
    style: { touchAction: "pan-y" } as CSSProperties,
  };

  return { props, x, opacity };
}

/* ---------- Tooltip -------------------------------------------------------- */

export type ChartTooltipProps = {
  store: ActiveStore;
  /** The pixel x of point `i`, in the same coordinates as the tooltip's container. */
  xOf: (index: number) => number;
  /** The container's width; the tooltip flips to the left of the point before it overflows. */
  width: number;
  /** Gap between the point and the tooltip, px. Default 12. */
  offset?: number;
  /** Distance from the container's top, px. Default 0. */
  top?: number;
  reduced?: boolean;
  /** The content for point `i`. Re-rendered only while scrubbing, and only here. */
  children: (index: number) => ReactNode;
  className?: string;
};

/**
 * A floating readout that follows the scrubbed point on its own `smooth` spring, a beat
 * behind the crosshair, and flips sides before it would leave the plot. It keeps showing the
 * last point while it fades out, so content never blanks mid-exit. `aria-hidden`: the slider
 * already reads the same values.
 */
export function ChartTooltip({ store, xOf, width, offset = 12, top = 0, reduced = false, children, className = "" }: ChartTooltipProps) {
  const index = useActiveIndex(store);
  const [shown, setShown] = useState<number | null>(null);
  const el = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const visible = useRef(false);
  if (index !== null && index !== shown) setShown(index);

  useLayoutEffect(() => {
    if (index === null || !el.current) {
      visible.current = false;
      return;
    }
    const w = el.current.offsetWidth;
    const px = xOf(index);
    const right = px + offset + w <= width;
    const target = Math.max(0, Math.min(width - w, right ? px + offset : px - offset - w));
    if (!visible.current || reduced) x.jump(target);
    else animate(x, target, smooth);
    visible.current = true;
  }, [index, xOf, width, offset, reduced, x]);

  return (
    <motion.div
      ref={el}
      aria-hidden
      className={`pointer-events-none absolute left-0 z-10 rounded-control border border-line bg-surface-raised px-3 py-2 text-ui-xs text-text shadow-floating ${className}`}
      style={{ x, top }}
      initial={false}
      animate={index === null ? { opacity: 0, scale: 0.97 } : { opacity: 1, scale: 1 }}
      transition={reduced ? instant : index === null ? exitFast : enter}
    >
      {shown !== null && children(shown)}
    </motion.div>
  );
}

/** The crosshair's motion values, for a vertical rule in the plot's `<svg>`. */
export function Crosshair({ x, opacity, height, top = 0 }: { x: MotionValue<number>; opacity: MotionValue<number>; height: number; top?: number }) {
  return (
    <motion.line
      aria-hidden
      x1={0}
      x2={0}
      y1={top}
      y2={height}
      stroke="var(--eased-chart-cursor)"
      strokeWidth={1}
      style={{ x, opacity }}
      shapeRendering="crispEdges"
    />
  );
}
