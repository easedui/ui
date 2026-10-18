"use client";

import { useMotionValue, useMotionValueEvent } from "motion/react";
import { useEffect, useState } from "react";
import { NumberRoll } from "../_primitives/number-roll/number-roll";
import { TextSwap } from "../_primitives/text-swap/text-swap";
import { useTokenRate } from "../_primitives/thinking-core/thinking-core";
import { DemoFrame } from "../lib/demo-frame";
import { Segmented } from "../segmented/segmented";
import { ShimmerText } from "../shimmer-text/shimmer-text";
import { AgentOrb, type OrbState } from "./agent-orb";

const REPLY =
  "Your March invoice went up because six seats were added mid-cycle. They're prorated from the 9th, so this month carries $56 extra and April goes back to the normal yearly rate. Want me to email the breakdown to finance? ";

const HINTS: Record<Exclude<OrbState, "speaking">, string> = {
  idle: "Ask about seats, invoices or plans",
  listening: "Go ahead, I’m listening",
  thinking: "Checking your March invoice…",
};

const CAPTIONS: Record<OrbState, string> = {
  idle: "Ready when you are",
  listening: "Listening",
  thinking: "Thinking",
  speaking: "Speaking",
};

/** A reply that streams in bursts: the pace changes every 1.2–2s between a trickle and a flood. */
function useFakeStream(on: boolean) {
  const [text, setText] = useState("");
  useEffect(() => {
    if (!on) return;
    let pace = 30;
    let i = 0;
    let out = "";
    const timers: number[] = [];
    const retime = window.setInterval(() => (pace = [8, 25, 45, 70][Math.floor(Math.random() * 4)]), 1600);
    const tick = () => {
      const tokens = 1 + Math.floor(Math.random() * 3);
      const chars = tokens * 4;
      out += REPLY.slice(i % REPLY.length, (i % REPLY.length) + chars);
      i += chars;
      setText(out.slice(-600));
      timers.push(window.setTimeout(tick, (tokens / pace) * 1000));
    };
    tick();
    return () => {
      clearInterval(retime);
      timers.forEach(clearTimeout);
      setText("");
    };
  }, [on]);
  return text;
}

/** A mic level: syllable-like bumps on a slow swell. */
function useFakeLevel(on: boolean) {
  const level = useMotionValue(0);
  useEffect(() => {
    if (!on) {
      level.set(0);
      return;
    }
    let raf = 0;
    const loop = (t: number) => {
      const s = t / 1000;
      const v = Math.max(0, Math.sin(s * 7.3) * 0.5 + Math.sin(s * 2.1) * 0.35 + Math.sin(s * 13.7) * 0.15);
      level.set(Math.min(1, v));
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [on, level]);
  return level;
}

export function AgentOrbDemo() {
  const [state, setState] = useState<OrbState>("thinking");
  const text = useFakeStream(state === "speaking");
  const { rate, tps } = useTokenRate(text, { max: 60 });
  const level = useFakeLevel(state === "listening");
  const [shownTps, setShownTps] = useState(0);
  useMotionValueEvent(tps, "change", (v) => {
    const r = Math.round(v);
    if (r !== shownTps) setShownTps(r);
  });

  return (
    <DemoFrame title="Agent Orb" meta={state === "speaking" ? <><NumberRoll value={shownTps} /> tok/s</> : undefined}>
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-6 px-4">
        <AgentOrb state={state} rate={rate} level={level} size={96} label={false} />
        <div className="flex w-full min-w-0 flex-col items-center gap-1 text-center">
          <p className="text-ui-md font-medium text-text" aria-live="polite">
            <TextSwap>{CAPTIONS[state]}</TextSwap>
          </p>
          {state === "speaking" ? (
            <p
              aria-hidden
              className="flex h-5 w-full max-w-72 justify-end overflow-hidden text-ui-sm whitespace-nowrap text-text-muted [mask-image:linear-gradient(to_right,transparent,#000_30%)]"
            >
              {text}
            </p>
          ) : (
            <p className="flex h-5 items-center text-ui-sm">
              <ShimmerText active={state === "thinking"}>{HINTS[state]}</ShimmerText>
            </p>
          )}
        </div>
      </div>
      <div className="flex shrink-0 justify-center border-t border-line-subtle p-4">
        <Segmented
          aria-label="Orb state"
          size="sm"
          value={state}
          onValueChange={setState}
          options={[
            { value: "idle", label: "Idle" },
            { value: "listening", label: "Listen" },
            { value: "thinking", label: "Think" },
            { value: "speaking", label: "Speak" },
          ]}
        />
      </div>
    </DemoFrame>
  );
}
