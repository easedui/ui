"use client";

import { useRef } from "react";
import { scrollFadeMask, useScrollEdges } from "../_primitives/scroll-fade/scroll-fade";
import { Button } from "../button/button";
import { DemoFrame } from "../lib/demo-frame";
import { FileUpload, useFileUpload, type FileUploadFn, type FileUploadItem } from "./file-upload";

const MB = 1_000_000;

const SEED: FileUploadItem[] = [
  { id: "seed-brand", name: "brand-guidelines-2026.pdf", size: 3.1 * MB, type: "application/pdf", status: "done" },
  { id: "seed-id", name: "photo-id-maya-okafor.jpg", size: 640_000, type: "image/jpeg", status: "done" },
];

// Fails once, the first time, so Retry has something to do.
const failedOnce = new Set<string>();

/** A pretend upload: progress in uneven steps, faster for small files; one file drops its connection once. */
const simulateUpload: FileUploadFn = (file, { onProgress, signal }) =>
  new Promise((resolve, reject) => {
    let done = 0;
    const rate = 0.9 * MB + Math.random() * 0.6 * MB; // bytes per second
    const flaky = file.name.includes("lease") && !failedOnce.has(file.name);
    const timer = window.setInterval(() => {
      done += (rate / 8) * (0.5 + Math.random());
      const fraction = Math.min(1, done / Math.max(1, file.size));
      if (flaky && fraction > 0.58) {
        window.clearInterval(timer);
        failedOnce.add(file.name);
        reject(new Error("Connection lost at 58%"));
        return;
      }
      onProgress(fraction);
      if (fraction >= 1) {
        window.clearInterval(timer);
        resolve(undefined);
      }
    }, 125);
    signal.addEventListener("abort", () => window.clearInterval(timer));
  });

const sample = (name: string, size: number, type: string) => new File([new ArrayBuffer(size)], name, { type });

/** Upload documents for a lease: browse, drop or paste, or try the samples. */
export function FileUploadDemo() {
  const upload = useFileUpload({ upload: simulateUpload, accept: "application/pdf,image/*", maxSize: 5 * MB, maxFiles: 8, defaultValue: SEED });
  const scroller = useRef<HTMLDivElement>(null);
  useScrollEdges(scroller);
  const done = upload.items.filter((f) => f.status === "done").length;

  return (
    <DemoFrame
      title="Lease documents"
      meta={`${done} of ${upload.items.length}`}
      actions={
        <Button
          variant="ghost"
          size="sm"
          edge="end"
          disabled={upload.items.some((f) => f.name === "signed-lease-agreement.pdf")}
          onClick={() =>
            upload.add([
              sample("signed-lease-agreement.pdf", 1.8 * MB, "application/pdf"),
              sample("unit-4b-floorplan.png", 2.4 * MB, "image/png"),
              sample("move-in-inspection.jpg", 0.9 * MB, "image/jpeg"),
              sample("drone-survey-raw.png", 6.2 * MB, "image/png"),
            ])
          }
        >
          Try samples
        </Button>
      }
    >
      <div ref={scroller} style={scrollFadeMask("y", 20)} className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4">
        <FileUpload controller={upload} listLabel="Lease documents" />
      </div>
    </DemoFrame>
  );
}
