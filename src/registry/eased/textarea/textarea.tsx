"use client";

import { Field as BaseField } from "@base-ui/react/field";
import { animate, motion, useMotionValue, type AnimationPlaybackControls } from "motion/react";
import { useCallback, useLayoutEffect, useRef, useState, type ComponentProps } from "react";
import { InputGroup, controlClass, controlPadClass, type ControlSize } from "../_primitives/field/field";
import { NumberRoll } from "../_primitives/number-roll/number-roll";
import { smooth, useSafeReducedMotion } from "../lib/motion";

export type TextareaProps = Omit<ComponentProps<"textarea">, "className" | "rows"> & {
  /** Height when empty, in lines. Default 3. */
  minRows?: number;
  /** Grow up to this many lines, then scroll. Default 8. */
  maxRows?: number;
  /** Called with the new text on every change. */
  onValueChange?: (value: string) => void;
  /**
   * Show a `count / maxLength` counter under the text. Default: on when `maxLength` is set.
   * Its digits roll, and it turns warning-coloured at 90% of the limit.
   */
  showCount?: boolean;
  /** Mark the textarea invalid outside a `Field` (inside one, the field's validity drives it). */
  invalid?: boolean;
  /** Type size, radius and padding, matching Input: sm (13px text), md (default), lg. */
  size?: ControlSize;
  /** Classes for the bordered shell. */
  className?: string;
  /** Classes for the `<textarea>` itself. */
  controlClassName?: string;
};

const PAD_Y: Record<ControlSize, string> = { sm: "py-1.5", md: "py-2", lg: "py-2.5" };

/**
 * A textarea that grows with its text on a smooth spring instead of jumping a line at a time.
 * The `<textarea>` itself is sized at once (so the caret never scrolls out of view) and a clip
 * around it springs to the new height. Built on Base UI's Field.Control, so it labels,
 * describes and validates itself inside a `Field`.
 */
export function Textarea({
  minRows = 3,
  maxRows = 8,
  onValueChange,
  showCount,
  invalid,
  size = "md",
  className = "",
  controlClassName = "",
  maxLength,
  value,
  defaultValue,
  ...props
}: TextareaProps) {
  const reduced = useSafeReducedMotion();
  const ref = useRef<HTMLTextAreaElement>(null);
  const height = useMotionValue<number | "auto">("auto");
  const spring = useRef<AnimationPlaybackControls | null>(null);
  const [typed, setTyped] = useState(() => String(defaultValue ?? "").length);
  const count = value !== undefined ? String(value).length : typed;
  const counted = showCount ?? maxLength !== undefined;

  const resize = useCallback(
    (animated: boolean) => {
      const el = ref.current;
      if (!el) return;
      const cs = getComputedStyle(el);
      const line = parseFloat(cs.lineHeight) || 20;
      const chrome = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
      const min = minRows * line + chrome;
      const max = maxRows * line + chrome;
      el.style.height = "0px";
      const content = el.scrollHeight;
      const target = Math.round(Math.min(max, Math.max(min, content)));
      el.style.height = `${target}px`;
      el.style.overflowY = content > max + 1 ? "auto" : "hidden";

      const from = height.get();
      if (from === target) return;
      spring.current?.stop();
      if (!animated || reduced || from === "auto") height.jump(target);
      else spring.current = animate(height, target, smooth);
    },
    [minRows, maxRows, reduced, height],
  );

  // Size before first paint; re-measure without animating when the width changes (rewrap).
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    resize(false);
    let width = el.offsetWidth;
    const ro = new ResizeObserver(() => {
      if (el.offsetWidth === width) return;
      width = el.offsetWidth;
      resize(false);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [resize]);

  // A controlled value can change without typing (a reset, a suggestion).
  useLayoutEffect(() => {
    if (value !== undefined) resize(true);
  }, [value, resize]);

  return (
    <InputGroup multiline size={size} invalid={invalid} className={className}>
      <motion.div style={{ height }} className="relative [overflow:clip]">
        <BaseField.Control
          {...(props as ComponentProps<typeof BaseField.Control>)}
          {...(invalid !== undefined ? { "aria-invalid": invalid } : null)}
          ref={ref}
          value={value as string | undefined}
          defaultValue={defaultValue as string | undefined}
          onValueChange={(v) => {
            if (value === undefined) setTyped(v.length);
            onValueChange?.(v);
            resize(true);
          }}
          render={(p) => <textarea {...(p as ComponentProps<"textarea">)} rows={minRows} maxLength={maxLength} />}
          className={`${controlClass} block w-full resize-none ${controlPadClass[size]} ${PAD_Y[size]} [scrollbar-width:thin] ${controlClassName}`}
        />
      </motion.div>
      {counted && maxLength !== undefined && <Counter count={count} max={maxLength} pad={controlPadClass[size]} />}
    </InputGroup>
  );
}

/** `count / max`, digits rolling in the direction of change; warning colour from 90%. */
function Counter({ count, max, pad }: { count: number; max: number; pad: string }) {
  const near = count >= max * 0.9;
  return (
    <div className={`flex justify-end pb-2 select-none ${pad}`}>
      <span
        aria-hidden
        className={`inline-flex items-center text-ui-xs tabular-nums transition-colors duration-150 ease-standard ${
          near ? "text-warning-text" : "text-text-muted"
        }`}
      >
        <NumberRoll value={count} format={{ useGrouping: false }} aria-hidden />
        <span className="text-text-muted">/{max}</span>
      </span>
      {/* Announce the thresholds, not every keystroke. */}
      <span role="status" className="sr-only">
        {count >= max ? "Character limit reached" : near ? `Approaching the ${max} character limit` : ""}
      </span>
    </div>
  );
}
