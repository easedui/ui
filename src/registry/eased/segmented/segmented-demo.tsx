"use client";

import { motion } from "motion/react";
import { useState } from "react";
import { Badge } from "../badge/badge";
import { DemoFrame } from "../lib/demo-frame";
import { smooth, useSafeReducedMotion } from "../lib/motion";
import { NumberRoll } from "../number-roll/number-roll";
import { TextSwap } from "../text-swap/text-swap";
import { Segmented } from "./segmented";

type Range = "24h" | "7d" | "30d" | "12m";
type Metric = "visitors" | "views";

const RANGES = [
  { value: "24h", label: "24h" },
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "12m", label: "12 mo" },
] as const;

const METRICS = [
  { value: "visitors", label: "Visitors" },
  { value: "views", label: "Views" },
] as const;

// Twelve buckets per range, as a share of the range's busiest bucket.
const DATA: Record<Range, { total: number; delta: number; bars: number[]; axis: [string, string] }> = {
  "24h": { total: 3_842, delta: 0.081, bars: [18, 12, 9, 14, 38, 62, 81, 100, 92, 74, 55, 31], axis: ["00:00", "22:00"] },
  "7d": { total: 26_190, delta: -0.034, bars: [72, 80, 77, 91, 100, 46, 39, 70, 84, 88, 95, 52], axis: ["Oct 6", "Oct 17"] },
  "30d": { total: 118_604, delta: 0.124, bars: [41, 48, 52, 50, 61, 66, 63, 72, 79, 85, 93, 100], axis: ["Sep 18", "Oct 17"] },
  "12m": { total: 1_204_330, delta: 0.468, bars: [22, 26, 31, 30, 38, 44, 52, 57, 63, 74, 88, 100], axis: ["Nov", "Oct"] },
};

const pct = new Intl.NumberFormat("en-US", { style: "percent", maximumFractionDigits: 1, signDisplay: "always" });

export function SegmentedDemo() {
  const reduced = useSafeReducedMotion();
  const [range, setRange] = useState<Range>("7d");
  const [metric, setMetric] = useState<Metric>("visitors");
  const data = DATA[range];
  const scale = metric === "views" ? 2.7 : 1;
  const total = Math.round(data.total * scale);

  return (
    <DemoFrame
      title="Traffic"
      actions={<Segmented aria-label="Metric" options={METRICS} value={metric} onValueChange={setMetric} />}
    >
      <div className="flex min-h-0 flex-1 flex-col gap-5 p-4">
        <Segmented aria-label="Date range" options={RANGES} value={range} onValueChange={setRange} fullWidth />

        <div className="flex items-baseline justify-between gap-3">
          <div className="min-w-0">
            <p className="text-ui-sm text-text-muted">
              <TextSwap>{metric === "views" ? "Page views" : "Unique visitors"}</TextSwap>
            </p>
            <p className="text-3xl font-semibold text-text tabular-nums">
              <NumberRoll value={total} locale="en-US" />
            </p>
          </div>
          <Badge tone={data.delta < 0 ? "danger" : "success"}>{pct.format(data.delta)}</Badge>
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-2">
          <div className="flex min-h-0 flex-1 items-end gap-1.5" aria-hidden>
            {data.bars.map((value, i) => (
              <motion.div
                key={i}
                initial={false}
                // clip-path, not scaleY, so the rounded top never squashes. 4px is --eased-radius-control-2xs:
                // Motion cannot interpolate a var() inside clip-path.
                animate={{ clipPath: `inset(${100 - value}% 0 0 0 round 4px 4px 0 0)` }}
                transition={reduced ? { duration: 0 } : smooth}
                className={`h-full flex-1 ${i === data.bars.length - 1 ? "bg-brand" : "bg-surface-active"}`}
              />
            ))}
          </div>
          <div className="flex justify-between text-ui-xs text-text-muted tabular-nums">
            <span>{data.axis[0]}</span>
            <span>{data.axis[1]}</span>
          </div>
        </div>
      </div>
    </DemoFrame>
  );
}
