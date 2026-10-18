"use client";

import { Input as BaseInput } from "@base-ui/react/input";
import type { ComponentProps, ReactNode } from "react";
import {
  InputGroup,
  InputGroupAddon,
  controlClass,
  type ControlSize,
} from "../_primitives/field/field";

export type InputProps = Omit<ComponentProps<typeof BaseInput>, "size" | "className"> & {
  /** sm 32px, md 36px (default), lg 40px. */
  size?: ControlSize;
  /** Leading content: an icon, or a prefix such as "https://". */
  start?: ReactNode;
  /** Trailing content: a unit, a kbd hint, a button. */
  end?: ReactNode;
  /**
   * Mark the input invalid outside a `Field` (inside one, the field's validity drives it):
   * red border, `aria-invalid`, and one shake when it turns on.
   */
  invalid?: boolean;
  /** Classes for the bordered shell. */
  className?: string;
  /** Classes for the `<input>` itself. */
  controlClassName?: string;
};

/**
 * A text input on Base UI's Input, so it labels, describes and validates itself inside a
 * `Field`. Focus firms the border and grows a soft glow; an error shakes the box once, 6px, and the field's
 * message opens under it with a height spring.
 */
export function Input({
  size = "md",
  start,
  end,
  invalid,
  className = "",
  controlClassName = "",
  ...props
}: InputProps) {
  return (
    <InputGroup size={size} invalid={invalid} className={className}>
      {start !== undefined && <InputGroupAddon>{start}</InputGroupAddon>}
      <BaseInput
        {...props}
        {...(invalid !== undefined ? { "aria-invalid": invalid } : null)}
        className={`${controlClass} ${controlClassName}`}
      />
      {end !== undefined && <InputGroupAddon>{end}</InputGroupAddon>}
    </InputGroup>
  );
}
