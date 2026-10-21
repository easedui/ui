"use client";

import { ContextMenu as BaseContextMenu } from "@base-ui/react/context-menu";
import type { ComponentProps } from "react";
import { FloatingLayer } from "../_primitives/floating/floating";
import { HighlightGroup, menuSurface, OVERLAY_ROLES } from "../_primitives/overlay-core/overlay-core";
import {
  DropdownMenuCheckboxItem,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuLinkItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  MenuFlashContext,
  useMenuFlash,
  type DropdownMenuContentProps,
} from "../dropdown-menu/dropdown-menu";

/**
 * A context menu on Base UI's ContextMenu. It appears at the pointer on right click, or on a
 * 500ms long press on touch, with no enter animation (rule 84: a right-click is high-frequency)
 * and its transform-origin at the cursor; it fades out in 100ms. Rows are Dropdown Menu's:
 * Base UI's ContextMenu re-exports Menu's parts, so every row, the gliding highlight and the
 * selection blink are shared, not copied.
 */

export type ContextMenuProps = ComponentProps<typeof BaseContextMenu.Root>;

/**
 * Groups a context menu's parts and owns its open state (`open` / `defaultOpen` / `onOpenChange`).
 * Lets rows blink before it closes; `actionsRef` still reaches Base UI's `close` and `unmount`.
 */
export function ContextMenu({ actionsRef, children, ...props }: ContextMenuProps) {
  const { ref, flash } = useMenuFlash(actionsRef);
  return (
    <MenuFlashContext value={flash}>
      <BaseContextMenu.Root {...props} actionsRef={ref}>
        {children}
      </BaseContextMenu.Root>
    </MenuFlashContext>
  );
}

export type ContextMenuTriggerProps = Omit<ComponentProps<typeof BaseContextMenu.Trigger>, "className"> & {
  /** The region's classes. It renders a `<div>`; pass `render` for another element. */
  className?: string;
};

/**
 * The region that opens the menu on right click and on a 500ms long press on touch (moving more
 * than 10px cancels it, so scrolling still works). Base UI suppresses the iOS callout; text in
 * the region is unselectable on coarse pointers so a long press opens the menu instead of a selection.
 */
export function ContextMenuTrigger({ className = "", ...props }: ContextMenuTriggerProps) {
  return <BaseContextMenu.Trigger {...props} className={`pointer-coarse:select-none ${className}`} />;
}

/*
 * Base UI places a context menu just right of and above the pointer (align start, 2px along,
 * −5px on the side axis) so the pointer lands on the first row. FloatingLayer always passes a
 * side, which turns off that default, so the same numbers are set here.
 */
const AT_CURSOR = { sideOffset: -5, alignOffset: 2 } as const;

export type ContextMenuContentProps = Pick<
  DropdownMenuContentProps,
  "finalFocus" | "container" | "zIndex" | "width" | "className" | "children"
>;

/** The menu popup at the pointer: Dropdown Menu's surface and tracks, appearing at once and fading out in 100ms. */
export function ContextMenuContent({ finalFocus, container, zIndex, width, className = "", children }: ContextMenuContentProps) {
  return (
    <FloatingLayer
      parts={BaseContextMenu}
      motion={OVERLAY_ROLES.context}
      side={OVERLAY_ROLES.context.side}
      align="start"
      sideOffset={AT_CURSOR.sideOffset}
      alignOffset={AT_CURSOR.alignOffset}
      container={container}
      zIndex={zIndex}
      popupProps={{ finalFocus }}
      style={width ? { width } : undefined}
      className={`${menuSurface} ${className}`}
    >
      <HighlightGroup>{children}</HighlightGroup>
    </FloatingLayer>
  );
}

/** A command row; blinks, then closes the menu. See `DropdownMenuItem`. */
export const ContextMenuItem = DropdownMenuItem;
/** A row that navigates. See `DropdownMenuLinkItem`. */
export const ContextMenuLinkItem = DropdownMenuLinkItem;
/** A toggle row; the menu stays open. See `DropdownMenuCheckboxItem`. */
export const ContextMenuCheckboxItem = DropdownMenuCheckboxItem;
/** One choice among its radio items. See `DropdownMenuRadioGroup`. */
export const ContextMenuRadioGroup = DropdownMenuRadioGroup;
/** One option of a radio group. See `DropdownMenuRadioItem`. */
export const ContextMenuRadioItem = DropdownMenuRadioItem;
/** A nested menu. See `DropdownMenuSub`. */
export const ContextMenuSub = DropdownMenuSub;
/** The row that opens a submenu. See `DropdownMenuSubTrigger`. */
export const ContextMenuSubTrigger = DropdownMenuSubTrigger;
/** The submenu popup beside its row. See `DropdownMenuSubContent`. */
export const ContextMenuSubContent = DropdownMenuSubContent;
/** Related rows under a label. See `DropdownMenuGroup`. */
export const ContextMenuGroup = DropdownMenuGroup;
/** A group's heading. See `DropdownMenuLabel`. */
export const ContextMenuLabel = DropdownMenuLabel;
/** A full-bleed rule between groups. See `DropdownMenuSeparator`. */
export const ContextMenuSeparator = DropdownMenuSeparator;

export type {
  DropdownMenuCheckboxItemProps as ContextMenuCheckboxItemProps,
  DropdownMenuGroupProps as ContextMenuGroupProps,
  DropdownMenuItemProps as ContextMenuItemProps,
  DropdownMenuLabelProps as ContextMenuLabelProps,
  DropdownMenuLinkItemProps as ContextMenuLinkItemProps,
  DropdownMenuRadioGroupProps as ContextMenuRadioGroupProps,
  DropdownMenuRadioItemProps as ContextMenuRadioItemProps,
  DropdownMenuSubContentProps as ContextMenuSubContentProps,
  DropdownMenuSubTriggerProps as ContextMenuSubTriggerProps,
} from "../dropdown-menu/dropdown-menu";
