"use client";

import type { ReactNode } from "react";
import { press } from "../../lib/press";

export type ChartKey = {
  key: string;
  label: string;
  /** CSS colour, usually `chartColor(n)`. */
  color: string;
  /** Previous-period style: a dashed line key. */
  dashed?: boolean;
};

/** A series' identity mark: a short line key for lines, a rounded square for bars and areas. */
export function ChartSwatch({ color, shape = "square", dashed = false, off = false }: { color: string; shape?: "line" | "square"; dashed?: boolean; off?: boolean }) {
  if (shape === "line") {
    return (
      <svg aria-hidden width={12} height={8} viewBox="0 0 12 8" className="shrink-0 overflow-visible">
        <line x1={1} x2={11} y1={4} y2={4} stroke={color} strokeWidth={2} strokeLinecap="round" strokeDasharray={dashed ? "2 3" : undefined} opacity={off ? 0.35 : dashed ? 0.6 : 1} />
      </svg>
    );
  }
  return (
    <span
      aria-hidden
      className="size-2 shrink-0 rounded-[calc(var(--eased-radius-control-2xs)/2)] transition-opacity duration-150 ease-standard"
      style={{ background: off ? "transparent" : color, boxShadow: off ? `inset 0 0 0 1.5px ${color}` : undefined, opacity: off ? 0.6 : 1 }}
    />
  );
}

export type ChartLegendProps = {
  items: readonly ChartKey[];
  /** Keys currently hidden. */
  hidden?: ReadonlySet<string>;
  /** Makes each key a toggle button. Leave out for a static legend. */
  onToggle?: (key: string) => void;
  /** Hovering or focusing a key previews it: the chart dims the others. */
  onPreview?: (key: string | null) => void;
  shape?: "line" | "square";
  /** Extra content on the right, e.g. a total. */
  trailing?: ReactNode;
  className?: string;
};

/**
 * The legend: always present for two or more series, so identity never rests on colour.
 * As toggles, each key is a pressed/unpressed button; the row is pulled left by the buttons'
 * padding so the first swatch sits on the content's left line (rule 104).
 */
export function ChartLegend({ items, hidden, onToggle, onPreview, shape = "square", trailing, className = "" }: ChartLegendProps) {
  return (
    <div className={`flex min-w-0 items-center justify-between gap-3 ${className}`}>
      <ul className={`flex min-w-0 flex-wrap items-center ${onToggle ? "-ml-2 gap-x-0.5" : "gap-x-4"} gap-y-1`}>
        {items.map((item) => {
          const off = hidden?.has(item.key) ?? false;
          const body = (
            <>
              <ChartSwatch color={item.color} shape={shape} dashed={item.dashed} off={off} />
              <span className="truncate">{item.label}</span>
            </>
          );
          return (
            <li key={item.key} className="min-w-0">
              {onToggle ? (
                <button
                  type="button"
                  aria-pressed={!off}
                  onClick={() => onToggle(item.key)}
                  onPointerEnter={(e) => e.pointerType === "mouse" && onPreview?.(item.key)}
                  onPointerLeave={() => onPreview?.(null)}
                  onFocus={() => onPreview?.(item.key)}
                  onBlur={() => onPreview?.(null)}
                  className={`${press} inline-flex h-6 max-w-full cursor-pointer items-center gap-1.5 rounded-control-xs px-2 text-ui-xs hover-fine:bg-surface-hover ${off ? "text-text-muted" : "text-text-secondary hover-fine:text-text"}`}
                >
                  {body}
                </button>
              ) : (
                <span className="inline-flex h-6 items-center gap-1.5 text-ui-xs text-text-secondary">{body}</span>
              )}
            </li>
          );
        })}
      </ul>
      {trailing}
    </div>
  );
}
