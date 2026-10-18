"use client";

import { useEffect, useRef } from "react";
import { useAttachments, type Attachment, type UploadFn } from "../_primitives/chat-core/chat-core";
import { Button } from "../button/button";
import { DemoFrame } from "../lib/demo-frame";
import { AttachmentList } from "./attachment-chip";

/** A small landscape as an SVG data URL, so the demo ships no image files. */
export function scene(sky: string, sun: string, far: string, near: string, sunX = 64) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><defs><linearGradient id="s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${sky}"/><stop offset="1" stop-color="${sun}" stop-opacity=".55"/></linearGradient></defs><rect width="120" height="120" fill="url(#s)"/><circle cx="${sunX}" cy="52" r="15" fill="${sun}"/><path d="M0 78 Q30 58 58 74 T120 66 V120 H0Z" fill="${far}"/><path d="M0 96 Q40 76 76 92 T120 88 V120 H0Z" fill="${near}"/></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/**
 * A pretend upload: progress in uneven steps over ~1.5–2.5s (like a real network), failing
 * when the name contains "fail". Respects the abort signal.
 */
export const fakeUpload: UploadFn = (file, { onProgress, signal }) =>
  new Promise((resolve, reject) => {
    let p = 0;
    const id = window.setInterval(() => {
      p = Math.min(1, p + 0.06 + Math.random() * 0.14);
      onProgress(p);
      if (/fail/i.test(file.name) && p > 0.55) {
        clearInterval(id);
        reject(new Error("Connection lost"));
      } else if (p >= 1) {
        clearInterval(id);
        resolve({ url: URL.createObjectURL(file) });
      }
    }, 220);
    signal.addEventListener("abort", () => clearInterval(id));
  });

const SEED: Attachment[] = [
  { id: "a1", name: "harbour-dawn.png", kind: "image", mediaType: "image/png", previewUrl: scene("#f6d6b8", "#f08a5d", "#7a8fb0", "#3e4f6e", 70), status: "done" },
  { id: "a2", name: "Q3 board deck.pdf", kind: "file", mediaType: "application/pdf", size: 4_812_000, status: "done" },
  { id: "a3", name: "dunes.jpg", kind: "image", mediaType: "image/jpeg", previewUrl: scene("#fbe7c6", "#e9a15a", "#d8a46c", "#a7683a", 40), status: "uploading", progress: 0.42 },
  { id: "a4", name: "churn-by-cohort.csv", kind: "file", mediaType: "text/csv", size: 218_400, status: "error", error: "Connection lost" },
];

/** Uploads in flight, a finished deck, a failed CSV with Retry; add your own files to watch the ring. */
export function AttachmentChipDemo() {
  const input = useRef<HTMLInputElement>(null);
  const { attachments, add, remove, retry, update } = useAttachments({ upload: fakeUpload, defaultValue: SEED, maxSize: 20_000_000 });

  const timers = useRef<number[]>([]);
  // Seeded chips have no File, so drive their "upload" here.
  const drive = (id: string, from: number) => {
    update(id, { status: "uploading", progress: from, error: undefined });
    let p = from;
    const t = window.setInterval(() => {
      p = Math.min(1, p + 0.08 + Math.random() * 0.1);
      update(id, p >= 1 ? { status: "done", progress: 1 } : { progress: p });
      if (p >= 1) clearInterval(t);
    }, 260);
    timers.current.push(t);
  };
  useEffect(() => {
    const start = window.setTimeout(() => drive("a3", 0.42), 900);
    const list = timers.current;
    return () => {
      clearTimeout(start);
      list.forEach(clearInterval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <DemoFrame title="New message" meta={`${attachments.length} ${attachments.length === 1 ? "file" : "files"}`}>
      <div className="flex min-h-0 flex-1 flex-col gap-4 p-4">
        <div className="flex flex-col gap-1">
          <p className="text-ui-sm text-text-muted">To</p>
          <p className="text-ui text-text">Finance team</p>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto pt-1.5 [scrollbar-width:thin]">
          <AttachmentList
            attachments={attachments}
            onRemove={remove}
            onRetry={(id) => (attachments.find((a) => a.id === id)?.file ? retry(id) : drive(id, 0.05))}
          />
        </div>
        <div className="flex items-center gap-2 border-t border-line-subtle pt-4">
          <p className="min-w-0 flex-1 truncate text-ui-sm text-text-muted">Up to 20&nbsp;MB per file</p>
          <Button variant="secondary" size="sm" onClick={() => input.current?.click()}>
            Add files
          </Button>
          <input
            ref={input}
            type="file"
            multiple
            className="sr-only"
            tabIndex={-1}
            aria-hidden
            onChange={(e) => {
              add(Array.from(e.target.files ?? []));
              e.target.value = "";
            }}
          />
        </div>
      </div>
    </DemoFrame>
  );
}
