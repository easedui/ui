"use client";

import { useInView } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { Badge } from "../badge/badge";
import { DemoFrame } from "../lib/demo-frame";
import { Segmented } from "../segmented/segmented";
import { NumberRoll } from "./number-roll";

type Range = "7d" | "30d" | "90d";
const RANGES = [
  { value: "7d", label: "7d" },
  { value: "30d", label: "30d" },
  { value: "90d", label: "90d" },
] as const;

const DATA: Record<Range, { revenue: number; delta: number; orders: number; refunds: number; returning: number }> = {
  "7d": { revenue: 12_480.5, delta: 0.084, orders: 214, refunds: 0.012, returning: 0.36 },
  "30d": { revenue: 48_210.4, delta: -0.031, orders: 869, refunds: 0.018, returning: 0.41 },
  "90d": { revenue: 139_775.9, delta: 0.127, orders: 2_406, refunds: 0.015, returning: 0.44 },
};

const LOCALES = [
  { value: "en-US", label: "en-US" },
  { value: "de-DE", label: "de-DE" },
  { value: "hi-IN", label: "hi-IN" },
] as const;
type Locale = (typeof LOCALES)[number]["value"];

export function NumberRollDemo() {
  const [range, setRange] = useState<Range>("30d");
  const [locale, setLocale] = useState<Locale>("en-US");
  const [live, setLive] = useState({ revenue: 0, orders: 0 });
  const root = useRef<HTMLDivElement>(null);
  const inView = useInView(root);

  // A new order every couple of seconds while the card is on screen: the total and the
  // order count tick up, and carries roll forward. The format switch shows grouping change
  // (hi-IN groups lakhs: 1,39,775.90) and digits slide to their new places.
  useEffect(() => {
    if (!inView) return;
    const t = window.setInterval(() => {
      setLive((l) => ({ revenue: l.revenue + 18 + Math.round(Math.random() * 6400) / 100, orders: l.orders + 1 }));
    }, 2200);
    return () => window.clearInterval(t);
  }, [inView]);

  const d = DATA[range];
  const revenue = d.revenue + live.revenue;
  const orders = d.orders + live.orders;
  const currency = { style: "currency", currency: "USD" } as const;

  return (
    <DemoFrame
      title="Revenue"
      actions={
        <Segmented
          aria-label="Range"
          options={RANGES}
          value={range}
          onValueChange={(r) => {
            setRange(r);
            setLive({ revenue: 0, orders: 0 });
          }}
        />
      }
    >
      <div ref={root} className="flex min-h-0 flex-1 flex-col p-4">
        <div className="flex items-center gap-2">
          <Badge tone="success" dot="live">
            Live
          </Badge>
          <p className="text-ui-sm text-text-muted">Net sales, all channels</p>
        </div>

        <p className="mt-3 text-4xl font-semibold text-text tabular-nums @max-[22rem]:text-3xl">
          <NumberRoll value={revenue} locale={locale} format={currency} />
        </p>
        <div className="mt-2 flex items-center gap-2 text-ui-sm text-text-muted">
          <Badge tone={d.delta >= 0 ? "success" : "danger"}>
            <span aria-hidden>{d.delta >= 0 ? "↑" : "↓"}</span>
            <NumberRoll
              value={Math.abs(d.delta)}
              locale={locale}
              format={{ style: "percent", minimumFractionDigits: 1, maximumFractionDigits: 1 }}
            />
          </Badge>
          <span>vs. previous {range === "7d" ? "week" : range === "30d" ? "month" : "quarter"}</span>
        </div>

        <dl className="mt-6 divide-y divide-line-subtle border-y border-line-subtle text-ui-sm">
          <Row label="Orders">
            <NumberRoll value={orders} locale={locale} />
          </Row>
          <Row label="Average order">
            <NumberRoll value={Math.round((revenue / orders) * 100) / 100} locale={locale} format={currency} />
          </Row>
          <Row label="Returning customers">
            <NumberRoll value={d.returning} locale={locale} format={{ style: "percent" }} />
          </Row>
          <Row label="Refund rate">
            <NumberRoll
              value={d.refunds}
              locale={locale}
              format={{ style: "percent", minimumFractionDigits: 1, maximumFractionDigits: 1 }}
            />
          </Row>
        </dl>

        <div className="mt-auto flex items-center justify-between gap-3 pt-4">
          <p className="text-ui-sm text-text-muted">Format</p>
          <Segmented aria-label="Number format" options={LOCALES} value={locale} onValueChange={setLocale} />
        </div>
      </div>
    </DemoFrame>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex h-9 items-center justify-between gap-3">
      <dt className="text-text-secondary">{label}</dt>
      <dd className="text-text tabular-nums">{children}</dd>
    </div>
  );
}
