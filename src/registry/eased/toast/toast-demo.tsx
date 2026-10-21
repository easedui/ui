"use client";

import { useState } from "react";
import { Button } from "../button/button";
import { DemoFrame } from "../lib/demo-frame";
import { rowGrid, rowGridRow } from "../lib/layout";
import { TextSwap } from "../text-swap/text-swap";
import { Toaster, useToast } from "./toast";

type Deploy = { id: string; message: string; meta: string; age: string; status: "ready" | "failed" };

const DEPLOYS: Deploy[] = [
  { id: "a91c03e", message: "Fix invoice rounding on EU plans", meta: "Preview · a91c03e · Build failed", age: "18m", status: "failed" },
  { id: "4f2c9e1", message: "Add usage-based billing page", meta: "Production · 4f2c9e1 · main", age: "2h", status: "ready" },
  { id: "c07b5d2", message: "Cache plan lookups at the edge", meta: "Production · c07b5d2 · main", age: "1d", status: "ready" },
];

/*
 * The demo mounts its own Toaster and portals the stack into the frame (`container`), so the
 * toasts land in the bottom-right of this "app window", as they would in a real app, instead of
 * the corner of the docs page, far from the buttons that fired them.
 */
export function ToastDemo() {
  const [frame, setFrame] = useState<HTMLDivElement | null>(null);
  return (
    <Toaster container={frame}>
      <Project layer={setFrame} />
    </Toaster>
  );
}

/** Each Deploy ships the next commit, so repeat presses read as new work. */
const COMMITS = [
  { sha: "7d3e1b2", message: "Show seat count on the plan card" },
  { sha: "e5a4f90", message: "Retry failed webhooks with backoff" },
  { sha: "2b8d6c1", message: "Add VAT ID field to checkout" },
  { sha: "9f1e7a4", message: "Speed up the invoices list query" },
];

function Project({ layer }: { layer: (el: HTMLDivElement | null) => void }) {
  const toast = useToast();
  const [deploys, setDeploys] = useState(DEPLOYS);
  const [deploying, setDeploying] = useState(false);
  const [done, setDone] = useState(false);
  const [count, setCount] = useState(0);

  const deploy = () => {
    setDeploying(true);
    const { sha, message } = COMMITS[count % COMMITS.length];
    setCount((n) => n + 1);
    const build = new Promise<number>((resolve) => window.setTimeout(() => resolve(38), 1800));
    void toast
      .promise(build, {
        loading: { title: "Deploying northwind-web…", description: `Building main · ${sha}` },
        success: (seconds) => ({ title: "Deployed to production", description: `northwind.app · built in ${seconds}s` }),
        error: "Deploy failed",
      })
      .then(() =>
        setDeploys((list): Deploy[] => [{ id: sha, message, meta: `Production · ${sha} · main`, age: "now", status: "ready" as const }, ...list.filter((d) => d.id !== sha)].slice(0, 4)),
      )
      .finally(() => setDeploying(false));
  };

  const moveToDone = () => {
    setDone(true);
    toast.add({
      title: "Moved 3 issues to Done",
      description: "NW-412, NW-418 and NW-421",
      // An icon keeps this toast's title on the same x as the status toasts stacked with it (R101).
      data: { icon: <DoneIcon /> },
      action: { label: "Undo", onClick: () => setDone(false) },
    });
  };

  const retry = () =>
    toast.error("Build failed again", {
      description: "DATABASE_URL is missing in Preview. Add it under Settings → Environment.",
    });

  return (
    <DemoFrame
      title="northwind-web"
      actions={
        <Button variant="primary" size="sm" loading={deploying} onClick={deploy}>
          Deploy
        </Button>
      }
    >
      <div className="flex min-h-0 flex-1 flex-col gap-6 px-(--pad) py-4">
        <section className="flex flex-col gap-2">
          <h3 className="text-ui-sm font-medium text-text-muted">Linked issues</h3>
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-ui text-text">NW-412, NW-418, NW-421</span>
              <span className="text-ui-sm text-text-muted">
                3 issues · <TextSwap>{done ? "Done" : "In review"}</TextSwap>
              </span>
            </div>
            <Button size="sm" disabled={done} onClick={moveToDone}>
              Move to Done
            </Button>
          </div>
        </section>

        <section className="flex min-h-0 flex-col gap-1">
          <h3 className="text-ui-sm font-medium text-text-muted">Deployments</h3>
          <ul className={`${rowGrid} gap-x-3 [--col:4rem]`}>
            {deploys.map((d) => (
              <li key={d.id} className={`${rowGridRow} h-12`}>
                <span aria-hidden className={`size-2 rounded-pill ${d.status === "ready" ? "bg-success" : "bg-danger"}`} />
                <span className="flex min-w-0 flex-col">
                  <span className="truncate text-ui-sm text-text">{d.message}</span>
                  <span className="truncate text-ui-xs text-text-muted">{d.meta}</span>
                </span>
                <span className="flex justify-end">
                  {d.status === "failed" ? (
                    <Button variant="ghost" size="sm" edge="end" onClick={retry}>
                      Retry
                    </Button>
                  ) : (
                    <span className="text-ui-xs text-text-muted tabular-nums">{d.age}</span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>
      {/* The toast stack's portal target: the frame is the positioned ancestor. */}
      <div ref={layer} />
    </DemoFrame>
  );
}

function DoneIcon() {
  return (
    <svg viewBox="0 0 16 16" className="size-4 text-text-muted" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="8" cy="8" r="6.25" />
      <path d="M5.25 8.25 7 10l3.75-4" />
    </svg>
  );
}
