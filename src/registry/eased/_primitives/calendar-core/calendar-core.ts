/**
 * calendar-core: month, week and day grids, range selection (click-click and drag), keyboard
 * movement and availability maths for bookings, legal deadlines, shifts and schedulers.
 * Import from here; the files behind it may move.
 */
export {
  addDays,
  addMinutes,
  addMonths,
  addWeeks,
  differenceInCalendarDays,
  endOfDay,
  endOfMonth,
  endOfWeek,
  fromDayKey,
  getDaysInMonth,
  isAfter,
  isBefore,
  isSameDay,
  isSameMonth,
  isWeekend,
  localeWeekStart,
  startOfDay,
  startOfMonth,
  startOfWeek,
  toDayKey,
  type WeekStart,
} from "./dates";
export {
  itemsByDay,
  monthGrid,
  placeDayItems,
  timeGrid,
  weekdays,
  type CalendarDay,
  type GridOptions,
  type PlacedItem,
  type TimedItem,
  type TimeGridOptions,
  type TimeSlot,
} from "./grid";
export {
  constrainRange,
  isInRange,
  nextFocusDate,
  normalizeRange,
  rangeLength,
  rangePosition,
  useRangeSelection,
  type CellState,
  type DateRange,
  type Granularity,
  type RangeConstraints,
  type RangePosition,
  type UseRangeSelectionOptions,
} from "./range";
export { intersectAvailability, mergeIntervals, slotsIn, subtractBusy, type Interval } from "./availability";
