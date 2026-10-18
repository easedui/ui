"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { groupMessages, useStickToBottom, type ChatMessage, type ChatStatus, type ComposerSubmission } from "../_primitives/chat-core/chat-core";
import { fakeUpload } from "../attachment/attachment-demo";
import { DemoFrame } from "../lib/demo-frame";
import { enter, exitFast, reducedFade, snappy, useSafeReducedMotion } from "../lib/motion";
import { pressWide } from "../lib/press";
import { CopyAction, Message } from "../message/message";
import { Composer } from "./composer";

const SEED: ChatMessage[] = [
  { id: "m1", role: "user", parts: [{ type: "text", text: "Can you turn last week’s churn numbers into three bullet points for the Monday sync?" }] },
  {
    id: "m2",
    role: "assistant",
    parts: [
      {
        type: "text",
        text: "Sure. Churn fell to 2.1% (from 2.6%), driven by the annual-plan nudge. Most cancellations still come from teams under 5 seats. Win-back emails recovered 38 accounts, about $4.2k MRR.",
      },
    ],
  },
];

const REPLIES = [
  "Here’s a tighter version for the slide: churn is down half a point to 2.1%; small teams remain the risk; win-back paid for itself twice over. Want me to add the cohort chart?",
  "Good question. The drop is mostly January cohorts renewing annually. If you exclude them, monthly churn is flat at 2.5%, so I’d frame the nudge as promising rather than proven.",
  "Done. I’ve also flagged the three accounts over 50 seats that downgraded, since those carry most of the revenue risk this quarter.",
];

const replyFor = (s: ComposerSubmission, n: number) =>
  s.attachments.length
    ? `I’ve read ${s.attachments.map((a) => a.name).join(" and ")}. The headline is the same: churn is trending down, but the small-team segment needs its own onboarding. I can draft that plan next.`
    : REPLIES[n % REPLIES.length];

/** A working mini chat: type and press Enter, attach or drop a file, press Stop mid-reply, scroll up while it streams. */
export function ComposerDemo() {
  const reduced = useSafeReducedMotion();
  const [messages, setMessages] = useState<ChatMessage[]>(SEED);
  const [status, setStatus] = useState<ChatStatus>("ready");
  const count = useRef(0);
  const stream = useRef<{ timer?: number; stop: boolean }>({ stop: false });
  const { scrollRef, contentRef, isAtBottom, scrollToBottom } = useStickToBottom();

  useEffect(() => () => clearTimeout(stream.current.timer), []);

  const send = (s: ComposerSubmission) => {
    const id = `u${Date.now()}`;
    const reply = replyFor(s, count.current++);
    setMessages((m) => [...m, { id, role: "user", metadata: { live: true }, parts: [...s.files, ...(s.text ? [{ type: "text" as const, text: s.text }] : [])] }]);
    scrollToBottom();
    setStatus("submitted");
    stream.current = { stop: false };
    const words = reply.split(/(?<=\s)/);
    const aid = `a${Date.now()}`;
    let i = 0;
    const tick = () => {
      if (stream.current.stop) return;
      if (i === 0) {
        setStatus("streaming");
        setMessages((m) => [...m, { id: aid, role: "assistant", metadata: { live: true }, parts: [{ type: "text", text: "", state: "streaming" }] }]);
      }
      // Bursty, like a real stream: one to four words per chunk.
      i = Math.min(words.length, i + 1 + Math.floor(Math.random() * 4));
      const text = words.slice(0, i).join("");
      const done = i >= words.length;
      setMessages((m) => m.map((x) => (x.id === aid ? { ...x, parts: [{ type: "text", text, state: done ? "done" : "streaming" }] } : x)));
      if (done) setStatus("ready");
      else stream.current.timer = window.setTimeout(tick, 60 + Math.random() * 90);
    };
    stream.current.timer = window.setTimeout(tick, 700);
  };

  const stop = () => {
    stream.current.stop = true;
    clearTimeout(stream.current.timer);
    setStatus("ready");
    setMessages((m) => m.map((x) => (x.parts[0]?.type === "text" && "state" in x.parts[0] && x.parts[0].state === "streaming" ? { ...x, parts: [{ ...x.parts[0], state: "done" }] } : x)));
  };

  const groups = groupMessages(messages);
  const last = messages[messages.length - 1];

  return (
    <DemoFrame title="Assistant" meta={status === "ready" ? "Ready" : status === "submitted" ? "Thinking…" : "Writing…"}>
      <div className="relative flex min-h-0 flex-1 flex-col">
        <div ref={scrollRef} aria-busy={status !== "ready"} className="min-h-0 flex-1 overflow-y-auto [scrollbar-width:thin]">
          <div ref={contentRef} className="flex flex-col gap-4 px-4 pt-4 pb-3">
            {groups.map((g) => (
              <div key={g.key} className="flex flex-col gap-1">
                {g.messages.map(({ message, position }) => {
                  return (
                    <Message
                      key={message.id}
                      message={message}
                      position={position}
                      animateIn={Boolean(message.metadata)}
                      actionsVisible={message === last ? "always" : "hover"}
                      actions={message.role === "assistant" && message.parts.some((p) => p.type === "text" && "text" in p && p.text) ? <CopyAction message={message} /> : undefined}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>


        <div className="relative shrink-0 px-4 pb-4">
          <AnimatePresence>
            {!isAtBottom && (
              <motion.button
                key="jump"
                type="button"
                onClick={() => scrollToBottom()}
                className={`absolute bottom-full left-1/2 z-10 mb-3 inline-flex h-7 -translate-x-1/2 cursor-pointer items-center gap-1.5 rounded-pill border border-line bg-surface-raised px-3 text-ui-xs font-medium text-text shadow-floating ${pressWide}`}
                initial={reduced ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1, transition: reduced ? reducedFade : { ...snappy, opacity: enter } }}
                exit={{ opacity: 0, y: reduced ? 0 : 4, transition: reduced ? reducedFade : exitFast }}
              >
                <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M8 3v10M4 9l4 4 4-4" />
                </svg>
                {status === "ready" ? "Jump to latest" : "New reply"}
              </motion.button>
            )}
          </AnimatePresence>
          <Composer status={status} onSubmit={send} onStop={stop} upload={fakeUpload} maxSize={20_000_000} placeholder="Ask about your metrics…" />
        </div>
      </div>
    </DemoFrame>
  );
}
