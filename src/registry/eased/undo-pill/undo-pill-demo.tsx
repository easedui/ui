"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { DemoFrame } from "../lib/demo-frame";
import { enter, exit, reducedFade, smooth, useSafeReducedMotion } from "../lib/motion";
import { press, pressIcon } from "../lib/press";
import { UndoPill, useUndoQueue } from "./undo-pill";

type File = { id: string; name: string; size: string; edited: string; kind: "pdf" | "fig" | "doc" | "sheet" };

const FILES: File[] = [
  { id: "1", name: "Q3 roadmap.pdf", size: "2.4\u00a0MB", edited: "2h ago", kind: "pdf" },
  { id: "2", name: "Onboarding flow.fig", size: "18.1\u00a0MB", edited: "Yesterday", kind: "fig" },
  { id: "3", name: "Launch checklist.md", size: "4\u00a0KB", edited: "Mon", kind: "doc" },
  { id: "4", name: "Pricing experiments.csv", size: "312\u00a0KB", edited: "Oct 9", kind: "sheet" },
  { id: "5", name: "Brand guidelines.pdf", size: "7.8\u00a0MB", edited: "Sep 28", kind: "pdf" },
  { id: "6", name: "Investor update.md", size: "9\u00a0KB", edited: "Sep 21", kind: "doc" },
];

const order = (ids: string[]) => FILES.filter((f) => ids.includes(f.id));

export function UndoPillDemo() {
  const reduce = useSafeReducedMotion();
  const [visible, setVisible] = useState(FILES.map((f) => f.id));
  const queue = useUndoQueue<string>({
    message: (ids) =>
      ids.length === 1 ? `Deleted “${FILES.find((f) => f.id === ids[0])?.name}”` : `Deleted ${ids.length} files`,
    onUndo: (ids) => setVisible((v) => [...v, ...ids]),
  });

  const remove = (id: string) => {
    setVisible((v) => v.filter((x) => x !== id));
    queue.push(id);
  };
  const reset = () => setVisible(FILES.map((f) => f.id));

  return (
    <DemoFrame title="Files" meta={`${visible.length} ${visible.length === 1 ? "item" : "items"}`}>

      <ul className="relative p-1.5">
        <AnimatePresence mode="popLayout" initial={false}>
          {order(visible).map((file) => (
            <motion.li
              key={file.id}
              layout
              initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.98, filter: "blur(4px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              exit={
                reduce
                  ? { opacity: 0, transition: reducedFade }
                  : { opacity: 0, x: -12, filter: "blur(4px)", transition: exit }
              }
              transition={reduce ? reducedFade : { ...smooth, opacity: enter, filter: enter }}
              className="group flex h-14 min-w-0 items-center gap-3 rounded-control pr-0.5 pl-2.5 transition-colors duration-150 ease-standard hover-fine:bg-surface-hover"
            >
              <FileIcon kind={file.kind} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-ui text-text">{file.name}</p>
                <p className="text-ui-sm text-text-muted tabular-nums">
                  {file.size} · {file.edited}
                </p>
              </div>
              <button
                type="button"
                onClick={() => remove(file.id)}
                aria-label={`Delete ${file.name}`}
                className={`hit-area inline-flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-control-sm text-text-muted hover-fine:bg-surface-hover hover-fine:text-text active:bg-surface-active [@media(hover:hover)]:opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 ${pressIcon}`}
              >
                <svg viewBox="0 0 16 16" className="size-4" fill="none" aria-hidden>
                  <path
                    d="M2.75 4.25h10.5M6.25 4.25V3a.75.75 0 0 1 .75-.75h2a.75.75 0 0 1 .75.75v1.25M4.25 4.25l.6 8.4a1 1 0 0 0 1 .93h4.3a1 1 0 0 0 1-.93l.6-8.4"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>

      {visible.length === 0 && queue.pending.length === 0 && (
        <div className="absolute inset-0 top-12 flex flex-col items-center justify-center gap-3">
          <p className="text-ui text-text-muted">All files deleted.</p>
          <button
            type="button"
            onClick={reset}
            className={`h-control-sm cursor-pointer rounded-control-sm bg-surface-hover px-3 text-ui-sm font-medium text-text hover-fine:bg-surface-active ${press}`}
          >
            Restore demo
          </button>
        </div>
      )}

      <UndoPill {...queue.pill} />
    </DemoFrame>
  );
}

function FileIcon({ kind }: { kind: File["kind"] }) {
  const label = { pdf: "PDF", fig: "FIG", doc: "MD", sheet: "CSV" }[kind];
  return (
    <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-control-sm border border-line-subtle bg-surface-sunken font-mono text-ui-2xs font-medium tracking-caps text-text-secondary">
      {label}
    </span>
  );
}
