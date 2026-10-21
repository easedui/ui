"use client";

import { useState } from "react";
import { Button } from "../button/button";
import { DemoFrame } from "../lib/demo-frame";
import { Alert } from "./alert";

type Payment = "failed" | "retrying" | "paid";

/** Billing: a failed payment retries into a success; a note dismisses and the page glides up. */
export function AlertDemo() {
  const [payment, setPayment] = useState<Payment>("failed");
  const [note, setNote] = useState(true);

  const retry = () => {
    setPayment("retrying");
    window.setTimeout(() => setPayment("paid"), 1200);
  };

  return (
    <DemoFrame
      title="Billing"
      actions={
        <Button size="sm" variant="ghost" edge="end" onClick={() => { setPayment("failed"); setNote(true); }}>
          Reset
        </Button>
      }
    >
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-(--pad) py-4">
        <Alert
          tone={payment === "paid" ? "success" : "danger"}
          role={payment === "paid" ? "status" : "alert"}
          title={payment === "paid" ? "Payment received" : "Your October payment failed"}
          actions={
            payment !== "paid" && (
              <Button size="sm" loading={payment === "retrying"} onClick={retry}>
                Retry $249.00
              </Button>
            )
          }
        >
          {payment === "paid"
            ? "Visa ending 4242 was charged $249.00. Your receipt is on its way."
            : "Visa ending 4242 was declined by the bank. We'll try again on Oct 21."}
        </Alert>
        <Alert open={note} innerClassName="pt-3" tone="neutral" title="Invoices go to billing@northwind.com" onDismiss={() => setNote(false)}>
          Add a second address in Settings → Billing contacts.
        </Alert>
        <Alert tone="warning" role="none" className="mt-3" title="Card expires in 6 days">
          Update it before Oct 24 to keep your Pro plan.
        </Alert>
        <dl className="mt-4 grid grid-cols-[minmax(0,1fr)_auto] gap-y-2 border-t border-line-subtle pt-3 text-ui-sm">
          <dt className="text-text-muted">Plan</dt>
          <dd className="text-end text-text">Pro, 12 seats</dd>
          <dt className="text-text-muted">Next invoice</dt>
          <dd className="text-end text-text tabular-nums">Nov 1, $249.00</dd>
        </dl>
      </div>
    </DemoFrame>
  );
}
