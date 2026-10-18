"use client";

import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { DemoFrame } from "../../lib/demo-frame";
import { TextSwap } from "../../text-swap/text-swap";
import { useDrag } from "./use-drag";

const PLACES = [
  { name: "Ritual Coffee", kind: "Espresso bar", walk: 3, rating: 4.7 },
  { name: "Saint Frank", kind: "Café", walk: 6, rating: 4.6 },
  { name: "Andytown", kind: "Roastery", walk: 9, rating: 4.8 },
  { name: "Sightglass", kind: "Roastery", walk: 11, rating: 4.5 },
  { name: "Linea Caffe", kind: "Espresso bar", walk: 12, rating: 4.4 },
  { name: "Wrecking Ball", kind: "Café", walk: 14, rating: 4.6 },
  { name: "Flywheel", kind: "Roastery", walk: 17, rating: 4.3 },
  { name: "Réveille", kind: "Café", walk: 19, rating: 4.2 },
  { name: "Equator", kind: "Espresso bar", walk: 22, rating: 4.5 },
  { name: "Four Barrel", kind: "Roastery", walk: 25, rating: 4.4 },
];

const DETENTS = ["Full", "Half", "Peek"] as const;
const TOP = 8; // the full detent's gap below the header
const PEEK = 92; // how much of the sheet the peek detent shows

/**
 * The gesture kit on a three-detent sheet: drag the grabber or the list. Flicks project onto
 * the detent they would coast to, pulls past the top rubber-band, and a scroll that reaches the
 * top of the list hands over to dragging the sheet down.
 */
export function GestureKitDemo() {
  const area = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(372);

  useEffect(() => {
    const el = area.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setHeight(el.clientHeight));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const points = [TOP, Math.round(height * 0.46), height - PEEK];
  // Destructure: the React Compiler treats the whole object as a ref once `ref` is passed on.
  const { ref, value, dragging, index, snapTo, onKeyDown } = useDrag({ snapPoints: points, defaultIndex: 1 });
  const detent = DETENTS[index] ?? "Half";

  return (
    <DemoFrame
      title="Nearby"
      meta={<TextSwap>{detent}</TextSwap>}
    >
      <div ref={area} className="relative min-h-0 flex-1 overflow-hidden bg-surface-sunken">
        <MapBackdrop />

        <motion.div
          ref={ref}
          style={{ y: value, height: height - TOP }}
          className={`absolute inset-x-0 top-0 flex flex-col rounded-t-surface border border-b-0 border-line bg-surface-raised shadow-overlay select-none ${
            dragging ? "cursor-grabbing" : "cursor-grab"
          }`}
        >
          <button
            type="button"
            role="slider"
            aria-label="Sheet height"
            aria-orientation="vertical"
            aria-valuemin={0}
            aria-valuemax={2}
            aria-valuenow={2 - index}
            aria-valuetext={detent}
            onKeyDown={onKeyDown}
            onClick={() => snapTo(index === 0 ? 2 : index - 1)}
            className="group mx-auto flex h-6 w-16 shrink-0 cursor-[inherit] items-center justify-center rounded-control-xs focus-ring"
          >
            <span className="h-1 w-9 rounded-pill bg-line-strong transition-colors duration-150 ease-standard hover-fine:bg-text-muted group-focus-visible:bg-text-muted" />
          </button>

          <div className="flex shrink-0 items-baseline justify-between px-4 pb-2">
            <p className="text-ui-md font-medium text-text">Coffee near you</p>
            <p className="text-ui-sm text-text-muted tabular-nums">{PLACES.length} places</p>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain border-t border-line-subtle">
            <ul className="pb-4">
              {PLACES.map((p) => (
                <li key={p.name} className="flex h-12 items-center gap-3 border-b border-line-subtle px-4 last:border-b-0">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-control-sm bg-surface-sunken text-text-muted">
                    <CupIcon />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-ui-sm font-medium text-text">{p.name}</p>
                    <p className="truncate text-ui-xs text-text-muted">
                      {p.kind} · {p.walk} min walk
                    </p>
                  </div>
                  <span className="shrink-0 text-ui-xs text-text-secondary tabular-nums">★ {p.rating.toFixed(1)}</span>
                </li>
              ))}
            </ul>
          </div>
        </motion.div>
      </div>
    </DemoFrame>
  );
}

function MapBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      <div className="absolute inset-0 bg-[linear-gradient(var(--eased-line-subtle)_1px,transparent_1px),linear-gradient(90deg,var(--eased-line-subtle)_1px,transparent_1px)] bg-size-[28px_28px]" />
      <div className="absolute top-[18%] left-[-10%] h-3 w-[120%] rotate-[-8deg] bg-surface" />
      <div className="absolute top-0 left-[58%] h-full w-3 rotate-[6deg] bg-surface" />
      {[
        ["24%", "30%"],
        ["62%", "12%"],
        ["40%", "70%"],
      ].map(([top, left], i) => (
        <span
          key={i}
          style={{ top, left }}
          className={`absolute size-3 rounded-pill border-2 border-surface shadow-thumb ${i === 0 ? "bg-brand" : "bg-text-muted"}`}
        />
      ))}
    </div>
  );
}

function CupIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3 6h8v4a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V6Z" />
      <path d="M11 7h1a1.5 1.5 0 0 1 0 3h-1" />
      <path d="M6 2.5v1.5M8.5 2.5v1.5" />
    </svg>
  );
}
