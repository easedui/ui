"use client";

import { useInView } from "motion/react";
import { useRef, type CSSProperties } from "react";

export type SpinnerSize = "sm" | "md" | "lg";

export type SpinnerProps = {
  /**
   * `sm` 14px (beside 12px text), `md` 16px (13–14px text), `lg` 20px (16px text), or a
   * diameter in px. Default `md`.
   */
  size?: SpinnerSize | number;
  /**
   * Announced name, e.g. "Saving". Default "Loading". Pass `false` when visible text beside the
   * spinner already says what is happening ("Uploading…"), so it is not read twice.
   */
  label?: string | false;
  /** Colour comes from `currentColor`; set a text colour class here. Default `text-text-muted`. */
  className?: string;
};

const SIZES: Record<SpinnerSize, number> = { sm: 14, md: 16, lg: 20 };

/**
 * A quarter arc turning on a faint ring, the same mark as eased.dev's status badge. It spins
 * on the compositor, so it keeps turning while the main thread is busy; it pauses off-screen
 * and freezes in place under reduced motion (R85).
 */
export function Spinner({ size = "md", label = "Loading", className = "text-text-muted" }: SpinnerProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref);
  const px = typeof size === "number" ? size : SIZES[size];
  // Ring weight scales with size: 2px at 16, 2.5px at 22 (the status badge), never under 1.5px.
  const stroke = Math.max(1.5, Math.round(px * 0.114 * 4) / 4);
  const style = { width: px, height: px, "--spinner-w": `${stroke}px` } as CSSProperties;
  return (
    <span
      ref={ref}
      role={label ? "status" : undefined}
      aria-label={label || undefined}
      aria-hidden={label ? undefined : true}
      style={style}
      className={`relative inline-block shrink-0 align-middle ${className}`}
    >
      <span className="absolute inset-0 rounded-pill border-(length:--spinner-w) border-current opacity-15" />
      <span
        className="absolute inset-0 animate-[eased-spin_900ms_linear_infinite] rounded-pill border-(length:--spinner-w) border-transparent border-t-current reduced:animate-none"
        style={{ animationPlayState: inView ? "running" : "paused" }}
      />
      <style href="eased-spinner" precedence="default">
        {"@keyframes eased-spin { to { transform: rotate(360deg); } }"}
      </style>
    </span>
  );
}
