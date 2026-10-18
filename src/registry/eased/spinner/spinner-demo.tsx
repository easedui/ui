"use client";

import { AnimatePresence, motion, useInView } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { Button } from "../button/button";
import { DemoFrame } from "../lib/demo-frame";
import { instant, reducedFade, snappy, useSafeReducedMotion } from "../lib/motion";
import { TextSwap } from "../text-swap/text-swap";
import { Spinner } from "./spinner";

const STEPS = [
  { name: "Install dependencies", ms: 1400 },
  { name: "Type-check", ms: 1100 },
  { name: "Build 214 pages", ms: 2200 },
  { name: "Upload to edge", ms: 1300 },
  { name: "Warm caches", ms: 900 },
];

export function SpinnerDemo() {
  const reduced = useSafeReducedMotion();
  const [current, setCurrent] = useState(0);
  const root = useRef<HTMLOListElement>(null);
  const inView = useInView(root);
  const finished = current >= STEPS.length;

  useEffect(() => {
    if (!inView || finished) return;
    const t = window.setTimeout(() => setCurrent((c) => c + 1), STEPS[current].ms);
    return () => window.clearTimeout(t);
  }, [current, finished, inView]);

  return (
    <DemoFrame
      title="Deploy"
      meta={finished ? "Ready" : "Building…"}
      actions={
        <Button size="sm" onClick={() => setCurrent(0)} disabled={!finished} swapKey={finished ? "idle" : "busy"}>
          {finished ? (
            "Redeploy"
          ) : (
            <>
              <Spinner size="sm" label={false} className="text-current" />
              Deploying…
            </>
          )}
        </Button>
      }
    >
      <ol ref={root} className="flex flex-col p-1.5" aria-label="Deploy steps">
        {STEPS.map((step, i) => {
          const state = i < current ? "done" : i === current ? "running" : "queued";
          return (
            <li
              key={step.name}
              aria-current={state === "running" ? "step" : undefined}
              className="flex h-10 items-center gap-3 rounded-control px-2.5 text-ui-sm"
            >
              <span className="relative grid size-4 shrink-0 place-items-center">
                <AnimatePresence initial={false} mode="popLayout">
                  <motion.span
                    key={state}
                    className="col-start-1 row-start-1 grid place-items-center"
                    initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.6, filter: "blur(2px)" }}
                    animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                    exit={reduced ? { opacity: 0, transition: instant } : { opacity: 0, scale: 0.6, transition: { duration: 0.1 } }}
                    transition={reduced ? reducedFade : { ...snappy, opacity: { duration: 0.15 }, filter: { duration: 0.15 } }}
                  >
                    {state === "running" ? (
                      <Spinner label={false} className="text-text" />
                    ) : state === "done" ? (
                      <svg viewBox="0 0 16 16" aria-hidden className="size-4 text-success-text">
                        <circle cx="8" cy="8" r="7" className="fill-current opacity-15" />
                        <path d="M5 8.25 7 10.25 11 6" className="fill-none stroke-current" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    ) : (
                      <span aria-hidden className="size-1.5 rounded-pill bg-text-disabled" />
                    )}
                  </motion.span>
                </AnimatePresence>
              </span>
              <span className={`min-w-0 flex-1 truncate ${state === "queued" ? "text-text-muted" : "text-text"}`}>{step.name}</span>
              <span className="text-ui-xs text-text-muted tabular-nums">
                <TextSwap swapKey={state}>
                  {state === "done" ? `${(step.ms / 1000).toFixed(1)}s` : state === "running" ? "Running" : "Queued"}
                </TextSwap>
              </span>
              <span className="sr-only">{state === "done" ? "Done" : state === "running" ? "In progress" : "Queued"}</span>
            </li>
          );
        })}
      </ol>

      <div className="mt-auto flex items-center gap-4 border-t border-line-subtle p-4 text-ui-xs text-text-muted">
        <span>Sizes</span>
        <Spinner size={12} label="Loading, 12px" />
        <Spinner size="sm" label="Loading, 14px" />
        <Spinner size="md" label="Loading, 16px" />
        <Spinner size="lg" label="Loading, 20px" />
        <Spinner size={22} label="Loading, 22px" className="text-text" />
      </div>
    </DemoFrame>
  );
}
