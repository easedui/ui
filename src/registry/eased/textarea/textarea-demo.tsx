"use client";

import { useEffect, useRef, useState } from "react";
import { Avatar } from "../avatar/avatar";
import { Button } from "../button/button";
import { Field } from "../field/field";
import { DemoFrame } from "../lib/demo-frame";
import { Textarea } from "./textarea";

const MAX = 280;
const TEMPLATE =
  "Thanks for flagging this, Maya. The export fails when a sheet name contains a slash, so the fix ships in tomorrow’s release. Until then, renaming the sheet works. I’ll reply here once it’s live.";

export function TextareaDemo() {
  const [value, setValue] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const send = () => {
    if (!value.trim()) return;
    setState("sending");
    timers.current.push(
      window.setTimeout(() => {
        setState("sent");
        setValue("");
        timers.current.push(window.setTimeout(() => setState("idle"), 1600));
      }, 900),
    );
  };

  return (
    <DemoFrame title="Reply to Maya Chen" meta="#4821">
      <div className="flex min-h-0 flex-1 flex-col gap-4 p-4">
        <div className="flex gap-3">
          <Avatar name="Maya Chen" size="md" />
          <div className="min-w-0">
            <p className="text-ui-sm text-text-muted">Maya Chen · 2h ago</p>
            <p className="text-ui text-pretty text-text-secondary">
              Exporting to CSV fails on the “Q3/Q4 forecast” sheet. Other sheets are fine.
            </p>
          </div>
        </div>

        <Field label="Reply">
          <Textarea
            value={value}
            onValueChange={setValue}
            maxLength={MAX}
            minRows={2}
            maxRows={6}
            placeholder="Write a reply…"
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) send();
            }}
          />
        </Field>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" edge="start" onClick={() => setValue(TEMPLATE)}>
            Insert template
          </Button>
          <div className="flex-1" />
          <Button
            variant="primary"
            size="sm"
            loading={state === "sending"}
            disabled={!value.trim() && state === "idle"}
            focusableWhenDisabled
            onClick={send}
          >
            {state === "sent" ? "Sent" : "Send reply"}
          </Button>
        </div>
        <span role="status" className="sr-only">
          {state === "sent" ? "Reply sent" : ""}
        </span>
      </div>
    </DemoFrame>
  );
}
