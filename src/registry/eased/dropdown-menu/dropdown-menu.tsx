"use client";

import { Menu } from "@base-ui/react/menu";
import {
  createContext,
  use,
  useEffect,
  useMemo,
  useRef,
  type ComponentProps,
  type ReactNode,
  type RefObject,
} from "react";
import { FloatingLayer, type FloatingAlign, type FloatingSide } from "../_primitives/floating/floating";
import {
  flashThenClose,
  groupClass,
  groupLabelClass,
  HighlightGroup,
  ItemCheck,
  ItemChevron,
  itemClass,
  ItemParts,
  menuSurface,
  OVERLAY_ROLES,
  separatorClass,
  withHighlight,
} from "../_primitives/overlay-core/overlay-core";
import { Button, type ButtonSize, type ButtonVariant } from "../button/button";
import { useSafeReducedMotion } from "../lib/motion";

/**
 * A dropdown menu on Base UI's Menu. It opens on mousedown from its trigger's transform-origin,
 * 4px toward the trigger at 0.97 in 150ms, and leaves half as far in 100ms. One highlight glides
 * between rows on the snappy spring; a chosen row blinks (40ms off, 40ms on) before the menu
 * closes, as on macOS. Submenus open beside their row with their first row on the row's line.
 *
 * The row parts (`DropdownMenuItem` … `DropdownMenuSeparator`) also serve Context Menu: Base UI's
 * ContextMenu re-exports Menu's parts, so the same rows work under either root.
 */

/* ---------------------------------------------------------- Selection flash ---------- */

type Flash = { close: () => void; reduced: boolean };

/** Lets a row close the whole menu after its flash. Provided by `DropdownMenu` and `ContextMenu`. */
export const MenuFlashContext = createContext<Flash | null>(null);

type Actions = { close: () => void; unmount: () => void };

/**
 * The root's half of the selection flash: an actions ref for Base UI's root (yours, if you pass
 * one) and the context value rows read to close it. For roots that wrap Menu or ContextMenu.
 */
export function useMenuFlash(actionsRef?: RefObject<Actions | null>) {
  const own = useRef<Actions | null>(null);
  const ref = actionsRef ?? own;
  const reduced = useSafeReducedMotion();
  const flash = useMemo<Flash>(() => ({ close: () => ref.current?.close(), reduced }), [ref, reduced]);
  return { ref, flash };
}

/* -------------------------------------------------------------------- Root ---------- */

export type DropdownMenuProps = ComponentProps<typeof Menu.Root>;

/**
 * Groups a menu's parts and owns its open state (`open` / `defaultOpen` / `onOpenChange`). Modal by
 * default: page scroll locks and outside clicks only dismiss. It also lets rows flash before it
 * closes; `actionsRef` still reaches Base UI's `close` and `unmount`.
 */
export function DropdownMenu({ actionsRef, children, ...props }: DropdownMenuProps) {
  const { ref, flash } = useMenuFlash(actionsRef);
  return (
    <MenuFlashContext value={flash}>
      <Menu.Root {...props} actionsRef={ref}>
        {children}
      </Menu.Root>
    </MenuFlashContext>
  );
}

export type DropdownMenuTriggerProps = Omit<ComponentProps<typeof Menu.Trigger>, "className"> & {
  /** The Eased `Button` variant. Default "secondary"; "ghost" for a quiet "⋯" in a header. */
  variant?: ButtonVariant;
  /** The Eased `Button` size. Default "sm" (32px); `icon-sm` for a square icon trigger. */
  size?: ButtonSize;
  className?: string;
};

/**
 * The button that opens the menu, on mousedown (rule 71), so press-drag-release picks a row in one
 * gesture. An Eased `Button`: it never scales as a trigger (R64) and stays pressed
 * (`aria-expanded`) while the menu is open. With `openOnHover` it waits 300ms after the pointer
 * leaves before closing (`closeDelay`). Pass `render` for your own element (style it with `floatingTrigger`).
 */
export function DropdownMenuTrigger({
  variant = "secondary",
  size = "sm",
  className = "",
  render,
  openOnHover,
  closeDelay = openOnHover ? 300 : 0,
  ...props
}: DropdownMenuTriggerProps) {
  return (
    <Menu.Trigger
      {...props}
      openOnHover={openOnHover}
      closeDelay={closeDelay}
      render={render ?? <Button variant={variant} size={size} className={className} />}
    />
  );
}

/* ----------------------------------------------------------------- Content ---------- */

export type DropdownMenuContentProps = {
  /** Preferred side; flips on collision and the enter direction follows. Default "bottom". */
  side?: FloatingSide;
  /** Default "start": the menu's leading edge on the trigger's. */
  align?: FloatingAlign;
  /** Gap to the trigger, px. Default 4. */
  sideOffset?: number;
  alignOffset?: number;
  /** Where focus returns on close. Default: the trigger. */
  finalFocus?: ComponentProps<typeof Menu.Popup>["finalFocus"];
  /** Portal target. Default `document.body`. */
  container?: HTMLElement | null;
  /** Stacking order. Default 50; raise it inside a higher layer such as a dialog. */
  zIndex?: number;
  /** A CSS width, e.g. `"15rem"`. Default: fits the rows, at least 192px, never wider than the viewport. */
  width?: string;
  /** Appended to the popup's classes. */
  className?: string;
  children?: ReactNode;
};

/**
 * The menu popup: a raised 16px panel with 4px padding whose rows share three tracks (icon ·
 * label · trailing), so labels start on one x and shortcuts, checks and chevrons share a column.
 * It scrolls within the space available.
 */
export function DropdownMenuContent({
  side = OVERLAY_ROLES.menu.side,
  align = "start",
  sideOffset = OVERLAY_ROLES.menu.sideOffset,
  alignOffset,
  finalFocus,
  container,
  zIndex,
  width,
  className = "",
  children,
}: DropdownMenuContentProps) {
  return (
    <FloatingLayer
      parts={Menu}
      motion={OVERLAY_ROLES.menu}
      side={side}
      align={align}
      sideOffset={sideOffset}
      alignOffset={alignOffset}
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

/* -------------------------------------------------------------------- Rows ---------- */

type RowContent = {
  /** 16px icon in the leading track; muted at rest, full colour while highlighted. */
  icon?: ReactNode;
  /** Shortcut glyphs for the trailing column, e.g. `"⌘D"`. Display only: bind the key yourself. */
  shortcut?: string;
  /** A second, muted line under the label. */
  description?: ReactNode;
  /** Appended to the row's classes. */
  className?: string;
  /** The label. */
  children: ReactNode;
};

export type DropdownMenuItemProps = Omit<ComponentProps<typeof Menu.Item>, "className" | "children" | "render"> &
  RowContent & {
    /** `"danger"`: red label and icon, a red-tinted highlight. For destructive actions. Default "default". */
    tone?: "default" | "danger";
  };

/**
 * A command row. Choosing it runs `onClick`, then the row blinks for 80ms and the menu closes
 * (at once under reduced motion). `closeOnClick={false}` keeps the menu open and skips the blink.
 * `disabled` rows stay in the list and in keyboard order (so they can be read), and ignore clicks.
 */
export function DropdownMenuItem({
  icon,
  shortcut,
  description,
  tone = "default",
  closeOnClick = true,
  onClick,
  className = "",
  children,
  ...props
}: DropdownMenuItemProps) {
  const flash = use(MenuFlashContext);
  const cancel = useRef<() => void>(undefined);
  useEffect(() => () => cancel.current?.(), []);
  // Without a flash-aware root (a bare Base UI Menu.Root), Base UI closes the menu itself.
  const flashes = flash !== null && closeOnClick;

  return (
    <Menu.Item
      {...props}
      closeOnClick={flashes ? false : closeOnClick}
      onClick={(event) => {
        onClick?.(event);
        if (!flash || !flashes || event.baseUIHandlerPrevented) return;
        cancel.current?.();
        cancel.current = flashThenClose(event.currentTarget, flash.close, flash.reduced);
      }}
      data-tone={tone === "danger" ? "danger" : undefined}
      className={`${itemClass({ tone, glide: true })} ${className}`}
      render={withHighlight}
    >
      <ItemParts icon={icon} shortcut={shortcut} description={description}>
        {children}
      </ItemParts>
    </Menu.Item>
  );
}

export type DropdownMenuLinkItemProps = Omit<ComponentProps<typeof Menu.LinkItem>, "className" | "children" | "render"> &
  RowContent;

/** A row that navigates: an `<a>` with `href`. The page change is the feedback, so it doesn't blink. */
export function DropdownMenuLinkItem({ icon, shortcut, description, className = "", children, ...props }: DropdownMenuLinkItemProps) {
  return (
    <Menu.LinkItem
      {...props}
      className={`${itemClass({ glide: true })} ${className}`}
      render={withHighlight}
    >
      <ItemParts icon={icon} shortcut={shortcut} description={description}>
        {children}
      </ItemParts>
    </Menu.LinkItem>
  );
}

export type DropdownMenuCheckboxItemProps = Omit<ComponentProps<typeof Menu.CheckboxItem>, "className" | "children" | "render"> &
  Omit<RowContent, "icon">;

/**
 * A toggle row (`checked` / `defaultChecked` / `onCheckedChange`). Its check sits in the icon
 * track and draws in when ticked. The menu stays open on click so you can set several.
 */
export function DropdownMenuCheckboxItem({ shortcut, description, className = "", children, ...props }: DropdownMenuCheckboxItemProps) {
  return (
    <Menu.CheckboxItem {...props} className={`${itemClass({ glide: true })} ${className}`} render={withHighlight}>
      <ItemParts
        icon={
          <Menu.CheckboxItemIndicator keepMounted className="flex">
            <ItemCheck />
          </Menu.CheckboxItemIndicator>
        }
        shortcut={shortcut}
        description={description}
      >
        {children}
      </ItemParts>
    </Menu.CheckboxItem>
  );
}

export type DropdownMenuRadioGroupProps = Omit<ComponentProps<typeof Menu.RadioGroup>, "className"> & { className?: string };

/** One choice among its `DropdownMenuRadioItem`s (`value` / `defaultValue` / `onValueChange`). Keeps the rows on the menu's tracks. */
export function DropdownMenuRadioGroup({ className = "", ...props }: DropdownMenuRadioGroupProps) {
  return <Menu.RadioGroup {...props} className={`${groupClass} ${className}`} />;
}

export type DropdownMenuRadioItemProps = Omit<ComponentProps<typeof Menu.RadioItem>, "className" | "children" | "render"> &
  Omit<RowContent, "icon">;

/** One option of a radio group (`value` required). The check marks the chosen one; the menu stays open on click. */
export function DropdownMenuRadioItem({ shortcut, description, className = "", children, ...props }: DropdownMenuRadioItemProps) {
  return (
    <Menu.RadioItem {...props} className={`${itemClass({ glide: true })} ${className}`} render={withHighlight}>
      <ItemParts
        icon={
          <Menu.RadioItemIndicator keepMounted className="flex">
            <ItemCheck />
          </Menu.RadioItemIndicator>
        }
        shortcut={shortcut}
        description={description}
      >
        {children}
      </ItemParts>
    </Menu.RadioItem>
  );
}

/* ---------------------------------------------------------------- Submenus ---------- */

/** A nested menu: holds one `DropdownMenuSubTrigger` and one `DropdownMenuSubContent`. Base UI `Menu.SubmenuRoot`. */
export const DropdownMenuSub = Menu.SubmenuRoot;

export type DropdownMenuSubTriggerProps = Omit<ComponentProps<typeof Menu.SubmenuTrigger>, "className" | "children" | "render"> &
  Omit<RowContent, "shortcut">;

/**
 * The row that opens a submenu: a chevron in the trailing column. It opens on hover (100ms
 * `delay`), click, Enter or ArrowRight; Base UI's safe-hover triangle keeps it open while the
 * pointer travels diagonally to it. While the submenu is open the row keeps a quiet fill.
 */
export function DropdownMenuSubTrigger({ icon, description, className = "", children, ...props }: DropdownMenuSubTriggerProps) {
  return (
    <Menu.SubmenuTrigger
      {...props}
      className={`${itemClass({ glide: true })} data-popup-open:bg-surface-hover ${className}`}
      render={withHighlight}
    >
      <ItemParts icon={icon} description={description} trailing={<ItemChevron />}>
        {children}
      </ItemParts>
    </Menu.SubmenuTrigger>
  );
}

/** The menu's 1px border plus its 4px padding: how far a submenu rises so its first row sits on its trigger row. */
const SUBMENU_ALIGN_OFFSET = -5;

export type DropdownMenuSubContentProps = Pick<DropdownMenuContentProps, "container" | "zIndex" | "width" | "className" | "children">;

/**
 * The submenu popup, beside its row (flipping to the other side on collision), raised by the
 * menu's border and padding so its first row lines up with the trigger row. It slides 4px out
 * from the parent and has its own gliding highlight.
 */
export function DropdownMenuSubContent({ container, zIndex, width, className = "", children }: DropdownMenuSubContentProps) {
  return (
    <FloatingLayer
      parts={Menu}
      motion={OVERLAY_ROLES.submenu}
      side={OVERLAY_ROLES.submenu.side}
      align="start"
      sideOffset={OVERLAY_ROLES.submenu.sideOffset}
      alignOffset={SUBMENU_ALIGN_OFFSET}
      container={container}
      zIndex={zIndex}
      style={width ? { width } : undefined}
      className={`${menuSurface} ${className}`}
    >
      <HighlightGroup>{children}</HighlightGroup>
    </FloatingLayer>
  );
}

/* ---------------------------------------------------------------- Grouping ---------- */

export type DropdownMenuGroupProps = Omit<ComponentProps<typeof Menu.Group>, "className"> & { className?: string };

/** Related rows, labelled by a `DropdownMenuLabel` inside it. Keeps its rows on the menu's tracks. */
export function DropdownMenuGroup({ className = "", ...props }: DropdownMenuGroupProps) {
  return <Menu.Group {...props} className={`${groupClass} ${className}`} />;
}

export type DropdownMenuLabelProps = Omit<ComponentProps<typeof Menu.GroupLabel>, "className"> & { className?: string };

/** A group's heading: 12px, muted, 28px tall. Names its `DropdownMenuGroup` or `DropdownMenuRadioGroup`. */
export function DropdownMenuLabel({ className = "", ...props }: DropdownMenuLabelProps) {
  return <Menu.GroupLabel {...props} className={`${groupLabelClass} ${className}`} />;
}

/** A full-bleed 1px rule between groups. */
export function DropdownMenuSeparator({ className = "" }: { className?: string }) {
  return <Menu.Separator className={`${separatorClass} ${className}`} />;
}
