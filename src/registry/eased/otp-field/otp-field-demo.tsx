"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "../button/button";
import { Field } from "../field/field";
import { DemoFrame } from "../lib/demo-frame";
import { OtpField } from "./otp-field";

const CODE = "314159";
const RESEND_AFTER = 30;

type Status = "idle" | "checking" | "wrong" | "verified";

export function OtpFieldDemo() {
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [wait, setWait] = useState(RESEND_AFTER);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    if (wait <= 0 || status === "verified") return;
    const t = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(t);
  }, [wait, status]);
  useEffect(() => () => clearTimeout(timer.current), []);

  const verify = (value: string) => {
    if (value.length < CODE.length || status === "checking") return;
    setStatus("checking");
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setStatus(value === CODE ? "verified" : "wrong"), 700);
  };

  const reset = () => {
    clearTimeout(timer.current);
    setCode("");
    setStatus("idle");
    setWait(RESEND_AFTER);
  };

  const verified = status === "verified";

  return (
    <DemoFrame title="Verify your email" meta="Step 2 of 3">
      <div className="flex min-h-0 flex-1 flex-col gap-6 p-4">
        <p className="text-ui text-pretty text-text-secondary">
          We sent a 6-digit code to <span className="font-medium text-text">maya@northwind.com</span>. It expires in 10 minutes.
        </p>

        <Field
          label="Verification code"
          description={verified ? "Email verified." : `For this demo, the code is ${CODE.slice(0, 3)} ${CODE.slice(3)}.`}
          error={status === "wrong" ? "That code doesn’t match. Check the latest email from us." : undefined}
        >
          <OtpField
            value={code}
            onValueChange={(v) => {
              setCode(v);
              if (status === "wrong") setStatus("idle");
            }}
            onValueComplete={verify}
            success={verified}
            readOnly={verified || status === "checking"}
          />
        </Field>
        <p className="text-ui-sm text-pretty text-text-muted">Can’t find it? Check your spam folder, or resend below.</p>

        <div className="mt-auto flex items-center justify-between gap-3">
          {verified ? (
            <Button variant="ghost" size="sm" edge="start" onClick={reset}>
              Start over
            </Button>
          ) : (
            <Button variant="ghost" size="sm" edge="start" disabled={wait > 0} onClick={reset} swapKey={wait > 0 ? "wait" : "ready"}>
              {wait > 0 ? <span className="tabular-nums">Resend in 0:{String(wait).padStart(2, "0")}</span> : "Resend code"}
            </Button>
          )}
          <Button variant="primary" size="sm" loading={status === "checking"} disabled={code.length < CODE.length || verified} onClick={() => verify(code)}>
            {verified ? "Verified" : "Verify"}
          </Button>
        </div>
      </div>
    </DemoFrame>
  );
}
