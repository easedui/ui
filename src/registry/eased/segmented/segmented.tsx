"use client";

import { Radio } from "@base-ui/react/radio";
import { RadioGroup } from "@base-ui/react/radio-group";
import type { ReactNode } from "react";
import { Indicator, IndicatorGroup } from "../_primitives/indicator/indicator";

export type SegmentedOption<V extends string> = {
  value: V;
  /** The visible label. For an icon-only segment pass `icon` and an `aria-label` instead. */
  label?: ReactNode;
  /** A 16px icon before the label. */
  icon?: ReactNode;
  /** Required when there is no text label. */
  "aria-label"?: string;
  disabled?: boolean;
};

export type SegmentedProps<V extends string> = {
  options: readonly SegmentedOption<V>[];
  /** The selected value (controlled). */
  value?: V;
  /** The initially selected value (uncontrolled). Defaults to the first option. */
  defaultValue?: V;
  onValueChange?: (value: V) => void;
  /** `sm` is 32px (dense UI, toolbars, demo headers); `md` is 36px (forms, settings). Default `sm`. */
  size?: "sm" | "md";
  /** Stretch to the container and share the width equally between segments. */
  fullWidth?: boolean;
  /** Submits the value with a form under this name. */
  name?: string;
  disabled?: boolean;
  /** Accessible name, e.g. "Date range". Or point `aria-labelledby` at a visible label. */
  "aria-label"?: string;
  "aria-labelledby"?: string;
  className?: string;
};

const SIZES = {
  sm: {
    track: "h-control-sm rounded-control-sm [--radius-outer:var(--eased-radius-control-sm)]",
    item: "gap-1.5 px-3 text-ui-sm",
    icon: "px-2",
  },
  md: {
    track: "h-control-md rounded-control [--radius-outer:var(--eased-radius-control)]",
    item: "gap-2 px-3.5 text-ui",
    icon: "px-2.5",
  },
} as const;

/**
 * A single-choice control whose thumb glides to the selected segment on the snappy spring.
 * Base UI's RadioGroup supplies the behaviour: one tab stop, arrow keys move selection,
 * Home/End, form submission. Concentric by construction: the thumb's radius is the track's
 * minus its padding and border (`radius-nested`). Labels never change weight; the selected
 * one only darkens, and its cursor goes back to default because clicking it does nothing.
 * Segments carry no extended hit area: they sit edge to edge, and the track is the target.
 */
export function Segmented<V extends string>({
  options,
  value,
  defaultValue,
  onValueChange,
  size = "sm",
  fullWidth = false,
  name,
  disabled,
  className = "",
  ...aria
}: SegmentedProps<V>) {
  const s = SIZES[size];
  return (
    <RadioGroup<V>
      value={value}
      defaultValue={value === undefined ? (defaultValue ?? options[0]?.value) : undefined}
      onValueChange={(next) => onValueChange?.(next)}
      name={name}
      disabled={disabled}
      {...aria}
      className={`${fullWidth ? "flex w-full" : "inline-flex"} shrink-0 items-stretch border border-line-subtle bg-surface-sunken p-0.5 [--border-w:1px] [--pad:2px] ${s.track} ${className}`}
    >
      <IndicatorGroup>
        {options.map((option) => (
          <Radio.Root
            key={option.value}
            value={option.value}
            disabled={option.disabled}
            aria-label={option["aria-label"]}
            nativeButton
            render={(props, state) => (
              <button type="button" {...props}>
                {state.checked && (
                  <Indicator className="inset-0 radius-nested bg-surface-raised shadow-thumb" />
                )}
                {option.icon && <span className="relative flex size-4 shrink-0 items-center justify-center [&_svg]:size-4">{option.icon}</span>}
                {option.label !== undefined && <span className="relative truncate">{option.label}</span>}
              </button>
            )}
            className={(state) =>
              `relative flex min-w-0 items-center justify-center font-medium whitespace-nowrap radius-nested select-none transition-[color,background-color,border-color,box-shadow] duration-150 ease-standard focus-ring ${
                option.label === undefined ? s.icon : s.item
              } ${fullWidth ? "flex-1" : ""} ${
                state.disabled
                  ? "cursor-not-allowed text-text-disabled"
                  : state.checked
                    ? "cursor-default text-text"
                    : "cursor-pointer text-text-muted hover-fine:text-text-secondary"
              }`
            }
          />
        ))}
      </IndicatorGroup>
    </RadioGroup>
  );
}
