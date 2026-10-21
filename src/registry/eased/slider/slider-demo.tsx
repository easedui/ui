"use client";

import { useState } from "react";
import { DemoFrame } from "../lib/demo-frame";
import { Slider } from "./slider";

const usd = { style: "currency", currency: "USD", maximumFractionDigits: 0 } as const;

/** Usage limits: a spend cap, a price range with two thumbs, and an alert threshold. */
export function SliderDemo() {
  const [cap, setCap] = useState(400);
  return (
    <DemoFrame title="Usage limits" meta={`Cap ${new Intl.NumberFormat("en-US", usd).format(cap)}/mo`}>
      <div className="flex min-h-0 flex-1 flex-col justify-center gap-8 overflow-y-auto px-(--pad) py-4">
        <Slider label="Monthly spend cap" value={cap} onValueChange={setCap} min={0} max={2000} step={50} largeStep={250} format={usd} locale="en-US" />
        <Slider label="Model price range" defaultValue={[2, 15]} min={0} max={30} step={0.5} minStepsBetweenValues={2} format={{ ...usd, maximumFractionDigits: 2, minimumFractionDigits: 0 }} locale="en-US" aria-label="Price per million tokens" />
        <Slider label="Alert at" defaultValue={80} min={50} max={100} format={{ style: "unit", unit: "percent" }} />
        <Slider label="Burst allowance" defaultValue={20} disabled format={{ style: "unit", unit: "percent" }} />
      </div>
    </DemoFrame>
  );
}
