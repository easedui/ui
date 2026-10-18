"use client";

import { AnimatePresence, motion, useMotionValueEvent, type MotionValue, type Transition } from "motion/react";
import { useLayoutEffect, useRef } from "react";
import { exitFast, fade, instant } from "../../lib/motion";
import { linear, type Domain } from "./scales";

export type ChartGridProps = {
  /** Gridline values, usually `niceScale(...).ticks`. */
  ticks: readonly number[];
  /** The live value domain. Gridlines ride it, so they slide while the scale springs. */
  domain: MotionValue<Domain>;
  /** Full width, px, gutter included. */
  width: number;
  /** Left gutter for the labels, px (see `gutterFor`). Lines start after it. Default 0: labels sit above the lines. */
  gutter?: number;
  /** Pixel range the domain maps to, top to bottom: `[top, bottom]`. */
  range: Domain;
  /** Tick label text. Leave out for unlabelled gridlines. */
  format?: (value: number) => string;
  reduced?: boolean;
};

/** A label gutter wide enough for the widest tick label (11px tabular figures), plus an 8px gap. */
export function gutterFor(labels: readonly string[]) {
  const longest = labels.reduce((m, l) => Math.max(m, l.length), 0);
  return longest ? Math.ceil(longest * 6.4) + 8 : 0;
}

/**
 * Hairline gridlines with their labels left-aligned on the chart's leading edge (the same x
 * as the headline and legend above it): in a gutter beside the lines, or just above them. When the domain changes, lines that
 * stay slide with the springing scale; new values fade in and retired ones fade out while
 * still sliding, so nothing pops. SVG; render it inside the plot's `<svg>`.
 */
export function ChartGrid({ ticks, domain, width, gutter = 0, range, format, reduced = false }: ChartGridProps) {
  return (
    <g aria-hidden>
      <AnimatePresence initial={false}>
        {ticks.map((t) => (
          <Tick key={t} value={t} domain={domain} width={width} gutter={gutter} range={range} label={format?.(t)} reduced={reduced} />
        ))}
      </AnimatePresence>
    </g>
  );
}

function Tick({ value, domain, width, gutter, range, label, reduced }: { value: number; domain: MotionValue<Domain>; width: number; gutter: number; range: Domain; label?: string; reduced: boolean }) {
  const ref = useRef<SVGGElement>(null);
  const place = (d: Domain) => {
    const y = Math.round(linear(d, [range[1], range[0]])(value)) + 0.5;
    ref.current?.setAttribute("transform", `translate(0 ${y})`);
  };
  useLayoutEffect(() => place(domain.get()));
  useMotionValueEvent(domain, "change", place);

  return (
    <motion.g
      ref={ref}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: reduced ? instant : fade }}
      exit={{ opacity: 0, transition: reduced ? instant : exitFast }}
    >
      <line x1={gutter} x2={width} stroke="var(--eased-chart-grid)" strokeWidth={1} shapeRendering="crispEdges" />
      {label !== undefined && (
        <text y={gutter ? 0 : -6} dominantBaseline={gutter ? "central" : undefined} className="fill-text-muted tabular-nums" style={{ fontSize: 11 }}>
          {label}
        </text>
      )}
    </motion.g>
  );
}

export type ChartXAxisProps = {
  /** The labels to show (already thinned), each with its bucket's key and pixel x. */
  items: readonly { key: string; x: number; text: string; align?: "start" | "center" | "end" }[];
  /** Morph transition for labels that stay. */
  transition: Transition;
  reduced?: boolean;
  /** Left offset of the row, px: the plot's gutter. */
  left?: number;
  className?: string;
};

/**
 * X labels in an HTML row under the plot. Labels keyed by their bucket slide to their new
 * position when the range changes; others fade. The first label starts on the plot's left
 * line and the last ends on its right line (`align`), so neither clips and both edges stay true.
 */
export function ChartXAxis({ items, transition, reduced = false, left = 0, className = "" }: ChartXAxisProps) {
  return (
    <div aria-hidden className={`pointer-events-none h-4 text-ui-2xs text-text-muted tabular-nums ${className}`} style={{ left }}>
      <AnimatePresence initial={false}>
        {items.map((item) => {
          const shift = item.align === "start" ? "" : item.align === "end" ? "-translate-x-full" : "-translate-x-1/2";
          return (
            <motion.span
              key={item.key}
              className={`absolute top-0 left-0 whitespace-nowrap ${shift}`}
              initial={{ x: item.x, opacity: 0 }}
              animate={{ x: item.x, opacity: 1, transition: reduced ? instant : { x: transition, opacity: fade } }}
              exit={{ opacity: 0, transition: reduced ? instant : exitFast }}
            >
              {item.text}
            </motion.span>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
