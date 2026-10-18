"use client";

import { useEffect, useRef, useState } from "react";
import { TextSwap } from "../_primitives/text-swap/text-swap";
import { DemoFrame } from "../lib/demo-frame";
import { Button } from "./button";

type Status = "draft" | "sent" | "void";
type Send = "idle" | "sending" | "sent";

const STATUS: Record<Status, { label: string; tone: string }> = {
  draft: { label: "Draft", tone: "bg-surface-hover text-text-secondary" },
  sent: { label: "Sent", tone: "bg-success-subtle text-success-text" },
  void: { label: "Void", tone: "bg-danger-subtle text-danger-text" },
};

const LINES = [
  { item: "Design system audit", qty: "1", amount: 2400 },
  { item: "Component build, 12 items", qty: "12", amount: 1560 },
  { item: "Motion review", qty: "4h", amount: 320 },
];

const money = new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR" });

export function ButtonDemo() {
  const [status, setStatus] = useState<Status>("draft");
  const [send, setSend] = useState<Send>("idle");
  const [downloading, setDownloading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [announce, setAnnounce] = useState("");
  const timers = useRef<number[]>([]);

  const later = (fn: () => void, ms: number) => timers.current.push(window.setTimeout(fn, ms));
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const sendInvoice = () => {
    setSend("sending");
    later(() => {
      setSend("sent");
      setStatus("sent");
      setAnnounce("Invoice sent to Northwind Traders");
      later(() => setSend("idle"), 1800);
    }, 1200);
  };

  const download = () => {
    setDownloading(true);
    later(() => setDownloading(false), 1100);
  };

  const voidInvoice = () => {
    if (!confirming) return setConfirming(true);
    setConfirming(false);
    setStatus("void");
    setAnnounce("Invoice voided");
  };

  const reset = () => {
    setStatus("draft");
    setSend("idle");
    setAnnounce("");
  };

  const total = LINES.reduce((sum, l) => sum + l.amount, 0);
  const voided = status === "void";

  return (
    <DemoFrame
      title={
        <span className="flex min-w-0 items-center gap-2">
          <span className="truncate">Invoice INV-2041</span>
          <span
            className={`inline-flex h-5 shrink-0 items-center rounded-control-xs px-1.5 text-ui-xs font-medium transition-colors duration-150 ease-standard ${STATUS[status].tone}`}
          >
            <TextSwap>{STATUS[status].label}</TextSwap>
          </span>
        </span>
      }
      actions={
        <div className="flex items-center gap-0.5">
          <Button variant="ghost" size="icon-sm" hitArea={false} aria-label="Copy invoice link">
            <svg viewBox="0 0 16 16" fill="none" aria-hidden>
              <path
                d="M6.75 9.25a2.5 2.5 0 0 0 3.54 0l2-2a2.5 2.5 0 0 0-3.54-3.54l-.5.5M9.25 6.75a2.5 2.5 0 0 0-3.54 0l-2 2a2.5 2.5 0 0 0 3.54 3.54l.5-.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </Button>
          <Button variant="ghost" size="icon-sm" hitArea={false} edge="end" aria-label="Reset demo" onClick={reset}>
            <svg viewBox="0 0 16 16" fill="none" aria-hidden>
              <path
                d="M3.25 8a4.75 4.75 0 1 0 1.4-3.36M3.25 2.75v2.5h2.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Button>
        </div>
      }
    >
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex flex-col gap-4 p-4">
          <div className="flex items-baseline justify-between gap-3">
            <div className="min-w-0">
              <p className="text-ui-sm text-text-muted">Billed to</p>
              <p className="truncate text-ui font-medium text-text">Northwind Traders</p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-ui-sm text-text-muted">Due 24 Oct</p>
              <p className={`text-ui font-medium tabular-nums ${voided ? "text-text-muted line-through" : "text-text"}`}>
                {money.format(total)}
              </p>
            </div>
          </div>

          <ul className="flex flex-col border-t border-line-subtle">
            {LINES.map((l) => (
              <li key={l.item} className="flex h-9 min-w-0 items-center gap-3 border-b border-line-subtle text-ui-sm">
                <span className="min-w-0 flex-1 truncate text-text-secondary">{l.item}</span>
                <span className="w-8 shrink-0 text-right text-text-muted tabular-nums">{l.qty}</span>
                <span className="w-20 shrink-0 text-right text-text tabular-nums">{money.format(l.amount)}</span>
              </li>
            ))}
          </ul>

          <Button
            variant="secondary"
            size="sm"
            className="self-start"
            loading={downloading}
            onClick={download}
          >
            <svg viewBox="0 0 16 16" fill="none" aria-hidden>
              <path
                d="M8 2.75v7m0 0L5.25 7M8 9.75 10.75 7M3.25 11.5v.75c0 .55.45 1 1 1h7.5c.55 0 1-.45 1-1v-.75"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Download PDF
          </Button>
        </div>

        <div className="mt-auto flex items-center gap-2 border-t border-line-subtle px-4 py-3">
          <Button
            variant={confirming ? "danger-solid" : "danger"}
            size="sm"
            disabled={voided}
            focusableWhenDisabled
            onClick={voidInvoice}
            onBlur={() => setConfirming(false)}
            onKeyDown={(e) => e.key === "Escape" && setConfirming(false)}
          >
            {confirming ? "Void invoice?" : voided ? "Voided" : "Void"}
          </Button>
          <div className="flex-1" />
          <Button
            variant="primary"
            size="sm"
            disabled={voided}
            loading={send === "sending"}
            onClick={sendInvoice}
            swapKey={send === "sent" ? "sent" : status === "sent" ? "resend" : "send"}
          >
            {send === "sent" ? (
              <>
                <svg viewBox="0 0 16 16" fill="none" aria-hidden>
                  <path d="m3.75 8.5 2.75 2.75 5.75-6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Sent
              </>
            ) : status === "sent" ? (
              "Resend"
            ) : (
              "Send invoice"
            )}
          </Button>
        </div>
      </div>
      <span role="status" className="sr-only">
        {announce}
      </span>
    </DemoFrame>
  );
}
