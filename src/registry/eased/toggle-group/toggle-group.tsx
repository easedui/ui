"use client";

import { Toggle } from "@base-ui/react/toggle";
import { ToggleGroup as BaseToggleGroup } from "@base-ui/react/toggle-group";
import { AnimatePresence } from "motion/react";
import { createContext, use, useState, type ReactNode } from "react";
import { exitFast, reducedFade, snappy, useSafeReducedMotion } from "../lib/motion";
import { Indicator, IndicatorGroup } from "../_primitives/indicator/indicator";

type GroupState = {
  pressed: readonly string[];
  multiple: boolean;
  /** The pressed set was empty before this change, so the highlight grows in instead of travelling. */
  fromEmpty: boolean;
  orientation: "horizontal" | "vertical";
  variant: "track" | "chips";
};

const ToggleGroupContext = createContext<GroupState | null>(null);

export type ToggleGroupProps = {
  /** Pressed values (controlled). */
  value?: readonly string[];
  /** Initially pressed values (uncontrolled). */
  defaultValue?: readonly string[];
  onValueChange?: (value: string[]) => void;
  /**
   * `false` (default): at most one item is pressed and the highlight travels between them,
   * like text alignment. `true`: any number, like bold/italic/underline; pressed neighbours
   * fuse into one continuous highlight.
   */
  multiple?: boolean;
  orientation?: "horizontal" | "vertical";
  /**
   * `track` (default): items share one 32px bordered track and one highlight. `chips`: a row
   * of separate bordered chips, each filling when pressed, for filter rows that may scroll.
   */
  variant?: "track" | "chips";
  disabled?: boolean;
  /** Accessible name for the group, e.g. "Text formatting". */
  "aria-label"?: string;
  "aria-labelledby"?: string;
  className?: string;
  children: ReactNode;
};

/**
 * A row of toggle buttons sharing one highlight. Base UI's ToggleGroup supplies the
 * behaviour: one tab stop, arrow keys between items, `aria-pressed` on each.
 * 32px tall like every grouped control track (2px padding, 1px border, items stretch to
 * 26px), concentric: the highlight's radius is the track's minus its padding and border.
 * A press tints the item (multi or toggle); Segmented's raised thumb is for single choice.
 */
export function ToggleGroup({
  value,
  defaultValue = [],
  onValueChange,
  multiple = false,
  orientation = "horizontal",
  variant = "track",
  disabled,
  className = "",
  children,
  ...aria
}: ToggleGroupProps) {
  const [uncontrolled, setUncontrolled] = useState<readonly string[]>(defaultValue);
  const pressed = value ?? uncontrolled;
  // Store what was pressed last render (React's "info from previous renders" pattern).
  const [prev, setPrev] = useState({ pressed, fromEmpty: true });
  let fromEmpty = prev.fromEmpty;
  if (prev.pressed !== pressed) {
    fromEmpty = prev.pressed.length === 0;
    setPrev({ pressed, fromEmpty });
  }
  const vertical = orientation === "vertical";

  return (
    <ToggleGroupContext value={{ pressed, multiple, fromEmpty, orientation, variant }}>
      <BaseToggleGroup
        value={pressed as string[]}
        onValueChange={(next) => {
          if (value === undefined) setUncontrolled(next);
          onValueChange?.(next);
        }}
        multiple={multiple}
        orientation={orientation}
        disabled={disabled}
        {...aria}
        className={`${
          variant === "chips"
            ? `flex gap-1.5 ${vertical ? "flex-col items-start" : "items-center"}`
            : `inline-flex shrink-0 rounded-control-sm border border-line-subtle bg-surface p-0.5 [--border-w:1px] [--pad:2px] [--radius-outer:var(--eased-radius-control-sm)] ${
                vertical ? "flex-col" : "h-control-sm items-stretch"
              }`
        } ${className}`}
      >
        <IndicatorGroup>{children}</IndicatorGroup>
      </BaseToggleGroup>
    </ToggleGroupContext>
  );
}

export type ToggleGroupItemProps = {
  value: string;
  /** An icon, a short label, or both. */
  children: ReactNode;
  /** Required for icon-only items, e.g. "Bold". */
  "aria-label"?: string;
  disabled?: boolean;
  className?: string;
};

/** One toggle. Its label never changes weight or size; only its colour and the highlight move. */
export function ToggleGroupItem({ value, children, disabled, className = "", ...aria }: ToggleGroupItemProps) {
  const group = use(ToggleGroupContext);
  if (!group) throw new Error("<ToggleGroupItem> must be rendered inside a <ToggleGroup>.");
  const reduced = useSafeReducedMotion();
  const pressed = group.pressed.includes(value);
  const vertical = group.orientation === "vertical";
  const iconOnly = aria["aria-label"] !== undefined;

  // Chips: each its own bordered 32px control that fills when pressed; no shared highlight.
  if (group.variant === "chips") {
    return (
      <Toggle
        value={value}
        disabled={disabled}
        {...aria}
        className={(state) =>
          `inline-flex h-control-sm shrink-0 items-center justify-center gap-1.5 rounded-control-sm border text-ui-sm font-medium whitespace-nowrap select-none transition-[color,background-color,border-color,box-shadow] duration-150 ease-standard focus-ring [&_svg]:size-4 [&_svg]:shrink-0 ${
            iconOnly ? "w-control-sm" : "px-3"
          } ${
            state.disabled
              ? "cursor-not-allowed border-line-subtle text-text-disabled"
              : state.pressed
                ? "cursor-pointer border-transparent bg-surface-active text-text"
                : "cursor-pointer border-line-subtle text-text-secondary hover-fine:bg-surface-hover hover-fine:text-text"
          } ${className}`
        }
      >
        {children}
      </Toggle>
    );
  }

  return (
    <Toggle
      value={value}
      disabled={disabled}
      {...aria}
      render={(props, state) => (
        <button type="button" {...props}>
          {group.multiple ? (
            <AnimatePresence initial={false}>
              {pressed && (
                <Indicator
                  key="on"
                  name={value}
                  initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: reduced ? 1 : 0.96, transition: reduced ? reducedFade : exitFast }}
                  transition={reduced ? reducedFade : { ...snappy, opacity: { duration: 0.12 } }}
                  className="inset-0 radius-nested bg-surface-active"
                />
              )}
            </AnimatePresence>
          ) : (
            // Travelling hands over instantly; clearing the group fades the highlight out.
            <AnimatePresence initial={false} custom={group.pressed.length === 0}>
              {pressed && (
                <Indicator
                  key="on"
                  custom={group.pressed.length === 0}
                  variants={{
                    gone: (cleared: boolean) =>
                      cleared
                        ? { opacity: 0, scale: reduced ? 1 : 0.96, transition: reduced ? reducedFade : exitFast }
                        : { opacity: 0, transition: { duration: 0 } },
                  }}
                  initial={group.fromEmpty && !reduced ? { opacity: 0, scale: 0.9 } : false}
                  animate={{ opacity: 1, scale: 1 }}
                  exit="gone"
                  className="inset-0 radius-nested bg-surface-active"
                />
              )}
            </AnimatePresence>
          )}
          {/* The bridge: fills the seam to the next pressed item so a run reads as one shape. */}
          {group.multiple && (
            <span
              aria-hidden
              className={`pointer-events-none absolute bg-surface-active opacity-0 transition-opacity duration-(--eased-duration-fast) ease-standard reduced:duration-(--eased-duration-instant) ${
                vertical ? "inset-x-0 -bottom-1.5 h-3" : "inset-y-0 -right-1.5 w-3"
              } ${state.pressed ? "[:has(+[data-pressed])>&]:opacity-100" : ""}`}
            />
          )}
          <span className="relative flex items-center gap-1.5 [&_svg]:size-4 [&_svg]:shrink-0">{children}</span>
        </button>
      )}
      className={(state) =>
        `relative flex min-w-7 shrink-0 items-center justify-center radius-nested text-ui-sm font-medium whitespace-nowrap select-none transition-[color,background-color,border-color,box-shadow] duration-150 ease-standard focus-ring ${
          iconOnly ? "px-1.5" : "px-2.5"
        } ${vertical ? "h-7" : ""} ${
          state.disabled
            ? "cursor-not-allowed text-text-disabled"
            : state.pressed
              ? "cursor-pointer text-text"
              : "cursor-pointer text-text-muted hover-fine:bg-surface-hover hover-fine:text-text-secondary"
        } ${className}`
      }
    />
  );
}
