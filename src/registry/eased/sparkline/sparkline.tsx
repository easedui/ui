"use client";

import { animate, motion, useMotionValue, useTransform } from "motion/react";
import { useCallback, useId, useLayoutEffect, useMemo, useRef } from "react";
import { snappy, useSafeReducedMotion } from "../lib/motion";
import { useDrawIn } from "../_primitives/chart-core/draw-in";
import { samplesToArea, samplesToPath, useMorphPath, type Curve, type MorphFrame } from "../_primitives/chart-core/morph";
import { linear, type Domain } from "../_primitives/chart-core/scales";
import { ChartTooltip, Crosshair, useActiveStore, useChartScrub } from "../_primitives/chart-core/scrub";
import { useChartTransition } from "../_primitives/chart-core/range";
import { useChartSize } from "../_primitives/chart-core/use-chart-size";
import { ChartTokens, chartColor } from "../_primitives/chart-core/tokens";

export type SparklineProps = {
  /** The values, oldest first, evenly spaced. */
  values: readonly number[];
  /** Accessible name, e.g. "Revenue, last 30 days". A summary (first, last, low, high) is appended. */
  label: string;
  /** Stroke colour. Default `var(--eased-chart-1)`. Use `chartColor(n)` or any token. */
  color?: string;
  /** Height in px. Default 32. The width follows the container. */
  height?: number;
  /** Add a soft wash under the line. Default false. */
  area?: boolean;
  /** Mark the newest value with a dot ringed in the surface colour. Default true. */
  dot?: boolean;
  /** Default "monotone". */
  curve?: Curve;
  /** Include zero in the value range (honest for counts and money). Default false: a sparkline shows shape. */
  zero?: boolean;
  /** Scrub to read values: a crosshair and a small readout, and the sparkline becomes a slider. Default false. */
  interactive?: boolean;
  /** Formats values for the readout and screen readers. */
  format?: (value: number) => string;
  /** The label of point `i` for the readout and screen readers, e.g. its date. */
  formatIndex?: (index: number) => string;
  onActiveChange?: (index: number | null) => void;
  className?: string;
};

const PAD = 5; // dot radius + ring: the newest point never clips
const fallbackFormat = (v: number) => new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 }).format(v);

function extent(values: readonly number[], zero: boolean): Domain {
  let lo = Infinity;
  let hi = -Infinity;
  for (const v of values) {
    if (v < lo) lo = v;
    if (v > hi) hi = v;
  }
  if (lo === Infinity) return [0, 1];
  if (zero) [lo, hi] = [Math.min(0, lo), Math.max(0, hi)];
  if (lo === hi) return [lo - 1, hi + 1];
  return [lo, hi];
}

/**
 * A word-sized line chart. It draws in left to right the first time it scrolls into view,
 * then the newest point settles in as a dot ringed in the surface colour. New values morph
 * the line from the shape on screen, so it can sit in a Stat Tile that changes range.
 */
export function Sparkline({
  values,
  label,
  color = chartColor(1),
  height = 32,
  area = false,
  dot = true,
  curve = "monotone",
  zero = false,
  interactive = false,
  format = fallbackFormat,
  formatIndex,
  onActiveChange,
  className = "",
}: SparklineProps) {
  const reduced = useSafeReducedMotion();
  const transition = useChartTransition();
  const [box, { width }] = useChartSize();
  const id = useId().replace(/:/g, "");
  const line = useRef<SVGPathElement>(null);
  const fill = useRef<SVGPathElement>(null);
  const end = useRef<SVGCircleElement>(null);
  const progress = useDrawIn(box, { reduced });
  const widthMV = useMotionValue(width);
  useLayoutEffect(() => widthMV.set(width), [width, widthMV]);
  const clipWidth = useTransform([progress, widthMV], ([p, w]: number[]) => p * (w + PAD * 2));
  const dotOpacity = useTransform(progress, [0.88, 1], [0, 1]);
  const dotScale = useTransform(progress, [0.88, 1], [0.5, 1]);

  const domain = useMemo(() => extent(values, zero), [values, zero]);
  const plotW = Math.max(0, width - PAD);

  const draw = useCallback(
    (f: MorphFrame) => {
      const s = f.series.v;
      if (!s) return;
      const x = (u: number) => u * plotW;
      const y = linear(f.domain, [height - PAD, PAD]);
      line.current?.setAttribute("d", samplesToPath(s, x, y));
      fill.current?.setAttribute("d", samplesToArea(s, x, y, height));
      if (end.current) {
        end.current.setAttribute("cx", String(x(1)));
        end.current.setAttribute("cy", String(y(s[s.length - 1])));
      }
    },
    [plotW, height],
  );
  const morph = useMorphPath(
    { series: { v: values }, domain },
    { onFrame: draw, curve, transition, animate: !reduced, samples: Math.min(240, Math.max(64, values.length * 12)) },
  );
  useLayoutEffect(() => morph.redraw(), [draw, morph]);

  // Scrubbing (opt-in).
  const store = useActiveStore();
  const n = values.length;
  const xOf = useCallback((i: number) => (n > 1 ? (i / (n - 1)) * plotW : plotW), [n, plotW]);
  const indexAt = useCallback((px: number) => (n > 1 ? Math.round((px / Math.max(1, plotW)) * (n - 1)) : 0), [n, plotW]);
  const valueText = useCallback((i: number) => `${formatIndex ? `${formatIndex(i)}: ` : ""}${format(values[i] ?? 0)}`, [format, formatIndex, values]);
  const activeY = useMotionValue(0);
  const scrub = useChartScrub({
    count: n,
    store,
    xOf,
    indexAt,
    valueText,
    label,
    reduced,
    onActiveChange: (i) => {
      if (i !== null) {
        const y = linear(domain, [height - PAD, PAD])(values[i]);
        if (reduced || scrub.opacity.get() < 0.01) activeY.jump(y);
        else animate(activeY, y, snappy);
      }
      onActiveChange?.(i);
    },
  });

  const summary = n
    ? `${format(values[0])} to ${format(values[n - 1])}, low ${format(Math.min(...values))}, high ${format(Math.max(...values))}`
    : "no data";

  return (
    <div
      ref={box}
      className={`relative w-full min-w-0 ${className}`}
      style={{ height }}
      {...(interactive ? {} : { role: "img", "aria-label": `${label}: ${summary}` })}
    >
      <ChartTokens />
      {width > 0 && (
        <svg aria-hidden width={width} height={height} className="absolute inset-0 overflow-visible">
          <defs>
            <clipPath id={`${id}-clip`}>
              <motion.rect x={-PAD} y={-PAD} height={height + PAD * 2} width={clipWidth} />
            </clipPath>
            <linearGradient id={`${id}-wash`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={color} stopOpacity={0.18} />
              <stop offset="1" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <g clipPath={`url(#${id}-clip)`}>
            {area && <path ref={fill} fill={`url(#${id}-wash)`} />}
            <path ref={line} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
          </g>
          {interactive && (
            <>
              <Crosshair x={scrub.x} opacity={scrub.opacity} height={height} />
              <motion.circle
                r={3}
                cx={0}
                fill={color}
                stroke="var(--chart-surface, var(--eased-surface))"
                strokeWidth={2}
                paintOrder="stroke"
                style={{ x: scrub.x, y: activeY, opacity: scrub.opacity }}
              />
            </>
          )}
          {dot && n > 0 && (
            <motion.circle
              ref={end}
              r={3}
              fill={color}
              stroke="var(--chart-surface, var(--eased-surface))"
              strokeWidth={2}
              paintOrder="stroke"
              style={{ opacity: dotOpacity, scale: dotScale, transformBox: "fill-box", transformOrigin: "center" }}
            />
          )}
        </svg>
      )}
      {interactive && (
        <>
          <div {...scrub.props} className="absolute inset-0 cursor-crosshair rounded-control-xs focus-ring" />
          <ChartTooltip store={store} xOf={xOf} width={width} top={-38} reduced={reduced} className="whitespace-nowrap py-1.5">
            {(i) => (
              <span className="flex items-baseline gap-2">
                {formatIndex && <span className="text-text-muted">{formatIndex(i)}</span>}
                <span className="font-medium tabular-nums">{format(values[i] ?? 0)}</span>
              </span>
            )}
          </ChartTooltip>
        </>
      )}
    </div>
  );
}
