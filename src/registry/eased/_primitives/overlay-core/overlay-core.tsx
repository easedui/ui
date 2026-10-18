"use client";

import type { CSSProperties, HTMLAttributes, ReactElement, ReactNode, Ref } from "react";
import { duration } from "../../lib/motion";
import { FLOATING_ROLES, floatingSurface, type FloatingMotion, type FloatingSide } from "../floating/floating";
import { Indicator, IndicatorGroup } from "../indicator/indicator";

/**
 * Overlay core: what every Eased overlay shares, so a row in a menu, a Select, a Combobox and
 * the Command palette is one row, and a Dialog, a Sheet and the palette sit on one backdrop.
 *
 *   Surfaces   panelSurface, menuSurface, modalSurface, backdropClass, modalViewportClass
 *   Rows       itemClass, withHighlight, ItemHighlight, HighlightGroup, ItemParts, ItemCheck,
 *              ItemChevron, Shortcut, separatorClass, groupClass, groupLabelClass, flashThenClose
 *   Motion     OVERLAY_ROLES (anchored), MODAL, SHEET, TOAST, modalMotion(), bump()
 *
 * Base UI owns behaviour; `_primitives/floating` owns how anchored popups appear. See README.md.
 */

const ms = (s: number) => Math.round(s * 1000);

/* ---------------------------------------------------------------- Motion ---------- */

export type OverlayRole = FloatingMotion & { side: FloatingSide; sideOffset: number };

/**
 * One motion table for every anchored layer. Spread an entry into `FloatingLayer`'s `motion`
 * and pass its `side` / `sideOffset`. Values are the floating layer's, tuned per job:
 * menus are a touch quicker than popovers, context menus open with no animation (rule 84).
 */
export const OVERLAY_ROLES = {
  tooltip: FLOATING_ROLES.tooltip,
  popover: FLOATING_ROLES.popover,
  card: FLOATING_ROLES.card,
  menu: { side: "bottom", sideOffset: 4, distance: 4, scale: 0.97, fade: ms(duration.fast), exit: ms(duration.instant), honourInstant: false },
  /** Opens beside its row, overlapping the parent by the menu's 4px padding so rows line up. */
  submenu: { side: "inline-end", sideOffset: 0, distance: 4, scale: 0.97, fade: ms(duration.fast), exit: ms(duration.instant), honourInstant: false },
  listbox: { side: "bottom", sideOffset: 4, distance: 4, scale: 0.97, fade: ms(duration.fast), exit: ms(duration.instant), honourInstant: false },
  /** No enter (rule 84: a right-click is high-frequency); a 100ms fade on the way out. */
  context: { side: "bottom", sideOffset: 0, distance: 0, scale: 1, fade: 0, exit: ms(duration.instant), honourInstant: false },
} as const satisfies Record<string, OverlayRole>;

/** Dialogs: rise 8px at 0.96 on the smooth spring; exit 4px at 0.98 in 160ms; parents step back per nested level. */
export const MODAL = { y: 8, scale: 0.96, fade: ms(duration.standard), exit: 160, nestedY: 16, nestedScale: 0.05, bump: 0.015 } as const;

/** Sheets: the sheet duration on the enter curve; a swipe release scales its exit by the swipe's strength. */
export const SHEET = { duration: ms(duration.sheet), exit: 375, indentScale: 0.97, indentY: 8 } as const;

/** Toasts: rise 12px at 0.97; stacked toasts peek 10px and shrink 5% each; 8px apart when expanded. */
export const TOAST = { y: 12, scale: 0.97, fade: ms(duration.standard), exit: ms(duration.fast), peek: 10, shrink: 0.05, gap: 8 } as const;

/*
 * The modal classes read short working variables (`--em-*`) so `data-instant` and the reduced
 * variant can override them; an inline style would beat a class.
 */
const MODAL_MOTION = [
  // Literal classes (Tailwind reads source text); they match MODAL above.
  "[--em-y:8px] [--em-s:0.96] [--em-in:var(--eased-duration-spring-smooth)] [--em-fade:200ms] [--em-out:160ms]",
  "[transition-property:opacity,translate,scale] [transition-duration:var(--em-fade),var(--em-in),var(--em-in)] [transition-timing-function:var(--eased-ease-enter),var(--eased-spring-smooth),var(--eased-spring-smooth)]",
  "data-starting-style:opacity-0 data-starting-style:[translate:0_var(--em-y)] data-starting-style:[scale:var(--em-s)]",
  "data-ending-style:opacity-0 data-ending-style:[translate:0_calc(var(--em-y)*0.5)] data-ending-style:[scale:calc(0.5_+_var(--em-s)*0.5)] data-ending-style:[transition-duration:var(--em-out)] data-ending-style:[transition-timing-function:var(--eased-ease-standard)]",
  // A parent under a nested dialog steps back: up 16px and 5% smaller per level, dimmed by a scrim layer.
  "data-nested-dialog-open:[translate:0_calc(var(--nested-dialogs)*-16px)] data-nested-dialog-open:[scale:calc(1_-_var(--nested-dialogs)*0.05)]",
  "after:pointer-events-none after:absolute after:inset-0 after:rounded-[inherit] after:bg-scrim after:opacity-0 after:[transition:opacity_var(--eased-duration-standard)_var(--eased-ease-standard)] data-nested-dialog-open:after:opacity-50",
  // Opened from a shortcut: no enter animation (rule 84). The exit still plays.
  "data-instant:[--em-in:0ms] data-instant:[--em-fade:0ms]",
  "reduced:[--em-y:0px] reduced:[--em-s:1] reduced:[--em-in:0ms] reduced:[--em-fade:var(--eased-duration-instant)] reduced:[--em-out:var(--eased-duration-instant)] reduced:data-nested-dialog-open:[translate:0] reduced:data-nested-dialog-open:[scale:1]",
].join(" ");

/** Transition classes for a modal popup (Dialog, AlertDialog, the palette). Needs `position: relative` or fixed. */
export function modalMotion() {
  return MODAL_MOTION;
}

/**
 * The alert dialog's "no": a 1.5% scale bump when someone clicks outside a dialog that won't
 * close that way. Runs on `transform`, so it composes with the `scale` transition. Reduced
 * motion skips it.
 */
export function bump(el: HTMLElement | null) {
  if (!el || typeof el.animate !== "function") return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  el.animate([{ transform: "scale(1)" }, { transform: `scale(${1 + MODAL.bump})` }, { transform: "scale(1)" }], {
    duration: 260,
    easing: "cubic-bezier(0.22, 1, 0.36, 1)",
  });
}

/* -------------------------------------------------------------- Surfaces ---------- */

/** The anchored panel: raised surface, `border-line`, `shadow-floating`, 16px corners. Add padding and `--pad`. */
export const panelSurface = `${floatingSurface} rounded-panel [--radius-outer:var(--eased-radius-panel)]`;

/**
 * A menu or listbox popup. 4px padding (rows get an 11px concentric radius) and a three-track
 * grid, icon · label · trailing, that every row subgrids into, so labels share one x and
 * shortcuts, checks and chevrons share one column whether or not a row has them (R101–R103).
 */
export const menuSurface = `${panelSurface} grid grid-cols-[auto_minmax(0,1fr)_auto] content-start min-w-48 max-w-(--available-width) max-h-(--available-height) overflow-y-auto overscroll-contain p-1 scroll-py-1 [--pad:4px]`;

/** Dialogs and the palette: raised, `border-line`, `shadow-overlay`, 24px corners, 24px padding var. */
export const modalSurface =
  "relative flex flex-col border border-line bg-surface-raised text-ui text-text shadow-overlay outline-none rounded-surface [--radius-outer:var(--eased-radius-surface)] [--pad:24px] max-sm:[--pad:20px]";

/** The scrim under modals (R34): `bg-scrim`, a 7px backdrop blur, fading in 200ms and out 150ms. */
export const backdropClass =
  "fixed inset-0 z-50 min-h-dvh bg-scrim backdrop-blur-[7px] [transition:opacity_var(--eased-duration-standard)_var(--eased-ease-enter)] data-starting-style:opacity-0 data-ending-style:opacity-0 data-ending-style:[transition-duration:var(--eased-duration-fast)] data-ending-style:[transition-timing-function:var(--eased-ease-standard)] reduced:[transition-duration:var(--eased-duration-instant)] supports-[-webkit-touch-callout:none]:absolute";

/** A fixed viewport that centres its popup with a 16px gutter and scrolls when the popup is taller than the screen. */
export const modalViewportClass = "fixed inset-0 z-50 flex overflow-y-auto overscroll-contain p-4 [&>*]:m-auto";

/** A full-bleed rule between groups inside `menuSurface`. */
export const separatorClass = "col-span-full -mx-(--pad) my-1 h-px bg-line-subtle";

/** A group of rows (`Menu.Group`, `Menu.RadioGroup`, `Select.Group`) that stays on the menu's tracks. */
export const groupClass = "col-span-full grid grid-cols-subgrid";

/** A group label on the rows' leading edge, where icons and checks start. */
export const groupLabelClass = "col-span-full flex h-7 items-center px-2 text-ui-xs text-text-muted select-none";

/* ------------------------------------------------------------------ Rows ---------- */

export type ItemClassOptions = {
  /** `"danger"`: red label and icon, a red-tinted highlight. For destructive rows. */
  tone?: "default" | "danger";
  /**
   * True when the row renders `withHighlight`, so the gliding fill replaces the static one.
   * Default false: the row fills in place on `data-highlighted` (lists that filter or scroll).
   */
  glide?: boolean;
};

const ROW =
  "relative isolate col-span-full grid grid-cols-subgrid items-center min-h-8 pointer-coarse:min-h-10 px-2 py-1.5 radius-nested text-ui-sm text-text outline-none select-none cursor-default scroll-my-1 [transition:color_var(--eased-duration-fast)_var(--eased-ease-standard)] data-disabled:text-text-disabled data-disabled:cursor-not-allowed data-popup-open:bg-surface-hover";

/** Classes for any Base UI row: Menu, Select, Combobox and Autocomplete items, checkbox and radio items, submenu triggers. */
export function itemClass({ tone = "default", glide = false }: ItemClassOptions = {}) {
  const fill = glide ? "" : tone === "danger" ? "data-highlighted:bg-danger-subtle" : "data-highlighted:bg-surface-hover";
  return `${ROW} ${tone === "danger" ? "text-danger-text" : ""} ${fill}`;
}

/** Scopes one popup's gliding highlight. Wrap each popup's rows; a submenu gets its own group. */
export function HighlightGroup({ children }: { children: ReactNode }) {
  return <IndicatorGroup>{children}</IndicatorGroup>;
}

/** The fill that glides between rows on the snappy spring (an Eased `Indicator`). Render it inside the highlighted row. */
export function ItemHighlight({ tone = "default" }: { tone?: "default" | "danger" }) {
  return (
    <Indicator
      name="overlay-highlight"
      className={`inset-0 -z-1 radius-nested in-data-flash:opacity-0 ${tone === "danger" ? "bg-danger-subtle" : "bg-surface-hover"}`}
    />
  );
}

type RenderProps = HTMLAttributes<HTMLElement> & { ref?: Ref<HTMLElement> };

/**
 * A Base UI `render` function that adds the gliding highlight to a row while it is highlighted:
 * `<Menu.Item render={withHighlight} className={itemClass({ glide: true })}>`.
 * The row's `data-tone="danger"` (set by `itemClass` users) tints it.
 */
export function withHighlight(props: RenderProps, state: { highlighted: boolean }): ReactElement {
  const { children, ...rest } = props;
  const tone = (rest as Record<string, unknown>)["data-tone"] === "danger" ? "danger" : "default";
  return (
    <div {...(rest as HTMLAttributes<HTMLDivElement>)} ref={props.ref as Ref<HTMLDivElement>}>
      {state.highlighted && <ItemHighlight tone={tone} />}
      {children}
    </div>
  );
}

export type ItemPartsProps = {
  /** 16px icon in the leading track. Muted at rest, full colour while the row is highlighted. */
  icon?: ReactNode;
  /** The label. One line, truncates. */
  children: ReactNode;
  /** A second, muted line under the label. The icon stays centred on the first line (R107). */
  description?: ReactNode;
  /** Shortcut glyphs, e.g. `"⌘⇧D"`, in the trailing column. */
  shortcut?: string;
  /** Anything else for the trailing column: a chevron, a count, a badge. */
  trailing?: ReactNode;
};

/**
 * A row's content laid on the menu's three tracks. Use inside any row with `itemClass`.
 * Rows with no icon leave the icon track to the rows that have one, so every label starts on
 * one x; trailing content right-aligns in one column.
 */
export function ItemParts({ icon, children, description, shortcut, trailing }: ItemPartsProps) {
  // One line: centre on the row. Two lines: pin to the first line (R107).
  const anchor = description !== undefined ? "self-start" : "self-center";
  return (
    <>
      {icon !== undefined && (
        <span
          aria-hidden
          className={`col-start-1 me-2 flex h-[1lh] items-center ${anchor} text-text-muted in-data-highlighted:text-current in-data-disabled:text-text-disabled in-data-[tone=danger]:text-current [&_svg]:size-4 [&_svg]:shrink-0`}
        >
          {icon}
        </span>
      )}
      <span className="col-start-2 flex min-w-0 flex-col">
        <span className="truncate">{children}</span>
        {description !== undefined && <span className="truncate text-ui-xs text-text-muted">{description}</span>}
      </span>
      {(shortcut !== undefined || trailing !== undefined) && (
        <span className={`col-start-3 ms-6 flex h-[1lh] items-center justify-end gap-2 ${anchor}`}>
          {shortcut !== undefined && <Shortcut keys={shortcut} />}
          {trailing}
        </span>
      )}
    </>
  );
}

const SPOKEN: Record<string, string> = {
  "⌘": "Command",
  "⇧": "Shift",
  "⌥": "Option",
  "⌃": "Control",
  "⌫": "Delete",
  "⌦": "Forward Delete",
  "↵": "Return",
  "⏎": "Return",
  "⎋": "Escape",
  "⇥": "Tab",
  "↑": "Up",
  "↓": "Down",
  "←": "Left",
  "→": "Right",
};

/** Shortcut glyphs in the muted trailing style, read by name ("Command Shift D"). */
export function Shortcut({ keys, className = "" }: { keys: string; className?: string }) {
  const glyphs = [...keys];
  return (
    <span
      aria-label={glyphs.map((g) => SPOKEN[g] ?? g).join(" ")}
      className={`inline-flex items-center gap-px text-ui-xs text-text-muted tabular-nums in-data-disabled:text-text-disabled ${className}`}
    >
      {glyphs.map((g, i) => (
        <span key={i} aria-hidden className="min-w-[1ch] text-center">
          {g}
        </span>
      ))}
    </span>
  );
}

/**
 * A 16px check for checkbox, radio and selected rows. It reads the row's `data-checked` or
 * `data-selected`: the stroke draws in on the snappy spring when the row becomes checked and
 * clears in 100ms when it doesn't. Put it in `ItemParts`' `icon` so it holds the icon track.
 */
export function ItemCheck({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden className={`size-4 shrink-0 text-text ${className}`}>
      <path
        d="M3.5 8.5 6.5 11.5 12.5 4.5"
        pathLength={1}
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="[stroke-dasharray:1] [stroke-dashoffset:1] [transition:stroke-dashoffset_var(--eased-duration-instant)_var(--eased-ease-standard)] in-data-checked:[stroke-dashoffset:0] in-data-selected:[stroke-dashoffset:0] in-data-checked:[transition:stroke-dashoffset_var(--eased-duration-spring-snappy)_var(--eased-spring-snappy)] in-data-selected:[transition:stroke-dashoffset_var(--eased-duration-spring-snappy)_var(--eased-spring-snappy)] reduced:[transition:none]!"
      />
    </svg>
  );
}

/** The submenu chevron, nudged 1px toward its direction (R57). Mirrors in RTL. */
export function ItemChevron() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden className="size-4 shrink-0 text-text-muted rtl:-scale-x-100 in-data-highlighted:text-current">
      <path d="m6.5 4 4 4-4 4" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * macOS's selection blink: the row's highlight goes out for 40ms and back for 40ms, then
 * `close` runs. With reduced motion, `close` runs at once. Returns a cancel function.
 */
export function flashThenClose(row: HTMLElement | null, close: () => void, reduced: boolean) {
  if (!row || reduced) {
    close();
    return () => {};
  }
  row.setAttribute("data-flash", "");
  const a = window.setTimeout(() => row.removeAttribute("data-flash"), 40);
  const b = window.setTimeout(close, 80);
  return () => {
    window.clearTimeout(a);
    window.clearTimeout(b);
    row.removeAttribute("data-flash");
  };
}

/** Inline custom properties for a layer that wants the role values as CSS variables. */
export function overlayVars(role: OverlayRole): CSSProperties {
  return {
    "--eased-float-distance": `${role.distance}px`,
    "--eased-float-scale": role.scale,
    "--eased-float-fade": `${role.fade}ms`,
    "--eased-float-exit": `${role.exit}ms`,
  } as CSSProperties;
}
