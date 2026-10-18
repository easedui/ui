"use client";

import { Button as BaseButton } from "@base-ui/react/button";
import { AnimatePresence, motion } from "motion/react";
import type { CSSProperties, ComponentProps, ReactNode } from "react";
import { TextSwap } from "../_primitives/text-swap/text-swap";
import { exitFast, reducedFade, swap, swapIn, swapOut, swapShown, useSafeReducedMotion } from "../lib/motion";
import { press } from "../lib/press";
import { Spinner } from "../spinner/spinner";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "danger-solid";
export type ButtonSize = "sm" | "md" | "lg" | "icon-sm" | "icon" | "icon-lg";

export type ButtonProps = Omit<ComponentProps<typeof BaseButton>, "className" | "children"> & {
  /**
   * primary: the one filled action in a region. secondary: everything else. ghost: toolbars
   * and quiet actions. danger: outlined, for destructive actions that confirm or undo next.
   * danger-solid: the final confirm step only (rule 33). Default "secondary".
   */
  variant?: ButtonVariant;
  /** sm 32px, md 36px, lg 40px; icon-sm/icon/icon-lg are the square versions. Default "md". */
  size?: ButtonSize;
  /**
   * Overlay a spinner on the (now transparent) label: the width never changes, focus stays
   * on the button, clicks are ignored and `aria-busy` is set.
   */
  loading?: boolean;
  /**
   * The label. A string or number swaps with y + blur whenever it changes, and the button's
   * width springs to fit ("Save" → "Saved"). For element children, pass `swapKey`.
   */
  children?: ReactNode;
  /** What counts as a new label when `children` are elements, e.g. `swapKey={state}`. */
  swapKey?: string | number;
  /**
   * Scale down while pressed: 0.97, or 0.96 for icon buttons and 0.985 past 220px wide.
   * Default true; buttons that open a popover or menu (`aria-haspopup`) never scale.
   */
  scaleOnPress?: boolean;
  /**
   * Extend the tap target to 44×44px without growing the visual. Default true for `icon-sm`
   * (the only size under 44px both ways); pass false when the button sits in a row or toolbar
   * beside other targets, where the extended area would steal their clicks.
   */
  hitArea?: boolean;
  /**
   * Pull a ghost button out by its own inset so its icon or label, not its padding, lands on
   * the container's content line (rule 104): "start" for a leading Copy link, "end" for a
   * trailing Restart or icon action. The hover fill bleeds into the gutter instead.
   */
  edge?: ButtonEdge;
  className?: string;
};

export type ButtonEdge = "start" | "end";

const VARIANT: Record<ButtonVariant, string> = {
  primary:
    "border-transparent bg-brand text-text-on-brand inset-shadow-highlight hover-fine:not-data-disabled:bg-brand-hover active:not-data-disabled:bg-brand-active data-disabled:not-aria-busy:opacity-50",
  secondary:
    "border-transparent bg-surface-hover text-text hover-fine:not-data-disabled:bg-surface-active active:not-data-disabled:bg-surface-active aria-expanded:bg-surface-active data-disabled:not-aria-busy:bg-surface-sunken data-disabled:not-aria-busy:text-text-disabled",
  ghost:
    "border-transparent text-text-muted hover-fine:not-data-disabled:bg-surface-hover hover-fine:not-data-disabled:text-text active:not-data-disabled:bg-surface-active aria-expanded:bg-surface-active aria-expanded:text-text data-disabled:not-aria-busy:text-text-disabled",
  danger:
    "border-line text-danger-text hover-fine:not-data-disabled:border-danger active:not-data-disabled:bg-danger-subtle data-disabled:not-aria-busy:bg-surface-sunken data-disabled:not-aria-busy:text-text-disabled",
  "danger-solid":
    "border-transparent bg-danger text-text-on-danger inset-shadow-highlight hover-fine:not-data-disabled:bg-danger-hover active:not-data-disabled:bg-danger-active data-disabled:not-aria-busy:opacity-50",
};

// Height → radius → padding, per the consistency contract. Icon buttons are square. Only
// icon-sm is under 44px both ways; it gets the 44×44 `hit-area` unless it sits in a row.
const SIZE: Record<ButtonSize, string> = {
  sm: "h-control-sm gap-1.5 rounded-control-sm px-3 text-ui-sm",
  md: "h-control-md gap-2 rounded-control px-3.5 text-ui",
  lg: "h-control-lg gap-2 rounded-control px-4 text-ui",
  "icon-sm": "size-8 rounded-control-sm text-ui-sm",
  icon: "size-9 rounded-control text-ui",
  "icon-lg": "size-10 rounded-control text-ui",
};

// The inset from the button's edge to its content: padding plus the 1px border for text sizes,
// and half of (box − 16px icon) for square ones.
const EDGE: Record<ButtonSize, Record<ButtonEdge, string>> = {
  sm: { start: "-ms-[calc(--spacing(3)+1px)]", end: "-me-[calc(--spacing(3)+1px)]" },
  md: { start: "-ms-[calc(--spacing(3.5)+1px)]", end: "-me-[calc(--spacing(3.5)+1px)]" },
  lg: { start: "-ms-[calc(--spacing(4)+1px)]", end: "-me-[calc(--spacing(4)+1px)]" },
  "icon-sm": { start: "-ms-2", end: "-me-2" },
  icon: { start: "-ms-2.5", end: "-me-2.5" },
  "icon-lg": { start: "-ms-3", end: "-me-3" },
};

const ICON_SIZES = new Set<ButtonSize>(["icon-sm", "icon", "icon-lg"]);
const WIDE = 220; // px; past this a 3% press reads as a lurch, so wide buttons press 1.5%

/**
 * A button on Base UI's Button. The label swaps with y + blur and the width springs, so a
 * label change never makes the button jump; loading overlays a spinner on the transparent
 * label so the width does not change at all. The press scale depends on the width.
 */
export function Button({
  variant = "secondary",
  size = "md",
  loading = false,
  children,
  swapKey,
  scaleOnPress = true,
  hitArea = size === "icon-sm",
  edge,
  disabled,
  focusableWhenDisabled,
  className = "",
  style,
  onPointerDown,
  onFocus,
  type = "button",
  ...props
}: ButtonProps) {
  const reduced = useSafeReducedMotion();
  const icon = ICON_SIZES.has(size);
  const trigger = props["aria-haspopup"] !== undefined && props["aria-haspopup"] !== false;
  const still = !scaleOnPress || trigger || disabled || loading;

  // `press` scales to --eased-press-scale; retune it per button rather than stacking classes.
  const pressScale = still ? "1" : icon ? "var(--eased-press-scale-icon)" : undefined;

  // Measured on pointer down and on focus (a keyboard press always follows focus), so a
  // button that grows into a wide slot presses like one.
  const measure = (el: HTMLElement) => {
    if (still || icon) return;
    el.style.setProperty("--eased-press-scale", el.offsetWidth > WIDE ? "var(--eased-press-scale-wide)" : "var(--eased-press-scale)");
  };

  const swappable = swapKey !== undefined || typeof children === "string" || typeof children === "number";
  const label = swappable ? <TextSwap swapKey={swapKey}>{children}</TextSwap> : children;

  return (
    <BaseButton
      {...props}
      type={type}
      disabled={disabled || loading}
      // Loading must not drop focus to <body> (a disabled button blurs itself).
      focusableWhenDisabled={loading || focusableWhenDisabled}
      aria-busy={loading || undefined}
      onPointerDown={(e) => {
        onPointerDown?.(e);
        measure(e.currentTarget);
      }}
      onFocus={(e) => {
        onFocus?.(e);
        measure(e.currentTarget);
      }}
      style={{ ...(pressScale ? { "--eased-press-scale": pressScale } : null), ...(style as CSSProperties) } as CSSProperties}
      className={`relative inline-flex shrink-0 cursor-pointer items-center justify-center border font-medium whitespace-nowrap select-none data-disabled:cursor-not-allowed aria-busy:cursor-progress [&_svg]:size-4 [&_svg]:shrink-0 ${press} ${VARIANT[variant]} ${SIZE[size]} ${hitArea ? "hit-area" : ""} ${edge ? EDGE[size][edge] : ""} ${className}`}
    >
      <motion.span
        className="inline-flex items-center justify-center gap-[inherit]"
        initial={false}
        animate={loading ? (reduced ? { opacity: 0 } : swapOut) : reduced ? { opacity: 1 } : swapShown}
        transition={
          reduced ? reducedFade : loading ? { ...swap, opacity: exitFast, filter: exitFast } : swap
        }
      >
        {label}
      </motion.span>
      <AnimatePresence initial={false}>
        {loading && (
          <motion.span
            key="spinner"
            className="absolute inset-0 flex items-center justify-center"
            initial={reduced ? { opacity: 0 } : swapIn}
            animate={reduced ? { opacity: 1 } : swapShown}
            exit={reduced ? { opacity: 0, transition: reducedFade } : { ...swapIn, transition: { ...swap, opacity: exitFast, filter: exitFast } }}
            transition={reduced ? reducedFade : swap}
          >
            <Spinner size="sm" label={false} className="text-current" />
          </motion.span>
        )}
      </AnimatePresence>
    </BaseButton>
  );
}
