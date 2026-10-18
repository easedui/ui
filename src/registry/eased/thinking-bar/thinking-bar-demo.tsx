"use client";

import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { Button } from "../button/button";
import { DemoFrame } from "../lib/demo-frame";
import { enter, useSafeReducedMotion } from "../lib/motion";
import { ThinkingBar } from "./thinking-bar";

const TRACE = [
  "The team is on monthly at $14 a seat, 18 seats, renewing 1 March.",
  "Six seats added in March prorate on either plan, so they cancel out.",
  "Yearly is $140 a seat: 24 × 140 = $3,360, against 24 × 14 × 12 = $4,032.",
  "Yearly saves $672 even with the mid-year seats. Worth saying it locks the count until renewal.",
];

const ANSWER =
  "Yes. With 24 seats, yearly comes to $3,360 against $4,032 on monthly, so you save $672. The six March seats are prorated either way. The one catch: on yearly you can add seats any time, but you can't drop below 24 until renewal.";

const THINK_MS = 6400;

export function ThinkingBarDemo() {
  const [run, setRun] = useState(0);
  const [status, setStatus] = useState<"thinking" | "done">("thinking");
  const [traced, setTraced] = useState(1);
  const [words, setWords] = useState(0);
  const reduced = useSafeReducedMotion();
  const answer = ANSWER.split(" ");

  // The script: trace lines land while thinking, then the answer streams in word by word.
  useEffect(() => {
    const timers = [
      ...TRACE.slice(1).map((_, i) => window.setTimeout(() => setTraced(i + 2), ((i + 1) * THINK_MS) / TRACE.length)),
      window.setTimeout(() => setStatus("done"), THINK_MS),
    ];
    return () => timers.forEach(clearTimeout);
  }, [run]);

  useEffect(() => {
    if (status !== "done" || words >= answer.length) return;
    const t = window.setTimeout(() => setWords((w) => Math.min(answer.length, w + 1 + Math.round(Math.random() * 2))), 45 + Math.random() * 70);
    return () => clearTimeout(t);
  }, [status, words, answer.length]);

  const replay = () => {
    setStatus("thinking");
    setTraced(1);
    setWords(0);
    setRun((r) => r + 1);
  };

  return (
    <DemoFrame
      title="Billing assistant"
      actions={
        <Button variant="ghost" size="sm" edge="end" onClick={replay}>
          Replay
        </Button>
      }
    >
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4 [scrollbar-width:thin]">
        <p className="ml-auto max-w-[85%] rounded-panel bg-surface-sunken px-3.5 py-2 text-ui text-text text-pretty">
          If we add 6 seats in March, is yearly still cheaper?
        </p>

        <div className="flex flex-col gap-3">
          <ThinkingBar
            key={run}
            status={status}
            lines={["Reading your plan", "Prorating 6 seats from March", "Comparing monthly and yearly"]}
          >
            <div className="flex flex-col gap-1.5">
              {TRACE.slice(0, traced).map((line) => (
                <motion.p
                  key={line}
                  initial={reduced ? { opacity: 0 } : { opacity: 0, y: 4, filter: "blur(4px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  transition={enter}
                >
                  {line}
                </motion.p>
              ))}
            </div>
          </ThinkingBar>

          {words > 0 && (
            <p className="text-ui text-text text-pretty" aria-live="polite">
              {answer.slice(0, words).map((w, i) => (
                <motion.span
                  key={i}
                  initial={reduced ? { opacity: 0 } : { opacity: 0, filter: "blur(4px)" }}
                  animate={{ opacity: 1, filter: "blur(0px)" }}
                  transition={enter}
                >
                  {w}{" "}
                </motion.span>
              ))}
            </p>
          )}
        </div>
      </div>
    </DemoFrame>
  );
}
