"use client";

import type { ComponentProps, ComponentType, CSSProperties, ReactNode } from "react";
import { duration } from "../../lib/motion";

/**
 * The Eased floating layer: one way for every popup (tooltip, popover, hover card, and later
 * menu, select, combobox) to appear and leave. Base UI owns behaviour (focus, dismissal,
 * collision, safe hover); this file owns motion and material.
 *
 *   - Grows from the trigger: `transform-origin` is Base UI's `--transform-origin`.
 *   - Enters from a few pixels toward the trigger, read from `data-side`, so a popup below its
 *     trigger drops down into place and one to the right slides out rightward.
 *   - Opening and closing are CSS transitions on Base UI's `data-starting-style` and
 *     `data-ending-style`, so a close during the open (or the reverse) turns around mid-flight.
 *   - Exits travel half the enter distance, scale half as far, never overshoot, and are faster.
 *   - Reduced motion keeps only a 100ms fade. Tooltips in a delay group swap with no animation.
 */

export type FloatingSide = "top" | "bottom" | "left" | "right" | "inline-start" | "inline-end";
export type FloatingAlign = "start" | "center" | "end";
export type FloatingRole = "tooltip" | "popover" | "card";

export type FloatingMotion = {
  /** Gap between trigger and popup, px. */
  sideOffset: number;
  /** How far the popup travels toward its resting place on enter, px. Exits travel half. */
  distance: number;
  /** Scale on enter; exits scale half as far (0.97 → 0.985). Never 0. */
  scale: number;
  /** Opacity fade on enter, ms. Transform rides `--eased-spring-snappy`. */
  fade: number;
  /** Whole exit, ms, on `--eased-ease-standard`. Keep it ≤ 0.75 × fade. */
  exit: number;
  /** Skip the animation when Base UI marks it instant (`data-instant`), e.g. a tooltip delay group. */
  honourInstant: boolean;
};

const ms = (s: number) => Math.round(s * 1000);

/** Per-role motion. Tooltips are smaller and quicker; cards sit a little further from their link. */
export const FLOATING_ROLES: Record<FloatingRole, FloatingMotion & { side: FloatingSide }> = {
  tooltip: { side: "top", sideOffset: 6, distance: 3, scale: 0.97, fade: ms(duration.fast), exit: ms(duration.instant), honourInstant: true },
  popover: { side: "bottom", sideOffset: 6, distance: 5, scale: 0.97, fade: ms(duration.standard), exit: ms(duration.fast), honourInstant: false },
  card: { side: "bottom", sideOffset: 8, distance: 5, scale: 0.97, fade: ms(duration.standard), exit: ms(duration.fast), honourInstant: false },
};

/*
 * Role values arrive as inline `--eased-float-*` properties. The classes copy them into short
 * working variables (`--ef-*`) so the `reduced` variant and `data-instant` can override the copies:
 * an inline style would otherwise beat any class.
 */
const MOTION = [
  "origin-(--transform-origin)",
  "[--ef-d:var(--eased-float-distance)] [--ef-s:var(--eased-float-scale)] [--ef-in:var(--eased-duration-spring-snappy)] [--ef-fade:var(--eased-float-fade)] [--ef-out:var(--eased-float-exit)]",
  // Direction toward the trigger: +1 / −1 per axis, from the side Base UI actually placed it on.
  "data-[side=top]:[--ef-y:1] data-[side=bottom]:[--ef-y:-1] data-[side=left]:[--ef-x:1] data-[side=right]:[--ef-x:-1] data-[side=inline-start]:[--ef-x:1] data-[side=inline-end]:[--ef-x:-1] rtl:data-[side=inline-start]:[--ef-x:-1] rtl:data-[side=inline-end]:[--ef-x:1]",
  // Open: opacity on the enter curve, transform on the snappy spring.
  "[transition-property:opacity,translate,scale] [transition-duration:var(--ef-fade),var(--ef-in),var(--ef-in)] [transition-timing-function:var(--eased-ease-enter),var(--eased-spring-snappy),var(--eased-spring-snappy)]",
  "data-starting-style:opacity-0 data-starting-style:[translate:calc(var(--ef-x,0)*var(--ef-d))_calc(var(--ef-y,0)*var(--ef-d))] data-starting-style:[scale:var(--ef-s)]",
  // Close: half the distance, half the scale, one faster duration, no overshoot.
  "data-ending-style:opacity-0 data-ending-style:[translate:calc(var(--ef-x,0)*var(--ef-d)*0.5)_calc(var(--ef-y,0)*var(--ef-d)*0.5)] data-ending-style:[scale:calc(0.5_+_var(--ef-s)*0.5)] data-ending-style:[transition-duration:var(--ef-out)] data-ending-style:[transition-timing-function:var(--eased-ease-standard)]",
  // Reduced motion: no travel, no scale, a 100ms fade.
  "reduced:[--ef-d:0px] reduced:[--ef-s:1] reduced:[--ef-in:0ms] reduced:[--ef-fade:var(--eased-duration-instant)] reduced:[--ef-out:var(--eased-duration-instant)]",
].join(" ");

const INSTANT = "data-instant:[--ef-in:0ms] data-instant:[--ef-fade:0ms] data-instant:[--ef-out:0ms]";

/**
 * Motion classes for any Base UI popup part. Pair with `floatingVars(role)` as its style, or use
 * `<FloatingLayer>`, which does both.
 */
export function floatingMotion(honourInstant = false) {
  return honourInstant ? `${MOTION} ${INSTANT}` : MOTION;
}

/** The inline custom properties `floatingMotion` reads. */
export function floatingVars(motion: Pick<FloatingMotion, "distance" | "scale" | "fade" | "exit">): CSSProperties {
  return {
    "--eased-float-distance": `${motion.distance}px`,
    "--eased-float-scale": motion.scale,
    "--eased-float-fade": `${motion.fade}ms`,
    "--eased-float-exit": `${motion.exit}ms`,
  } as CSSProperties;
}

/**
 * Floating material (R12, R25): raised surface, `border-line`, `shadow-floating`, Eased UI type.
 * The popup itself never draws a focus ring; focus moves to its first control, which draws its own.
 */
export const floatingSurface = "border border-line bg-surface-raised text-ui text-text shadow-floating outline-none";

/**
 * Behaviour classes for anything that anchors a popup (R64): it presses by colour, never by
 * scale, so the popup's origin stays put. Colour moves at 150ms; keyboard focus draws Eased's
 * ring. Add your own look, and use `data-popup-open:` for the open state.
 */
export const floatingTrigger =
  "[transition:color_150ms_var(--eased-ease-standard),background-color_150ms_var(--eased-ease-standard),border-color_150ms_var(--eased-ease-standard),text-decoration-color_150ms_var(--eased-ease-standard),box-shadow_var(--eased-duration-focus)_var(--eased-ease-standard)] focus-ring cursor-pointer select-none";

/* ---------- FloatingLayer: Portal → Positioner → Popup for any Base UI popup family ---------- */

type Part = { className?: string; style?: CSSProperties; children?: ReactNode };

/** The three parts every Base UI popup family exposes: `Tooltip`, `Popover`, `PreviewCard`, `Menu` … */
export type FloatingParts = {
  Portal: ComponentType<{ children?: ReactNode; container?: HTMLElement | null }>;
  Positioner: ComponentType<
    Part & { side?: FloatingSide; align?: FloatingAlign; sideOffset?: number; alignOffset?: number; collisionPadding?: number }
  >;
  Popup: ComponentType<Part>;
};

type Reserved = "className" | "style" | "children" | "side" | "align" | "sideOffset" | "alignOffset" | "collisionPadding";

export type FloatingLayerProps<P extends FloatingParts> = {
  /** The Base UI namespace to render with, e.g. `Popover` from `@base-ui/react/popover`. */
  parts: P;
  /** Sets the side, gap and motion defaults. Default "popover". */
  role?: FloatingRole;
  /** Preferred side; Base UI flips it on collision and the enter direction follows. */
  side?: FloatingSide;
  align?: FloatingAlign;
  /** Gap to the trigger, px. Defaults per role (6, or 8 for cards). */
  sideOffset?: number;
  alignOffset?: number;
  /** Space kept from the viewport edge, px. Default 8. */
  collisionPadding?: number;
  /** Override any of the role's motion values. */
  motion?: Partial<FloatingMotion>;
  /** Portal target. Default `document.body`. */
  container?: HTMLElement | null;
  /** Stacking order of the positioner. Default 50; raise it for a popup inside a higher layer (a dialog). */
  zIndex?: number;
  /** Popup classes, appended after the motion classes. Bring your own surface (see `floatingSurface`). */
  className?: string;
  style?: CSSProperties;
  /** Extra props for the Positioner, e.g. `sticky`, `anchor`, `collisionAvoidance`. */
  positionerProps?: Omit<ComponentProps<P["Positioner"]>, Reserved>;
  /** Extra props for the Popup, e.g. Popover's `initialFocus` and `finalFocus`. */
  popupProps?: Omit<ComponentProps<P["Popup"]>, Reserved>;
  children?: ReactNode;
};

/**
 * Renders a Base UI popup with Eased's floating motion. Behaviour stays with the family you pass:
 *
 *   <Popover.Root>
 *     <Popover.Trigger className={floatingTrigger}>Share</Popover.Trigger>
 *     <FloatingLayer parts={Popover} className={`${floatingSurface} rounded-panel p-4`}>…</FloatingLayer>
 *   </Popover.Root>
 */
export function FloatingLayer<P extends FloatingParts>({
  parts,
  role = "popover",
  side,
  align = "center",
  sideOffset,
  alignOffset = 0,
  collisionPadding = 8,
  motion,
  container,
  zIndex = 50,
  className = "",
  style,
  positionerProps,
  popupProps,
  children,
}: FloatingLayerProps<P>) {
  const { Portal, Positioner, Popup } = parts as FloatingParts;
  const m = { ...FLOATING_ROLES[role], ...motion };

  return (
    <Portal container={container}>
      <Positioner
        {...positionerProps}
        side={side ?? m.side}
        align={align}
        sideOffset={sideOffset ?? m.sideOffset}
        alignOffset={alignOffset}
        collisionPadding={collisionPadding}
        style={{ zIndex }}
      >
        <Popup {...popupProps} className={`${floatingMotion(m.honourInstant)} ${className}`} style={{ ...floatingVars(m), ...style }}>
          {children}
        </Popup>
      </Positioner>
    </Portal>
  );
}
