"use client";

import { Drawer as BaseDrawer } from "@base-ui/react/drawer";
import { createContext, use, useEffect, useRef, useState, useSyncExternalStore, type ComponentProps, type ReactNode } from "react";
import { backdropClass } from "../_primitives/overlay-core/overlay-core";
import { scrollFadeMask, useScrollEdges } from "../_primitives/scroll-fade/scroll-fade";
import { Button, type ButtonSize, type ButtonVariant } from "../button/button";

/**
 * A sheet on Base UI's Drawer: a floating panel that slides in from an edge over the blurred
 * scrim, follows the finger when swiped back toward that edge, and leaves faster the harder
 * it is flicked. Under 640px a side sheet becomes a bottom sheet with a grabber. A sheet
 * opened from inside another steps the parent back, smaller and dimmed, like iOS.
 *
 * Motion numbers are overlay-core's `SHEET`: 500ms in on the enter curve, out in
 * `--drawer-swipe-strength` × 375ms on the standard curve; nested parents step back 16px and
 * 5% per level; the background indent scales to 0.97 and drops 8px.
 */

export type SheetSide = "right" | "left" | "top" | "bottom";

const SWIPE = { right: "right", left: "left", top: "up", bottom: "down" } as const;

type SheetContextValue = { setSide: (side: SheetSide) => void; snap: boolean };
const SheetContext = createContext<SheetContextValue | null>(null);

export type SheetProps = Omit<ComponentProps<typeof BaseDrawer.Root>, "swipeDirection">;

/**
 * Groups a sheet's parts and owns its open state (`open` / `defaultOpen` / `onOpenChange`).
 * The swipe direction follows `SheetContent`'s side. `snapPoints`, `snapPoint` and
 * `onSnapPointChange` pass through to Base UI for bottom sheets.
 */
export function Sheet({ snapPoints, ...props }: SheetProps) {
  const [side, setSide] = useState<SheetSide>("right");
  return (
    <SheetContext value={{ setSide, snap: (snapPoints?.length ?? 0) > 0 }}>
      <BaseDrawer.Root {...props} snapPoints={snapPoints} swipeDirection={SWIPE[side]} />
    </SheetContext>
  );
}

/** Closes the sheet. `<SheetClose render={<Button />}>Cancel</SheetClose>`. */
export const SheetClose = BaseDrawer.Close;

export type SheetTriggerProps = Omit<ComponentProps<typeof BaseDrawer.Trigger>, "className"> & {
  /** The Eased `Button` variant. Default "secondary". */
  variant?: ButtonVariant;
  /** The Eased `Button` size. Default "sm". */
  size?: ButtonSize;
  className?: string;
};

/**
 * The button that opens the sheet: an Eased `Button`, which never scales as a popup trigger
 * (R64). Focus returns here on close. Pass `render` to bring your own element.
 */
export function SheetTrigger({ variant = "secondary", size = "sm", className = "", render, ...props }: SheetTriggerProps) {
  return <BaseDrawer.Trigger {...props} render={render ?? <Button variant={variant} size={size} className={className} />} />;
}

/* ------------------------------------------------------------------ Mobile ---------- */

const MOBILE = "(max-width: 639.98px)";
const subscribeMobile = (onChange: () => void) => {
  const mq = window.matchMedia(MOBILE);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
};

/** Under 640px, read after hydration: false on the server and while hydrating, live afterwards. */
function useMobile() {
  return useSyncExternalStore(subscribeMobile, () => window.matchMedia(MOBILE).matches, () => false);
}

/* ------------------------------------------------------------------ Motion ---------- */

/*
 * Every side writes the same working variables, read by the shared classes below:
 *   --sheet-rest  the resting transform: Base UI's swipe movement, minus the stack step
 *   --sheet-off   where it enters from and leaves to (just past its edge)
 *   --sheet-head  the header's top inset (the close button lines up with the title)
 * They are `transform`, not `translate`/`scale`: Base UI freezes the popup's computed
 * `transform` when a drag starts and writes the drag over it inline.
 * --sheet-depth is the number of sheets open above this one, easing back to 0 as the top one
 * is swiped away (Base UI gives a parent its child's swipe progress).
 */
const POPUP = [
  "relative flex min-h-0 flex-col border border-line bg-surface-raised text-ui text-text shadow-overlay outline-none",
  "[--radius-outer:var(--eased-radius-surface)] [--pad:24px] max-sm:[--pad:20px]",
  "[--sheet-depth:calc(var(--nested-drawers)_-_clamp(0,var(--drawer-swipe-progress),1))] [--sheet-step:16px] [--sheet-shrink:0.05]",
  // Side sheets step further, so the parent still peeks out past a same-width child.
  "data-[side=right]:[--sheet-step:40px] data-[side=left]:[--sheet-step:40px] reduced:data-[side=right]:[--sheet-step:0px] reduced:data-[side=left]:[--sheet-step:0px]",
  "[--sheet-in:var(--eased-duration-sheet)] [--sheet-out:calc(var(--drawer-swipe-strength)*375ms)]",
  "[transform:var(--sheet-rest)] data-starting-style:[transform:var(--sheet-off)] data-ending-style:[transform:var(--sheet-off)]",
  "[transition-property:transform,opacity] [transition-duration:var(--sheet-in)] [transition-timing-function:var(--eased-ease-enter)]",
  "data-ending-style:[transition-duration:var(--sheet-out)] data-ending-style:[transition-timing-function:var(--eased-ease-standard)]",
  // Transitions are off while a finger drives the sheet (or the sheet above it).
  "data-swiping:select-none data-swiping:[transition-duration:0ms] data-nested-drawer-swiping:[transition-duration:0ms]",
  "data-ending-style:data-swiping:[transition-duration:var(--sheet-out)] data-ending-style:data-nested-drawer-swiping:[transition-duration:var(--sheet-out)]",
  // A parent under a nested sheet dims by half a scrim, tracking the child's swipe.
  "after:pointer-events-none after:absolute after:-inset-px after:rounded-[inherit] after:bg-scrim after:opacity-[calc(min(1,var(--sheet-depth))*0.5)] after:[transition:opacity_var(--eased-duration-slow)_var(--eased-ease-standard)] data-nested-drawer-swiping:after:[transition:none]",
  // Reduced motion: no slide, no step back; a 100ms fade.
  "reduced:[--sheet-off:var(--sheet-rest)] reduced:[--sheet-step:0px] reduced:[--sheet-shrink:0] reduced:[--sheet-in:var(--eased-duration-instant)] reduced:[--sheet-out:var(--eased-duration-instant)] reduced:data-starting-style:opacity-0 reduced:data-ending-style:opacity-0",
].join(" ");

const SIDES: Record<SheetSide, { viewport: string; popup: string }> = {
  right: {
    viewport: "justify-end items-stretch p-(--sheet-inset) [--sheet-inset:0px] sm:[--sheet-inset:8px]",
    popup:
      "h-full w-(--sheet-w) max-w-full max-sm:max-w-[calc(100%_-_16px)] rounded-l-surface max-sm:border-r-0 sm:rounded-surface [--sheet-head:var(--pad)] [transform-origin:100%_50%] [--sheet-rest:translateX(calc(var(--drawer-swipe-movement-x)_-_var(--sheet-depth)*var(--sheet-step)))_scale(calc(1_-_var(--sheet-depth)*var(--sheet-shrink)))] [--sheet-off:translateX(calc(100%_+_var(--sheet-inset)_+_16px))]",
  },
  left: {
    viewport: "justify-start items-stretch p-(--sheet-inset) [--sheet-inset:0px] sm:[--sheet-inset:8px]",
    popup:
      "h-full w-(--sheet-w) max-w-full max-sm:max-w-[calc(100%_-_16px)] rounded-r-surface max-sm:border-l-0 sm:rounded-surface [--sheet-head:var(--pad)] [transform-origin:0%_50%] [--sheet-rest:translateX(calc(var(--drawer-swipe-movement-x)_+_var(--sheet-depth)*var(--sheet-step)))_scale(calc(1_-_var(--sheet-depth)*var(--sheet-shrink)))] [--sheet-off:translateX(calc(-100%_-_var(--sheet-inset)_-_16px))]",
  },
  // The bleed (::before) runs 48px past the screen edge, so an overshoot never shows a gap.
  bottom: {
    viewport: "items-end justify-center",
    popup:
      "w-full max-h-[min(85dvh,calc(100%_-_24px))] rounded-t-surface border-b-0 pb-[env(safe-area-inset-bottom,0px)] data-snap:pb-[calc(env(safe-area-inset-bottom,0px)_+_max(0px,calc(var(--drawer-snap-point-offset)_+_var(--drawer-swipe-movement-y))))] [--sheet-head:28px] [transform-origin:50%_0%] [--sheet-rest:translateY(calc(var(--drawer-snap-point-offset)_+_var(--drawer-swipe-movement-y)_-_var(--sheet-depth)*var(--sheet-step)))_scale(calc(1_-_var(--sheet-depth)*var(--sheet-shrink)))] [--sheet-off:translateY(calc(100%_+_2px))] before:pointer-events-none before:absolute before:-inset-x-px before:top-full before:h-12 before:border-x before:border-line before:bg-inherit",
  },
  top: {
    viewport: "items-start justify-center",
    popup:
      "w-full max-h-[min(85dvh,calc(100%_-_24px))] rounded-b-surface border-t-0 pt-[env(safe-area-inset-top,0px)] [--sheet-head:var(--pad)] [transform-origin:50%_100%] [--sheet-rest:translateY(calc(var(--drawer-swipe-movement-y)_+_var(--sheet-depth)*var(--sheet-step)))_scale(calc(1_-_var(--sheet-depth)*var(--sheet-shrink)))] [--sheet-off:translateY(calc(-100%_-_2px))] before:pointer-events-none before:absolute before:-inset-x-px before:bottom-full before:h-12 before:border-x before:border-line before:bg-inherit",
  },
};

const WIDTHS = { sm: "[--sheet-w:20rem]", md: "[--sheet-w:24rem]", lg: "[--sheet-w:30rem]" } as const;
export type SheetSize = keyof typeof WIDTHS;

/* The scrim fades with the swipe: Base UI writes --drawer-swipe-progress on the backdrop. */
const BACKDROP = `${backdropClass} opacity-[calc(1_-_var(--drawer-swipe-progress))] data-swiping:[transition-duration:0ms]`;

export type SheetContentProps = {
  /** The edge it lives on and swipes back to. Default "right". */
  side?: SheetSide;
  /** Side sheets' width: sm 320px, md 384px (default), lg 480px. Never wider than the screen less 16px. */
  size?: SheetSize;
  /**
   * Under 640px, a right or left sheet becomes a bottom sheet with a grabber and drag to
   * dismiss. Read after hydration, so the server HTML never mismatches. Default true.
   */
  responsive?: boolean;
  /** Portal target. Default `document.body`. */
  container?: HTMLElement | null;
  /** Where focus goes on open. Default: the first tabbable element (the popup itself on touch). */
  initialFocus?: ComponentProps<typeof BaseDrawer.Popup>["initialFocus"];
  /** Where focus returns on close. Default: the trigger. */
  finalFocus?: ComponentProps<typeof BaseDrawer.Popup>["finalFocus"];
  /** Show the close button in the top corner. Default true. */
  closeButton?: boolean;
  /** The close button's accessible name. Default "Close". */
  closeLabel?: string;
  /** Appended to the popup's classes. */
  className?: string;
  /** `SheetHeader`, `SheetBody` and `SheetFooter`. */
  children?: ReactNode;
};

/**
 * The sheet: scrim, viewport and popup. A raised 24px-corner surface (inset 8px from the
 * screen from 640px up), `shadow-overlay`, with `--pad` (24px, 20px under 640px) and
 * `--radius-outer` exposed for concentric children. Lay it out with `SheetHeader`,
 * `SheetBody` (the scroll region) and `SheetFooter`. The close button's icon sits on the
 * content's right edge (R104).
 */
export function SheetContent({
  side = "right",
  size = "md",
  responsive = true,
  container,
  initialFocus,
  finalFocus,
  closeButton = true,
  closeLabel = "Close",
  className = "",
  children,
}: SheetContentProps) {
  const ctx = use(SheetContext);
  if (!ctx) throw new Error("<SheetContent> must be rendered inside a <Sheet>.");
  const mobile = useMobile();
  const placed: SheetSide = responsive && mobile && (side === "left" || side === "right") ? "bottom" : side;
  const { setSide } = ctx;
  useEffect(() => setSide(placed), [setSide, placed]);
  const s = SIDES[placed];

  return (
    <BaseDrawer.Portal container={container}>
      <BaseDrawer.Backdrop className={BACKDROP} />
      <BaseDrawer.Viewport className={`fixed inset-0 z-50 flex ${s.viewport}`}>
        <BaseDrawer.Popup
          initialFocus={initialFocus}
          finalFocus={finalFocus}
          data-side={placed}
          data-snap={(ctx.snap && placed === "bottom") || undefined}
          className={`${POPUP} ${s.popup} ${WIDTHS[size]} ${className}`}
        >
          {placed === "bottom" && (
            // Outside Drawer.Content, so a mouse can drag from it too (Content keeps text selectable).
            <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 flex h-5 items-end justify-center">
              <span className="pointer-events-auto h-1 w-9 rounded-pill bg-line-strong hit-area" />
            </div>
          )}
          <BaseDrawer.Content className="flex min-h-0 flex-1 flex-col">{children}</BaseDrawer.Content>
          {closeButton && (
            // A positioned wrapper: Button is `relative` itself, so it can't be the absolute layer.
            <span className="absolute end-[calc(var(--pad)-8px)] top-[calc(var(--sheet-head)-4px)] flex">
              <BaseDrawer.Close render={<Button variant="ghost" size="icon-sm" hitArea={false} aria-label={closeLabel} />}>
                <CloseIcon />
              </BaseDrawer.Close>
            </span>
          )}
        </BaseDrawer.Popup>
      </BaseDrawer.Viewport>
    </BaseDrawer.Portal>
  );
}

/* ------------------------------------------------------------------- Parts ---------- */

type TextProps = { className?: string; children: ReactNode };

/** Title and description, on the content's inset. Fixed above the scrolling body. */
export function SheetHeader({ className = "", children }: TextProps) {
  return <div className={`flex shrink-0 flex-col px-(--pad) pt-(--sheet-head) pb-4 ${className}`}>{children}</div>;
}

/** The heading; labels the sheet. Leaves room for the close button. */
export function SheetTitle({ className = "", children }: TextProps) {
  return <BaseDrawer.Title className={`pe-8 text-ui-md font-medium text-balance text-text ${className}`}>{children}</BaseDrawer.Title>;
}

/** Supporting text under the title; describes the sheet. */
export function SheetDescription({ className = "", children }: TextProps) {
  return <BaseDrawer.Description className={`mt-1.5 text-ui text-pretty text-text-secondary ${className}`}>{children}</BaseDrawer.Description>;
}

/**
 * The scroll region between the header and the footer. Its edges feather only while there is
 * more to scroll; at the top, a downward drag hands over to the sheet (Base UI).
 */
export function SheetBody({ className = "", children }: TextProps) {
  const ref = useRef<HTMLDivElement>(null);
  useScrollEdges(ref);
  return (
    <div
      ref={ref}
      style={scrollFadeMask("y")}
      className={`flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto overscroll-contain px-(--pad) pt-1 pb-(--pad) ${className}`}
    >
      {children}
    </div>
  );
}

/**
 * The actions bar, pinned under the body on the same inset (R105), above a hairline. Put the
 * primary action last; a leading ghost action takes `edge="start"` and `className="me-auto"`.
 */
export function SheetFooter({ className = "", children }: TextProps) {
  return (
    <div className={`flex shrink-0 items-center justify-end gap-2 border-t border-line-subtle px-(--pad) py-4 ${className}`}>{children}</div>
  );
}

/* ------------------------------------------------------------------ Indent ---------- */

/**
 * Lets an open sheet indent the page behind it. Wrap the app (above every `Sheet`), then put
 * the page in `SheetIndent`.
 */
export const SheetProvider = BaseDrawer.Provider;

export type SheetIndentProps = {
  /** Classes for the page layer. Give it the page's background (default `bg-bg`). */
  className?: string;
  /** Classes for what shows around the indented page. Default `bg-surface-sunken`. */
  backgroundClassName?: string;
  children: ReactNode;
};

/**
 * The page, scaled to 0.97 and dropped 8px with 24px corners while any sheet in the
 * `SheetProvider` is open, easing back as the sheet is swiped away. Scales from its top
 * centre, so put it on an app shell that scrolls itself (`h-dvh overflow-y-auto`) rather than
 * on a page the window scrolls. Reduced motion skips it.
 */
export function SheetIndent({ className = "bg-bg", backgroundClassName = "bg-surface-sunken", children }: SheetIndentProps) {
  return (
    <div className="relative isolate">
      <BaseDrawer.IndentBackground className={`absolute inset-0 -z-1 ${backgroundClassName}`} />
      <BaseDrawer.Indent
        className={`relative origin-[50%_0%] [--indent-t:calc(1_-_clamp(0,calc(var(--drawer-swipe-progress)*100000),1))] [transition-property:transform,border-radius] [transition-duration:calc(var(--eased-duration-sheet)*var(--indent-t))] [transition-timing-function:var(--eased-ease-enter)] data-active:overflow-hidden data-active:rounded-surface data-active:[transform:translateY(calc(8px*(1_-_var(--drawer-swipe-progress))))_scale(calc(0.97_+_0.03*var(--drawer-swipe-progress)))] reduced:data-active:[transform:none] ${className}`}
      >
        {children}
      </BaseDrawer.Indent>
    </div>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 16 16" className="size-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" aria-hidden>
      <path d="m4.5 4.5 7 7m0-7-7 7" />
    </svg>
  );
}
