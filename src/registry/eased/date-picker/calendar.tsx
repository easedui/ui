"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useId, useMemo, useRef, useState, useSyncExternalStore, type KeyboardEvent } from "react";
import {
  addMonths,
  isSameDay,
  localeWeekStart,
  monthGrid,
  nextFocusDate,
  startOfDay,
  startOfMonth,
  toDayKey,
  useRangeSelection,
  type CalendarDay,
  type DateRange,
  type WeekStart,
} from "../_primitives/calendar-core/calendar-core";
import { TextSwap } from "../_primitives/text-swap/text-swap";
import { enter, exitFast, reducedFade, smooth, snappy, useSafeReducedMotion } from "../lib/motion";
import { pressIcon } from "../lib/press";

export type { DateRange };

export type CalendarBaseProps = {
  /** Locale for the month title, weekday names and day labels. Default: the runtime's. */
  locale?: string;
  /** 0 Sunday … 6 Saturday. Default: the locale's first day of the week. */
  weekStartsOn?: WeekStart;
  /** Earliest selectable day. */
  min?: Date;
  /** Latest selectable day. */
  max?: Date;
  /** Days that can't be picked: weekends, booked nights, holidays. A range never spans one. */
  isDateDisabled?: (date: Date) => boolean;
  /** "Today", for the today mark. Pass a fixed date for deterministic demos. Default: now. */
  today?: Date;
  /** The month shown first. Default: the selected day's month, else today's. */
  defaultMonth?: Date;
  /** Fires when the shown month changes (the first of that month). */
  onMonthChange?: (month: Date) => void;
  /** Focus the active day on mount (a popover opening). Default false. */
  autoFocus?: boolean;
  /** Called after a pick that finishes a selection: one day, or a range's second end. */
  onSelectComplete?: () => void;
  className?: string;
};

export type CalendarSingleProps = CalendarBaseProps & {
  mode?: "single";
  value?: Date | null;
  defaultValue?: Date | null;
  onValueChange?: (date: Date | null) => void;
};

export type CalendarRangeProps = CalendarBaseProps & {
  mode: "range";
  value?: DateRange | null;
  defaultValue?: DateRange | null;
  onValueChange?: (range: DateRange | null) => void;
  /** Fewest days in a range. Default 1. */
  minLength?: number;
  /** Most days in a range. */
  maxLength?: number;
};

export type CalendarProps = CalendarSingleProps | CalendarRangeProps;

const SERVER_DAY = new Date(2000, 0, 1);

let todayCache: Date | null = null;
const readToday = () => {
  const d = startOfDay(Date.now());
  if (!todayCache || +todayCache !== +d) todayCache = d;
  return todayCache;
};
const noSubscribe = () => () => {};

/** Local midnight today, read on the client only (null on the server and during hydration). */
export function useToday(): Date | null {
  return useSyncExternalStore(noSubscribe, readToday, () => null);
}

const CELL = "h-9"; // 36px rows: 7 × 36 = 252px wide, so the popover fits a 320px screen.
const monthKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}`;

/**
 * A month grid on calendar-core: one day or a range, arrow keys, Home/End and PageUp/PageDown
 * (Shift for years). Paging slides the days the way you moved while the title swaps; the
 * selected day's fill glides between days on the snappy spring, and a range's ends pop in.
 */
export function Calendar(props: CalendarProps) {
  const {
    locale,
    weekStartsOn: weekStartsOnProp,
    min,
    max,
    isDateDisabled,
    today: todayProp,
    defaultMonth,
    onMonthChange,
    autoFocus = false,
    onSelectComplete,
    className = "",
  } = props;
  const range = props.mode === "range";
  const reduced = useSafeReducedMotion();
  const uid = useId();

  const now = useToday();
  // Before hydration there is no clock to read; a fixed day keeps the server render stable.
  const today = todayProp ?? now ?? SERVER_DAY;
  const weekStartsOn = weekStartsOnProp ?? localeWeekStart(locale);

  const isDisabled = (d: Date) => (min !== undefined && d < startOfDay(min)) || (max !== undefined && d > startOfDay(max)) || !!isDateDisabled?.(d);

  // Single selection.
  const [singleOwn, setSingleOwn] = useState<Date | null>(!range ? (props.defaultValue ?? null) : null);
  const single = !range ? (props.value !== undefined ? props.value : singleOwn) : null;
  const pickSingle = (d: Date) => {
    if (range) return;
    if (props.value === undefined) setSingleOwn(d);
    props.onValueChange?.(d);
    onSelectComplete?.();
  };

  // Range selection: calendar-core owns click-click, drag, preview and the constraints.
  const sel = useRangeSelection({
    value: range ? props.value : undefined,
    defaultValue: range ? props.defaultValue : null,
    onChange: (r) => {
      if (!range) return;
      props.onValueChange?.(r);
      if (r) onSelectComplete?.();
    },
    isDisabled,
    minLength: range ? props.minLength : undefined,
    maxLength: range ? props.maxLength : undefined,
  });

  const anchorDate = range ? (sel.value?.start ?? null) : single;
  const [month, setMonthState] = useState(() => startOfMonth(defaultMonth ?? anchorDate ?? today));
  const [dir, setDir] = useState<1 | -1>(1);
  const [focusKey, setFocusKey] = useState(() => toDayKey(anchorDate ?? today));
  const pendingFocus = useRef(autoFocus);
  const gridRef = useRef<HTMLDivElement>(null);

  const grid = useMemo(() => monthGrid(month, { weekStartsOn, today, locale }), [month, weekStartsOn, today, locale]);
  const dayLabel = useMemo(() => new Intl.DateTimeFormat(locale, { weekday: "long", day: "numeric", month: "long", year: "numeric" }), [locale]);

  const goTo = (next: Date) => {
    const m = startOfMonth(next);
    if (+m === +month) return;
    setDir(+m > +month ? 1 : -1);
    setMonthState(m);
    onMonthChange?.(m);
  };

  const prevDisabled = min !== undefined && +addMonths(month, -1) < +startOfMonth(min);
  const nextDisabled = max !== undefined && +addMonths(month, 1) > +startOfMonth(max);

  // The roving tab stop stays on a day of the shown month.
  const focusInMonth = grid.days.some((d) => d.inMonth && d.key === focusKey);
  const tabKey = focusInMonth ? focusKey : (grid.days.find((d) => d.inMonth && !isDisabled(d.date))?.key ?? grid.days.find((d) => d.inMonth)!.key);

  useEffect(() => {
    if (!pendingFocus.current) return;
    pendingFocus.current = false;
    gridRef.current?.querySelector<HTMLElement>(`[data-month="${monthKey(month)}"] [data-date="${tabKey}"][data-in-month]`)?.focus({ preventScroll: true });
  }, [month, tabKey]);

  const moveFocus = (date: Date) => {
    pendingFocus.current = true;
    setFocusKey(toDayKey(date));
    goTo(date);
    if (range) sel.hover(date);
  };

  const onCellKey = (e: KeyboardEvent<HTMLElement>, day: CalendarDay, rangeKey?: (e: KeyboardEvent<HTMLElement>) => void) => {
    const next = nextFocusDate(day.date, e.key, { weekStartsOn, shift: e.shiftKey });
    if (next) {
      e.preventDefault();
      if (min && next < startOfDay(min)) return moveFocus(startOfDay(min));
      if (max && next > startOfDay(max)) return moveFocus(startOfDay(max));
      return moveFocus(next);
    }
    if (rangeKey) return rangeKey(e);
    if ((e.key === "Enter" || e.key === " ") && !isDisabled(day.date)) {
      e.preventDefault();
      pickSingle(day.date);
    }
  };

  const slide = reduced ? 0 : 28;

  return (
    <div className={`flex w-63 flex-col gap-2 select-none ${className}`}>
      <div className="flex h-8 items-center justify-between">
        <TextSwap direction={dir} className="text-ui font-medium text-text" aria-live="polite">
          {grid.title}
        </TextSwap>
        <div className="-me-2 flex items-center">
          <NavButton label="Previous month" disabled={prevDisabled} onClick={() => goTo(addMonths(month, -1))} dir="left" />
          <NavButton label="Next month" disabled={nextDisabled} onClick={() => goTo(addMonths(month, 1))} dir="right" />
        </div>
      </div>

      <div
        ref={gridRef}
        role="grid"
        aria-label={grid.title}
        aria-multiselectable={range || undefined}
        className="flex flex-col"
        onPointerLeave={range ? () => sel.hover(null) : undefined}
      >
        <div role="row" className="grid grid-cols-7 pb-1">
          {grid.weekdays.map((w) => (
            <span key={w.weekday} role="columnheader" aria-label={w.long} className="flex h-6 items-center justify-center text-ui-xs text-text-muted">
              {w.short}
            </span>
          ))}
        </div>

        <div className="relative overflow-hidden" style={{ height: `calc(6 * var(--spacing) * 9 + 5 * var(--spacing) * 0.5)` }}>
          <AnimatePresence initial={false} mode="popLayout" custom={dir}>
            <motion.div
              key={monthKey(month)}
              role="rowgroup"
              data-month={monthKey(month)}
              custom={dir}
              variants={{
                enter: (d: number) => ({ x: d * slide, opacity: 0 }),
                center: { x: 0, opacity: 1 },
                exit: (d: number) => ({ x: d * -slide * 0.5, opacity: 0, transition: reduced ? reducedFade : { x: smooth, opacity: exitFast } }),
              }}
              initial="enter"
              animate="center"
              exit="exit"
              transition={reduced ? reducedFade : { x: smooth, opacity: enter }}
              className={`flex w-full flex-col gap-0.5 ${range ? "touch-none" : ""}`}
            >
              {grid.weeks.map((week) => (
                <div key={week[0].key} role="row" className="grid grid-cols-7">
                  {week.map((day, col) => {
                    const disabled = isDisabled(day.date);
                    const label = dayLabel.format(day.date);
                    const common = {
                      role: "gridcell",
                      "aria-label": label,
                      "aria-current": day.isToday ? ("date" as const) : undefined,
                      "data-date": day.key,
                      "data-in-month": day.inMonth ? "" : undefined,
                      tabIndex: day.inMonth && day.key === tabKey ? 0 : -1,
                    };
                    if (range) {
                      const cell = sel.cellProps(day.date);
                      const s = sel.stateOf(day.date);
                      return (
                        <div
                          key={day.key}
                          {...common}
                          {...cell}
                          onFocus={() => {
                            setFocusKey(day.key);
                            cell.onFocus();
                          }}
                          onKeyDown={(e) => onCellKey(e, day, cell.onKeyDown)}
                          className={`group/day relative flex ${CELL} items-center justify-center outline-none ${disabled ? "cursor-not-allowed" : "cursor-pointer"}`}
                        >
                          <RangeBand position={s.position} col={col} preview={s.previewing && !s.selected} />
                          <DayFace
                            day={day}
                            disabled={disabled}
                            filled={s.position !== null && s.position !== "middle"}
                            preview={s.previewing}
                            reduced={reduced}
                            pop
                          />
                        </div>
                      );
                    }
                    const selected = !!single && isSameDay(single, day.date);
                    return (
                      <div
                        key={day.key}
                        {...common}
                        aria-selected={selected}
                        aria-disabled={disabled || undefined}
                        onClick={() => !disabled && pickSingle(day.date)}
                        onFocus={() => setFocusKey(day.key)}
                        onKeyDown={(e) => onCellKey(e, day)}
                        className={`group/day relative flex ${CELL} items-center justify-center outline-none ${disabled ? "cursor-not-allowed" : "cursor-pointer"}`}
                      >
                        {selected && day.inMonth && (
                          <motion.span
                            layoutId={`${uid}-selected-${monthKey(month)}`}
                            transition={reduced ? { duration: 0 } : snappy}
                            className="absolute inset-y-0 left-1/2 w-9 -translate-x-1/2 rounded-control-sm bg-brand"
                          />
                        )}
                        <DayFace day={day} disabled={disabled} filled={selected && day.inMonth} reduced={reduced} />
                      </div>
                    );
                  })}
                </div>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

/** The light band behind a range: square in the middle, open towards the inside at each end, rounded at row edges. */
function RangeBand({ position, col, preview }: { position: "single" | "start" | "middle" | "end" | null; col: number; preview: boolean }) {
  if (position === null || position === "single") return null;
  const left = position === "start" ? "left-1/2" : "left-0";
  const right = position === "end" ? "right-1/2" : "right-0";
  const roundL = col === 0 && position !== "start" ? "rounded-l-control-sm" : "";
  const roundR = col === 6 && position !== "end" ? "rounded-r-control-sm" : "";
  return (
    <span
      aria-hidden
      className={`absolute inset-y-0 ${left} ${right} ${roundL} ${roundR} bg-brand-subtle transition-opacity duration-(--eased-duration-fast) ease-standard ${preview ? "opacity-60" : "opacity-100"}`}
    />
  );
}

function DayFace({
  day,
  disabled,
  filled,
  preview = false,
  reduced,
  pop = false,
}: {
  day: CalendarDay;
  disabled: boolean;
  filled: boolean;
  preview?: boolean;
  reduced: boolean;
  pop?: boolean;
}) {
  const tone = filled
    ? "text-text-on-brand"
    : disabled
      ? "text-text-disabled"
      : day.isToday
        ? "text-brand-text font-medium"
        : day.inMonth
          ? "text-text"
          : "text-text-muted";
  return (
    <span
      className={`relative flex size-9 items-center justify-center rounded-control-sm text-ui-sm tabular-nums [transition:color_150ms_var(--eased-ease-standard),background-color_150ms_var(--eased-ease-standard),box-shadow_var(--eased-duration-focus)_var(--eased-ease-standard)] group-focus-visible/day:z-10 group-focus-visible/day:shadow-[0_0_0_2px_var(--eased-bg),0_0_0_4px_var(--eased-ring)] ${tone} ${
        !filled && !disabled ? "group-hover-fine/day:bg-surface-hover group-active/day:bg-surface-active" : ""
      }`}
    >
      {pop && filled && (
        <motion.span
          key={day.key}
          aria-hidden
          initial={reduced ? { opacity: 0 } : { scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: preview ? 0.75 : 1 }}
          transition={reduced ? reducedFade : { scale: snappy, opacity: enter }}
          className="absolute inset-0 rounded-[inherit] bg-brand"
        />
      )}
      <span className="relative">{day.day}</span>
      {day.isToday && <span aria-hidden className="absolute bottom-1 left-1/2 size-1 -translate-x-1/2 rounded-pill bg-current" />}
    </span>
  );
}

function NavButton({ label, onClick, disabled, dir }: { label: string; onClick: () => void; disabled: boolean; dir: "left" | "right" }) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex size-8 cursor-pointer items-center justify-center rounded-control-sm text-text-muted hover-fine:not-disabled:bg-surface-hover hover-fine:not-disabled:text-text active:not-disabled:bg-surface-active disabled:cursor-not-allowed disabled:text-text-disabled ${pressIcon}`}
    >
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden className="size-4">
        <path d={dir === "left" ? "M9.5 3.5 5 8l4.5 4.5" : "M6.5 3.5 11 8l-4.5 4.5"} />
      </svg>
    </button>
  );
}
