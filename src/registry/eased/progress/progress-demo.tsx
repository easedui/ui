"use client";

import { useInView } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { Button } from "../button/button";
import { DemoFrame } from "../lib/demo-frame";
import { NumberRoll } from "../number-roll/number-roll";
import { Spinner } from "../spinner/spinner";
import { TextSwap } from "../text-swap/text-swap";
import { Progress } from "./progress";

type Upload = { id: string; name: string; size: number; speed: number };

const FILES: Upload[] = [
  { id: "a", name: "Launch film final.mov", size: 842, speed: 46 },
  { id: "b", name: "Press kit.zip", size: 128, speed: 31 },
  { id: "c", name: "Hero stills.fig", size: 64, speed: 22 },
  { id: "d", name: "Captions (EN, DE, JA).srt", size: 3, speed: 1.4 },
];

/** Megabytes sent per file, then ticks of server-side processing once the bytes are in. */
type State = Record<string, { sent: number; processing: number }>;

const fresh = (): State => Object.fromEntries(FILES.map((f) => [f.id, { sent: 0, processing: 0 }]));
const PROCESSING_TICKS = 6;

export function ProgressDemo() {
  const [state, setState] = useState<State>(fresh);
  const root = useRef<HTMLUListElement>(null);
  const inView = useInView(root);

  // Uneven chunks, the way a real upload reports, then a short indeterminate processing step.
  useEffect(() => {
    if (!inView) return;
    const t = window.setInterval(() => {
      setState((s) => {
        const next = { ...s };
        for (const f of FILES) {
          const cur = s[f.id];
          if (cur.sent < f.size) {
            next[f.id] = { ...cur, sent: Math.min(f.size, cur.sent + f.speed * (0.4 + Math.random())) };
          } else if (cur.processing < PROCESSING_TICKS) {
            next[f.id] = { ...cur, processing: cur.processing + 1 };
          }
        }
        return next;
      });
    }, 450);
    return () => window.clearInterval(t);
  }, [inView]);

  const done = FILES.filter((f) => state[f.id].processing >= PROCESSING_TICKS).length;
  const busy = done < FILES.length;

  return (
    <DemoFrame
      title="Uploads"
      meta={
        <span className="inline-flex items-center gap-1.5">
          {busy && <Spinner size="sm" label={false} />}
          {done} of {FILES.length}
        </span>
      }
      actions={
        <Button variant="ghost" size="sm" edge="end" onClick={() => setState(fresh())}>
          Restart
        </Button>
      }
    >
      <ul ref={root} className="flex flex-col gap-5 p-4">
        {FILES.map((f) => {
          const { sent, processing } = state[f.id];
          const phase = sent < f.size ? "uploading" : processing < PROCESSING_TICKS ? "processing" : "done";
          return (
            <li key={f.id} className="flex flex-col gap-1.5">
              <Progress
                label={f.name}
                value={phase === "processing" ? null : sent}
                max={f.size}
                getAriaValueText={(formatted) => (phase === "processing" ? "Processing" : `${formatted} uploaded`)}
              />
              <div className="flex items-center justify-between text-ui-xs text-text-muted tabular-nums">
                <span>
                  <NumberRoll value={Math.round(Math.min(sent, f.size))} />
                  &nbsp;/&nbsp;{f.size}&nbsp;MB
                </span>
                <Status phase={phase} />
              </div>
            </li>
          );
        })}
      </ul>

      <div className="mt-auto border-t border-line-subtle p-4">
        <Progress label="Workspace storage" value={7.4} max={10} format={{ style: "unit", unit: "gigabyte", maximumFractionDigits: 1 }} size="sm" successOnComplete={false} />
      </div>
    </DemoFrame>
  );
}

function Status({ phase }: { phase: "uploading" | "processing" | "done" }) {
  const text = phase === "uploading" ? "Uploading…" : phase === "processing" ? "Processing…" : "Uploaded";
  return (
    <TextSwap swapKey={phase} className={phase === "done" ? "text-success-text" : ""}>
      {phase === "done" && (
        <svg viewBox="0 0 14 14" aria-hidden className="size-3.5 fill-none stroke-current" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 7.5 5.75 10 11 4" />
        </svg>
      )}
      {text}
    </TextSwap>
  );
}
