"use client";

import { ScrollArea as Base } from "@base-ui/react/scroll-area";
import type { CSSProperties, ReactNode, Ref } from "react";
import { scrollFadeMask, type FadeAxis } from "../_primitives/scroll-fade/scroll-fade";

export type ScrollAreaProps = {
  children: ReactNode;
  /** Which way it scrolls. "both" draws both bars and fades all four edges. Default "vertical". */
  orientation?: "vertical" | "horizontal" | "both";
  /** Edge feather in px, drawn only while there is more to scroll that way; 0 turns it off. Default 20. */
  fade?: number;
  /** Classes for the root: size it here (`h-64`, `max-h-80`, `flex-1 min-h-0`). */
  className?: string;
  /** Classes for the content wrapper: put padding here so it scrolls with the content. */
  contentClassName?: string;
  /** The scrolling element, for `scrollTo`, scroll-linked effects or a Progressive Blur. */
  viewportRef?: Ref<HTMLDivElement>;
  /** Accessible name for the scrollable region, which is a keyboard tab stop when it overflows. */
  "aria-label"?: string;
  "aria-labelledby"?: string;
  style?: CSSProperties;
};

const AXIS: Record<NonNullable<ScrollAreaProps["orientation"]>, FadeAxis> = { vertical: "y", horizontal: "x", both: "both" };

// The bar is a 10px hit zone; the visible pill is 6px and drawn at 2/3 until the pointer is on
// the bar, so it thickens under the pointer (scale, not width, so it stays on the compositor).
const bar =
  "group/bar flex touch-none p-0.5 opacity-0 select-none pointer-events-none transition-opacity duration-(--eased-duration-slow) ease-standard data-hovering:pointer-events-auto data-hovering:opacity-100 data-hovering:duration-(--eased-duration-fast) data-scrolling:pointer-events-auto data-scrolling:opacity-100 data-scrolling:duration-(--eased-duration-instant) reduced:transition-none";
const pill =
  "rounded-pill bg-line-strong transition-[scale,background-color] duration-(--eased-duration-fast) ease-standard group-active/bar:bg-text-muted group-active/bar:scale-100 [@media(hover:hover)_and_(pointer:fine)]:group-hover/bar:scale-100 [@media(hover:hover)_and_(pointer:fine)]:group-hover/bar:bg-text-muted reduced:transition-none";

/**
 * A native scroller with Eased's overlay scrollbar and edge fades. Base UI owns the scrolling,
 * the thumb drag and the keyboard (the viewport is a tab stop that arrow keys scroll); Eased
 * draws a thin themed pill that appears while scrolling or hovering and thickens under the
 * pointer, and feathers each edge only while there is content past it.
 */
export function ScrollArea({
  children,
  orientation = "vertical",
  fade = 20,
  className = "",
  contentClassName = "",
  viewportRef,
  style,
  ...aria
}: ScrollAreaProps) {
  const vertical = orientation !== "horizontal";
  const horizontal = orientation !== "vertical";

  return (
    <Base.Root
      style={style}
      className={`relative min-h-0 min-w-0 overflow-hidden -outline-offset-2 has-[[data-eased-viewport]:focus-visible]:outline-2 has-[[data-eased-viewport]:focus-visible]:outline-focus ${className}`}
    >
      <Base.Viewport
        ref={viewportRef}
        data-eased-viewport=""
        {...aria}
        role={aria["aria-label"] || aria["aria-labelledby"] ? "region" : undefined}
        style={{
          ...(fade > 0 && scrollFadeMask(AXIS[orientation], fade)),
          // Base UI sets overflow: scroll inline; lock the axis this area does not scroll.
          ...(!vertical && { overflowY: "hidden" }),
          ...(!horizontal && { overflowX: "hidden" }),
        }}
        className="size-full max-h-[inherit] overscroll-contain outline-none"
      >
        {/* Base UI sets min-width: fit-content inline; a vertical-only area must shrink to the
            viewport instead, or wide rows push their trailing column out of view. */}
        <Base.Content style={horizontal ? undefined : { minWidth: 0 }} className={contentClassName}>
          {children}
        </Base.Content>
      </Base.Viewport>

      {vertical && (
        <Base.Scrollbar orientation="vertical" className={`${bar} w-2.5 justify-end`}>
          <Base.Thumb className="flex w-full justify-end">
            <span className={`${pill} h-full w-1.5 origin-right scale-x-[0.67]`} />
          </Base.Thumb>
        </Base.Scrollbar>
      )}
      {horizontal && (
        <Base.Scrollbar orientation="horizontal" className={`${bar} h-2.5 flex-col justify-end`}>
          <Base.Thumb className="flex h-full flex-col justify-end">
            <span className={`${pill} h-1.5 w-full origin-bottom scale-y-[0.67]`} />
          </Base.Thumb>
        </Base.Scrollbar>
      )}
      {orientation === "both" && <Base.Corner />}
    </Base.Root>
  );
}
