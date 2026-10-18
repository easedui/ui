"use client";

import { Field as BaseField } from "@base-ui/react/field";
import { AnimatePresence, animate, motion, useIsPresent } from "motion/react";
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentProps,
  type ComponentPropsWithoutRef,
  type PointerEvent,
  type ReactNode,
} from "react";
import { enter, exitFast, reducedFade, smooth, swap, swapIn, swapOut, swapShown, useSafeReducedMotion } from "../../lib/motion";
import { AutoHeight } from "../auto-height/auto-height";

/* ---------- Sizes ------------------------------------------------------------- */

export type ControlSize = "sm" | "md" | "lg";

/**
 * Height, radius, gap and type for a text control's shell, by size. Each sets
 * `--radius-outer`/`--pad` so anything nested (a clear button, a chip) can use `radius-nested`.
 */
export const controlSizeClass: Record<ControlSize, string> = {
  sm: "min-h-control-sm rounded-control-sm gap-1.5 text-ui-sm [--pad:6px] [--radius-outer:var(--eased-radius-control-sm)]",
  md: "min-h-control-md rounded-control gap-2 text-ui [--pad:8px] [--radius-outer:var(--eased-radius-control)]",
  lg: "min-h-control-lg rounded-control gap-2 text-ui [--pad:8px] [--radius-outer:var(--eased-radius-control)]",
};

/** Horizontal padding of a one-line shell, by size (0.3–0.35 × height: text fields sit tighter than buttons). */
export const controlPadClass: Record<ControlSize, string> = { sm: "px-2.5", md: "px-3", lg: "px-3.5" };

/**
 * Classes for the bare `<input>`/`<textarea>` inside an `InputGroup`: no box of its own (the
 * group draws border and focus), 16px on touch screens so iOS does not zoom on focus.
 */
export const controlClass =
  "min-w-0 flex-1 self-stretch bg-transparent text-text outline-none placeholder:text-text-muted disabled:cursor-not-allowed disabled:text-text-disabled disabled:placeholder:text-text-disabled pointer-coarse:text-ui-md";

/* ---------- Root, label, description ---------------------------------------- */

export type FieldRootProps = Omit<ComponentProps<typeof BaseField.Root>, "className"> & { className?: string };

/**
 * Base UI's Field.Root: wires label, control, description and error together (ids,
 * `aria-describedby`, validation, `data-invalid` …). Stacks its parts with a 6px rhythm.
 */
export function FieldRoot({ className = "", ...props }: FieldRootProps) {
  return (
    <BaseField.Root
      {...props}
      className={`group/field flex min-w-0 flex-col gap-1.5 ${className}`}
    />
  );
}

export type FieldLabelProps = Omit<ComponentProps<typeof BaseField.Label>, "className"> & { className?: string };

export function FieldLabel({ className = "", ...props }: FieldLabelProps) {
  return (
    <BaseField.Label
      {...props}
      className={`w-fit cursor-default text-ui font-medium text-text group-data-disabled/field:text-text-disabled ${className}`}
    />
  );
}

/* ---------- The message slot: description ⇄ error ----------------------------- */

export type FieldMessageProps = {
  /** Helper text shown while the field is valid. An error takes its place, then gives it back. */
  description?: ReactNode;
  /**
   * The error to show while the field is invalid. Leave it out to show Base UI's message: your
   * `validate()` result, a `<Form errors>` entry, or the browser's validation message.
   */
  error?: ReactNode;
  className?: string;
};

/**
 * One line under the control that holds either the description or the error. They swap in
 * place with y + blur (the outgoing line lifts, the incoming rises), and the slot's height
 * springs when the line count changes or the slot opens from nothing. Must sit inside a
 * `FieldRoot`.
 */
export function FieldMessage(props: FieldMessageProps) {
  return <BaseField.Validity>{(v) => <MessageSlot {...props} validity={v} />}</BaseField.Validity>;
}

function MessageSlot({
  description,
  error,
  className = "",
  validity,
}: FieldMessageProps & { validity: BaseField.Validity.State }) {
  const reduced = useSafeReducedMotion();
  const invalid = validity.validity.valid === false;
  // Key the error by its text, so a new message swaps instead of sitting still.
  const errorKey = typeof error === "string" ? error : validity.errors.join("\n") || validity.error || "invalid";
  // An error with no description to replace opens the slot: let the control's shake land first.
  const delay = invalid && !description && !reduced ? 0.08 : 0;

  return (
    // The slot owns the 6px gap above it (pt-1.5 against -mt-1.5), so an empty slot adds no space.
    <AutoHeight fade={false} transition={{ ...smooth, delay }} className={`-mt-1.5 ${className}`} aria-live="polite">
      <div className="relative">
        <AnimatePresence mode="popLayout" initial={false}>
          {invalid ? (
            <MessageLine key={`error:${errorKey}`} reduced={reduced} delay={delay} tone="error">
              <ErrorIcon />
              <ErrorText error={error} />
            </MessageLine>
          ) : description ? (
            <MessageLine key="description" reduced={reduced} delay={0} tone="description">
              <BaseField.Description className="min-w-0 text-pretty">{description}</BaseField.Description>
            </MessageLine>
          ) : null}
        </AnimatePresence>
      </div>
    </AutoHeight>
  );
}

// `ref` is forwarded: AnimatePresence's popLayout needs it to lift the outgoing line out of flow.
function MessageLine({
  children,
  reduced,
  delay,
  tone,
  ref,
}: {
  children: ReactNode;
  reduced: boolean;
  delay: number;
  tone: "error" | "description";
  ref?: React.Ref<HTMLDivElement>;
}) {
  const present = useIsPresent();
  return (
    <motion.div
      ref={ref}
      aria-hidden={present ? undefined : true}
      initial={reduced ? { opacity: 0 } : swapIn}
      animate={reduced ? { opacity: 1 } : swapShown}
      exit={
        reduced
          ? { opacity: 0, transition: reducedFade }
          : { ...swapOut, transition: { ...swap, opacity: exitFast, filter: exitFast } }
      }
      transition={reduced ? reducedFade : { ...swap, opacity: { ...enter, delay }, filter: { ...enter, delay }, delay }}
      className={`flex w-full items-start gap-1.5 pt-1.5 text-ui-sm ${
        tone === "error" ? "text-danger-text" : "text-text-secondary"
      }`}
    >
      {children}
    </motion.div>
  );
}

/**
 * Base UI's Field.Error, which reads the live message. A line that is leaving keeps the
 * message it arrived with, so the outgoing copy never flashes the incoming text.
 */
function ErrorText({ error }: { error?: ReactNode }) {
  const present = useIsPresent();
  const frozen = useRef<ReactNode>(null);
  return (
    <BaseField.Error
      match
      className="min-w-0 text-pretty"
      // No `children` key unless we have one: an explicit undefined would blank Base UI's message.
      {...(error !== undefined ? { children: error } : null)}
      render={(props) => {
        if (present) frozen.current = props.children;
        return <div {...props}>{present ? props.children : frozen.current}</div>;
      }}
    />
  );
}

function ErrorIcon() {
  // 16px to match 13px text (rule 54), centred on the first line (rule 58).
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden className="mt-px size-4 shrink-0 translate-y-[0.5px]">
      <circle cx="8" cy="8" r="6.25" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 4.75v3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="8" cy="10.9" r="0.85" fill="currentColor" />
    </svg>
  );
}

/* ---------- Input group: the box a text control lives in -------------------- */

export type InputGroupProps = ComponentPropsWithoutRef<"div"> & {
  size?: ControlSize;
  /**
   * Draw the invalid state and shake once when it turns on. Inside a `FieldRoot` this follows
   * the field's validity on its own; pass it to drive a standalone control.
   */
  invalid?: boolean;
  /** Stack content vertically (a textarea and its footer) instead of in one row. */
  multiline?: boolean;
};

/**
 * The bordered shell for a text control and its addons (icons, prefixes, a clear button, a
 * shortcut hint). Hover steps the border up once; focus steps it up and grows a soft 3px glow
 * (`--eased-ring-soft`), the only ring the field draws; an invalid field keeps its danger border
 * and glows in danger while focused; a field turning invalid shakes the shell once, 6px, then
 * the message opens. A press anywhere
 * on the shell that is not itself interactive focuses the control, so addons never steal it.
 */
export function InputGroup({
  size = "md",
  invalid: invalidProp,
  multiline = false,
  className = "",
  onPointerDown,
  children,
  ...props
}: InputGroupProps) {
  const reduced = useSafeReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const controlInvalid = useControlInvalid(ref);
  const invalid = invalidProp ?? controlInvalid;
  useShakeOnInvalid(ref, invalid, reduced);

  const focusControl = (e: PointerEvent<HTMLDivElement>) => {
    onPointerDown?.(e);
    if (e.defaultPrevented || e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (target.closest("input, textarea, select, button, a, [role=button], [contenteditable=true]")) return;
    const control = ref.current?.querySelector<HTMLElement>("input, textarea");
    if (!control || control.matches(":disabled")) return;
    e.preventDefault();
    control.focus();
  };

  return (
    <div
      ref={ref}
      {...props}
      data-invalid={invalid || undefined}
      onPointerDown={focusControl}
      className={`relative flex w-full min-w-0 cursor-text border border-line-strong bg-surface text-text transition-[border-color,background-color,box-shadow] duration-(--eased-duration-standard) ease-standard reduced:transition-none ${
        multiline ? "flex-col items-stretch" : `items-center ${controlPadClass[size]}`
      } ${controlSizeClass[size]} hover-fine:not-data-invalid:border-(--eased-neutral-9) focus-within:not-data-invalid:border-(--eased-neutral-9) focus-within:shadow-[0_0_0_3px_var(--eased-ring-soft)] data-invalid:border-danger focus-within:data-invalid:shadow-[0_0_0_3px_var(--eased-ring-danger)] has-[:is(input,textarea,[aria-haspopup]):disabled]:cursor-not-allowed has-[:is(input,textarea,[aria-haspopup]):disabled]:border-line has-[:is(input,textarea,[aria-haspopup]):disabled]:bg-surface-sunken has-[:is(input,textarea,[aria-haspopup]):disabled]:text-text-disabled ${className}`}
    >
      {children}
    </div>
  );
}

/**
 * Whether the control inside reads as invalid. Base UI marks a field's control with
 * `data-invalid` and `aria-invalid`, so this works inside a Field and for a standalone control
 * given `aria-invalid`, with no context required.
 */
function useControlInvalid(ref: React.RefObject<HTMLElement | null>) {
  const [invalid, setInvalid] = useState(false);
  useLayoutEffect(() => {
    const control = ref.current?.querySelector("input, textarea");
    if (!control) return;
    const read = () =>
      setInvalid(control.hasAttribute("data-invalid") || control.getAttribute("aria-invalid") === "true");
    read();
    const mo = new MutationObserver(read);
    mo.observe(control, { attributes: true, attributeFilter: ["data-invalid", "aria-invalid"] });
    return () => mo.disconnect();
  }, [ref]);
  return invalid;
}

/** One horizontal shake, 6px, when `invalid` turns on. Reduced motion: none (the colour carries it). */
export function useShakeOnInvalid(ref: React.RefObject<HTMLElement | null>, invalid: boolean, reduced: boolean) {
  const was = useRef(invalid);
  useEffect(() => {
    const turnedOn = invalid && !was.current;
    was.current = invalid;
    if (!turnedOn || reduced || !ref.current) return;
    const shake = animate(ref.current, { x: [0, -6, 5, -3, 1.5, 0] }, { duration: 0.36, ease: "easeOut" });
    return () => shake.stop();
  }, [invalid, reduced, ref]);
}

export type InputGroupAddonProps = ComponentPropsWithoutRef<"span">;

/** A leading or trailing slot: icons at 16px in the muted colour, text prefixes, kbd hints. */
export function InputGroupAddon({ className = "", ...props }: InputGroupAddonProps) {
  return (
    <span
      {...props}
      className={`inline-flex shrink-0 items-center gap-1.5 text-text-muted select-none [&_svg]:size-4 [&_svg]:shrink-0 ${className}`}
    />
  );
}
