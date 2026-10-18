"use client";

import { Popover as BasePopover } from "@base-ui/react/popover";
import type { ComponentProps, ReactNode } from "react";
import {
  FloatingLayer,
  floatingSurface,
  type FloatingAlign,
  type FloatingMotion,
  type FloatingSide,
} from "../_primitives/floating/floating";
import { Button, type ButtonSize, type ButtonVariant } from "../button/button";

/**
 * Groups a popover's parts and owns its open state. Uncontrolled by default (`defaultOpen`);
 * pass `open` and `onOpenChange` to control it. Non-modal unless `modal` is set.
 */
export const Popover = BasePopover.Root;

/** Closes the popover. Use `render` to make any button a closer: `<PopoverClose render={<button … />} />`. */
export const PopoverClose = BasePopover.Close;

export type PopoverTriggerProps = Omit<ComponentProps<typeof BasePopover.Trigger>, "className"> & {
  /** The Eased `Button` variant. Default "secondary". */
  variant?: ButtonVariant;
  /** The Eased `Button` size. Default "sm" (32px); `icon-sm` for a square icon trigger. */
  size?: ButtonSize;
  className?: string;
};

/**
 * The button that opens the popover: an Eased `Button`, which never scales as a popup
 * trigger (R64) so the popup's transform-origin stays fixed, and stays pressed (`aria-expanded`)
 * while the popover is open. Pass `render` to bring your own trigger (style it with
 * `floatingTrigger`). `openOnHover`, `delay` and `closeDelay` turn it into a hover-intent trigger.
 */
export function PopoverTrigger({ variant = "secondary", size = "sm", className = "", render, ...props }: PopoverTriggerProps) {
  return <BasePopover.Trigger {...props} render={render ?? <Button variant={variant} size={size} className={className} />} />;
}

export type PopoverContentProps = {
  /** Preferred side; flips on collision and the enter direction follows. Default "bottom". */
  side?: FloatingSide;
  /** Default "center". */
  align?: FloatingAlign;
  /** Gap to the trigger, px. Default 6. */
  sideOffset?: number;
  alignOffset?: number;
  /** Override the floating motion (distance, scale, fade, exit). */
  motion?: Partial<FloatingMotion>;
  /** Where focus goes on open. Default: the first tabbable element, else the popup. */
  initialFocus?: ComponentProps<typeof BasePopover.Popup>["initialFocus"];
  /** Where focus returns on close. Default: the trigger. */
  finalFocus?: ComponentProps<typeof BasePopover.Popup>["finalFocus"];
  container?: HTMLElement | null;
  /** Stacking order. Default 50; raise it inside a higher layer such as a dialog. */
  zIndex?: number;
  /** Appended to the panel's classes; set a width here (default `w-80`, never wider than the viewport). */
  className?: string;
  children?: ReactNode;
};

/**
 * The panel. It opens from the trigger's transform-origin with a 5px offset toward the
 * trigger, and leaves half as far in 150ms. Open and close are transitions, so they reverse
 * mid-flight. A raised 16px panel with 16px padding; `--radius-outer` and `--pad` are exposed so
 * nested corners (see `PopoverFooter`) stay concentric.
 */
export function PopoverContent({
  side = "bottom",
  align = "center",
  sideOffset,
  alignOffset,
  motion,
  initialFocus,
  finalFocus,
  container,
  zIndex,
  className = "",
  children,
}: PopoverContentProps) {
  return (
    <FloatingLayer
      parts={BasePopover}
      role="popover"
      side={side}
      align={align}
      sideOffset={sideOffset}
      alignOffset={alignOffset}
      motion={motion}
      container={container}
      zIndex={zIndex}
      popupProps={{ initialFocus, finalFocus }}
      className={`${floatingSurface} flex w-80 max-w-(--available-width) flex-col overflow-hidden rounded-panel p-4 [--pad:16px] [--radius-outer:var(--eased-radius-panel)] ${className}`}
    >
      {children}
    </FloatingLayer>
  );
}

/** The popover's heading; labels the dialog for assistive tech. */
export function PopoverTitle({ className = "", children }: { className?: string; children: ReactNode }) {
  return <BasePopover.Title className={`text-ui font-medium text-balance text-text ${className}`}>{children}</BasePopover.Title>;
}

/** One line of supporting text under the title; describes the dialog for assistive tech. */
export function PopoverDescription({ className = "", children }: { className?: string; children: ReactNode }) {
  return (
    <BasePopover.Description className={`mt-1 text-ui-sm text-pretty text-text-secondary ${className}`}>{children}</BasePopover.Description>
  );
}

/**
 * A full-bleed action bar on a sunken strip at the bottom of the panel. It keeps the body's
 * `--pad` as its horizontal inset, so its first and last items sit on the content lines above
 * (R105): give a leading ghost button `edge="start"`, and use `rounded-control-sm` buttons.
 */
export function PopoverFooter({ className = "", children }: { className?: string; children: ReactNode }) {
  return (
    <div
      className={`-mx-(--pad) mt-(--pad) -mb-(--pad) flex items-center justify-between gap-2 border-t border-line-subtle bg-surface-sunken px-(--pad) py-3 ${className}`}
    >
      {children}
    </div>
  );
}
