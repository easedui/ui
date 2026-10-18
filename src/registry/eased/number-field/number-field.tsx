"use client";

import { NumberField as BaseNumberField } from "@base-ui/react/number-field";
import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type ComponentProps, type PointerEvent, type ReactNode } from "react";
import { InputGroup, InputGroupAddon, controlClass, type ControlSize } from "../_primitives/field/field";
import { NumberRoll } from "../_primitives/number-roll/number-roll";
import { minusFormatter } from "../lib/format";
import { pressIcon } from "../lib/press";

type RootProps = ComponentProps<typeof BaseNumberField.Root>;

export type NumberFieldProps = Omit<RootProps, "className" | "render" | "value" | "defaultValue" | "onValueChange" | "children" | "step"> & {
  /** Controlled value; `null` is empty. */
  value?: number | null;
  /** Uncontrolled starting value. */
  defaultValue?: number | null;
  /** Fires on every change: typing, a stepper press, each repeat while held, arrows and scrubbing. */
  onValueChange?: (value: number | null) => void;
  /** Amount each press, arrow key or scrub tick moves. Default 1. Shift uses `largeStep`, Alt `smallStep`. */
  step?: number;
  /** A visible label above the field. Leave it out inside a `Field` with its own label. */
  label?: ReactNode;
  /** Drag the label sideways to change the value (Base UI's scrub area). Needs `label`. Default false. */
  scrub?: boolean;
  /** Where the steppers sit: both at the end (default), or − before and + after a centred value. */
  layout?: "end" | "split";
  /** sm 32px, md 36px (default), lg 40px. */
  size?: ControlSize;
  /** Leading content inside the box, e.g. an icon. Not shown in the split layout. */
  start?: ReactNode;
  placeholder?: string;
  /** Roll digits when the value changes from the steppers, arrows or a scrub. Default true. */
  animated?: boolean;
  /** Accessible names for the steppers. */
  incrementLabel?: string;
  decrementLabel?: string;
  /** Classes for the root (label + box). */
  className?: string;
  /** Classes for the bordered box. */
  groupClassName?: string;
  "aria-label"?: string;
};

// Steppers sit 3px inside the box's border, so their radius is the box's minus that inset (R4).
const STEPPER: Record<ControlSize, { button: string; end: string; start: string }> = {
  sm: {
    button: "size-6 rounded-control-2xs",
    end: "-me-[7px]",
    start: "-ms-[7px]",
  },
  md: {
    button: "size-7 rounded-control-xs",
    end: "-me-[9px]",
    start: "-ms-[9px]",
  },
  lg: {
    button: "size-8 rounded-control-xs",
    end: "-me-[11px]",
    start: "-ms-[11px]",
  },
};

// Press and hold: one step at once, then repeats after 400ms that speed up from 150ms to 35ms.
const HOLD_DELAY = 400;
const FIRST_TICK = 150;
const FASTEST_TICK = 35;
const ACCELERATION = 0.86;

const decimals = (n: number) => {
  const s = String(n);
  if (s.includes("e-")) return Number(s.split("e-")[1]);
  return s.split(".")[1]?.length ?? 0;
};

/**
 * A number input on Base UI's NumberField: typed entry parses in the field's locale, arrows
 * and PageUp/PageDown step, and the value is clamped to `min`/`max`. Its steppers repeat while
 * held and speed up the longer you hold. Outside of typing, the shown value is a NumberRoll, so
 * each step rolls its digits in the direction of change, and negatives use the true minus.
 */
export function NumberField({
  value: valueProp,
  defaultValue = null,
  onValueChange,
  step = 1,
  smallStep = step / 10,
  largeStep = step * 10,
  min,
  max,
  format,
  locale,
  label,
  scrub = false,
  layout = "end",
  size = "md",
  start,
  placeholder,
  animated = true,
  incrementLabel = "Increase",
  decrementLabel = "Decrease",
  disabled,
  readOnly,
  id: idProp,
  className = "",
  groupClassName = "",
  "aria-label": ariaLabel,
  ...props
}: NumberFieldProps) {
  const autoId = useId();
  const id = idProp ?? autoId;
  const [uncontrolled, setUncontrolled] = useState<number | null>(defaultValue);
  const value = valueProp !== undefined ? valueProp : uncontrolled;
  // The latest value for the hold loop, which steps from it between renders.
  const valueRef = useRef(value);
  useLayoutEffect(() => {
    valueRef.current = value;
  }, [value]);

  // The roll stands in for the input's text unless someone is typing in it.
  const [focused, setFocused] = useState(false);
  const [typing, setTyping] = useState(false);
  const [scrubbing, setScrubbing] = useState(false);
  const showRoll = value !== null && (!focused || !typing);

  const set = useCallback(
    (next: number | null) => {
      if (valueProp === undefined) setUncontrolled(next);
      valueRef.current = next;
      onValueChange?.(next);
    },
    [valueProp, onValueChange],
  );

  const lo = min ?? -Infinity;
  const hi = max ?? Infinity;
  const places = Math.max(decimals(step), decimals(smallStep), decimals(largeStep));

  /** One step from the current value; false once a bound stops it. */
  const stepBy = useCallback(
    (amount: number) => {
      const clamp = (n: number) => Math.min(hi, Math.max(lo, n));
      const current = valueRef.current;
      // From empty, the first press lands on 0 (or the nearest bound), as Base UI's arrows do.
      const next = current === null ? clamp(0) : clamp(Number((current + amount).toFixed(places)));
      if (next === valueRef.current) return false;
      set(next);
      setTyping(false);
      return next !== lo && next !== hi;
    },
    [lo, hi, places, set],
  );

  const roll = useMemo(() => minusFormatter(locale, format ?? {}), [locale, format]);
  const atMin = value !== null && value <= lo;
  const atMax = value !== null && value >= hi;
  const inert = disabled || readOnly;

  const s = STEPPER[size];
  const decrement = (
    <Stepper
      dir={-1}
      label={decrementLabel}
      disabled={inert || atMin}
      className={s.button}
      stepBy={stepBy}
      step={step}
      smallStep={smallStep}
      largeStep={largeStep}
      controls={id}
    >
      <MinusIcon />
    </Stepper>
  );
  const increment = (
    <Stepper
      dir={1}
      label={incrementLabel}
      disabled={inert || atMax}
      className={s.button}
      stepBy={stepBy}
      step={step}
      smallStep={smallStep}
      largeStep={largeStep}
      controls={id}
    >
      <PlusIcon />
    </Stepper>
  );
  const split = layout === "split";

  return (
    <BaseNumberField.Root
      {...props}
      id={id}
      value={value}
      onValueChange={(next, details) => {
        set(next);
        const r = details.reason;
        setTyping(r === "input-change" || r === "input-clear" || r === "input-paste");
        setScrubbing(r === "scrub");
      }}
      onValueCommitted={(next, details) => {
        setScrubbing(false);
        props.onValueCommitted?.(next, details);
      }}
      step={step}
      smallStep={smallStep}
      largeStep={largeStep}
      min={min}
      max={max}
      format={format}
      locale={locale}
      disabled={disabled}
      readOnly={readOnly}
      className={`group/number flex min-w-0 flex-col gap-1.5 ${className}`}
    >
      {label !== undefined &&
        (scrub ? (
          <BaseNumberField.ScrubArea className="flex w-fit cursor-ew-resize touch-none select-none data-disabled:cursor-not-allowed" pixelSensitivity={4}>
            <label
              htmlFor={id}
              className="cursor-ew-resize text-ui font-medium text-text decoration-text-muted decoration-dotted underline-offset-4 group-data-disabled/number:cursor-not-allowed group-data-disabled/number:text-text-disabled hover-fine:underline"
            >
              {label}
            </label>
            {/* Shown in place of the pointer while it is locked during a scrub. */}
            <BaseNumberField.ScrubAreaCursor className="text-text drop-shadow-[0_1px_1px_rgb(0_0_0/0.25)]">
              <ScrubCursorIcon />
            </BaseNumberField.ScrubAreaCursor>
          </BaseNumberField.ScrubArea>
        ) : (
          <label htmlFor={id} className="w-fit cursor-default text-ui font-medium text-text group-data-disabled/number:text-text-disabled">
            {label}
          </label>
        ))}
      <InputGroup size={size} className={groupClassName}>
        {/* `contents`, so the group's parts lay out in the box's row while keeping role="group". */}
        <BaseNumberField.Group className="contents">
          {split ? <span className={`flex shrink-0 ${s.start}`}>{decrement}</span> : start !== undefined && <InputGroupAddon>{start}</InputGroupAddon>}
          <span className="relative flex min-w-0 flex-1 self-stretch">
            <BaseNumberField.Input
              placeholder={placeholder}
              aria-label={ariaLabel}
              onFocus={() => setFocused(true)}
              onBlur={() => {
                setFocused(false);
                setTyping(false);
              }}
              className={`${controlClass} tabular-nums ${split ? "text-center" : ""} ${showRoll ? "text-transparent! caret-transparent selection:bg-transparent" : ""}`}
            />
            {showRoll && (
              <span
                aria-hidden
                className={`pointer-events-none absolute inset-0 flex items-center overflow-hidden text-text group-data-disabled/number:text-text-disabled pointer-coarse:text-ui-md ${split ? "justify-center" : ""}`}
              >
                <NumberRoll value={value} formatter={roll} animated={animated && !scrubbing} aria-hidden />
              </span>
            )}
          </span>
          <span className={`flex shrink-0 items-center gap-0.5 ${s.end}`}>
            {!split && decrement}
            {increment}
          </span>
        </BaseNumberField.Group>
      </InputGroup>
    </BaseNumberField.Root>
  );
}

type StepperProps = {
  dir: 1 | -1;
  label: string;
  disabled?: boolean;
  className: string;
  step: number;
  smallStep: number;
  largeStep: number;
  controls: string;
  stepBy: (amount: number) => boolean;
  children: ReactNode;
};

/**
 * A stepper that repeats while held, accelerating. It never takes focus, so the caret stays in
 * the input; keyboard users step with the arrow keys there instead.
 */
function Stepper({ dir, label, disabled, className, step, smallStep, largeStep, controls, stepBy, children }: StepperProps) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stop = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  }, []);
  useEffect(() => stop, [stop]);
  useEffect(() => {
    if (disabled) stop();
  }, [disabled, stop]);

  const begin = (e: PointerEvent<HTMLButtonElement>) => {
    if (e.button !== 0 || disabled) return;
    // Keep focus where it is (the input, or nowhere on touch, so no keyboard opens).
    e.preventDefault();
    const amount = dir * (e.shiftKey ? largeStep : e.altKey ? smallStep : step);
    if (!stepBy(amount)) return;
    let tick = FIRST_TICK;
    const repeat = () => {
      if (!stepBy(amount)) return stop();
      tick = Math.max(FASTEST_TICK, tick * ACCELERATION);
      timer.current = setTimeout(repeat, tick);
    };
    timer.current = setTimeout(repeat, HOLD_DELAY);
    const end = () => {
      stop();
      window.removeEventListener("pointerup", end);
      window.removeEventListener("pointercancel", end);
      window.removeEventListener("blur", end);
    };
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);
    window.addEventListener("blur", end);
  };

  return (
    <button
      type="button"
      tabIndex={-1}
      aria-label={label}
      aria-controls={controls}
      disabled={disabled}
      onPointerDown={begin}
      onContextMenu={(e) => e.preventDefault()}
      className={`inline-flex shrink-0 cursor-pointer touch-manipulation items-center justify-center text-text-muted select-none hover-fine:not-disabled:bg-surface-hover hover-fine:not-disabled:text-text active:not-disabled:bg-surface-active active:not-disabled:text-text disabled:cursor-not-allowed disabled:text-text-disabled ${pressIcon} ${className}`}
    >
      {children}
    </button>
  );
}

function MinusIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden className="size-4">
      <path d="M3.75 8h8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden className="size-4">
      <path d="M8 3.75v8.5M3.75 8h8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function ScrubCursorIcon() {
  return (
    <svg viewBox="0 0 24 16" width="24" height="16" fill="none" aria-hidden>
      <path d="M8 3.5 3.5 8 8 12.5M16 3.5 20.5 8 16 12.5M4 8h16" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
