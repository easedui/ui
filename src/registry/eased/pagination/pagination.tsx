"use client";

import { AnimatePresence, motion } from "motion/react";
import {
  useEffect,
  useRef,
  useState,
  type ComponentProps,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
} from "react";
import { Indicator, IndicatorGroup } from "../_primitives/indicator/indicator";
import { NumberRoll } from "../_primitives/number-roll/number-roll";
import { exitFast, instant, swap, useSafeReducedMotion } from "../lib/motion";
import { pressIcon } from "../lib/press";

export type PaginationProps = Omit<ComponentProps<"nav">, "children" | "onChange"> & {
  /** How many pages there are. */
  count: number;
  /** The current page, from 1 (controlled). */
  page?: number;
  /** The starting page (uncontrolled). Default 1. */
  defaultPage?: number;
  onPageChange?: (page: number) => void;
  /**
   * `default`: numbered pages with ellipses. `compact`: previous, "Page 3 of 12" and next, for
   * cards, tables and narrow screens. Default "default".
   */
  variant?: "default" | "compact";
  /** `sm` is 32px (tables, cards); `md` is 36px (pages). Default "md". */
  size?: "sm" | "md";
  /** Pages shown either side of the current one. Default 1. */
  siblings?: number;
  /** Pages always shown at each end. Default 1. */
  boundaries?: number;
  /**
   * Render real links: `getHref={(p) => "?page=" + p}`. Each link still calls `onPageChange`, so
   * a client router can take over. Leave it out for buttons.
   */
  getHref?: (page: number) => string;
  /** The page buttons' accessible names. Default `Page 3`. */
  getPageLabel?: (page: number) => string;
  disabled?: boolean;
  /** The landmark's name. Default "Pagination". */
  "aria-label"?: string;
  className?: string;
};

type Slot = number | "ellipsis";

/**
 * The visible slots. Once the pages outnumber them, the slot count is fixed (boundaries, an
 * ellipsis or a page, the siblings and current, an ellipsis or a page, boundaries), so the
 * control never changes width while you page through it.
 */
export function paginationSlots(page: number, count: number, siblings = 1, boundaries = 1): Slot[] {
  const range = (from: number, to: number) => Array.from({ length: Math.max(0, to - from + 1) }, (_, i) => from + i);
  if (count <= boundaries * 2 + siblings * 2 + 3) return range(1, count);
  const start = range(1, boundaries);
  const end = range(count - boundaries + 1, count);
  const from = Math.max(Math.min(page - siblings, count - boundaries - siblings * 2 - 1), boundaries + 2);
  const to = Math.min(Math.max(page + siblings, boundaries + siblings * 2 + 2), count - boundaries - 1);
  return [
    ...start,
    from > boundaries + 2 ? "ellipsis" : boundaries + 1,
    ...range(from, to),
    to < count - boundaries - 1 ? "ellipsis" : count - boundaries,
    ...end,
  ];
}

const SIZES = {
  sm: { item: "h-control-sm min-w-control-sm rounded-control-sm px-1.5 text-ui-sm", icon: "size-control-sm rounded-control-sm", gap: "gap-1" },
  md: { item: "h-control-md min-w-control-md rounded-control px-2 text-ui", icon: "size-control-md rounded-control", gap: "gap-1" },
} as const;

const COLOUR_ONLY =
  "[transition:color_150ms_var(--eased-ease-standard),background-color_150ms_var(--eased-ease-standard),box-shadow_var(--eased-duration-focus)_var(--eased-ease-standard)] focus-ring";

const Chevron = ({ dir }: { dir: -1 | 1 }) => (
  <svg viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    {/* Shifted 1px toward its direction (R57). */}
    <path d={dir < 0 ? "M9.5 4 5.5 8l4 4" : "M6.5 4l4 4-4 4"} />
  </svg>
);

type PageControlProps = {
  href?: string;
  label: string;
  current: boolean;
  inert: boolean;
  number: boolean;
  className: string;
  onSelect: () => void;
  children: ReactNode;
};

/** One button or link in the row. Numbers press by colour only: the chip measures them, so they never scale (R88). */
function PageControl({ href, label, current, inert, number, className, onSelect, children }: PageControlProps) {
  const props = {
    "data-pagination-item": "",
    "aria-label": label,
    "aria-current": current ? ("page" as const) : undefined,
    "aria-disabled": inert || undefined,
    onClick: (e: MouseEvent) => {
      if (inert) return e.preventDefault();
      onSelect();
    },
    className: `relative inline-flex shrink-0 items-center justify-center font-medium tabular-nums whitespace-nowrap select-none ${number ? COLOUR_ONLY : pressIcon} ${
      inert
        ? "cursor-not-allowed text-text-disabled active:scale-none"
        : current
          ? "cursor-default text-text"
          : "cursor-pointer text-text-muted hover-fine:bg-surface-hover hover-fine:text-text active:bg-surface-active"
    } ${className}`,
  };
  return href ? (
    <a href={href} {...props}>
      {children}
    </a>
  ) : (
    <button type="button" {...props}>
      {children}
    </button>
  );
}

/**
 * Pages with a selected chip that glides between them on the snappy spring. Past seven pages
 * the middle collapses behind ellipses into a fixed number of slots, so the control keeps its
 * width; when the window shifts, the numbers in a slot slide over in the direction of travel
 * while the chip stays put. Previous and next stay focusable at the ends (`aria-disabled`), so
 * focus is never dropped.
 */
export function Pagination({
  count,
  page: controlled,
  defaultPage = 1,
  onPageChange,
  variant = "default",
  size = "md",
  siblings = 1,
  boundaries = 1,
  getHref,
  getPageLabel = (p) => `Page ${p}`,
  disabled = false,
  "aria-label": ariaLabel = "Pagination",
  className = "",
  ...rest
}: PaginationProps) {
  const total = Math.max(1, Math.floor(count));
  const [own, setOwn] = useState(defaultPage);
  const page = Math.min(Math.max(1, controlled ?? own), total);
  const reduced = useSafeReducedMotion();
  const s = SIZES[size];

  // Which way the numbers travel when a slot's page changes.
  const [prev, setPrev] = useState(page);
  const [dir, setDir] = useState<1 | -1>(1);
  if (prev !== page) {
    setDir(page > prev ? 1 : -1);
    setPrev(page);
  }

  // A clicked number can move to another slot; send focus after it so it never lands on a
  // slot that now reads a different page.
  const listRef = useRef<HTMLUListElement>(null);
  const [follow, setFollow] = useState(0);
  useEffect(() => {
    if (follow) listRef.current?.querySelector<HTMLElement>('[aria-current="page"]')?.focus();
  }, [follow]);

  const go = (next: number, fromNumber = false) => {
    if (disabled) return;
    const target = Math.min(Math.max(1, next), total);
    if (target === page) return;
    if (fromNumber) setFollow((f) => f + 1);
    if (controlled === undefined) setOwn(target);
    onPageChange?.(target);
  };

  // Left and right move focus along the row; Tab still visits every control.
  const onKeyDown = (e: KeyboardEvent<HTMLUListElement>) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    const items = [...(listRef.current?.querySelectorAll<HTMLElement>("[data-pagination-item]") ?? [])];
    const i = items.indexOf(document.activeElement as HTMLElement);
    if (i < 0) return;
    e.preventDefault();
    items[Math.min(Math.max(0, i + (e.key === "ArrowRight" ? 1 : -1)), items.length - 1)]?.focus();
  };

  const control = (o: { target: number; label: string; current?: boolean; off?: boolean; number?: boolean; className: string; children: ReactNode }) => {
    const inert = disabled || !!o.off;
    return (
      <PageControl
        href={getHref && !inert ? getHref(o.target) : undefined}
        label={o.label}
        current={!!o.current}
        inert={inert}
        number={!!o.number}
        className={o.className}
        onSelect={() => go(o.target, !!o.number)}
      >
        {o.children}
      </PageControl>
    );
  };

  const prevButton = control({
    target: page - 1,
    label: "Previous page",
    off: page <= 1,
    className: s.icon,
    children: <Chevron dir={-1} />,
  });
  const nextButton = control({
    target: page + 1,
    label: "Next page",
    off: page >= total,
    className: s.icon,
    children: <Chevron dir={1} />,
  });

  if (variant === "compact") {
    return (
      <nav aria-label={ariaLabel} {...rest} className={`inline-flex ${className}`}>
        <ul ref={listRef} onKeyDown={onKeyDown} className={`flex flex-1 items-center justify-between ${s.gap}`}>
          <li className="flex">{prevButton}</li>
          <li className={`px-2 whitespace-nowrap tabular-nums text-text-muted ${size === "sm" ? "text-ui-sm" : "text-ui"}`}>
            {/* Read once, on change, from a region that stays mounted. */}
            <span aria-live="polite" aria-atomic className="sr-only">{`Page ${page} of ${total}`}</span>
            <span aria-hidden className="inline-flex items-baseline gap-1">
              Page
              <span className="font-medium text-text">
                <NumberRoll value={page} animated={!reduced} aria-hidden />
              </span>
              of <span className="font-medium text-text">{total}</span>
            </span>
          </li>
          <li className="flex">{nextButton}</li>
        </ul>
      </nav>
    );
  }

  const slots = paginationSlots(page, total, siblings, boundaries);
  const enterX = reduced ? 0 : dir * 8;

  return (
    <nav aria-label={ariaLabel} {...rest} className={`inline-flex max-w-full ${className}`}>
      <IndicatorGroup>
        <ul ref={listRef} onKeyDown={onKeyDown} className={`flex items-center ${s.gap}`}>
          <li className="flex">{prevButton}</li>
          {slots.map((slot, i) => (
            <li key={i} className="flex">
              {slot === "ellipsis" ? (
                <span aria-hidden className={`inline-flex items-center justify-center text-text-muted select-none ${s.item}`}>
                  …
                </span>
              ) : (
                control({
                  target: slot,
                  label: getPageLabel(slot),
                  current: slot === page,
                  number: true,
                  className: s.item,
                  children: (
                    <>
                      {slot === page && <Indicator className="inset-0 rounded-[inherit] bg-surface-active" />}
                      {/* The slot's number slides over when the window shifts beneath the chip. */}
                      <span className="relative grid overflow-hidden">
                        <AnimatePresence initial={false} mode="popLayout">
                          <motion.span
                            key={slot}
                            className="col-start-1 row-start-1"
                            initial={reduced ? { opacity: 0 } : { opacity: 0, x: enterX, filter: "blur(2px)" }}
                            animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                            exit={reduced ? { opacity: 0, transition: instant } : { opacity: 0, x: -enterX * 0.75, filter: "blur(2px)", transition: exitFast }}
                            transition={reduced ? instant : swap}
                          >
                            {slot}
                          </motion.span>
                        </AnimatePresence>
                      </span>
                    </>
                  ),
                })
              )}
            </li>
          ))}
          <li className="flex">{nextButton}</li>
        </ul>
      </IndicatorGroup>
    </nav>
  );
}
