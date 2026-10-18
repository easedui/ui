"use client";

import { animate, motion, useMotionValue, useTransform, type AnimationPlaybackControls, type MotionValue } from "motion/react";
import { useCallback, useEffect, useRef, useState, type ButtonHTMLAttributes } from "react";
import { TextSwap } from "../text-swap/text-swap";

export type Hold = {
  /** 0 → 1 while held; drains back to 0 when let go early. */
  progress: MotionValue<number>;
  /** True between the hold starting and it completing or being let go. */
  holding: boolean;
  start: () => void;
  cancel: () => void;
};

/**
 * Hold-to-confirm timing. `start` fills `progress` linearly over the remaining share of
 * `holdMs`, so it reads as a clock and resuming a half-drained hold takes half the time;
 * `cancel` drains it on a short no-overshoot spring. `onDone` fires once the fill lands.
 */
export function useHold(holdMs: number, onDone: () => void, disabled: boolean): Hold {
  const progress = useMotionValue(0);
  const anim = useRef<AnimationPlaybackControls | null>(null);
  const done = useRef(onDone);
  useEffect(() => {
    done.current = onDone;
  });
  const [holding, setHolding] = useState(false);

  const start = useCallback(() => {
    if (disabled || anim.current) return;
    setHolding(true);
    // Time-true fill: the remaining share of the hold, linearly, so it reads as a clock.
    anim.current = animate(progress, 1, {
      duration: (holdMs / 1000) * (1 - progress.get()),
      ease: "linear",
      onComplete: () => {
        anim.current = null;
        setHolding(false);
        done.current();
      },
    });
  }, [disabled, holdMs, progress]);

  const cancel = useCallback(() => {
    if (!anim.current) return;
    anim.current.stop();
    anim.current = null;
    setHolding(false);
    // Let go early and it drains back quickly on the smooth spring, never overshooting.
    animate(progress, 0, { type: "spring", visualDuration: 0.3, bounce: 0 });
  }, [progress]);

  return { progress, holding, start, cancel };
}

export type HoldButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> & {
  hold: Hold;
  label: string;
};

/**
 * A 32px button that runs `hold` on pointer, Space or Enter: the same check + label on brand
 * is revealed left to right as the hold runs. Pass the resting surface, cursor and press
 * classes in `className`; the fill, size and handlers are fixed.
 */
export function HoldButton({ hold, label, className = "", ...props }: HoldButtonProps) {
  const clip = useTransform(hold.progress, (p) => `inset(0 ${(1 - p) * 100}% 0 0)`);
  const content = (tone: string) => (
    <span className={`inline-flex items-center gap-1.5 ${tone}`}>
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden className="size-4 shrink-0">
        <path d="M3.5 8.5l3 3 6-7" />
      </svg>
      <TextSwap>{label}</TextSwap>
    </span>
  );
  return (
    <button
      type="button"
      {...props}
      data-holding={hold.holding || undefined}
      onPointerDown={(e) => {
        if (e.button !== 0) return;
        e.currentTarget.setPointerCapture(e.pointerId);
        hold.start();
      }}
      onPointerUp={hold.cancel}
      onPointerCancel={hold.cancel}
      onLostPointerCapture={hold.cancel}
      onKeyDown={(e) => {
        if ((e.key === " " || e.key === "Enter") && !e.repeat) {
          e.preventDefault();
          hold.start();
        }
      }}
      onKeyUp={(e) => {
        if (e.key === " " || e.key === "Enter") hold.cancel();
      }}
      onClick={(e) => e.preventDefault()}
      onContextMenu={(e) => e.preventDefault()}
      className={`relative inline-flex h-control-sm shrink-0 touch-none items-center justify-center overflow-hidden rounded-control-sm px-3 text-ui-sm font-medium select-none ${className}`}
    >
      {content("text-text")}
      {/* The fill: the same label on brand, revealed left to right as the hold runs. */}
      <motion.span aria-hidden className="absolute inset-0 flex items-center justify-center bg-brand inset-shadow-highlight" style={{ clipPath: clip }}>
        {content("text-text-on-brand")}
      </motion.span>
    </button>
  );
}
