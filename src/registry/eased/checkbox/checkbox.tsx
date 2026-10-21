"use client";

import { Checkbox as BaseCheckbox } from "@base-ui/react/checkbox";
import { CheckboxGroup as BaseCheckboxGroup } from "@base-ui/react/checkbox-group";
import { motion } from "motion/react";
import { useId, type ReactNode } from "react";
import { ease, duration, reducedFade, snappy, useSafeReducedMotion } from "../lib/motion";

/*
 * One stroke, three points, two shapes: the check and the indeterminate dash share a command
 * structure, so the check's corner slides up into a straight line instead of cross-fading.
 */
const CHECK = "M4.25 8.4 L6.9 11 L11.75 5.25";
const DASH = "M4.5 8 L8 8 L11.5 8";

// Colour on the standard curve; the box presses to 0.9 in 100ms and springs back (rule 63).
const PRESS =
  "[transition:background-color_150ms_var(--eased-ease-standard),border-color_150ms_var(--eased-ease-standard),scale_var(--eased-duration-spring-snappy)_var(--eased-spring-snappy)] group-active:scale-90 group-active:duration-(--eased-duration-instant) group-active:ease-standard reduced:group-active:scale-none group-data-disabled:scale-none group-data-readonly:scale-none";

/** The 16px box: the fill tints in, the mark draws on and morphs between check and dash. */
function CheckboxControl({ checked, indeterminate, disabled }: { checked: boolean; indeterminate: boolean; disabled: boolean }) {
  const reduced = useSafeReducedMotion();
  const on = checked || indeterminate;
  const shape = indeterminate ? DASH : CHECK;

  const transition = reduced
    ? { d: { duration: 0 }, pathLength: { duration: 0 }, opacity: reducedFade }
    : on
      ? { d: snappy, pathLength: { duration: duration.standard, ease: ease.enter }, opacity: { duration: duration.instant } }
      : { d: snappy, pathLength: { duration: duration.instant, ease: ease.exit }, opacity: { duration: duration.instant, delay: 0.04 } };

  return (
    <span
      aria-hidden
      className={`relative flex size-4 shrink-0 items-center justify-center rounded-control-2xs border ${PRESS} ${
        disabled
          ? on
            ? "border-transparent bg-text-disabled"
            : "border-line bg-surface-sunken"
          : on
            ? "border-brand bg-brand"
            : "border-line-strong bg-surface group-hover-fine:border-text-muted"
      }`}
    >
      <svg viewBox="0 0 16 16" fill="none" className="absolute -inset-px size-4 overflow-visible">
        <motion.path
          initial={false}
          animate={{ d: shape, pathLength: on ? 1 : 0, opacity: on ? 1 : 0 }}
          transition={transition}
          className={disabled ? "stroke-surface" : "stroke-text-on-brand"}
          strokeWidth={1.75}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

export type CheckboxProps = {
  /** Checked (controlled). */
  checked?: boolean;
  /** Initially checked (uncontrolled). */
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  /** Shows the dash. A parent checkbox in a `CheckboxGroup` sets this itself. */
  indeterminate?: boolean;
  /** Controls every checkbox in its `CheckboxGroup`: checks or clears them all, and shows the dash when some are checked. */
  parent?: boolean;
  /** Its value inside a `CheckboxGroup`, and what a form submits under `name`. */
  value?: string;
  name?: string;
  disabled?: boolean;
  required?: boolean;
  readOnly?: boolean;
  /** The label. Clicking anywhere on the row toggles it. Leave it out for a bare box, and pass `aria-label`. */
  children?: ReactNode;
  /** Muted text under the label, e.g. why it is disabled. */
  description?: ReactNode;
  "aria-label"?: string;
  id?: string;
  className?: string;
};

/**
 * A checkbox on Base UI: keyboard (Space), form submission, Field validation and group
 * parents. The fill tints in, the check draws itself, and the indeterminate dash is the same
 * stroke straightened, so check ⇄ dash morphs rather than swaps.
 */
export function Checkbox({ children, description, className = "", ...props }: CheckboxProps) {
  const id = useId();
  const labelled = children != null;

  return (
    <BaseCheckbox.Root
      {...props}
      aria-labelledby={labelled ? `${id}-label` : undefined}
      aria-describedby={description ? `${id}-desc` : undefined}
      render={(htmlProps, state) => (
        <span {...htmlProps}>
          {labelled ? (
            <>
              {/* 16px box centred on the 14px label's 20px first line (rule 107). */}
              <span className="flex h-5 items-center">
                <CheckboxControl checked={state.checked} indeterminate={state.indeterminate} disabled={state.disabled} />
              </span>
              <span className="flex min-w-0 flex-col gap-0.5">
                <span id={`${id}-label`} className={`text-ui ${state.disabled ? "text-text-disabled" : "text-text"}`}>
                  {children}
                </span>
                {description && (
                  <span id={`${id}-desc`} className="text-ui-sm text-text-muted text-pretty">
                    {description}
                  </span>
                )}
              </span>
            </>
          ) : (
            <CheckboxControl checked={state.checked} indeterminate={state.indeterminate} disabled={state.disabled} />
          )}
        </span>
      )}
      className={(state) =>
        `group inline-flex min-w-0 items-start text-left select-none focus-ring ${
          labelled ? "gap-2.5 rounded-control-xs py-1.5" : "rounded-control-2xs"
        } ${state.disabled ? "cursor-not-allowed" : state.readOnly ? "cursor-default" : "cursor-pointer"} ${className}`
      }
    />
  );
}

export type CheckboxGroupProps = {
  /** Checked values (controlled). */
  value?: string[];
  /** Initially checked values (uncontrolled). */
  defaultValue?: string[];
  onValueChange?: (value: string[]) => void;
  /** Every child's value. Required when the group has a `parent` checkbox. */
  allValues?: string[];
  disabled?: boolean;
  "aria-label"?: string;
  "aria-labelledby"?: string;
  className?: string;
  children: ReactNode;
};

/** A list of checkboxes that share one value array, with an optional parent "Select all". */
export function CheckboxGroup({ className = "", onValueChange, children, ...props }: CheckboxGroupProps) {
  return (
    <BaseCheckboxGroup {...props} onValueChange={(v) => onValueChange?.(v)} className={`flex flex-col ${className}`}>
      {children}
    </BaseCheckboxGroup>
  );
}
