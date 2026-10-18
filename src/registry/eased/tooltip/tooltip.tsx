"use client";

import { Tooltip as BaseTooltip } from "@base-ui/react/tooltip";
import type { ReactElement, ReactNode } from "react";
import { FloatingLayer, floatingSurface, type FloatingAlign, type FloatingSide } from "../_primitives/floating/floating";
import { Kbd } from "../kbd/kbd";

export type TooltipProviderProps = {
  /** How long the pointer must rest on the first trigger before its tooltip opens, ms. Default 400. */
  delay?: number;
  /** How long a tooltip stays after the pointer leaves, ms. Default 0. */
  closeDelay?: number;
  /** After a tooltip closes, the next one within this window opens instantly and unanimated, ms. Default 400. */
  timeout?: number;
  children: ReactNode;
};

/**
 * A delay group. Inside it the first tooltip waits `delay`; while the pointer sweeps on to
 * neighbouring triggers the rest appear at once, with no animation.
 */
export function TooltipProvider({ delay = 400, closeDelay = 0, timeout = 400, children }: TooltipProviderProps) {
  return (
    <BaseTooltip.Provider delay={delay} closeDelay={closeDelay} timeout={timeout}>
      {children}
    </BaseTooltip.Provider>
  );
}

export type TooltipProps = {
  /** The label. Keep it short; the trigger still needs a matching `aria-label`. */
  content: ReactNode;
  /** Keys shown after the label as `Kbd` caps, one per key: `["⌘", "B"]`, or `"Esc"` for one key. */
  shortcut?: string | string[];
  /** The trigger: one focusable element that accepts a ref, usually an icon button. */
  children: ReactElement;
  /** Preferred side; flips on collision. Default "top". */
  side?: FloatingSide;
  align?: FloatingAlign;
  /** Gap to the trigger, px. Default 6. */
  sideOffset?: number;
  /** Rest time before opening, ms. Unset: the provider's delay (400), or Base UI's 600 outside a provider. */
  delay?: number;
  closeDelay?: number;
  /** Close when the trigger is clicked. Default true. */
  closeOnClick?: boolean;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  disabled?: boolean;
  /** Stacking order. Default 50; raise it inside a higher layer such as a dialog. */
  zIndex?: number;
  /** Appended to the tooltip's classes. */
  className?: string;
};

/**
 * A short visual label for mouse and keyboard users. It opens after the pointer rests (or on
 * keyboard focus), enters 3px toward its trigger from the trigger's origin, and never shows on touch.
 */
export function Tooltip({
  content,
  shortcut,
  children,
  side = "top",
  align = "center",
  sideOffset,
  delay,
  closeDelay,
  closeOnClick = true,
  open,
  defaultOpen,
  onOpenChange,
  disabled,
  zIndex,
  className = "",
}: TooltipProps) {
  const keys = typeof shortcut === "string" ? [shortcut] : shortcut;

  return (
    <BaseTooltip.Root
      open={open}
      defaultOpen={defaultOpen}
      onOpenChange={onOpenChange ? (next) => onOpenChange(next) : undefined}
      disabled={disabled}
    >
      <BaseTooltip.Trigger
        render={children}
        delay={delay}
        closeDelay={closeDelay}
        closeOnClick={closeOnClick}
      />
      <FloatingLayer
        parts={BaseTooltip}
        role="tooltip"
        side={side}
        align={align}
        sideOffset={sideOffset}
        zIndex={zIndex}
        className={`${floatingSurface} flex max-w-[min(16rem,var(--available-width))] items-center gap-2 rounded-control-sm px-2.5 py-1 text-ui-sm text-pretty ${className}`}
      >
        <span className="min-w-0">{content}</span>
        {keys && keys.length > 0 && (
          // The label already names the action; the caps are a visual hint, not read twice.
          <span aria-hidden className="-mr-1 inline-flex shrink-0">
            <Kbd keys={keys} listen={false} />
          </span>
        )}
      </FloatingLayer>
    </BaseTooltip.Root>
  );
}
