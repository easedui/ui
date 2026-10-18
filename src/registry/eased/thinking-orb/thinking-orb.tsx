"use client";

import { isMotionValue, motion, useInView, useMotionValue, useTransform, type MotionValue } from "motion/react";
import { useEffect, useRef, type ComponentType, type CSSProperties } from "react";
import { useSafeReducedMotion } from "../lib/motion";

export type OrbState = "idle" | "listening" | "thinking" | "speaking";

/**
 * What every orb variant draws from. The orb owns the clock and the state; a variant only
 * paints. Pro variants (ring, swirl, pulse-dots, liquid, aurora, grain, shader) are
 * components of this shape passed as `variant`.
 */
export type OrbRenderProps = {
  /** Diameter in px. */
  size: number;
  state: OrbState;
  /**
   * Animated time in seconds, already scaled by the orb's speed (idle 0.4×, thinking 1×,
   * speaking up to 2× with the token rate). Derive every rotation and loop from it, so speed
   * changes glide instead of jumping. Frozen under reduced motion and off-screen.
   */
  phase: MotionValue<number>;
  /** 0–1, smoothed: how much is happening (state, token rate, voice level). Drive amplitude with it. */
  energy: MotionValue<number>;
  /** Reduced motion is on: draw a still frame. */
  reduced: boolean;
};

export type OrbVariant = ComponentType<OrbRenderProps>;

export type ThinkingOrbProps = {
  /** Each state has its own colours, speed and energy, and crossfades into the next. Default `thinking`. */
  state?: OrbState;
  /**
   * 0–1: how fast the stream is flowing. Speeds the swirl up to 2× and swells the breath.
   * Pass `useTokenRate(text).rate` (a motion value) so the orb follows without re-rendering.
   */
  rate?: number | MotionValue<number>;
  /** 0–1 input level while `listening` (a mic's amplitude); the orb swells with it. */
  level?: number | MotionValue<number>;
  /** `orb` (default), or a Pro variant component. */
  variant?: "orb" | OrbVariant;
  /** `sm` 16px (inline with text), `md` 24px, `lg` 40px, or any diameter in px. Default `md`. */
  size?: "sm" | "md" | "lg" | number;
  /** Accessible name. Default the state ("Thinking"); `false` when visible text already says it. */
  label?: string | false;
  className?: string;
};

const SIZES = { sm: 16, md: 24, lg: 40 } as const;
const SPEED: Record<OrbState, number> = { idle: 0.4, listening: 0.7, thinking: 1, speaking: 1 };
const ENERGY: Record<OrbState, number> = { idle: 0.1, listening: 0.3, thinking: 0.45, speaking: 0.5 };
const NAMES: Record<OrbState, string> = { idle: "Idle", listening: "Listening", thinking: "Thinking", speaking: "Speaking" };

/** Reads a number or a motion value without subscribing React to it. */
function useReader(v: number | MotionValue<number> | undefined) {
  const ref = useRef(v);
  useEffect(() => {
    ref.current = v;
  });
  return () => {
    const x = ref.current;
    return x === undefined ? 0 : isMotionValue(x) ? x.get() : x;
  };
}

/**
 * The orb's clock: phase advances by speed × dt each frame, and speed and energy ease toward
 * their targets with a 0.5s time constant (critically damped, no overshoot), so a burst of
 * tokens swells the orb and a pause lets it settle. The loop runs only while on screen and
 * not under reduced motion.
 */
function useOrbClock(state: OrbState, rate: () => number, level: () => number, active: boolean) {
  const phase = useMotionValue(0);
  const energy = useMotionValue(ENERGY[state]);
  const speed = useRef(SPEED[state]);
  const target = useRef({ state, rate, level });
  useEffect(() => {
    target.current = { state, rate, level };
  });

  useEffect(() => {
    if (!active) return;
    let raf = 0;
    let then = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - then) / 1000);
      then = now;
      const { state, rate, level } = target.current;
      const r = Math.min(1, Math.max(0, rate()));
      const l = Math.min(1, Math.max(0, level()));
      const k = 1 - Math.exp(-dt / 0.5);
      const wantSpeed = SPEED[state] + (state === "idle" ? 0 : r);
      const wantEnergy = Math.min(1, ENERGY[state] + (state === "speaking" ? r * 0.5 : state === "thinking" ? r * 0.3 : 0) + (state === "listening" ? l * 0.7 : 0));
      speed.current += (wantSpeed - speed.current) * k;
      energy.set(energy.get() + (wantEnergy - energy.get()) * k);
      phase.set(phase.get() + dt * speed.current);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, phase, energy]);

  return { phase, energy };
}

/*
 * Colours per state are registered properties, so a state change crossfades the gradients
 * over 700ms on its own. They are the orb's palette, declared here rather than in eased.css;
 * override `--eased-orb-a/b/c/deep` on the orb (per `data-state`) to re-theme it.
 */
const CSS = `
@property --eased-orb-a { syntax: "<color>"; inherits: true; initial-value: transparent; }
@property --eased-orb-b { syntax: "<color>"; inherits: true; initial-value: transparent; }
@property --eased-orb-c { syntax: "<color>"; inherits: true; initial-value: transparent; }
@property --eased-orb-deep { syntax: "<color>"; inherits: true; initial-value: transparent; }
@property --eased-orb-sweep { syntax: "<number>"; inherits: true; initial-value: 0; }
.eased-orb {
  --eased-orb-a: oklch(66% 0.2 290); --eased-orb-b: oklch(72% 0.15 250); --eased-orb-c: oklch(81% 0.12 335); --eased-orb-deep: oklch(44% 0.17 282);
  --eased-orb-sweep: 1;
  transition: --eased-orb-a 700ms var(--eased-ease-standard), --eased-orb-b 700ms var(--eased-ease-standard), --eased-orb-c 700ms var(--eased-ease-standard), --eased-orb-deep 700ms var(--eased-ease-standard), --eased-orb-sweep 700ms var(--eased-ease-standard);
}
.eased-orb[data-state="idle"] {
  --eased-orb-a: oklch(76% 0.06 265); --eased-orb-b: oklch(84% 0.04 215); --eased-orb-c: oklch(74% 0.06 310); --eased-orb-deep: oklch(58% 0.06 270);
  --eased-orb-sweep: 0;
}
.eased-orb[data-state="listening"] {
  --eased-orb-a: oklch(80% 0.12 205); --eased-orb-b: oklch(68% 0.15 245); --eased-orb-c: oklch(88% 0.1 175); --eased-orb-deep: oklch(48% 0.13 240);
  --eased-orb-sweep: 0.35;
}
.eased-orb[data-state="speaking"] {
  --eased-orb-a: oklch(77% 0.15 55); --eased-orb-b: oklch(67% 0.19 22); --eased-orb-c: oklch(88% 0.11 88); --eased-orb-deep: oklch(52% 0.17 32);
  --eased-orb-sweep: 0.25;
}
@media (forced-colors: active) { .eased-orb { forced-color-adjust: none; } }
`;

/**
 * A small living disc for an assistant's state: three soft colour fields drift around inside a
 * glassy sphere at different rates, a band of light sweeps through while thinking, and the
 * whole orb breathes. Its speed is a motion value: idle drifts at 0.4×, thinking turns at 1×,
 * and speaking runs up to 2× with the token `rate`, so it visibly keeps pace with the stream.
 * States crossfade their palettes. It pauses off-screen and stands still under reduced motion.
 */
export function ThinkingOrb({ state = "thinking", rate, level, variant = "orb", size = "md", label, className = "" }: ThinkingOrbProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref);
  const reduced = useSafeReducedMotion();
  const px = typeof size === "number" ? size : SIZES[size];
  const { phase, energy } = useOrbClock(state, useReader(rate), useReader(level), inView && !reduced);
  const Variant = variant === "orb" ? Orb : variant;
  const name = label === false ? undefined : (label ?? NAMES[state]);

  return (
    <span
      ref={ref}
      role={name ? "img" : undefined}
      aria-label={name}
      aria-hidden={name ? undefined : true}
      data-state={state}
      className={`eased-orb relative inline-flex shrink-0 align-middle ${className}`}
      style={{ width: px, height: px }}
    >
      <Variant size={px} state={state} phase={phase} energy={energy} reduced={reduced} />
      <style href="eased-thinking-orb" precedence="default">
        {CSS}
      </style>
    </span>
  );
}

const layer = "pointer-events-none absolute inset-[-25%] rounded-pill";

/**
 * The free variant: a slow iridescent swirl under three drifting colour fields and a dark
 * pocket that keeps the colour from going flat, a light sweep while thinking, and glass on top
 * (specular cap, a shaded lower edge, a fresnel rim). It breathes as one.
 */
function Orb({ size, phase, energy, reduced }: OrbRenderProps) {
  // Each layer orbits at its own rate (degrees per second at 1×), so the pattern never repeats.
  const swirl = useTransform(phase, (p) => p * 28);
  const r1 = useTransform(phase, (p) => p * 52);
  const r2 = useTransform(phase, (p) => p * -67 + 120);
  const r3 = useTransform(phase, (p) => p * 83 + 240);
  const pocket = useTransform(phase, (p) => p * -38 + 60);
  const sweep = useTransform(phase, (p) => p * 150);
  // Breath: 1 → up to 1.06, faster as the orb speeds up, deeper with energy.
  const scale = useTransform(() => {
    const e = energy.get();
    const wave = 0.5 + 0.5 * Math.sin((phase.get() * Math.PI * 2) / 2.6);
    return 1 + (0.015 + 0.045 * e) * wave;
  });
  const halo = useTransform(energy, (e) => 0.35 + 0.65 * e);
  const style = { "--orb-blur": `${Math.max(1, size * 0.07)}px` } as CSSProperties;

  return (
    <motion.span className="absolute inset-0" style={{ scale: reduced ? 1 : scale }}>
      {/* Glow behind the orb: ≤ 10% alpha (R36), brighter with energy. */}
      <motion.span
        aria-hidden
        className="pointer-events-none absolute inset-[-35%] rounded-pill bg-[radial-gradient(closest-side,color-mix(in_oklch,var(--eased-orb-a)_10%,transparent),transparent)]"
        style={{ opacity: halo }}
      />
      <span
        aria-hidden
        style={style}
        className="absolute inset-0 isolate overflow-hidden rounded-pill bg-[radial-gradient(circle_at_50%_40%,var(--eased-orb-b),var(--eased-orb-deep)_75%)]"
      >
        <span className="absolute inset-0 [filter:blur(var(--orb-blur))_saturate(1.25)]">
          <motion.span className={`${layer} bg-[conic-gradient(from_0deg,var(--eased-orb-a),var(--eased-orb-b),var(--eased-orb-c),var(--eased-orb-deep),var(--eased-orb-a))] opacity-80`} style={{ rotate: swirl }} />
          <motion.span className={`${layer} bg-[radial-gradient(circle_at_30%_32%,var(--eased-orb-a),transparent_30%)]`} style={{ rotate: r1 }} />
          <motion.span className={`${layer} bg-[radial-gradient(circle_at_72%_62%,var(--eased-orb-b),transparent_32%)]`} style={{ rotate: r2 }} />
          <motion.span className={`${layer} bg-[radial-gradient(circle_at_52%_80%,var(--eased-orb-c),transparent_26%)]`} style={{ rotate: r3 }} />
          <motion.span className={`${layer} bg-[radial-gradient(circle_at_62%_38%,var(--eased-orb-deep),transparent_24%)] opacity-70`} style={{ rotate: pocket }} />
          <motion.span
            className={`${layer} bg-[conic-gradient(from_0deg,transparent_0_58%,oklch(100%_0_0/0.55)_78%,transparent_94%)] opacity-(--eased-orb-sweep) mix-blend-soft-light`}
            style={{ rotate: sweep }}
          />
        </span>
        {/* Glass: a specular cap, a shaded lower edge, a fresnel rim and a hairline. */}
        <span className="absolute inset-0 rounded-pill bg-[radial-gradient(42%_30%_at_36%_20%,oklch(100%_0_0/0.62),transparent)]" />
        <span className="absolute inset-0 rounded-pill bg-[radial-gradient(80%_50%_at_60%_100%,oklch(0%_0_0/0.22),transparent)]" />
        <span className="absolute inset-0 rounded-pill bg-[radial-gradient(circle,transparent_58%,oklch(100%_0_0/0.22))] mix-blend-screen" />
        <span className="absolute inset-0 rounded-pill shadow-[inset_0_0_0_0.5px_oklch(100%_0_0/0.3)]" />
      </span>
    </motion.span>
  );
}
