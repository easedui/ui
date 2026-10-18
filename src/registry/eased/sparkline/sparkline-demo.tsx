"use client";

import { useMemo, useState } from "react";
import { DemoFrame } from "../lib/demo-frame";
import { NumberRoll } from "../number-roll/number-roll";
import { Segmented } from "../segmented/segmented";
import { chartColor } from "../_primitives/chart-core/tokens";
import { Sparkline } from "./sparkline";

type Range = "7d" | "30d" | "90d";
const DAYS: Record<Range, number> = { "7d": 7, "30d": 30, "90d": 90 };
const RANGES = [
  { value: "7d", label: "7D" },
  { value: "30d", label: "30D" },
  { value: "90d", label: "90D" },
] as const;

// A seeded random walk, so the demo is the same on every load.
function walk(seed: number, count: number, start: number, drift: number, noise: number) {
  let s = seed;
  const rand = () => ((s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296);
  const out: number[] = [];
  let v = start;
  for (let i = 0; i < 90; i++) {
    v = Math.max(start * 0.3, v * (1 + drift + (rand() - 0.5) * noise));
    out.push(v);
  }
  return out.slice(90 - count);
}

const METRICS = [
  { name: "Signups", seed: 7, start: 410, drift: 0.006, noise: 0.16, fmt: { maximumFractionDigits: 0 } },
  { name: "Activation", seed: 21, start: 38, drift: 0.001, noise: 0.05, fmt: { maximumFractionDigits: 1 }, unit: "%" },
  { name: "Churned", seed: 5, start: 31, drift: -0.003, noise: 0.22, fmt: { maximumFractionDigits: 0 } },
  { name: "p95 latency", seed: 13, start: 182, drift: 0.002, noise: 0.08, fmt: { maximumFractionDigits: 0 }, unit: " ms" },
] as const;

const day = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });
const TODAY = new Date(2026, 9, 17);
const dateOf = (i: number, n: number) => day.format(new Date(TODAY.getTime() - (n - 1 - i) * 86_400_000));

export function SparklineDemo() {
  const [range, setRange] = useState<Range>("30d");
  const n = DAYS[range];
  const visitors = useMemo(() => walk(3, n, 2_400, 0.004, 0.12), [n]);
  const rows = useMemo(() => METRICS.map((m) => ({ ...m, values: walk(m.seed, n, m.start, m.drift, m.noise) })), [n]);
  const int = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

  return (
    <DemoFrame title="Product health" actions={<Segmented aria-label="Range" options={RANGES} value={range} onValueChange={setRange} />}>
      <div className="flex min-h-0 flex-1 flex-col p-4">
        <div className="flex flex-col gap-1">
          <p className="text-ui-sm text-text-muted">Daily active users</p>
          <p className="text-ui-lg font-medium text-text tabular-nums">
            <NumberRoll value={Math.round(visitors[visitors.length - 1])} locale="en-US" />
          </p>
        </div>
        <Sparkline
          className="mt-8"
          values={visitors}
          label={`Daily active users, last ${n} days`}
          height={56}
          area
          interactive
          format={(v) => int.format(v)}
          formatIndex={(i) => dateOf(i, n)}
        />
        <ul className="mt-auto grid grid-cols-[minmax(0,1fr)_minmax(0,6rem)_5rem] items-center gap-x-4 border-t border-line-subtle pt-1">
          {rows.map((m) => {
            const last = m.values[m.values.length - 1];
            const first = m.values[0];
            const lowerIsBetter = m.name === "Churned" || m.name === "p95 latency";
            const healthy = lowerIsBetter ? last <= first : last >= first;
            return (
              <li key={m.name} className="col-span-3 grid h-9 grid-cols-subgrid items-center">
                <span className="truncate text-ui-sm text-text-secondary">{m.name}</span>
                <Sparkline values={m.values} label={`${m.name}, last ${n} days`} height={20} color={healthy ? chartColor(1) : "var(--eased-warning)"} />
                <span className="text-right text-ui-sm font-medium text-text tabular-nums">
                  <NumberRoll value={last} locale="en-US" format={m.fmt} />
                  {"unit" in m ? m.unit : ""}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </DemoFrame>
  );
}
