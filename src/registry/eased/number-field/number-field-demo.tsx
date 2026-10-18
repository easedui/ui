"use client";

import { useState } from "react";
import { NumberRoll } from "../_primitives/number-roll/number-roll";
import { Field } from "../field/field";
import { DemoFrame } from "../lib/demo-frame";
import { minusFormatter } from "../lib/format";
import { NumberField } from "./number-field";

const USD = { style: "currency", currency: "USD" } as const;
const PERCENT = { style: "percent", minimumFractionDigits: 1, maximumFractionDigits: 1, signDisplay: "exceptZero" } as const;
const cost = minusFormatter("en-US", USD);

export function NumberFieldDemo() {
  const [shares, setShares] = useState<number | null>(25);
  const [limit, setLimit] = useState<number | null>(187.45);
  const [stop, setStop] = useState<number | null>(-0.025);

  const total = (shares ?? 0) * (limit ?? 0);
  const floor = (limit ?? 0) * (1 + (stop ?? 0));

  return (
    <DemoFrame title="Buy NVDA" meta="Limit order">
      <div className="flex min-h-0 flex-1 flex-col gap-4 p-4">
        <div className="grid grid-cols-1 gap-4 @sm:grid-cols-2">
          <NumberField label="Shares" layout="split" value={shares} onValueChange={setShares} min={1} max={500} locale="en-US" />
          <NumberField label="Limit price" value={limit} onValueChange={setLimit} min={0.05} step={0.05} snapOnStep format={USD} locale="en-US" />
        </div>
        <Field description="Drag the label to scrub. Sells if the price falls this far below your limit.">
          <NumberField
            label="Stop loss"
            scrub
            value={stop}
            onValueChange={setStop}
            min={-0.2}
            max={0}
            step={0.005}
            smallStep={0.001}
            largeStep={0.05}
            format={PERCENT}
            locale="en-US"
          />
        </Field>

        <dl className="mt-auto grid grid-cols-[1fr_auto] gap-x-4 gap-y-1.5 border-t border-line-subtle pt-4 text-ui-sm">
          <dt className="text-text-secondary">Stop triggers at</dt>
          <dd className="text-right text-text tabular-nums">
            <NumberRoll value={floor} formatter={cost} />
          </dd>
          <dt className="font-medium text-text">Estimated cost</dt>
          <dd className="text-right font-medium text-text tabular-nums">
            <NumberRoll value={total} formatter={cost} />
          </dd>
        </dl>
      </div>
    </DemoFrame>
  );
}
