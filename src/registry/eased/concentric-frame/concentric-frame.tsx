"use client";

import {
  createContext,
  useContext,
  useMemo,
  type ComponentProps,
  type CSSProperties,
  type ElementType,
  type ReactNode,
} from "react";

/** A px number, or any CSS length (`"var(--eased-radius-panel)"`, `"1rem"`). */
export type FrameLength = number | string;

export type FrameMetrics = {
  /** CSS lengths, safe to drop into `style` or `calc()`. */
  radius: string;
  /** The larger of the two paddings: the one the inner radius is cut by. */
  pad: string;
  padX: string;
  padY: string;
  border: string;
  /** The smallest inner radius, so a deep nest rounds at this instead of squaring off (R5). */
  min: string;
  inner: string;
  /** The same values in px, or null when any input is a CSS string. */
  px: { radius: number; pad: number; border: number; min: number; inner: number } | null;
  concentric: boolean;
};

// ComponentProps, not ComponentPropsWithoutRef: React 19 passes `ref` as a prop, and ...rest forwards it.
type Poly<T extends ElementType, P> = P & { as?: T } & Omit<ComponentProps<T>, keyof P | "as">;

type FrameOwnProps = {
  /** Outer corner radius. Defaults to the parent frame's inner radius, else `--eased-radius-panel`. */
  radius?: FrameLength;
  /** Padding on every side, or `{ x, y }`. Default 12. The inner radius is cut by the larger one. */
  pad?: FrameLength | { x: FrameLength; y: FrameLength };
  /** Border width, subtracted from the inner radius. Default 1; colour it with a class. */
  border?: FrameLength;
  /** Floor for the inner radius. Default 2: below that a corner reads as a mistake, so it stays slightly round. */
  min?: FrameLength;
  /** False hands children the outer radius unchanged: the naive look, for comparisons. Inherited. */
  concentric?: boolean;
  style?: CSSProperties;
  children?: ReactNode;
};

export type FrameProps<T extends ElementType = "div"> = Poly<T, FrameOwnProps>;
export type FrameInnerProps<T extends ElementType = "div"> = Poly<T, { style?: CSSProperties; children?: ReactNode }>;

const FrameContext = createContext<FrameMetrics | null>(null);

const toCss = (v: FrameLength) => (typeof v === "number" ? `${v}px` : v);

const cssVars = (m: FrameMetrics) =>
  ({
    "--radius-outer": m.radius,
    "--pad": m.pad,
    "--pad-x": m.padX,
    "--pad-y": m.padY,
    "--border-w": m.border,
    "--radius-inner": m.inner,
  }) as CSSProperties;

/**
 * A layout primitive that keeps nested curves parallel. It exposes `--radius-outer`,
 * `--pad`, `--border-w` and `--radius-inner` on its root, so any descendant can round
 * itself with `var(--radius-inner)` (or `<FrameInner>`, or `radius-nested`) without props.
 * Padding, radius and border (width and style) are owned here: Tailwind `p-*`, `rounded-*`
 * and `border-*` width classes on the root are overridden. Style only the border colour.
 */
export function Frame<T extends ElementType = "div">({
  as,
  radius,
  pad = 12,
  border = 1,
  min = 2,
  concentric,
  style,
  ...rest
}: FrameProps<T>) {
  const parent = useContext(FrameContext);

  const metrics = useMemo<FrameMetrics>(() => {
    const isConcentric = concentric ?? parent?.concentric ?? true;
    // A nested frame with no radius continues the parent's curve.
    const r: FrameLength = radius ?? (parent ? (parent.px?.inner ?? parent.inner) : "var(--eased-radius-panel)");

    const { x, y } = typeof pad === "object" ? pad : { x: pad, y: pad };

    if ([r, x, y, border, min].every((v) => typeof v === "number")) {
      const [R, X, Y, B, M] = [r, x, y, border, min] as number[];
      const P = Math.max(X, Y);
      // Never rounder than the outer corner, never squarer than the floor.
      const inner = isConcentric ? Math.min(R, Math.max(M, R - P - B)) : R;
      return {
        radius: toCss(R),
        pad: toCss(P),
        padX: toCss(X),
        padY: toCss(Y),
        border: toCss(B),
        min: toCss(M),
        inner: toCss(inner),
        px: { radius: R, pad: P, border: B, min: M, inner },
        concentric: isConcentric,
      };
    }

    const [R, X, Y, B, M] = [toCss(r), toCss(x), toCss(y), toCss(border), toCss(min)];
    const P = X === Y ? X : `max(${X}, ${Y})`;
    return {
      radius: R,
      pad: P,
      padX: X,
      padY: Y,
      border: B,
      min: M,
      inner: isConcentric ? `min(${R}, max(${M}, calc(${R} - ${P} - ${B})))` : R,
      px: null,
      concentric: isConcentric,
    };
  }, [radius, pad, border, min, concentric, parent]);

  const Comp: ElementType = as ?? "div";
  const vars = {
    ...cssVars(metrics),
    borderRadius: "var(--radius-outer)",
    padding: "var(--pad-y) var(--pad-x)",
    borderWidth: "var(--border-w)",
    // Set with the width so the border never depends on Tailwind's preflight.
    borderStyle: "solid",
    ...style,
  } as CSSProperties;

  return (
    <FrameContext value={metrics}>
      <Comp {...rest} style={vars} />
    </FrameContext>
  );
}

/** A direct child that takes the frame's concentric inner radius. Images inside should use `rounded-[inherit]`. */
export function FrameInner<T extends ElementType = "div">({ as, style, ...rest }: FrameInnerProps<T>) {
  const Comp: ElementType = as ?? "div";
  return <Comp {...rest} style={{ borderRadius: "var(--radius-inner)", ...style }} />;
}

/** The nearest frame's metrics, or null outside one. Use `px` for geometry (guides, canvases). */
export function useFrame() {
  return useContext(FrameContext);
}

/**
 * The nearest frame's CSS variables as a style object, empty outside one. Spread it onto
 * anything that cannot inherit them: a portal, or an SVG or canvas wrapper rendered elsewhere.
 */
export function useFrameVar(): CSSProperties {
  const metrics = useContext(FrameContext);
  return metrics ? cssVars(metrics) : {};
}
