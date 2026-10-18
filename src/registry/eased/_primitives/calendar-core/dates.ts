/**
 * Local-time date math for calendar-core. The names and semantics match date-fns
 * (`addDays`, `startOfWeek({ weekStartsOn })`, `differenceInCalendarDays` …) so this file can
 * be swapped for `date-fns` imports one-for-one. Every function returns a new Date.
 */

export type WeekStart = 0 | 1 | 2 | 3 | 4 | 5 | 6;

const clone = (d: Date | number) => new Date(typeof d === "number" ? d : d.getTime());

export function startOfDay(d: Date | number): Date {
  const x = clone(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
export function endOfDay(d: Date | number): Date {
  const x = clone(d);
  x.setHours(23, 59, 59, 999);
  return x;
}
/** Calendar days, so a DST change keeps the wall-clock time. */
export function addDays(d: Date | number, n: number): Date {
  const x = clone(d);
  x.setDate(x.getDate() + n);
  return x;
}
export const addWeeks = (d: Date | number, n: number) => addDays(d, n * 7);
/** Clamps to the last day of a shorter month (31 Jan + 1 month → 28/29 Feb), like date-fns. */
export function addMonths(d: Date | number, n: number): Date {
  const x = clone(d);
  const day = x.getDate();
  x.setDate(1);
  x.setMonth(x.getMonth() + n);
  x.setDate(Math.min(day, getDaysInMonth(x)));
  return x;
}
export function addMinutes(d: Date | number, n: number): Date {
  return new Date(clone(d).getTime() + n * 60_000);
}
export function getDaysInMonth(d: Date | number): number {
  const x = clone(d);
  return new Date(x.getFullYear(), x.getMonth() + 1, 0).getDate();
}
export function startOfMonth(d: Date | number): Date {
  const x = startOfDay(d);
  x.setDate(1);
  return x;
}
export function endOfMonth(d: Date | number): Date {
  const x = startOfMonth(d);
  x.setMonth(x.getMonth() + 1, 0);
  return endOfDay(x);
}
export function startOfWeek(d: Date | number, { weekStartsOn = 0 }: { weekStartsOn?: WeekStart } = {}): Date {
  const x = startOfDay(d);
  const diff = (x.getDay() - weekStartsOn + 7) % 7;
  return addDays(x, -diff);
}
export function endOfWeek(d: Date | number, options: { weekStartsOn?: WeekStart } = {}): Date {
  return endOfDay(addDays(startOfWeek(d, options), 6));
}
export const isSameDay = (a: Date | number, b: Date | number) => startOfDay(a).getTime() === startOfDay(b).getTime();
export function isSameMonth(a: Date | number, b: Date | number): boolean {
  const x = clone(a);
  const y = clone(b);
  return x.getFullYear() === y.getFullYear() && x.getMonth() === y.getMonth();
}
export const isWeekend = (d: Date | number) => {
  const day = clone(d).getDay();
  return day === 0 || day === 6;
};
/** Whole calendar days from `b` to `a` (a − b), ignoring time of day and DST. */
export function differenceInCalendarDays(a: Date | number, b: Date | number): number {
  const x = startOfDay(a);
  const y = startOfDay(b);
  const utc = (d: Date) => Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  return Math.round((utc(x) - utc(y)) / 86_400_000);
}
export const isBefore = (a: Date | number, b: Date | number) => clone(a).getTime() < clone(b).getTime();
export const isAfter = (a: Date | number, b: Date | number) => clone(a).getTime() > clone(b).getTime();
export const min = (a: Date, b: Date) => (a.getTime() <= b.getTime() ? a : b);
export const max = (a: Date, b: Date) => (a.getTime() >= b.getTime() ? a : b);

/** `YYYY-MM-DD` in local time: a stable React key and `data-date` for a day cell. */
export function toDayKey(d: Date | number): string {
  const x = clone(d);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${x.getFullYear()}-${p(x.getMonth() + 1)}-${p(x.getDate())}`;
}
/** Local midnight of a `YYYY-MM-DD` key. */
export function fromDayKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** The locale's first day of the week (Intl `weekInfo` where supported), else Monday, or Sunday for en-US. */
export function localeWeekStart(locale?: string): WeekStart {
  try {
    const loc = new Intl.Locale(locale ?? Intl.DateTimeFormat().resolvedOptions().locale) as Intl.Locale & {
      weekInfo?: { firstDay: number };
      getWeekInfo?: () => { firstDay: number };
    };
    const info = loc.getWeekInfo?.() ?? loc.weekInfo;
    if (info) return (info.firstDay % 7) as WeekStart;
    return loc.region === "US" || loc.baseName === "en" ? 0 : 1;
  } catch {
    return 1;
  }
}
