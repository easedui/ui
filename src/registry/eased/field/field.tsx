"use client";

import type { ReactNode } from "react";
import {
  FieldLabel,
  FieldMessage,
  FieldRoot,
  type FieldRootProps,
} from "../_primitives/field/field";

export type FieldProps = Omit<FieldRootProps, "children"> & {
  /** The visible label, tied to the control for you. */
  label?: ReactNode;
  /** Helper text under the control. While the field is invalid the error takes its place. */
  description?: ReactNode;
  /**
   * An error you control (a server reply, a form library). Setting it marks the field invalid.
   * Leave it out to show the message from `validate`, `<Form errors>` or the browser.
   */
  error?: ReactNode;
  /** One control: `<Input>`, `<Textarea>`, `<SearchField>`, or any Base UI control. */
  children: ReactNode;
};

/**
 * Label, control and one message line, on Base UI's Field. The description and the error
 * share the line and swap with y + blur; the line's height springs when it opens or rewraps.
 * Inside Base UI's `<Form>`, submitting focuses the first invalid field.
 */
export function Field({ label, description, error, invalid, children, ...props }: FieldProps) {
  const hasError = error !== undefined && error !== null && error !== false && error !== "";
  return (
    <FieldRoot {...props} invalid={invalid ?? (hasError || undefined)}>
      {label !== undefined && <FieldLabel>{label}</FieldLabel>}
      {children}
      <FieldMessage description={description} error={hasError ? error : undefined} />
    </FieldRoot>
  );
}

export { FieldRoot, FieldLabel, FieldMessage } from "../_primitives/field/field";
