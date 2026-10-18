"use client";

import { Popover as BasePopover } from "@base-ui/react/popover";
import { useLayoutEffect, useRef, type ComponentProps, type ReactNode } from "react";
import { floatingMotion, floatingTrigger, floatingVars, FLOATING_ROLES, type FloatingAlign, type FloatingMotion } from "../_primitives/floating/floating";
import { MAC_RADIUS, macFont, macHairlineStroke, macMaterial, macShadow, macTextSecondary, type MacMaterialMode } from "../lib/mac";

/**
 * A macOS menu bar popover: a status item in the menu bar and a frosted panel that hangs from it
 * on an arrow. The panel and arrow are one shape (one clip-path), so a single backdrop blur covers
 * both with no seam, and the hairline is one stroke that follows the arrow. Behaviour is Base UI
 * Popover; motion is Eased's floating layer, so the panel grows from the arrow tip and a close
 * during the open turns around mid-flight.
 */

/** Groups the parts and owns the open state (`open`, `defaultOpen`, `onOpenChange`). Non-modal. */
export const MacMenuPopover = BasePopover.Root;

/** Closes the popover. `<MacMenuPopoverClose render={<MacMenuItem … />} />` makes a row that closes it. */
export const MacMenuPopoverClose = BasePopover.Close;

/** Arrow geometry, px: 24 × 12 (45° sides), a softened tip and a small fillet where it meets the panel. */
const ARROW = { width: 24, height: 12, tip: 2.5, fillet: 3 } as const;
/** Keeps the arrow clear of the panel's rounded corners when a collision shifts the panel. */
const ARROW_PADDING = MAC_RADIUS.popover + ARROW.fillet + 1;

/** The spec's motion: a little further and a little smaller than a web popover, on the same transitions. */
const MOTION: FloatingMotion = { ...FLOATING_ROLES.popover, distance: 6, scale: 0.95 };
const MOTION_VARS = floatingVars(MOTION);

/*
 * Fills for hover, press, separators and tracks on the material, as variables so the parts below
 * stay single-class. Same values as macOS's quaternary/tertiary system fills, light and dark.
 */
const FILLS =
  "[--mac-hover:rgb(0_0_0/0.06)] [--mac-press:rgb(0_0_0/0.1)] [--mac-separator:rgb(0_0_0/0.1)] [--mac-track:rgb(0_0_0/0.08)] " +
  "in-[.dark]:[--mac-hover:rgb(255_255_255/0.08)] in-[.dark]:[--mac-press:rgb(255_255_255/0.14)] in-[.dark]:[--mac-separator:rgb(255_255_255/0.1)] in-[.dark]:[--mac-track:rgb(255_255_255/0.1)] " +
  "in-data-[theme=dark]:[--mac-hover:rgb(255_255_255/0.08)] in-data-[theme=dark]:[--mac-press:rgb(255_255_255/0.14)] in-data-[theme=dark]:[--mac-separator:rgb(255_255_255/0.1)] in-data-[theme=dark]:[--mac-track:rgb(255_255_255/0.1)]";

/* ---------- Status item ---------- */

export type MacStatusItemProps = Omit<ComponentProps<typeof BasePopover.Trigger>, "className"> & {
  /** The accessible name. Status items are usually an icon or a number, so this is required. */
  label: string;
  className?: string;
};

/**
 * The menu bar button that opens the popover: an icon, optionally with a short value ("62%").
 * Like a macOS status item it presses and stays highlighted (`data-popup-open`) by colour only,
 * never by scale, so the arrow's anchor stays put. Keyboard focus draws Eased's ring.
 */
export function MacStatusItem({ label, className = "", ...props }: MacStatusItemProps) {
  return (
    <BasePopover.Trigger
      aria-label={label}
      {...props}
      className={`${floatingTrigger} ${FILLS} inline-flex h-[22px] shrink-0 items-center gap-[5px] rounded-[5px] px-[7px] font-medium tabular-nums active:bg-(--mac-press) data-popup-open:bg-(--mac-press) cursor-default! ${className}`}
    />
  );
}

/* ---------- The panel ---------- */

export type MacMenuPopoverContentProps = {
  /** Panel width, px. Never wider than the space available. Default 320. */
  width?: number;
  /** Draw the arrow. Without it the panel is a plain rounded rectangle. Default true. */
  arrow?: boolean;
  /** `"css"` frosts the panel in a web page; `"native"` leaves it to a Tauri/Electron window's vibrancy. Default "css". */
  material?: MacMaterialMode;
  /** Below the menu bar, or above an anchor near the bottom of the screen. Default "bottom". */
  side?: "bottom" | "top";
  /** Default "center": the tip sits under the status item; collisions shift the panel and the tip stays put. */
  align?: FloatingAlign;
  /** Gap from the status item to the arrow tip, px. Default 6 (5px below a 24px menu bar). */
  sideOffset?: number;
  alignOffset?: number;
  /** Space kept from the boundary, px. Default 8. */
  collisionPadding?: number;
  /** The area the panel must stay inside. Default: the viewport (the tray window, in Tauri). */
  collisionBoundary?: ComponentProps<typeof BasePopover.Positioner>["collisionBoundary"];
  /** Where focus goes on open. Default: the first control for a keyboard open, the panel for a pointer open. */
  initialFocus?: ComponentProps<typeof BasePopover.Popup>["initialFocus"];
  /** Where focus returns on close. Default: the status item. */
  finalFocus?: ComponentProps<typeof BasePopover.Popup>["finalFocus"];
  /** Portal target. Default `document.body`. */
  container?: HTMLElement | null;
  /** Stacking order. Default 50. */
  zIndex?: number;
  /** Appended to the content area's classes (12px padding, a flex column). */
  className?: string;
  children?: ReactNode;
};

/**
 * The frosted panel. 11px corners, 12px padding, 13px SF type. It exposes `--pad` and
 * `--radius-outer` so nested corners stay concentric (rows use 7px).
 */
export function MacMenuPopoverContent({
  width = 320,
  arrow = true,
  material = "css",
  side = "bottom",
  align = "center",
  sideOffset = 6,
  alignOffset = 0,
  collisionPadding = 8,
  collisionBoundary,
  initialFocus,
  finalFocus,
  container,
  zIndex = 50,
  className = "",
  children,
}: MacMenuPopoverContentProps) {
  return (
    <BasePopover.Portal container={container}>
      <BasePopover.Positioner
        side={side}
        align={align}
        sideOffset={sideOffset}
        alignOffset={alignOffset}
        collisionPadding={collisionPadding}
        collisionBoundary={collisionBoundary}
        arrowPadding={ARROW_PADDING}
        style={{ zIndex }}
      >
        <Panel width={width} arrow={arrow} material={material} side={side} initialFocus={initialFocus} finalFocus={finalFocus} className={className}>
          {children}
        </Panel>
      </BasePopover.Positioner>
    </BasePopover.Portal>
  );
}

type PanelProps = Required<Pick<MacMenuPopoverContentProps, "width" | "arrow" | "material" | "side" | "className">> &
  Pick<MacMenuPopoverContentProps, "initialFocus" | "finalFocus" | "children">;

/** Attributes the floating motion reads; the shadow layer copies them from the panel to move in step. */
const MIRRORED = ["data-starting-style", "data-ending-style", "data-side"];

/**
 * Mounted only while open (inside the Positioner), so its refs are live in its layout effect.
 *
 * Layers, back to front: the shadow (a sibling, because a filter on an ancestor would stop the
 * panel's backdrop blur from seeing the page), then the panel, which carries the blur, the
 * clip-path and the floating motion on one element, so the blur also survives the fade.
 */
function Panel({ width, arrow, material, side, initialFocus, finalFocus, className, children }: PanelProps) {
  const popupRef = useRef<HTMLDivElement>(null);
  const arrowRef = useRef<HTMLDivElement>(null);
  const shadowRef = useRef<HTMLDivElement>(null);
  const shadowPathRef = useRef<SVGPathElement>(null);
  const hairlineRef = useRef<SVGPathElement>(null);

  useLayoutEffect(() => {
    const popup = popupRef.current;
    const shadow = shadowRef.current;
    if (!popup || !shadow) return;
    const arrowEl = arrowRef.current;

    // Size from offset* (layout px), so the scale animation never distorts the shape.
    const draw = () => {
      const w = popup.offsetWidth;
      const h = popup.offsetHeight;
      const tip = arrowEl ? arrowEl.offsetLeft + arrowEl.offsetWidth / 2 : w / 2;
      const d = shapePath(w, h, tip, arrowEl ? (popup.dataset.side === "top" ? "top" : "bottom") : null);
      popup.style.clipPath = `path("${d}")`;
      // The shadow layer keeps only what falls outside the shape, so it never darkens the glass.
      shadow.style.clipPath = `path(evenodd, "M-80 -80H${w + 80}V${h + 80}H-80Z ${d}")`;
      shadowPathRef.current?.setAttribute("d", d);
      hairlineRef.current?.setAttribute("d", d);
    };
    const mirror = () => {
      for (const name of MIRRORED) {
        const value = popup.getAttribute(name);
        if (value === null) shadow.removeAttribute(name);
        else shadow.setAttribute(name, value);
      }
    };

    mirror();
    draw();
    // Observer callbacks run before the next paint, so the shape and shadow never lag a frame.
    const resize = new ResizeObserver(draw);
    resize.observe(popup);
    const mutations = new MutationObserver(() => {
      mirror();
      draw();
    });
    mutations.observe(popup, { attributes: true, attributeFilter: MIRRORED });
    // Base UI moves the arrow (inline `left`) when a collision shifts the panel.
    if (arrowEl) mutations.observe(arrowEl, { attributes: true, attributeFilter: ["style"] });
    return () => {
      resize.disconnect();
      mutations.disconnect();
    };
  }, [arrow]);

  return (
    <>
      <div
        ref={shadowRef}
        aria-hidden
        // Mounts with the panel in its starting state, before the observer takes over.
        data-starting-style=""
        data-side={side}
        className={`${floatingMotion()} ${macShadow} pointer-events-none absolute inset-0`}
        style={MOTION_VARS}
      >
        <svg className="absolute inset-0 size-full overflow-visible">
          <path ref={shadowPathRef} />
        </svg>
      </div>

      <BasePopover.Popup
        ref={popupRef}
        // A pointer open focuses the panel, so no row lights up; a keyboard open focuses the first control.
        initialFocus={initialFocus ?? ((type) => (type === "keyboard" ? true : popupRef.current))}
        finalFocus={finalFocus}
        className={`${floatingMotion()} ${macMaterial("popover", material, { hairline: false })} ${macFont} ${FILLS} relative flex max-h-(--available-height) max-w-(--available-width) flex-col outline-none [--pad:12px] [--radius-outer:11px] ${
          arrow ? "data-[side=bottom]:pt-3 data-[side=top]:pb-3" : ""
        }`}
        style={{ ...MOTION_VARS, width }}
      >
        {/* Invisible: Base UI positions it under the status item; the shape reads its offset. */}
        {arrow && <BasePopover.Arrow ref={arrowRef} className="pointer-events-none h-3 w-6 data-[side=bottom]:top-0 data-[side=top]:bottom-0" />}
        <div className={`flex min-h-0 flex-col overflow-y-auto p-(--pad) ${className}`}>{children}</div>
        {/* A 1px stroke on the clip edge: the clip keeps its inner half, a 0.5px hairline. */}
        <svg aria-hidden className="pointer-events-none absolute inset-0 size-full">
          <path ref={hairlineRef} fill="none" strokeWidth={1} className={macHairlineStroke} />
        </svg>
      </BasePopover.Popup>
    </>
  );
}

const n = (v: number) => Math.round(v * 100) / 100;

/**
 * The panel outline as one SVG path: a rounded rectangle with the arrow (when `arrowSide` is set)
 * on the edge facing the anchor, its tip at `tipX`. Built for the bottom side (arrow on top) and
 * mirrored vertically for the top side.
 */
function shapePath(w: number, h: number, tipX: number, arrowSide: "top" | "bottom" | null) {
  const a = arrowSide ? ARROW.height : 0;
  const r = Math.max(0, Math.min(MAC_RADIUS.popover, (h - a) / 2, w / 2));
  const flip = arrowSide === "top";
  const sweep = flip ? 0 : 1;
  const p = (x: number, y: number) => `${n(x)} ${n(flip ? h - y : y)}`;
  const arc = (x: number, y: number) => `A${n(r)} ${n(r)} 0 0 ${sweep} ${p(x, y)}`;

  let top = "";
  if (arrowSide) {
    const hw = ARROW.width / 2;
    const k = Math.SQRT1_2; // the arrow's sides run at 45°
    const f = ARROW.fillet;
    const t = ARROW.tip;
    const x = Math.min(Math.max(tipX, r + hw + f), w - r - hw - f);
    top =
      `L${p(x - hw - f, a)} Q${p(x - hw, a)} ${p(x - hw + f * k, a - f * k)} ` +
      `L${p(x - t * k, t * k)} Q${p(x, 0)} ${p(x + t * k, t * k)} ` +
      `L${p(x + hw - f * k, a - f * k)} Q${p(x + hw, a)} ${p(x + hw + f, a)} `;
  }

  return (
    `M${p(r, a)} ${top}L${p(w - r, a)} ${arc(w, a + r)} L${p(w, h - r)} ${arc(w - r, h)} ` +
    `L${p(r, h)} ${arc(0, h - r)} L${p(0, a + r)} ${arc(r, a)} Z`
  );
}

/**
 * The panel without the popover, for a Tauri/Electron tray window, where the native tray icon is
 * the status item and the window is the panel. Same type, fills and 12px padding; it fills the
 * window, so the window rounds the corners (Tauri `windowEffects.radius`; macOS rounds a frameless
 * Electron window). Usually `material="native"`: a CSS blur can't see the desktop behind a window.
 */
export function MacMenuPanel({ material = "native", className = "", children }: { material?: MacMaterialMode; className?: string; children?: ReactNode }) {
  return (
    <div className={`${macMaterial("popover", material)} ${macFont} ${FILLS} flex min-h-full flex-col p-(--pad) [--pad:12px] [--radius-outer:11px] ${className}`}>
      {children}
    </div>
  );
}

/* ---------- Rows ---------- */

export type MacMenuItemProps = ComponentProps<"button"> & {
  /** A 16px icon on the content line. */
  icon?: ReactNode;
  /** A keyboard shortcut shown on the right, e.g. "⌘D". Display only: wire the key yourself. */
  shortcut?: string;
};

/**
 * A menu-style action row. Its highlight bleeds 8px into the panel padding so the icon and label
 * sit on the content line; the 7px corner is concentric with the panel. Colour only on hover and
 * press; keyboard focus shows the same highlight, a shade stronger.
 */
export function MacMenuItem({ icon, shortcut, className = "", children, type = "button", ...props }: MacMenuItemProps) {
  return (
    <button
      type={type}
      {...props}
      className={`-mx-2 grid h-6 items-center gap-2 rounded-[7px] px-2 text-left outline-none [transition:background-color_150ms_var(--eased-ease-standard)] select-none hover-fine:bg-(--mac-hover) focus-visible:bg-(--mac-press) active:bg-(--mac-press) disabled:opacity-40 ${
        icon ? "grid-cols-[16px_1fr_auto]" : "grid-cols-[1fr_auto]"
      } ${className}`}
    >
      {icon && <span className="flex size-4 items-center justify-center [&_svg]:size-4">{icon}</span>}
      <span className="truncate">{children}</span>
      {shortcut && <Shortcut keys={shortcut} />}
    </button>
  );
}

/** Modifiers right-aligned, then the key centred in its own cell, so keys line up in a column as in a macOS menu. */
function Shortcut({ keys }: { keys: string }) {
  const chars = Array.from(keys);
  return (
    <span className={`${macTextSecondary} flex justify-end`}>
      <span className="tracking-wide">{chars.slice(0, -1).join("")}</span>
      <span className="w-[1.2em] text-center">{chars[chars.length - 1]}</span>
    </span>
  );
}

/** A divider between groups, on the content lines. */
export function MacMenuSeparator({ className = "" }: { className?: string }) {
  return <div role="separator" className={`my-[5px] h-px shrink-0 bg-(--mac-separator) ${className}`} />;
}
