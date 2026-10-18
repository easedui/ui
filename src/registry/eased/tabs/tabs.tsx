"use client";

import { Tabs as BaseTabs } from "@base-ui/react/tabs";
import { motion } from "motion/react";
import { cloneElement, createContext, use, useRef, type ComponentProps, type ReactElement, type ReactNode } from "react";
import { useScrollFades } from "../lib/dom";
import { AutoHeight } from "../_primitives/auto-height/auto-height";
import { Indicator, IndicatorGroup } from "../_primitives/indicator/indicator";

type Variant = "underline" | "pill";
type Orientation = "horizontal" | "vertical";

const TabsContext = createContext<{ variant: Variant; orientation: Orientation }>({
  variant: "underline",
  orientation: "horizontal",
});

export type TabsProps = Omit<ComponentProps<typeof BaseTabs.Root>, "className" | "orientation"> & {
  /**
   * `underline`: a 2px bar under the active tab, for page and card sections (default).
   * `pill`: a filled highlight behind the active tab, for dense toolbars and filters.
   */
  variant?: Variant;
  orientation?: Orientation;
  className?: string;
};

/**
 * Tabs with a gliding indicator and panels that cross-fade in the direction of travel.
 * Base UI's Tabs supplies the behaviour: roving focus, arrow keys, Home/End, ARIA wiring.
 * Controlled (`value` + `onValueChange`) or uncontrolled (`defaultValue`).
 */
export function Tabs({ variant = "underline", orientation = "horizontal", className = "", ...props }: TabsProps) {
  return (
    <TabsContext value={{ variant, orientation }}>
      <BaseTabs.Root
        orientation={orientation}
        className={`min-w-0 ${orientation === "vertical" ? "flex gap-6" : ""} ${className}`}
        {...props}
      />
    </TabsContext>
  );
}

export type TabsListProps = Omit<ComponentProps<typeof BaseTabs.List>, "className" | "render"> & {
  className?: string;
};

/**
 * The row of tabs. It scrolls sideways (with edge fades) when the tabs outgrow it, so it
 * never forces the page wider at 360px. Arrow keys move focus; Enter or Space activates,
 * unless you pass `activateOnFocus`.
 */
export function TabsList({ className = "", children, ...props }: TabsListProps) {
  const { variant, orientation } = use(TabsContext);
  const ref = useRef<HTMLDivElement>(null);
  useScrollFades(ref, "x");
  const vertical = orientation === "vertical";
  const underline = variant === "underline";
  // The rule lives on a wrapper, outside the scroller, so it never scrolls or clips; the
  // list's -m-1 p-1 gives focus rings room inside the scroll container's clip.
  return (
    <div
      className={`relative isolate min-w-0 shrink-0 ${
        underline
          ? `after:absolute after:-z-10 after:bg-line-subtle ${vertical ? "after:inset-y-0 after:left-0 after:w-px" : "after:inset-x-0 after:bottom-0 after:h-px"}`
          : ""
      } ${className}`}
    >
      <BaseTabs.List
        ref={ref}
        render={<motion.div layoutScroll />}
        className={`relative -m-1 flex p-1 ${
          vertical
            ? `flex-col ${underline ? "" : "gap-0.5"}`
            : `fade-x overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${underline ? "gap-5" : "gap-0.5"}`
        }`}
        {...props}
      >
        <IndicatorGroup>{children}</IndicatorGroup>
      </BaseTabs.List>
    </div>
  );
}

export type TabProps = Omit<ComponentProps<typeof BaseTabs.Tab>, "className" | "render" | "children"> & {
  children: ReactNode;
  /**
   * Render the tab as another element, e.g. a Next `<Link href="/settings/domains" />` for routed
   * tabs. The indicator, icon and label go inside it. Non-button elements set `nativeButton` false
   * for you.
   */
  render?: ReactElement;
  /** A 16px icon before the label. */
  icon?: ReactNode;
  className?: string;
};

const TAB = {
  underline: {
    horizontal: "h-control-lg px-0",
    vertical: "h-control-md pl-4 pr-2 justify-start",
    indicator: {
      horizontal: "inset-x-0 bottom-0 h-0.5 rounded-pill bg-text",
      vertical: "inset-y-1.5 left-0 w-0.5 rounded-pill bg-text",
    },
  },
  pill: {
    horizontal: "h-control-sm rounded-control-sm px-3",
    vertical: "h-control-sm rounded-control-sm px-3 justify-start",
    indicator: {
      horizontal: "inset-0 rounded-[inherit] bg-surface-active",
      vertical: "inset-0 rounded-[inherit] bg-surface-active",
    },
  },
} as const;

/** One tab. Its label never changes weight; the active one darkens and stops looking clickable. */
export function Tab({ children, icon, render, nativeButton, className = "", ...props }: TabProps) {
  const { variant, orientation } = use(TabsContext);
  const t = TAB[variant];
  return (
    <BaseTabs.Tab
      {...props}
      nativeButton={nativeButton ?? (render === undefined || render.type === "button")}
      render={(htmlProps, state) => {
        const content = (
          <>
            {state.active && <Indicator className={t.indicator[orientation]} />}
            {icon && <span className="relative flex size-4 shrink-0 items-center justify-center [&_svg]:size-4">{icon}</span>}
            <span className="relative">{children}</span>
          </>
        );
        return render ? (
          cloneElement(render, htmlProps, content)
        ) : (
          <button type="button" {...htmlProps}>
            {content}
          </button>
        );
      }}
      className={(state) =>
        `relative flex shrink-0 items-center justify-center gap-2 text-ui font-medium whitespace-nowrap select-none transition-[color,background-color,border-color,box-shadow] duration-150 ease-standard focus-ring ${
          t[orientation]
        } ${
          state.disabled
            ? "cursor-not-allowed text-text-disabled"
            : state.active
              ? "cursor-default text-text"
              : `cursor-pointer text-text-muted hover-fine:text-text-secondary ${variant === "pill" ? "hover-fine:bg-surface-hover" : ""}`
        } ${className}`
      }
    />
  );
}

export type TabsPanelsProps = {
  children: ReactNode;
  /** Classes for the clipping root, e.g. a margin above the panels. */
  className?: string;
};

/**
 * Holds the panels. Its height springs between panels of different lengths while the old
 * and new panels cross-fade over each other in one grid cell.
 */
export function TabsPanels({ children, className = "" }: TabsPanelsProps) {
  const { orientation } = use(TabsContext);
  return (
    <AutoHeight fade={false} className={`min-w-0 ${orientation === "vertical" ? "flex-1" : ""} ${className}`} innerClassName="grid">
      {children}
    </AutoHeight>
  );
}

export type TabsPanelProps = Omit<ComponentProps<typeof BaseTabs.Panel>, "className"> & { className?: string };

/**
 * A panel. It enters from 6px on the side of the tab you came from and leaves 3px the other
 * way, faster than it arrived. Reduced motion: an opacity cross-fade only.
 */
export function TabsPanel({ className = "", ...props }: TabsPanelProps) {
  return (
    <BaseTabs.Panel
      className={`col-start-1 row-start-1 min-w-0 rounded-control-xs focus-ring [transition:opacity_var(--eased-duration-standard)_var(--eased-ease-enter),translate_var(--eased-duration-spring-snappy)_var(--eased-spring-snappy),box-shadow_var(--eased-duration-focus)_var(--eased-ease-standard)] data-ending-style:duration-(--eased-duration-fast) data-ending-style:ease-standard data-starting-style:opacity-0 data-ending-style:opacity-0 data-starting-style:data-[activation-direction=left]:-translate-x-1.5 data-starting-style:data-[activation-direction=right]:translate-x-1.5 data-ending-style:data-[activation-direction=left]:translate-x-0.75 data-ending-style:data-[activation-direction=right]:-translate-x-0.75 data-starting-style:data-[activation-direction=up]:-translate-y-1.5 data-starting-style:data-[activation-direction=down]:translate-y-1.5 data-ending-style:data-[activation-direction=up]:translate-y-0.75 data-ending-style:data-[activation-direction=down]:-translate-y-0.75 reduced:translate-none! reduced:duration-(--eased-duration-instant)! ${className}`}
      {...props}
    />
  );
}
