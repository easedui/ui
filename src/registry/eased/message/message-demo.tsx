"use client";

import { useState } from "react";
import { groupMessages, useStickToBottom, type ChatMessage } from "../_primitives/chat-core/chat-core";
import { scene } from "../attachment/attachment-demo";
import { Button } from "../button/button";
import { DemoFrame } from "../lib/demo-frame";
import { CopyAction, Message } from "./message";

const SEED: ChatMessage[] = [
  {
    id: "1",
    role: "user",
    parts: [
      { type: "file", mediaType: "image/png", filename: "kitchen-before.png", url: scene("#e9e4dc", "#c9a27e", "#b7c4b0", "#6f7f6a", 30) },
      { type: "text", text: "This is the kitchen now. What would make it feel bigger without moving walls?" },
    ],
  },
  {
    id: "2",
    role: "assistant",
    parts: [
      {
        type: "text",
        text: "Three things do most of the work: paint the upper cabinets the wall colour so they recede, swap the pendant for a flush light, and run one floor finish through to the dining area.",
      },
    ],
  },
];

const FOLLOW_UPS = ["Love the cabinet idea.", "What colour would you pick?", "Something warm, not stark white."];

/** Send the follow-ups one by one: each new bubble tightens the corners where it meets the last. */
export function MessageDemo() {
  const [messages, setMessages] = useState(SEED);
  const [step, setStep] = useState(0);
  const { scrollRef, contentRef, scrollToBottom } = useStickToBottom();
  const left = FOLLOW_UPS.length - step;

  const send = () => {
    if (step >= FOLLOW_UPS.length) {
      setStep(0);
      setMessages(SEED);
      return;
    }
    const text = FOLLOW_UPS[step];
    setStep(step + 1);
    setMessages((m) => [...m, { id: `f${step}-${Date.now()}`, role: "user", metadata: { live: true }, parts: [{ type: "text", text }] }]);
    scrollToBottom();
  };

  return (
    <DemoFrame title="Kitchen ideas" meta={`${messages.length} messages`}>
      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto [scrollbar-width:thin]">
        <div ref={contentRef} className="flex flex-col gap-4 p-4">
          {groupMessages(messages).map((g) => (
            <div key={g.key} className="flex flex-col gap-1">
              {g.messages.map(({ message, position }) => {
                return (
                  <Message
                    key={message.id}
                    message={message}
                    position={position}
                    animateIn={Boolean(message.metadata)}
                    actions={message.role === "assistant" ? <CopyAction message={message} /> : undefined}
                    actionsVisible="always"
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-3 border-t border-line-subtle px-4 py-3">
        <p className="min-w-0 flex-1 truncate text-ui-sm text-text-muted">
          {left > 0 ? `“${FOLLOW_UPS[step]}”` : "All follow-ups sent"}
        </p>
        <Button variant="primary" size="sm" onClick={send}>
          {left > 0 ? "Send follow-up" : "Reset"}
        </Button>
      </div>
    </DemoFrame>
  );
}
