"use client";

import { useRef, useState } from "react";
import { Button } from "../button/button";
import { DemoFrame } from "../lib/demo-frame";
import { ScrollArea } from "../scroll-area/scroll-area";
import { Segmented } from "../segmented/segmented";
import { ProgressiveBlur } from "./progressive-blur";

type Mode = "ramp" | "flat" | "off";

const MODES = [
  { value: "ramp", label: "Ramp" },
  { value: "flat", label: "Flat" },
  { value: "off", label: "Off" },
] as const;

const TONES = [
  "bg-info-subtle fill-info-text",
  "bg-warning-subtle fill-warning-text",
  "bg-success-subtle fill-success-text",
  "bg-danger-subtle fill-danger-text",
  "bg-surface-active fill-text-secondary",
  "bg-brand-subtle fill-brand-text",
];

const ALBUMS = [
  ["Low Tide", "Mara Lindqvist"],
  ["Paper Suns", "The Overpass"],
  ["Northern Rooms", "Iso Kaito"],
  ["Glasshouse", "Dela Cruz"],
  ["Small Hours", "June Arden"],
  ["Field Notes", "Halden Rowe"],
  ["Static Bloom", "Neon Parish"],
  ["Slow Light", "Halden Rowe"],
  ["Copper Coast", "Mara Lindqvist"],
  ["Weather Report", "Sol Ferreira"],
  ["After Image", "Iso Kaito"],
  ["Open Water", "The Overpass"],
];

/** A music library whose header and mini player blur the covers scrolling under them. */
export function ProgressiveBlurDemo() {
  const [mode, setMode] = useState<Mode>("ramp");
  const scroller = useRef<HTMLDivElement>(null);

  return (
    <DemoFrame
      title="Progressive Blur"
      actions={<Segmented size="sm" options={MODES} value={mode} onValueChange={setMode} aria-label="Blur style" />}
    >
      <div className="relative min-h-0 flex-1">
        <ScrollArea viewportRef={scroller} fade={0} className="h-full" contentClassName="px-4 pt-14 pb-20" aria-label="Albums">
          <ul className="grid grid-cols-3 gap-x-3 gap-y-4 @max-xs:grid-cols-2">
            {ALBUMS.map(([title, artist], i) => (
              <li key={title} className="min-w-0">
                <Cover tone={TONES[i % TONES.length]} shape={i % 4} />
                <p className="mt-1.5 truncate text-ui-sm font-medium text-text">{title}</p>
                <p className="truncate text-ui-xs text-text-muted">{artist}</p>
              </li>
            ))}
          </ul>
        </ScrollArea>

        {mode === "ramp" && <ProgressiveBlur side="top" size={72} scrollRef={scroller} scrollRange={48} />}
        {mode === "ramp" && <ProgressiveBlur side="bottom" size={96} scrollRef={scroller} scrollRange={48} />}
        {mode === "flat" && (
          <>
            <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-12 bg-surface/60 backdrop-blur-[20px]" />
            <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-surface/60 backdrop-blur-[20px]" />
          </>
        )}

        <div className="pointer-events-none absolute inset-x-0 top-0 flex h-12 items-center justify-between px-4">
          <p className="text-ui-lg font-medium text-text">Library</p>
          <p className="text-ui-sm text-text-muted tabular-nums">{ALBUMS.length} albums</p>
        </div>

        <NowPlaying />
      </div>
    </DemoFrame>
  );
}

function NowPlaying() {
  const [playing, setPlaying] = useState(false);
  return (
    // Inset to the grid's 16px content line; the cover and button nest inside its 10px corner.
    <div className="absolute inset-x-4 bottom-4 flex items-center gap-3 rounded-control border border-line bg-surface-raised p-1 shadow-floating [--pad:4px] [--radius-outer:var(--eased-radius-control)]">
      <span className="size-9 shrink-0 overflow-hidden radius-nested">
        <Cover tone={TONES[0]} shape={0} flat />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-ui-sm font-medium text-text">Low Tide</p>
        <p className="truncate text-ui-xs text-text-muted">Mara Lindqvist</p>
      </div>
      <Button
        variant="ghost"
        size="icon"
        aria-label={playing ? "Pause" : "Play"}
        onClick={() => setPlaying((p) => !p)}
        className="radius-nested! text-text"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden className="fill-current">
          {playing ? <path d="M4 3h3v10H4zM9 3h3v10H9z" /> : <path d="M5.2 2.8v10.4L13.4 8z" />}
        </svg>
      </Button>
    </div>
  );
}

function Cover({ tone, shape, flat = false }: { tone: string; shape: number; flat?: boolean }) {
  return (
    <div className={`${tone} flex aspect-square w-full items-center justify-center ${flat ? "" : "image-ring overflow-hidden rounded-control"}`}>
      <svg viewBox="0 0 40 40" className="h-3/5 w-3/5" aria-hidden>
        {shape === 0 && <circle cx="20" cy="20" r="14" />}
        {shape === 1 && <rect x="7" y="7" width="26" height="26" rx="4" />}
        {shape === 2 && <path d="M20 5 36 34H4Z" />}
        {shape === 3 && (
          <>
            <circle cx="13" cy="20" r="9" />
            <circle cx="27" cy="20" r="9" opacity=".6" />
          </>
        )}
      </svg>
    </div>
  );
}
