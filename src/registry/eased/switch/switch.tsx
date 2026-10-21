"use client";

import { Switch as BaseSwitch } from "@base-ui/react/switch";
import { useId, type ReactNode } from "react";

export type SwitchProps = {
  /** On (controlled). */
  checked?: boolean;
  /** Initially on (uncontrolled). */
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  /** What a form submits under `name` while on. */
  value?: string;
  name?: string;
  disabled?: boolean;
  required?: boolean;
  readOnly?: boolean;
  /**
   * The label. With one, Switch renders a settings row: label (and description) on the left,
   * the switch on the right, and the whole row toggles it. Leave it out for a bare switch, and
   * pass `aria-label`.
   */
  children?: ReactNode;
  /** Muted text under the label. */
  description?: ReactNode;
  "aria-label"?: string;
  id?: string;
  className?: string;
};

/*
 * The thumb is a 20px box clipped to a 16px circle. At rest the clip hides the 4px on the
 * side it travels toward; pressing opens the clip, so the thumb stretches in the direction it
 * is about to move, then the box translates 12px while the clip closes behind it. Visually the
 * circle travels 16px. Only transform and clip-path animate, on the snappy spring.
 */
const THUMB_CLIP =
  "[clip-path:inset(0_4px_0_0_round_8px)] group-data-checked:[clip-path:inset(0_0_0_4px_round_8px)] group-active:[clip-path:inset(0_0_0_0_round_8px)] group-data-disabled:group-active:[clip-path:inset(0_4px_0_0_round_8px)] group-data-disabled:group-data-checked:group-active:[clip-path:inset(0_0_0_4px_round_8px)] group-data-readonly:group-active:[clip-path:inset(0_4px_0_0_round_8px)] group-data-readonly:group-data-checked:group-active:[clip-path:inset(0_0_0_4px_round_8px)]";

const SPRING =
  "[transition:translate_var(--eased-duration-spring-snappy)_var(--eased-spring-snappy),clip-path_var(--eased-duration-spring-snappy)_var(--eased-spring-snappy),background-color_150ms_var(--eased-ease-standard)] reduced:[transition:background-color_100ms_linear]";

function SwitchTrack() {
  return (
    <>
      {/* Drop shadows on the unclipped wrapper, so the clip does not cut them off. Tinted from the shadow token. */}
      <span
        aria-hidden
        className={`pointer-events-none absolute top-0.5 left-0.5 h-4 w-5 translate-x-0 group-data-checked:translate-x-3 [filter:drop-shadow(0_1px_1.5px_oklch(var(--eased-shadow-tint)/0.2))_drop-shadow(0_0_0.5px_oklch(var(--eased-shadow-tint)/0.18))] ${SPRING}`}
      >
        <BaseSwitch.Thumb
          className={`block size-full group-data-unchecked:bg-surface-raised dark:group-data-unchecked:bg-text-secondary group-data-checked:bg-text-on-brand ${THUMB_CLIP} ${SPRING}`}
        />
      </span>
    </>
  );
}

const TRACK =
  "group relative inline-flex h-5 w-9 shrink-0 rounded-pill inset-shadow-well transition-colors duration-150 ease-standard focus-ring data-unchecked:bg-surface-active data-checked:bg-brand hover-fine:data-unchecked:not-data-disabled:bg-line hover-fine:data-checked:not-data-disabled:bg-brand-hover data-disabled:cursor-not-allowed data-disabled:opacity-50";

/**
 * A switch on Base UI: Space and Enter toggle it, forms submit it, Field validates it. The
 * thumb springs across and, while pressed, stretches toward where it is going.
 */
export function Switch({ children, description, className = "", ...props }: SwitchProps) {
  const id = useId();

  if (children == null) {
    return (
      <BaseSwitch.Root {...props} className={(s) => `${TRACK} ${s.readOnly ? "cursor-default" : "cursor-pointer"} ${className}`}>
        <SwitchTrack />
      </BaseSwitch.Root>
    );
  }

  return (
    <div className={`grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-start gap-x-4 ${className}`}>
      <span className="flex min-w-0 flex-col gap-0.5 py-px">
        <label
          htmlFor={`${id}-switch`}
          id={`${id}-label`}
          className={`text-ui ${props.disabled ? "cursor-not-allowed text-text-disabled" : "cursor-pointer text-text"}`}
        >
          {children}
        </label>
        {description && (
          <span id={`${id}-desc`} className="text-ui-sm text-text-muted text-pretty">
            {description}
          </span>
        )}
      </span>
      {/* 20px switch on the label's 20px first line (rule 107). */}
      <BaseSwitch.Root
        {...props}
        id={props.id ?? `${id}-switch`}
        aria-labelledby={`${id}-label`}
        aria-describedby={description ? `${id}-desc` : undefined}
        className={(s) => `${TRACK} mt-px ${s.readOnly ? "cursor-default" : "cursor-pointer"}`}
      >
        <SwitchTrack />
      </BaseSwitch.Root>
    </div>
  );
}
