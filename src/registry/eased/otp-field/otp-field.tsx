"use client";

import { OTPField as BaseOTPField } from "@base-ui/react/otp-field";
import { AnimatePresence, animate, motion } from "motion/react";
import { Fragment, useEffect, useLayoutEffect, useRef, useState, type ComponentProps } from "react";
import { useShakeOnInvalid } from "../_primitives/field/field";
import { bouncy, ease, enter, exitFast, reducedFade, snappy, stagger, useSafeReducedMotion } from "../lib/motion";

type RootProps = ComponentProps<typeof BaseOTPField.Root>;

export type OtpFieldSize = "md" | "lg";

export type OtpFieldProps = Omit<RootProps, "className" | "render" | "children" | "length" | "value" | "defaultValue" | "onValueChange"> & {
  /** Number of characters. Default 6. */
  length?: number;
  /**
   * Cells per group, separated by a dash: `[3, 3]` for 123–456. Default: two halves for an even
   * length of 6 or more, else one group. Pass `[length]` for no separator.
   */
  groups?: readonly number[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /**
   * Mark the code wrong: danger borders and one shake when it turns on. Inside a `Field`, the
   * field's validity drives it too.
   */
  invalid?: boolean;
  /** Mark the code accepted: success borders and a ripple across the cells when it turns on. */
  success?: boolean;
  /** md 40×44 cells (default), lg 48×56. */
  size?: OtpFieldSize;
  /** Accessible name for slots after the first, given its position. Default "Character 2 of 6". */
  getSlotLabel?: (index: number, length: number) => string;
  className?: string;
};

const CELL: Record<OtpFieldSize, string> = {
  md: "h-11 w-10 rounded-control text-ui-lg",
  lg: "h-14 w-12 rounded-control text-display-xl",
};

function defaultGroups(length: number): number[] {
  if (length >= 6 && length % 2 === 0) return [length / 2, length / 2];
  return [length];
}

/**
 * A one-time-code input on Base UI's OTPField: one input per cell, with `autocomplete="one-time-code"`
 * on the first, so an SMS or email autofill, a password manager or a paste fills every cell at
 * once. The caret blinks in the empty cell that has focus, each character pops in, a wrong code
 * shakes the row once, and an accepted one ripples green across it.
 */
export function OtpField({
  length = 6,
  groups: groupsProp,
  value: valueProp,
  defaultValue = "",
  onValueChange,
  invalid: invalidProp,
  success = false,
  size = "md",
  mask = false,
  disabled,
  getSlotLabel = (i, n) => `Character ${i + 1} of ${n}`,
  className = "",
  ...props
}: OtpFieldProps) {
  const reduced = useSafeReducedMotion();
  const [uncontrolled, setUncontrolled] = useState(defaultValue);
  const value = valueProp ?? uncontrolled;
  const [focusIndex, setFocusIndex] = useState<number | null>(null);

  const rowRef = useRef<HTMLDivElement>(null);
  const fieldInvalid = useDataInvalid(rowRef);
  const invalid = !disabled && (invalidProp ?? fieldInvalid);
  useShakeOnInvalid(rowRef, invalid, reduced);
  useRipple(rowRef, success && !invalid, reduced);

  const groups = groupsProp?.reduce((a, b) => a + b, 0) === length ? groupsProp : defaultGroups(length);
  const starts = groups.map((_, g) => groups.slice(0, g).reduce((a, b) => a + b, 0));
  const tone = invalid ? "invalid" : success ? "success" : "idle";

  return (
    <BaseOTPField.Root
      {...props}
      ref={rowRef}
      length={length}
      value={value}
      mask={mask}
      disabled={disabled}
      onValueChange={(next) => {
        if (valueProp === undefined) setUncontrolled(next);
        onValueChange?.(next);
      }}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocusIndex(null);
      }}
      className={`flex w-fit max-w-full items-center gap-2 ${className}`}
    >
      {groups.map((count, g) => (
        <Fragment key={g}>
          {g > 0 && (
            <BaseOTPField.Separator className="flex w-2 shrink-0 items-center justify-center" render={<span />}>
              <span className={`h-0.5 w-2 rounded-pill ${disabled ? "bg-text-disabled" : "bg-line-strong"}`} />
            </BaseOTPField.Separator>
          )}
          <div className="flex items-center gap-1.5">
            {Array.from({ length: count }, (_, k) => {
              const i = starts[g] + k;
              const char = value[i] ?? "";
              const focused = focusIndex === i;
              return (
                <div
                  key={i}
                  data-otp-cell=""
                  data-tone={tone}
                  data-focused={focused || undefined}
                  data-filled={char ? "" : undefined}
                  className={`relative flex shrink-0 items-center justify-center border font-medium tabular-nums ${disabled ? "bg-surface-sunken" : "bg-surface"} transition-[border-color,box-shadow,color,background-color] duration-(--eased-duration-standard) ease-standard reduced:transition-none ${CELL[size]} ${
                    disabled
                      ? "cursor-not-allowed border-line text-text-disabled"
                      : tone === "invalid"
                        ? `border-danger text-text ${focused ? "shadow-[0_0_0_3px_var(--eased-ring-danger)]" : ""}`
                        : tone === "success"
                          ? "border-success text-success-text"
                          : focused
                            ? "border-(--eased-neutral-9) text-text shadow-[0_0_0_3px_var(--eased-ring-soft)]"
                            : "border-line-strong text-text hover-fine:border-(--eased-neutral-9)"
                  }`}
                >
                  <BaseOTPField.Input
                    // Base UI names the first slot from the field's label; the rest by position.
                    aria-label={i > 0 ? getSlotLabel(i, length) : undefined}
                    {...(invalidProp !== undefined ? { "aria-invalid": invalidProp || undefined } : null)}
                    onFocus={() => setFocusIndex(i)}
                    className="absolute inset-0 size-full cursor-text rounded-[inherit] bg-transparent text-center text-transparent caret-transparent outline-none selection:bg-transparent disabled:cursor-not-allowed"
                  />
                  <span aria-hidden className="pointer-events-none relative flex size-full items-center justify-center">
                    <AnimatePresence initial={false} mode="popLayout">
                      {char ? (
                        <motion.span
                          key={`${i}:${char}`}
                          initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.5, y: 3, filter: "blur(2px)" }}
                          animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
                          exit={reduced ? { opacity: 0, transition: reducedFade } : { opacity: 0, scale: 0.7, filter: "blur(2px)", transition: exitFast }}
                          transition={reduced ? reducedFade : { scale: bouncy, y: snappy, opacity: enter, filter: enter }}
                          className="inline-block"
                        >
                          {mask ? "•" : char}
                        </motion.span>
                      ) : focused && !disabled ? (
                        <Caret key="caret" reduced={reduced} size={size} />
                      ) : null}
                    </AnimatePresence>
                  </span>
                </div>
              );
            })}
          </div>
        </Fragment>
      ))}
    </BaseOTPField.Root>
  );
}

/** A 1.5px caret that holds, fades out, holds and fades back in, like a native text field. Static under reduced motion. */
function Caret({ reduced, size, ref }: { reduced: boolean; size: OtpFieldSize; ref?: React.Ref<HTMLSpanElement> }) {
  return (
    <motion.span
      ref={ref}
      initial={{ opacity: 0 }}
      animate={reduced ? { opacity: 1 } : { opacity: [1, 1, 0, 0, 1] }}
      exit={{ opacity: 0, transition: { duration: 0 } }}
      transition={reduced ? reducedFade : { duration: 1.1, times: [0, 0.45, 0.55, 0.9, 1], ease: "linear", repeat: Infinity }}
      className={`block w-[1.5px] rounded-pill bg-text ${size === "lg" ? "h-7" : "h-5"}`}
    />
  );
}

/** Whether Base UI marked the field invalid (a `Field`'s validation or `<Form errors>`). */
function useDataInvalid(ref: React.RefObject<HTMLElement | null>) {
  const [invalid, setInvalid] = useState(false);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const read = () => setInvalid(el.hasAttribute("data-invalid"));
    read();
    const mo = new MutationObserver(read);
    mo.observe(el, { attributes: true, attributeFilter: ["data-invalid"] });
    return () => mo.disconnect();
  }, [ref]);
  return invalid;
}

/** A left-to-right lift across the cells when `on` turns on: 2px up and back, 35ms apart. Reduced motion: none. */
function useRipple(ref: React.RefObject<HTMLElement | null>, on: boolean, reduced: boolean) {
  const was = useRef(on);
  useEffect(() => {
    const turnedOn = on && !was.current;
    was.current = on;
    if (!turnedOn || reduced || !ref.current) return;
    const cells = ref.current.querySelectorAll<HTMLElement>("[data-otp-cell]");
    const runs = [...cells].map((cell, i) =>
      animate(cell, { y: [0, -3, 0], scale: [1, 1.04, 1] }, { duration: 0.32, delay: i * stagger.item, ease: ease.standard }),
    );
    return () => runs.forEach((r) => r.stop());
  }, [on, reduced, ref]);
}
