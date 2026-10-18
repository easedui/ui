"use client";

import { AnimatePresence, MotionConfig, motion } from "motion/react";
import { useEffect, useId, useRef, useState } from "react";
import { DemoFrame } from "../lib/demo-frame";
import { enter, fade, snappy, swap, swapIn, swapOut, swapShown } from "../lib/motion";
import { press } from "../lib/press";
import { Frame, FrameInner } from "./concentric-frame";

// Fixed geometry of the player, mirrored by the guides so they draw the rendered curves.
const BORDER = 1;
const GROUP_PAD = 4;
const BUTTON_H = 36;
const GROUP_H = BUTTON_H + GROUP_PAD * 2;
const MIN = 2; // the Frame's default inner-radius floor

// What <Frame> computes: outer − padding − border, floored at MIN, never above the outer.
const nested = (outer: number, pad: number, border: number) => Math.min(outer, Math.max(MIN, outer - pad - border));

export function ConcentricFrameDemo() {
  const [radius, setRadius] = useState(24);
  const [pad, setPad] = useState(10);
  const [naive, setNaive] = useState(false);
  const [playing, setPlaying] = useState(true);

  // Guides show while a thumb is held, while the pointer is over the card, and briefly after keys.
  const [dragging, setDragging] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [pulsing, setPulsing] = useState(false);
  const pulseTimer = useRef(0);

  const pulse = (ms = 900) => {
    setPulsing(true);
    window.clearTimeout(pulseTimer.current);
    pulseTimer.current = window.setTimeout(() => setPulsing(false), ms);
  };
  useEffect(() => () => window.clearTimeout(pulseTimer.current), []);

  useEffect(() => {
    if (!dragging) return;
    const up = () => setDragging(false);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    return () => {
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    };
  }, [dragging]);

  const raw = radius - pad - BORDER;
  const inner = naive ? radius : nested(radius, pad, BORDER);
  const formula = naive
    ? "= outer radius"
    : raw < MIN
      ? `= max(${MIN}, ${radius} − ${pad} − 1)`
      : `= ${radius} − ${pad} − 1`;

  return (
    <MotionConfig reducedMotion="user">
      <DemoFrame
        title={
          <p className="flex min-w-0 items-center gap-2">
            <span className="shrink-0">Inner radius</span>
            <span className="inline-flex shrink-0 items-center tabular-nums">
              <RollingNumber value={inner} />
              <span className="text-text-muted">px</span>
            </span>
            {/* The formula is a bonus; narrow tiles drop it rather than truncate it. */}
            <span className="truncate text-ui-sm font-normal text-text-muted tabular-nums @max-sm:hidden">{formula}</span>
          </p>
        }
        actions={
          <NaiveSwitch
            checked={naive}
            onChange={(v) => {
              setNaive(v);
              pulse(1400);
            }}
          />
        }
      >
        <div className="flex min-h-0 flex-1 items-center justify-center bg-surface-sunken px-4">
          <Frame
            radius={radius}
            pad={pad}
            border={BORDER}
            concentric={!naive}
            onPointerEnter={(e: React.PointerEvent) => e.pointerType === "mouse" && setHovering(true)}
            onPointerLeave={() => setHovering(false)}
            className="relative flex w-full max-w-72 flex-col gap-3 border-line-subtle bg-surface"
          >
            <FrameInner className="image-ring aspect-[2/1] overflow-hidden">
              <Cover />
            </FrameInner>

            <div className="flex items-baseline justify-between gap-3 px-1">
              <div className="min-w-0">
                <p className="truncate text-ui font-medium text-text">Slow Light</p>
                <p className="truncate text-ui-sm text-text-muted">Halden Rowe</p>
              </div>
              <p className="shrink-0 text-ui-sm text-text-muted tabular-nums">2:14 / 3:48</p>
            </div>

            <Frame pad={GROUP_PAD} border={0} className="flex gap-1 bg-surface-sunken inset-shadow-well">
              <PlayerButton label="Previous track">
                <SkipIcon className="-scale-x-100" />
              </PlayerButton>
              <PlayerButton label={playing ? "Pause" : "Play"} primary onClick={() => setPlaying((p) => !p)}>
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.span
                    key={playing ? "pause" : "play"}
                    className="inline-flex"
                    initial={swapIn}
                    animate={swapShown}
                    exit={swapOut}
                    transition={swap}
                  >
                    {playing ? <PauseIcon /> : <PlayIcon />}
                  </motion.span>
                </AnimatePresence>
              </PlayerButton>
              <PlayerButton label="Next track">
                <SkipIcon />
              </PlayerButton>
            </Frame>

            <Guides radius={radius} pad={pad} naive={naive} visible={dragging || hovering || pulsing} />
          </Frame>
        </div>

        <div className="border-t border-line-subtle px-4 py-4">
          <div className="grid grid-cols-2 gap-6 @max-xs:gap-4">
            <Slider
              label="Outer radius"
              min={8}
              max={32}
              value={radius}
              onChange={setRadius}
              onGrab={() => setDragging(true)}
              onKey={() => pulse()}
            />
            <Slider
              label="Padding"
              min={0}
              max={24}
              value={pad}
              onChange={setPad}
              onGrab={() => setDragging(true)}
              onKey={() => pulse()}
            />
          </div>
        </div>
      </DemoFrame>
    </MotionConfig>
  );
}

/* ---------- Guides: each corner's arc and centre, so concentricity is visible ---------- */

type Arc = { c: number; r: number };

function Guides({ radius, pad, naive, visible }: { radius: number; pad: number; naive: boolean; visible: boolean }) {
  // Rendered radii: the browser shrinks any radius past half the box, so the guides do too.
  const inner = naive ? radius : nested(radius, pad, BORDER);
  const group = Math.min(inner, GROUP_H / 2);
  const button = Math.min(naive ? radius : nested(inner, GROUP_PAD, 0), BUTTON_H / 2);

  // Centres measured from the padding box, which is what this overlay fills.
  const outer: Arc = { c: radius - BORDER, r: radius };
  const top = [outer, { c: pad + inner, r: inner }];
  const bottom = [outer, { c: pad + group, r: group }, { c: pad + GROUP_PAD + button, r: button }];

  return (
    <motion.div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-10"
      initial={false}
      animate={{ opacity: visible ? 1 : 0 }}
      transition={visible ? enter : fade}
    >
      <Corner arcs={top} className="top-0 left-0" />
      <Corner arcs={top} className="top-0 left-full -scale-x-100" />
      <Corner arcs={bottom} className="top-full left-0 -scale-y-100" />
      <Corner arcs={bottom} className="top-full left-full -scale-100" />
    </motion.div>
  );
}

function Corner({ arcs, className }: { arcs: Arc[]; className: string }) {
  return (
    <svg className={`absolute size-px origin-top-left overflow-visible ${className}`}>
      {arcs
        .filter((a) => a.r > 0.5)
        .map(({ c, r }, i) => {
          const quarter = `M ${c - r} ${c} A ${r} ${r} 0 0 1 ${c} ${c - r}`;
          return (
            <g key={i} fill="none">
              <circle cx={c} cy={c} r={r} strokeDasharray="2 3" className="stroke-text-muted" strokeOpacity={0.45} />
              <path d={`M ${c - r} ${c} H ${c} V ${c - r}`} className="stroke-text-muted" strokeOpacity={0.35} />
              <path d={quarter} className="stroke-bg" strokeOpacity={0.6} strokeWidth={3} strokeLinecap="round" />
              <path d={quarter} className="stroke-brand-text" strokeWidth={1.25} strokeLinecap="round" />
              <circle cx={c} cy={c} r={1.75} className="fill-brand-text stroke-bg" strokeWidth={1} />
            </g>
          );
        })}
    </svg>
  );
}

/* ---------- Controls ---------- */

function Slider({
  label,
  min,
  max,
  value,
  onChange,
  onGrab,
  onKey,
}: {
  label: string;
  min: number;
  max: number;
  value: number;
  onChange: (v: number) => void;
  onGrab: () => void;
  onKey: () => void;
}) {
  const id = useId();
  const pct = (value - min) / (max - min);

  return (
    <div className="group flex flex-col gap-2">
      <div className="flex items-center justify-between text-ui-sm">
        <label htmlFor={id} className="min-w-0 truncate text-text-secondary">
          {label}
        </label>
        <span className="shrink-0 text-text tabular-nums">
          {value}
          <span className="text-text-muted">px</span>
        </span>
      </div>

      <div className="relative h-4">
        {/* The native range owns input, keys and a11y; its 16px thumb matches the drawn one. */}
        <input
          id={id}
          type="range"
          min={min}
          max={max}
          step={1}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          onPointerDown={onGrab}
          onKeyDown={onKey}
          className="absolute inset-x-0 top-1/2 z-10 h-11 w-full -translate-y-1/2 cursor-pointer appearance-none bg-transparent opacity-0 [&::-moz-range-thumb]:size-4 [&::-moz-range-thumb]:border-0 [&::-webkit-slider-thumb]:size-4 [&::-webkit-slider-thumb]:appearance-none"
        />
        <div className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 overflow-hidden rounded-pill bg-surface-active inset-shadow-well">
          {/* A fixed cap plus a scaled run, so the fill ends under the thumb's centre. */}
          <div className="absolute inset-y-0 left-0 w-2 bg-brand" />
          <div className="absolute inset-y-0 right-2 left-2 origin-left bg-brand" style={{ transform: `scaleX(${pct})` }} />
        </div>
        <div className="pointer-events-none absolute inset-y-0 right-4 left-0">
          <div className="absolute inset-0" style={{ transform: `translateX(${pct * 100}%)` }}>
            <span className="absolute top-0 left-0 size-4 rounded-pill bg-text shadow-thumb outline-offset-2 group-has-[input:focus-visible]:outline-2 group-has-[input:focus-visible]:outline-focus" />
          </div>
        </div>
      </div>
    </div>
  );
}

function NaiveSwitch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="group -me-1.5 inline-flex h-control-sm shrink-0 cursor-pointer items-center gap-2.5 rounded-control-sm pr-1.5 pl-2.5 text-ui-sm font-medium text-text-muted transition-[color,background-color,border-color,box-shadow] duration-150 ease-standard hover-fine:bg-surface-hover hover-fine:text-text focus-ring"
    >
      Naive
      {/* The shared switch recipe: 20×36 track, 16px thumb, 2px padding. */}
      <span
        className={`flex h-5 w-9 rounded-pill p-0.5 transition-colors duration-150 ease-standard ${checked ? "bg-brand" : "bg-surface-active"}`}
      >
        <motion.span
          className={`size-4 rounded-pill shadow-thumb transition-colors duration-150 ease-standard ${checked ? "bg-text-on-brand" : "bg-text-secondary"}`}
          initial={false}
          animate={{ x: checked ? 16 : 0 }}
          transition={snappy}
        />
      </span>
    </button>
  );
}

/* ---------- Rolling digits ---------- */

function RollingNumber({ value }: { value: number }) {
  const tens = Math.floor(value / 10) % 10;
  return (
    <>
      <span className="sr-only">{value}</span>
      <span aria-hidden className="inline-flex">
        <Digit digit={tens} hidden={value < 10} />
        <Digit digit={value % 10} />
      </span>
    </>
  );
}

function Digit({ digit, hidden = false }: { digit: number; hidden?: boolean }) {
  return (
    <span className="relative inline-block h-[1lh] w-[1ch] overflow-hidden">
      <motion.span
        className="absolute inset-x-0 top-0 flex flex-col text-center"
        initial={false}
        animate={{ y: `${-digit * 10}%`, opacity: hidden ? 0 : 1 }}
        transition={{ ...snappy, opacity: fade }}
      >
        {Array.from({ length: 10 }, (_, n) => (
          <span key={n} className="h-[1lh]">
            {n}
          </span>
        ))}
      </motion.span>
    </span>
  );
}

/* ---------- Player parts ---------- */

function PlayerButton({
  label,
  primary = false,
  onClick,
  children,
}: {
  label: string;
  primary?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <FrameInner
      as="button"
      type="button"
      aria-label={label}
      onClick={onClick}
      className={`inline-flex h-9 flex-1 cursor-pointer items-center justify-center ${press} ${
        primary
          ? "bg-brand text-text-on-brand inset-shadow-highlight hover-fine:bg-brand-hover"
          : "bg-surface-raised text-text-secondary shadow-resting hover-fine:bg-surface-hover hover-fine:text-text"
      }`}
    >
      {children}
    </FrameInner>
  );
}

function Cover() {
  const id = useId().replace(/[^\w-]/g, ""); // safe inside url(#…)
  return (
    <svg viewBox="0 0 240 120" preserveAspectRatio="xMidYMid slice" className="size-full rounded-[inherit]" aria-hidden>
      <defs>
        <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" style={{ stopColor: "var(--eased-surface-raised)" }} />
          <stop offset="1" style={{ stopColor: "var(--eased-brand)", stopOpacity: 0.32 }} />
        </linearGradient>
      </defs>
      <rect width="240" height="120" className="fill-surface-raised" />
      <rect width="240" height="120" fill={`url(#${id}-sky)`} />
      <circle cx="92" cy="76" r="28" className="fill-brand" />
      <path d="M0 82C38 72 78 76 118 85S196 74 240 80V120H0Z" className="fill-surface-active" />
      <path d="M0 99C46 88 104 92 146 101S214 92 240 96V120H0Z" className="fill-surface-sunken" />
    </svg>
  );
}

function SkipIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={`size-4 shrink-0 ${className}`} fill="currentColor" aria-hidden>
      <path d="M3.5 4.2v7.6a.75.75 0 0 0 1.16.63l5.7-3.8a.75.75 0 0 0 0-1.26l-5.7-3.8a.75.75 0 0 0-1.16.63Z" />
      <rect x="11" y="3.5" width="1.75" height="9" rx="0.875" />
    </svg>
  );
}

function PlayIcon() {
  // Drawn ~1.5px right of centre so the triangle reads optically centred.
  return (
    <svg viewBox="0 0 16 16" className="size-4 shrink-0" fill="currentColor" aria-hidden>
      <path d="M5.5 3.6v8.8a.8.8 0 0 0 1.22.68l7-4.4a.8.8 0 0 0 0-1.36l-7-4.4A.8.8 0 0 0 5.5 3.6Z" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg viewBox="0 0 16 16" className="size-4 shrink-0" fill="currentColor" aria-hidden>
      <rect x="4" y="3" width="2.75" height="10" rx="0.9" />
      <rect x="9.25" y="3" width="2.75" height="10" rx="0.9" />
    </svg>
  );
}
