"use client";

import { useId, useState } from "react";
import { addDays, isWeekend, type DateRange } from "../_primitives/calendar-core/calendar-core";
import { Field } from "../field/field";
import { DemoFrame } from "../lib/demo-frame";
import { DatePicker } from "./date-picker";

// A fixed "today", so the demo reads the same on every visit.
const TODAY = new Date(2026, 9, 18);
const LOCALE = "en-US";

const workingDays = (r: DateRange) => {
  let n = 0;
  for (let d = r.start; d <= r.end; d = addDays(d, 1)) if (!isWeekend(d)) n++;
  return n;
};

export function DatePickerDemo() {
  const awayLabel = useId();
  const [away, setAway] = useState<DateRange | null>({ start: new Date(2026, 9, 26), end: new Date(2026, 9, 30) });
  const [handover, setHandover] = useState<Date | null>(new Date(2026, 9, 23));
  const days = away ? workingDays(away) : 0;
  const lastDayBefore = away ? addDays(away.start, -1) : null;

  return (
    <DemoFrame title="Time off" meta={away ? `${days} working ${days === 1 ? "day" : "days"}` : "Not set"}>
      <div className="flex min-h-0 flex-1 flex-col gap-4 p-4">
        <div className="flex flex-col gap-1.5">
          <span id={awayLabel} className="w-fit text-ui font-medium text-text">
            Away
          </span>
          <DatePicker mode="range" aria-labelledby={awayLabel} value={away} onValueChange={setAway} min={TODAY} maxLength={21} today={TODAY} locale={LOCALE} />
        </div>

        <Field
          label="Handover review"
          description="Type a date like “Oct 23” or “tomorrow”, or pick one. Weekdays only."
          error={handover && lastDayBefore && handover > lastDayBefore ? "Hold the review before your first day away." : undefined}
        >
          <DatePicker
            value={handover}
            onValueChange={setHandover}
            min={TODAY}
            isDateDisabled={isWeekend}
            today={TODAY}
            locale={LOCALE}
            placeholder="Pick a day"
          />
        </Field>
        <dl className="mt-auto grid grid-cols-[1fr_auto] gap-x-4 gap-y-1.5 border-t border-line-subtle pt-4 text-ui-sm">
          <dt className="text-text-secondary">Balance after</dt>
          <dd className="text-right text-text tabular-nums">{Math.max(0, 14 - days)} of 20 days</dd>
          <dt className="text-text-secondary">Approver</dt>
          <dd className="text-right text-text">Jonas Weber</dd>
        </dl>
      </div>
    </DemoFrame>
  );
}
