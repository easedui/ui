"use client";

import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { MAC_RADIUS, macFont, macMaterial, type MacMaterialMode } from "../lib/mac";
import {
  blur,
  enter,
  exit,
  exitFast,
  instant,
  reducedFade,
  smooth,
  snappy,
  swap,
  swapIn,
  swapOut,
  swapShown,
  useSafeReducedMotion,
} from "../lib/motion";

export type MacHudKind = "volume" | "brightness" | "keyboard";
export type MacHudVariant = "classic" | "pill";

export type MacHudLabels = {
  /** Announced before the level, e.g. "Volume 60%". Defaults: "Volume", "Brightness", "Keyboard brightness". */
  volume: string;
  brightness: string;
  keyboard: string;
  /** Announced instead of the level while muted: "Volume, muted". Default "muted". */
  muted: string;
};

export type MacHudProps = {
  /** Show the HUD. Keep it mounted and toggle this so the exit animates; `useMacHud` drives it for you. */
  open: boolean;
  /** Which level it shows; picks the icon and the announcement. */
  kind: MacHudKind;
  /** The level, 0 to 1. Shown in quarter segments, the finest step macOS has (⌥⇧ + a media key). */
  value: number;
  /** Volume only: speaker with a slash, empty bar. */
  muted?: boolean;
  /** `classic` is the 200×200 square of macOS 15 and earlier; `pill` the top-right capsule of macOS 26. Default "classic". */
  variant?: MacHudVariant;
  /**
   * `fixed` to the viewport (default), `absolute` in the nearest positioned parent, or `none`
   * to place it yourself (a Tauri HUD window that is exactly the HUD's size).
   */
  position?: "fixed" | "absolute" | "none";
  /** `css` draws the frosted material; `native` leaves it to a window with real vibrancy. Default "css". */
  material?: MacMaterialMode;
  labels?: Partial<MacHudLabels>;
  /** Appended to the HUD's classes; position is kept. */
  className?: string;
};

const DEFAULT_LABELS: MacHudLabels = {
  volume: "Volume",
  brightness: "Brightness",
  keyboard: "Keyboard brightness",
  muted: "muted",
};

const SEGMENTS = 16;

// Classic sits centred 140px above the bottom edge, as on macOS; in a container shorter than
// ~480px that would push it off the top, so it centres vertically instead.
const PLACE: Record<MacHudVariant, string> = {
  classic: "inset-x-0 mx-auto bottom-[max(0px,min(140px,calc(50%-100px)))]",
  pill: "top-3 right-3",
};
const POSITION = { fixed: "fixed z-50", absolute: "absolute z-10", none: "relative" } as const;

const pct = new Intl.NumberFormat(undefined, { style: "percent", maximumFractionDigits: 0 });
const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

/**
 * The macOS volume and brightness overlay: a frosted, click-through HUD that updates in place
 * while it is up. Not anchored to anything, so it fades and scales in on its own and leaves
 * faster than it came; a new level never replays the entrance.
 */
export function MacHud({
  open,
  kind,
  value,
  muted = false,
  variant = "classic",
  position = "fixed",
  material = "css",
  labels,
  className = "",
}: MacHudProps) {
  const reduce = useSafeReducedMotion();
  const text = { ...DEFAULT_LABELS, ...labels };
  const silent = kind === "volume" && muted;
  const level = silent ? 0 : clamp01(value);
  const pill = variant === "pill";

  const announce = silent ? `${text[kind]}, ${text.muted}` : `${text[kind]} ${pct.format(clamp01(value))}`;

  return (
    <>
      {/* A live region must exist before its text changes, so it stays mounted outside the HUD. */}
      <span role="status" className="sr-only">
        {open ? announce : ""}
      </span>
      <AnimatePresence>
        {open && (
          <motion.div
            // A new variant is a new HUD: the old one leaves while the new one enters, no morph.
            key={variant}
            aria-hidden
            data-variant={variant}
            initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: pill ? -10 : 0 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={
              reduce
                ? { opacity: 0, transition: reducedFade }
                : { opacity: 0, scale: 0.98, y: pill ? -6 : 0, transition: exit }
            }
            transition={reduce ? reducedFade : { ...snappy, opacity: enter }}
            style={{ borderRadius: pill ? MAC_RADIUS.pill : MAC_RADIUS.hud }}
            className={`pointer-events-none select-none ${POSITION[position]} ${position === "none" ? "" : PLACE[variant]} ${macFont} ${macMaterial("hud", material)} ${
              pill ? "flex h-11 w-[200px] items-center gap-3 px-4" : "size-[200px]"
            } ${className}`}
          >
            {pill ? (
              <>
                <MacHudIcon kind={kind} value={value} muted={muted} className="size-5" />
                <PillBar level={level} reduce={reduce} />
              </>
            ) : (
              <>
                <MacHudIcon kind={kind} value={value} muted={muted} className="absolute inset-x-0 top-11 mx-auto size-20 opacity-70" />
                <Segments level={level} />
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/** Sixteen 7.5px squares, 2px apart (150px), 40px off the bottom. Each fills in quarters. */
function Segments({ level }: { level: number }) {
  return (
    <div className="absolute inset-x-0 bottom-10 mx-auto flex w-[150px] gap-[2px]">
      {Array.from({ length: SEGMENTS }, (_, i) => {
        // Quarter-segment resolution, like macOS. Fill and track never overlap, so the
        // filled 70% and empty 20% stay exact rather than stacking.
        const f = clamp01(Math.round((level * SEGMENTS - i) * 4) / 4);
        return (
          <span key={i} className="relative size-[7.5px] shrink-0">
            <span
              className="absolute inset-0 bg-current/20 transition-[clip-path] duration-(--eased-duration-instant) ease-standard reduced:transition-none"
              style={{ clipPath: `inset(0 0 0 ${f * 100}%)` }}
            />
            <span
              className="absolute inset-0 bg-current/70 transition-[clip-path] duration-(--eased-duration-instant) ease-standard reduced:transition-none"
              style={{ clipPath: `inset(0 ${(1 - f) * 100}% 0 0)` }}
            />
          </span>
        );
      })}
    </div>
  );
}

/** A 6px track whose fill slides on `smooth`: a translate, so no layout work per frame. */
function PillBar({ level, reduce }: { level: number; reduce: boolean }) {
  return (
    <span className="relative h-1.5 min-w-0 flex-1 bg-current/20 [clip-path:inset(0_round_9999px)]">
      <motion.span
        className="absolute inset-0 rounded-full bg-current/70"
        initial={false}
        animate={{ x: `${(level - 1) * 100}%` }}
        transition={reduce ? instant : smooth}
      />
    </span>
  );
}

/* ---------- Icons: filled glyphs in the spirit of SF Symbols, on a 24-unit grid ---------- */

const STROKE = 1.8;

/** Straight strokes from radius r1 to r2 around (cx, cy), one per angle in degrees (0 = right, 90 = up). */
const rays = (cx: number, cy: number, r1: number, r2: number, angles: number[]) =>
  angles
    .map((a) => {
      const [c, s] = [Math.cos((a * Math.PI) / 180), -Math.sin((a * Math.PI) / 180)];
      const p = (r: number) => `${+(cx + r * c).toFixed(2)} ${+(cy + r * s).toFixed(2)}`;
      return `M${p(r1)}L${p(r2)}`;
    })
    .join("");

/** A wave of radius r around the speaker's mouth, spanning ±deg. */
const wave = (r: number, deg: number) => {
  const [x, y] = [11 + r * Math.cos((deg * Math.PI) / 180), r * Math.sin((deg * Math.PI) / 180)];
  return `M${x.toFixed(2)} ${(12 - y).toFixed(2)}A${r} ${r} 0 0 1 ${x.toFixed(2)} ${(12 + y).toFixed(2)}`;
};

const SPEAKER = "M3 9h3l4.3-3.6c.65-.55 1.7-.08 1.7.77v11.66c0 .85-1.05 1.32-1.7.77L6 15H3a1 1 0 0 1-1-1v-4a1 1 0 0 1 1-1Z";
const WAVES = [wave(4, 45), wave(7, 50), wave(10, 52)];
const SLASH = "M3.5 3.5 18.5 18.5";
// Shift (in grid units) that centres what is drawn: the speaker spans x 2–12, wave n ends at
// 11 + r + half a stroke, the slash at 19.4. Three waves are centred as drawn.
const CENTRE = [5, 3.05, 1.55, 0];
const CENTRE_MUTED = 1.4;
const SUN_ALL = [0, 45, 90, 135, 180, 225, 270, 315];
const SUN = { min: rays(12, 12, 7, 7.6, SUN_ALL), max: rays(12, 12, 6.9, 9.4, SUN_ALL) };
const LIGHT_ALL = [0, 45, 90, 135, 180];
const LIGHT = { min: rays(12, 15.2, 7, 7.6, LIGHT_ALL), max: rays(12, 15.2, 6.9, 9.4, LIGHT_ALL) };

export type MacHudIconProps = {
  kind: MacHudKind;
  /** 0–1. Volume shows 0–3 waves; brightness and keyboard switch to longer rays from half. */
  value: number;
  muted?: boolean;
  /** Size it here, e.g. `size-5`. Colour is `currentColor`. */
  className?: string;
};

/**
 * The HUD's glyphs, also handy on your own media keys. Parts that come and go (a wave, the
 * mute slash, long rays) fade and un-blur on the text-swap tokens; a new kind swaps the whole
 * glyph with the text-swap rise.
 */
export function MacHudIcon({ kind, value, muted = false, className = "" }: MacHudIconProps) {
  const reduce = useSafeReducedMotion();
  const v = clamp01(value);
  const waves = v === 0 ? 0 : Math.ceil(v * 3);
  const bright = v >= 0.5;

  return (
    <span aria-hidden className={`relative block ${className}`}>
      <AnimatePresence initial={false}>
        <motion.span
          key={kind}
          className="absolute inset-0"
          initial={reduce ? { opacity: 0 } : swapIn}
          animate={reduce ? { opacity: 1 } : swapShown}
          exit={reduce ? { opacity: 0, transition: reducedFade } : { ...swapOut, transition: { ...swap, opacity: exitFast, filter: exitFast } }}
          transition={reduce ? reducedFade : swap}
        >
          {kind === "volume" ? (
            // Like separate SF Symbols, each state is centred on its own: the speaker slides
            // over as waves come and go rather than hanging left of an empty space.
            <motion.span
              className="absolute inset-0"
              initial={false}
              animate={{ x: `${((muted ? CENTRE_MUTED : CENTRE[waves]) / 24) * 100}%` }}
              transition={reduce ? instant : snappy}
            >
              <Speaker muted={muted} reduce={reduce} />
              {WAVES.map((d, i) => (
                <Part key={d} shown={!muted && waves > i} reduce={reduce}>
                  <path d={d} fill="none" stroke="currentColor" strokeWidth={STROKE} strokeLinecap="round" />
                </Part>
              ))}
              <Part shown={muted} reduce={reduce}>
                <path d={SLASH} fill="none" stroke="currentColor" strokeWidth={STROKE} strokeLinecap="round" />
              </Part>
            </motion.span>
          ) : (
            <>
              <Part shown reduce={reduce}>
                {kind === "brightness" ? (
                  <circle cx="12" cy="12" r="4.4" />
                ) : (
                  <>
                    <path d="M7.2 15.2a4.8 4.8 0 0 1 9.6 0Z" />
                    <rect x="3" y="17.4" width="18" height={STROKE} rx={STROKE / 2} />
                  </>
                )}
              </Part>
              {(["min", "max"] as const).map((size) => (
                <Part key={size} shown={bright === (size === "max")} reduce={reduce}>
                  <path
                    d={(kind === "brightness" ? SUN : LIGHT)[size]}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={STROKE}
                    strokeLinecap="round"
                  />
                </Part>
              ))}
            </>
          )}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

/**
 * One layer of a glyph, as its own <svg> so blur works everywhere (Safari ignores CSS
 * filters on shapes inside an SVG). Always mounted: toggling `shown` cross-fades it.
 */
function Part({ shown, reduce, children }: { shown: boolean; reduce: boolean; children: ReactNode }) {
  return (
    <motion.svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className="absolute inset-0 size-full overflow-visible"
      initial={false}
      animate={shown ? (reduce ? { opacity: 1 } : swapShown) : reduce ? { opacity: 0 } : { opacity: 0, filter: `blur(${blur.soft})` }}
      transition={reduce ? reducedFade : shown ? swap : { ...swap, opacity: exitFast, filter: exitFast }}
    >
      {children}
    </motion.svg>
  );
}

/** The speaker, with a gap cut along the mute slash so the slash reads on a filled shape. */
function Speaker({ muted, reduce }: { muted: boolean; reduce: boolean }) {
  const id = `mac-hud-cut-${useId().replace(/[^\w-]/g, "")}`;
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="absolute inset-0 size-full overflow-visible">
      <mask id={id} maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24">
        <rect width="24" height="24" fill="white" />
        <motion.path
          d={SLASH}
          fill="none"
          stroke="black"
          strokeWidth={STROKE + 3}
          strokeLinecap="round"
          initial={false}
          animate={{ opacity: muted ? 1 : 0 }}
          transition={reduce ? reducedFade : muted ? swap.opacity : exitFast}
        />
      </mask>
      <path d={SPEAKER} mask={`url(#${id})`} />
    </svg>
  );
}

export type MacHudState = { open: boolean; kind: MacHudKind; value: number; muted: boolean };

export type UseMacHudOptions = {
  /** How long the HUD stays up after the last change, in ms. Default 1100, as on macOS. */
  duration?: number;
};

/**
 * The HUD's state and its hold timer. `show(kind, value)` opens it, or updates it in place if
 * it is already up, and restarts the timer; it hides `duration` ms after the last call.
 * Spread `hud` onto `<MacHud>`.
 */
export function useMacHud({ duration = 1100 }: UseMacHudOptions = {}) {
  const [hud, setHud] = useState<MacHudState>({ open: false, kind: "volume", value: 0, muted: false });
  const timer = useRef<number | undefined>(undefined);

  const hide = useCallback(() => {
    window.clearTimeout(timer.current);
    setHud((h) => (h.open ? { ...h, open: false } : h));
  }, []);

  const show = useCallback(
    (kind: MacHudKind, value: number, { muted = false }: { muted?: boolean } = {}) => {
      setHud({ open: true, kind, value: clamp01(value), muted });
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setHud((h) => ({ ...h, open: false })), duration);
    },
    [duration],
  );

  useEffect(() => () => window.clearTimeout(timer.current), []);

  return { hud, show, hide };
}
