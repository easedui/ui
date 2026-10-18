"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "../button/button";
import { DemoFrame } from "../lib/demo-frame";
import { Segmented } from "../segmented/segmented";
import { TextSwap } from "./text-swap";

const STEPS = [
  { label: "Order placed", detail: "Mon 14 Oct, 09:12" },
  { label: "Packed", detail: "Mon 14 Oct, 16:40" },
  { label: "Shipped from Leeds", detail: "Tue 15 Oct, 07:05" },
  { label: "Out for delivery", detail: "Wed 16 Oct, 08:31" },
  { label: "Delivered", detail: "Wed 16 Oct, 13:58" },
];

const PLANS = {
  monthly: { price: "$12", period: "per seat / month", note: "Billed monthly" },
  yearly: { price: "$120", period: "per seat / year", note: "Billed yearly, 2 months free" },
} as const;

export function TextSwapDemo() {
  const [step, setStep] = useState(2);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [plan, setPlan] = useState<keyof typeof PLANS>("monthly");
  const [copied, setCopied] = useState(false);
  const timer = useRef(0);
  useEffect(() => () => clearTimeout(timer.current), []);

  const go = (to: number) => {
    setDirection(to > step ? 1 : -1);
    setStep(to);
  };

  const copy = () => {
    void navigator.clipboard?.writeText("https://acme.co/invite/7f3k9q").catch(() => {});
    setCopied(true);
    clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), 1400);
  };

  const p = PLANS[plan];

  return (
    <DemoFrame title="Text Swap">
      <div className="flex min-h-0 flex-1 flex-col divide-y divide-line-subtle">
        <section className="flex flex-col gap-3 p-4" aria-label="Order status">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-ui-sm text-text-muted">Order #4182</p>
              <p className="text-ui font-medium text-text" aria-live="polite">
                <TextSwap direction={direction}>{STEPS[step].label}</TextSwap>
              </p>
              <p className="text-ui-sm text-text-muted tabular-nums">
                <TextSwap direction={direction}>{STEPS[step].detail}</TextSwap>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ol className="flex flex-1 gap-1" aria-hidden>
              {STEPS.map((s, i) => (
                <li
                  key={s.label}
                  className={`h-1 flex-1 rounded-pill transition-colors duration-200 ease-standard ${
                    i <= step ? "bg-text" : "bg-surface-active"
                  }`}
                />
              ))}
            </ol>
            <div className="flex shrink-0 gap-1">
              <Button variant="ghost" size="sm" onClick={() => go(step - 1)} disabled={step === 0}>
                Back
              </Button>
              <Button size="sm" onClick={() => go(step + 1)} disabled={step === STEPS.length - 1}>
                Next step
              </Button>
            </div>
          </div>
        </section>

        <section className="flex flex-col gap-3 p-4" aria-label="Pricing">
          <div className="flex items-center justify-between gap-3">
            <p className="text-ui font-medium text-text">Team plan</p>
            <Segmented
              aria-label="Billing period"
              size="sm"
              value={plan}
              onValueChange={setPlan}
              options={[
                { value: "monthly", label: "Monthly" },
                { value: "yearly", label: "Yearly" },
              ]}
            />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-semibold text-text tabular-nums">
              <TextSwap direction={plan === "yearly" ? 1 : -1}>{p.price}</TextSwap>
            </span>
            <span className="text-ui-sm text-text-muted">
              <TextSwap>{p.period}</TextSwap>
            </span>
          </div>
          <p className="text-ui-sm text-text-secondary">
            <TextSwap>{p.note}</TextSwap>
          </p>
        </section>

        <section className="flex items-center justify-between gap-3 p-4" aria-label="Invite link">
          <div className="min-w-0">
            <p className="text-ui font-medium text-text">Invite link</p>
            <p className="truncate font-mono text-ui-sm text-text-muted">acme.co/invite/7f3k9q</p>
          </div>
          <Button size="sm" onClick={copy} swapKey={copied ? "copied" : "copy"}>
            {copied ? (
              <>
                <svg viewBox="0 0 16 16" fill="none" aria-hidden className="size-4">
                  <path d="m3.75 8.5 2.75 2.75 5.75-6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Copied
              </>
            ) : (
              "Copy link"
            )}
          </Button>
          <span role="status" className="sr-only">
            {copied ? "Link copied" : ""}
          </span>
        </section>
      </div>
    </DemoFrame>
  );
}
