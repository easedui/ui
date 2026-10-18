"use client";

import { useEffect, useState } from "react";
import { NumberRoll } from "../_primitives/number-roll/number-roll";
import { useElapsed, useStatusCarousel } from "../_primitives/thinking-core/thinking-core";
import { Button } from "../button/button";
import { DemoFrame } from "../lib/demo-frame";
import { Spinner } from "../spinner/spinner";
import { ShimmerText } from "./shimmer-text";

const RESEARCH = [
  "Searching 14 sources…",
  "Reading stripe.com/pricing…",
  "Comparing three pricing tiers…",
  "Checking the 2026 fee changes…",
  "Drafting the summary…",
];

const TASKS = [
  { id: "read", todo: "Read checkout-form.tsx", busy: "Reading checkout-form.tsx…", label: "Read checkout-form.tsx", took: 0.4 },
  { id: "edit", todo: "Edit the coupon field", busy: "Editing the coupon field…", label: "Edited the coupon field", took: 3.2 },
  { id: "test", todo: "Run pnpm test", busy: "Running pnpm test…", label: "Ran pnpm test, 48 passed", took: 4.1 },
  { id: "types", todo: "Type check", busy: "Running the type check…", label: "Type check passed", took: 2.7 },
  { id: "pr", todo: "Open a pull request", busy: "Opening a pull request…", label: "Opened pull request #412", took: 1.3 },
];

function Check() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden className="size-4 text-text-muted">
      <path d="m4 8.5 2.5 2.5L12 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Queued() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden className="size-4 text-text-disabled">
      <circle cx="8" cy="8" r="5.25" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 2.2" />
    </svg>
  );
}

/** The live seconds of the running task, rolling. */
function Live({ running }: { running: boolean }) {
  const s = useElapsed({ running });
  return <NumberRoll value={s} formatter={(v) => `${v}s`} />;
}

export function ShimmerTextDemo() {
  const [playing, setPlaying] = useState(true);
  const [active, setActive] = useState(1);
  const line = useStatusCarousel(RESEARCH, { paused: !playing, loop: true });

  // One task finishes every 3.4s; after the last, the list starts over.
  useEffect(() => {
    if (!playing) return;
    const t = window.setTimeout(() => setActive((i) => (i + 1) % (TASKS.length + 1)), active === TASKS.length ? 2200 : 3400);
    return () => clearTimeout(t);
  }, [active, playing]);

  return (
    <DemoFrame
      title="Agent activity"
      actions={
        <Button variant="ghost" size="sm" edge="end" onClick={() => setPlaying((p) => !p)} swapKey={playing ? "pause" : "play"}>
          {playing ? "Pause" : "Resume"}
        </Button>
      }
    >
      <div className="flex min-h-0 flex-1 flex-col divide-y divide-line-subtle">
        <section className="flex flex-col gap-1.5 p-4" aria-label="Research">
          <p className="text-ui-sm text-text-muted">Research · pricing comparison</p>
          <p className="text-ui-md font-medium" aria-live="polite">
            <ShimmerText active={playing} className="text-text-secondary">
              {line}
            </ShimmerText>
          </p>
        </section>

        <section className="flex flex-1 flex-col gap-3 p-4" aria-label="Tasks">
          <div className="flex items-baseline justify-between gap-3">
            <p className="text-ui font-medium text-text">Fix the coupon field</p>
            <p className="text-ui-sm text-text-muted tabular-nums">
              <NumberRoll value={Math.min(active, TASKS.length)} /> of {TASKS.length}
            </p>
          </div>
          <ol className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-2.5">
            {TASKS.map((task, i) => {
              const state = i < active ? "done" : i === active ? "active" : "queued";
              return (
                <li key={task.id} className="col-span-3 grid h-9 grid-cols-subgrid items-center">
                  <span className="flex size-4 items-center justify-center">
                    {state === "done" ? <Check /> : state === "active" ? <Spinner size="sm" label={false} /> : <Queued />}
                  </span>
                  <span className={`min-w-0 truncate text-ui-sm ${state === "queued" ? "text-text-muted" : ""}`}>
                    <ShimmerText
                      active={state === "active" && playing}
                      className={state === "done" ? "text-text-secondary" : state === "active" ? "text-text-muted" : "text-text-disabled"}
                    >
                      {state === "done" ? task.label : state === "active" ? task.busy : task.todo}
                    </ShimmerText>
                  </span>
                  <span className="text-right text-ui-sm text-text-muted tabular-nums">
                    {state === "done" ? `${task.took}s` : state === "active" ? <Live running={playing} /> : ""}
                  </span>
                </li>
              );
            })}
          </ol>
        </section>
      </div>
    </DemoFrame>
  );
}
