"use client";

import { Input as BaseInput } from "@base-ui/react/input";
import { Popover } from "@base-ui/react/popover";
import { useMemo, useRef, useState, type ComponentProps } from "react";
import { addDays, startOfDay, type WeekStart } from "../_primitives/calendar-core/calendar-core";
import { InputGroup, InputGroupAddon, controlClass, controlPadClass, type ControlSize } from "../_primitives/field/field";
import { FloatingLayer, floatingSurface } from "../_primitives/floating/floating";
import { pressIcon } from "../lib/press";
import { Calendar, useToday, type DateRange } from "./calendar";

export { Calendar, useToday, type CalendarProps, type CalendarRangeProps, type CalendarSingleProps, type DateRange } from "./calendar";

type InputProps = Omit<ComponentProps<typeof BaseInput>, "size" | "className" | "value" | "defaultValue" | "onValueChange" | "type" | "min" | "max">;

type DatePickerBaseProps = {
  /** Locale for parsing, formatting and the calendar. Default: the runtime's. */
  locale?: string;
  /** How the value is written in the field. Default `{ day: "numeric", month: "short", year: "numeric" }`. */
  formatOptions?: Intl.DateTimeFormatOptions;
  /** 0 Sunday … 6 Saturday. Default: the locale's. */
  weekStartsOn?: WeekStart;
  min?: Date;
  max?: Date;
  /** Days that can't be picked or typed. */
  isDateDisabled?: (date: Date) => boolean;
  /** "Today", for the today mark and for typed words like "tomorrow". Default: now. */
  today?: Date;
  /** sm 32px, md 36px (default), lg 40px. */
  size?: ControlSize;
  placeholder?: string;
  disabled?: boolean;
  /** Controlled popover state. */
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Close the calendar once a day (or a range's second end) is picked. Default true. */
  closeOnSelect?: boolean;
  /** Popover alignment against the field. Default "start". */
  align?: "start" | "center" | "end";
  /** Classes for the bordered box. */
  className?: string;
  /** Stacking order of the popover. Default 50; raise it inside a dialog. */
  zIndex?: number;
};

export type DatePickerSingleProps = DatePickerBaseProps &
  Omit<InputProps, keyof DatePickerBaseProps> & {
    mode?: "single";
    value?: Date | null;
    defaultValue?: Date | null;
    onValueChange?: (date: Date | null) => void;
    /** Accessible name for the calendar button. Default "Choose date". */
    calendarLabel?: string;
    /** Called with the text when a typed date can't be read or isn't allowed. */
    onInvalidInput?: (text: string) => void;
  };

export type DatePickerRangeProps = DatePickerBaseProps & {
  mode: "range";
  value?: DateRange | null;
  defaultValue?: DateRange | null;
  onValueChange?: (range: DateRange | null) => void;
  minLength?: number;
  maxLength?: number;
  id?: string;
  name?: string;
  "aria-label"?: string;
  "aria-labelledby"?: string;
};

export type DatePickerProps = DatePickerSingleProps | DatePickerRangeProps;

const DEFAULT_FORMAT: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" };

/**
 * A date field with a calendar in a popover (Base UI Popover; the grid is calendar-core).
 * Single mode is a text input that reads typed dates in the field's locale ("24 Oct", "10/24",
 * "2026-10-24", "tomorrow") with a calendar button beside it; range mode is a button showing
 * the span. The popover grows from the field; the calendar inside pages with a directional
 * slide and its selection springs between days.
 */
export function DatePicker(props: DatePickerProps) {
  return props.mode === "range" ? <RangePicker {...props} /> : <SinglePicker {...props} />;
}

function usePopoverState(open: boolean | undefined, defaultOpen: boolean | undefined, onOpenChange?: (open: boolean) => void) {
  const [own, setOwn] = useState(defaultOpen ?? false);
  const isOpen = open ?? own;
  const setOpen = (next: boolean) => {
    if (open === undefined) setOwn(next);
    onOpenChange?.(next);
  };
  return [isOpen, setOpen] as const;
}

function SinglePicker({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- kept off the input
  mode: _mode,
  value: valueProp,
  defaultValue = null,
  onValueChange,
  locale,
  formatOptions = DEFAULT_FORMAT,
  weekStartsOn,
  min,
  max,
  isDateDisabled,
  today: todayProp,
  size = "md",
  placeholder,
  disabled,
  open,
  defaultOpen,
  onOpenChange,
  closeOnSelect = true,
  align = "start",
  className = "",
  zIndex,
  calendarLabel = "Choose date",
  onInvalidInput,
  onBlur,
  onKeyDown,
  ...inputProps
}: DatePickerSingleProps) {
  const [own, setOwn] = useState<Date | null>(defaultValue);
  const value = valueProp !== undefined ? valueProp : own;
  const [isOpen, setOpen] = usePopoverState(open, defaultOpen, onOpenChange);
  const now = useToday();
  const today = todayProp ?? now ?? undefined;
  const anchor = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const fmt = useMemo(() => new Intl.DateTimeFormat(locale, formatOptions), [locale, formatOptions]);
  const shown = value ? plainSpaces(fmt.format(value)) : "";
  // What the person is typing; null while the field shows the formatted value.
  const [draft, setDraft] = useState<string | null>(null);

  const allowed = (d: Date) => !((min && d < startOfDay(min)) || (max && d > startOfDay(max)) || isDateDisabled?.(d));

  const commit = (next: Date | null) => {
    if (valueProp === undefined) setOwn(next);
    if ((next?.getTime() ?? null) !== (value?.getTime() ?? null)) onValueChange?.(next);
  };

  /** Reads the draft; a date that can't be read or picked reverts to the last good value. */
  const commitDraft = () => {
    if (draft === null) return;
    const text = draft.trim();
    setDraft(null);
    if (!text) return commit(null);
    const parsed = parseDate(text, { locale, today });
    if (parsed && allowed(parsed)) commit(parsed);
    else onInvalidInput?.(text);
  };

  return (
    <Popover.Root
      open={isOpen}
      onOpenChange={(next) => {
        if (next) commitDraft();
        setOpen(next);
      }}
    >
      <div ref={anchor} className="flex w-full min-w-0">
        <InputGroup size={size} className={className}>
          <BaseInput
            {...inputProps}
            ref={inputRef}
            value={draft ?? shown}
            onValueChange={(v) => setDraft(v)}
            placeholder={placeholder ?? (today ? plainSpaces(fmt.format(today)) : undefined)}
            disabled={disabled}
            autoComplete="off"
            spellCheck={false}
            onBlur={(e) => {
              commitDraft();
              onBlur?.(e);
            }}
            onKeyDown={(e) => {
              onKeyDown?.(e);
              if (e.defaultPrevented) return;
              if (e.key === "Enter") commitDraft();
              else if (e.key === "Escape" && draft !== null) {
                e.preventDefault();
                setDraft(null);
              } else if (e.key === "ArrowDown" && (e.altKey || !draft)) {
                e.preventDefault();
                commitDraft();
                setOpen(true);
              }
            }}
            className={controlClass}
          />
          <Popover.Trigger
            aria-label={calendarLabel}
            disabled={disabled}
            className={`-me-1.5 inline-flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-control-xs text-text-muted hover-fine:not-disabled:bg-surface-hover hover-fine:not-disabled:text-text active:not-disabled:bg-surface-active data-popup-open:bg-surface-active data-popup-open:text-text disabled:cursor-not-allowed disabled:text-text-disabled ${pressIcon} active:scale-100`}
          >
            <CalendarIcon />
          </Popover.Trigger>
        </InputGroup>
      </div>
      <CalendarPopover anchor={anchor} align={align} zIndex={zIndex}>
        <Calendar
          value={value}
          onValueChange={commit}
          onSelectComplete={() => {
            if (!closeOnSelect) return;
            setOpen(false);
          }}
          locale={locale}
          weekStartsOn={weekStartsOn}
          min={min}
          max={max}
          isDateDisabled={isDateDisabled}
          today={today}
        />
      </CalendarPopover>
    </Popover.Root>
  );
}

function RangePicker({
  value: valueProp,
  defaultValue = null,
  onValueChange,
  locale,
  formatOptions = DEFAULT_FORMAT,
  weekStartsOn,
  min,
  max,
  isDateDisabled,
  minLength,
  maxLength,
  today,
  size = "md",
  placeholder = "Pick dates",
  disabled,
  open,
  defaultOpen,
  onOpenChange,
  closeOnSelect = true,
  align = "start",
  className = "",
  zIndex,
  id,
  name,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
}: DatePickerRangeProps) {
  const [own, setOwn] = useState<DateRange | null>(defaultValue);
  const value = valueProp !== undefined ? valueProp : own;
  const [isOpen, setOpen] = usePopoverState(open, defaultOpen, onOpenChange);
  const anchor = useRef<HTMLDivElement>(null);
  // Escape while a range is half-picked drops the half-pick and keeps the calendar open.
  const fmt = useMemo(() => new Intl.DateTimeFormat(locale, formatOptions), [locale, formatOptions]);
  const label = value ? plainSpaces(fmt.formatRange(value.start, value.end)) : "";

  const commit = (r: DateRange | null) => {
    if (valueProp === undefined) setOwn(r);
    onValueChange?.(r);
  };

  return (
    <Popover.Root
      open={isOpen}
      onOpenChange={(next, details) => {
        if (!next && details.reason === "escape-key" && details.event.defaultPrevented) return details.cancel();
        setOpen(next);
      }}
    >
      <div ref={anchor} className="flex w-full min-w-0">
        <InputGroup size={size} className={`px-0! ${className}`}>
          <Popover.Trigger
            id={id}
            disabled={disabled}
            aria-label={ariaLabel}
            aria-labelledby={ariaLabelledBy}
            className={`flex min-w-0 flex-1 cursor-pointer items-center gap-2 self-stretch rounded-[inherit] text-left outline-none disabled:cursor-not-allowed ${controlPadClass[size]}`}
          >
            <span className={`min-w-0 flex-1 truncate tabular-nums ${label ? "text-text" : "text-text-muted"} in-disabled:text-text-disabled`}>
              {label || placeholder}
            </span>
            <InputGroupAddon>
              <CalendarIcon />
            </InputGroupAddon>
          </Popover.Trigger>
          {name && <input type="hidden" name={name} value={value ? `${toIso(value.start)}/${toIso(value.end)}` : ""} />}
        </InputGroup>
      </div>
      <CalendarPopover anchor={anchor} align={align} zIndex={zIndex}>
        <Calendar
          mode="range"
          value={value}
          onValueChange={commit}
          onSelectComplete={() => {
            if (closeOnSelect) setOpen(false);
          }}
          locale={locale}
          weekStartsOn={weekStartsOn}
          min={min}
          max={max}
          isDateDisabled={isDateDisabled}
          minLength={minLength}
          maxLength={maxLength}
          today={today}
        />
      </CalendarPopover>
    </Popover.Root>
  );
}

function CalendarPopover({
  anchor,
  align,
  zIndex,
  children,
}: {
  anchor: React.RefObject<HTMLDivElement | null>;
  align: "start" | "center" | "end";
  zIndex?: number;
  children: React.ReactNode;
}) {
  const body = useRef<HTMLDivElement>(null);
  return (
    <FloatingLayer
      parts={Popover}
      role="popover"
      side="bottom"
      align={align}
      zIndex={zIndex}
      positionerProps={{ anchor }}
      // Open on the active day (the selection, else today), the grid's roving tab stop.
      popupProps={{ initialFocus: () => body.current?.querySelector<HTMLElement>('[role="gridcell"][tabindex="0"]') ?? true }}
      className={`${floatingSurface} rounded-panel p-3 [--pad:12px] [--radius-outer:var(--eased-radius-panel)]`}
    >
      <div ref={body}>{children}</div>
    </FloatingLayer>
  );
}

/** Intl's thin and narrow no-break spaces differ between Node's ICU and the browser's; plain ones hydrate. */
const plainSpaces = (s: string) => s.replace(/[\u2009\u202f]/g, " ");

const toIso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/* ---------- Typed dates ----------------------------------------------------- */

const WORDS: Record<string, number> = { today: 0, tod: 0, tomorrow: 1, tmr: 1, tom: 1, yesterday: -1 };

/**
 * Reads a typed date in the locale's order: "2026-10-24", "24/10" or "10/24" (the locale
 * decides), "24 Oct", "Oct 24 2026", "October 24", and today / tomorrow / yesterday. A missing
 * year is the year of `today`; two-digit years are 20xx. Null when it can't be read or the day
 * doesn't exist (31 Feb).
 */
export function parseDate(text: string, { locale, today = new Date() }: { locale?: string; today?: Date } = {}): Date | null {
  const t = text.trim().toLowerCase();
  if (!t) return null;
  if (t in WORDS) return addDays(startOfDay(today), WORDS[t]);

  const make = (y: number, m: number, d: number) => {
    if (y < 100) y += 2000;
    const date = new Date(y, m, d);
    return date.getFullYear() === y && date.getMonth() === m && date.getDate() === d ? date : null;
  };

  const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(t);
  if (iso) return make(+iso[1], +iso[2] - 1, +iso[3]);

  const year = today.getFullYear();
  const tokens = t.split(/[\s,./-]+/).filter(Boolean);

  // A month written as a word.
  const names = monthNames(locale);
  const wordIndex = tokens.findIndex((tok) => /\p{L}/u.test(tok));
  if (wordIndex >= 0) {
    const word = tokens[wordIndex].replace(/\.$/, "");
    const m = names.findIndex((n) => n.some((name) => word.length >= 3 && name.startsWith(word)));
    if (m < 0) return null;
    const nums = tokens.filter((_, i) => i !== wordIndex).map(Number);
    if (nums.some(Number.isNaN) || nums.length === 0 || nums.length > 2) return null;
    const [a, b] = nums;
    // "Oct 24 2026", "24 Oct 2026", "2026 Oct 24".
    if (nums.length === 1) return make(year, m, a);
    return a > 31 ? make(a, m, b) : make(b, m, a);
  }

  // All numbers, in the locale's day/month/year order.
  const nums = tokens.map(Number);
  if (nums.some(Number.isNaN) || nums.length < 2 || nums.length > 3) return null;
  const order = numericOrder(locale);
  const parts: Record<"day" | "month" | "year", number> = { day: NaN, month: NaN, year };
  const fields = nums.length === 3 ? order : order.filter((f) => f !== "year");
  fields.forEach((f, i) => (parts[f] = nums[i]));
  return make(parts.year, parts.month - 1, parts.day);
}

const monthCache = new Map<string, string[][]>();
function monthNames(locale?: string): string[][] {
  const key = locale ?? "";
  const hit = monthCache.get(key);
  if (hit) return hit;
  const long = new Intl.DateTimeFormat(locale, { month: "long" });
  const short = new Intl.DateTimeFormat(locale, { month: "short" });
  const en = new Intl.DateTimeFormat("en", { month: "long" });
  const names = Array.from({ length: 12 }, (_, m) => {
    const d = new Date(2000, m, 1);
    return [long.format(d), short.format(d), en.format(d)].map((s) => s.toLowerCase().replace(/\.$/, ""));
  });
  monthCache.set(key, names);
  return names;
}

function numericOrder(locale?: string): ("day" | "month" | "year")[] {
  const parts = new Intl.DateTimeFormat(locale, { day: "numeric", month: "numeric", year: "numeric" }).formatToParts(new Date(2000, 10, 22));
  const order = parts.map((p) => p.type).filter((t): t is "day" | "month" | "year" => t === "day" || t === "month" || t === "year");
  return order.length === 3 ? order : ["month", "day", "year"];
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden className="size-4">
      <rect x="2.25" y="3.25" width="11.5" height="10.5" rx="2.25" stroke="currentColor" strokeWidth="1.5" />
      <path d="M2.5 6.75h11M5.5 1.75v2.5M10.5 1.75v2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
