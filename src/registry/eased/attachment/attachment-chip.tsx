"use client";

import { AnimatePresence, motion, useInView } from "motion/react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { fileTypeLabel, formatBytes, type Attachment } from "../_primitives/chat-core/chat-core";
import { TextSwap } from "../_primitives/text-swap/text-swap";
import { blur, enter, exitFast, fade, instant, reducedFade, smooth, snappy, useSafeReducedMotion } from "../lib/motion";
import { pressIcon } from "../lib/press";

export type AttachmentChipProps = {
  attachment: Attachment;
  /** Shows the remove button (top-right; on hover and focus with a fine pointer, always on touch). */
  onRemove?: (id: string) => void;
  /** Shows Retry on a failed upload. */
  onRetry?: (id: string) => void;
  /** `auto` (default): images as a thumbnail tile, everything else as a file chip. `file` forces the chip. */
  variant?: "auto" | "file";
  className?: string;
};

const RING = 20;
const R = 8;

/**
 * One attachment: a thumbnail for images, a typed chip for files. The thumbnail sharpens from
 * a 4px blur once it decodes; upload progress is a ring that springs between reported values
 * (and spins when the size is unknown); a failure shakes once and offers Retry.
 */
export function AttachmentChip({ attachment: a, onRemove, onRetry, variant = "auto", className = "" }: AttachmentChipProps) {
  const reduced = useSafeReducedMotion();
  const status = a.status ?? "done";
  const shake = useShake(status === "error", reduced);
  const image = variant === "auto" && a.kind === "image";
  const src = a.previewUrl ?? a.url;
  const progressText = a.progress !== undefined ? `${Math.round(a.progress * 100)}%` : "";
  const label = `${a.name}${status === "uploading" ? `, uploading ${progressText}` : status === "error" ? `, failed: ${a.error ?? "upload failed"}` : ""}`;

  const remove = onRemove && (
    <button
      type="button"
      aria-label={`Remove ${a.name}`}
      onClick={() => onRemove(a.id)}
      className={`absolute -top-1.5 -right-1.5 z-10 inline-flex size-5 cursor-pointer items-center justify-center rounded-pill border border-line bg-surface-raised text-text-secondary shadow-resting hit-area hover-fine:text-text pointer-fine:opacity-0 pointer-fine:group-hover-fine:opacity-100 pointer-fine:focus-visible:opacity-100 pointer-fine:group-focus-within:opacity-100 ${pressIcon}`}
    >
      <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" className="size-2.5" aria-hidden>
        <path d="M3 3l6 6M9 3l-6 6" />
      </svg>
    </button>
  );

  if (image) {
    return (
      <motion.div ref={shake} role="group" aria-label={label} className={`group relative size-14 shrink-0 ${className}`}>
        <div
          className={`relative size-full overflow-clip rounded-control bg-surface-sunken image-ring ${status === "error" ? "ring-1 ring-danger ring-inset" : ""}`}
        >
          {src && <Thumb src={src} reduced={reduced} />}
          <AnimatePresence initial={false}>
            {status !== "done" && (
              <motion.div
                key="veil"
                className="absolute inset-0 flex items-center justify-center rounded-[inherit] bg-surface/70 backdrop-blur-[2px]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: reduced ? reducedFade : enter }}
                exit={{ opacity: 0, transition: reduced ? reducedFade : { ...fade, delay: 0.25 } }}
              >
                {status === "error" ? (
                  onRetry ? <RetryIcon name={a.name} onRetry={() => onRetry(a.id)} /> : <ErrorGlyph />
                ) : (
                  <ProgressRing value={a.progress} name={a.name} />
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        {remove}
      </motion.div>
    );
  }

  const meta =
    status === "uploading"
      ? `Uploading… ${progressText}`.trim()
      : status === "error"
        ? (a.error ?? "Upload failed")
        : [fileTypeLabel(a), a.size !== undefined ? formatBytes(a.size) : null].filter(Boolean).join(" · ");

  return (
    <motion.div
      ref={shake}
      role="group"
      aria-label={label}
      className={`group relative grid h-14 w-56 max-w-full shrink-0 grid-cols-[auto_minmax(0,1fr)] items-center gap-2.5 rounded-control border bg-surface p-1.5 pr-3 [--pad:6px] [--radius-outer:var(--eased-radius-control)] ${
        status === "error" ? "border-danger" : "border-line-subtle"
      } ${className}`}
    >
      <div
        className={`relative flex size-11 items-center justify-center overflow-clip rounded-control-2xs transition-colors duration-150 ease-standard ${
          status === "error" ? "bg-danger-subtle text-danger-text" : "bg-surface-sunken text-text-secondary"
        }`}
      >
        <AnimatePresence initial={false} mode="popLayout">
          <motion.span
            key={status}
            className="flex items-center justify-center"
            initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.9, filter: `blur(${blur.soft})` }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)", transition: reduced ? reducedFade : { ...snappy, opacity: enter, filter: enter } }}
            exit={{ opacity: 0, scale: reduced ? 1 : 0.9, filter: reduced ? "blur(0px)" : `blur(${blur.soft})`, transition: reduced ? reducedFade : exitFast }}
          >
            {status === "uploading" ? (
              <ProgressRing value={a.progress} name={a.name} />
            ) : status === "error" ? (
              <ErrorGlyph />
            ) : (
              <span className="text-ui-2xs font-medium tracking-caps select-none">{fileTypeLabel(a)}</span>
            )}
          </motion.span>
        </AnimatePresence>
      </div>
      <div className="flex min-w-0 flex-col">
        <p className="truncate text-ui-sm font-medium text-text" title={a.name}>
          {a.name}
        </p>
        <div className="flex min-w-0 items-baseline gap-2 text-ui-xs">
          <span className={`truncate tabular-nums ${status === "error" ? "text-danger-text" : "text-text-muted"}`}>
            <TextSwap swapKey={status}>{meta}</TextSwap>
          </span>
          {status === "error" && onRetry && (
            <button
              type="button"
              onClick={() => onRetry(a.id)}
              className="shrink-0 cursor-pointer rounded-control-2xs font-medium text-text underline decoration-line-strong underline-offset-2 focus-ring hover-fine:decoration-text"
            >
              Retry
            </button>
          )}
        </div>
      </div>
      {remove}
    </motion.div>
  );
}

/* ---------- The list ---------------------------------------------------------- */

export type AttachmentListProps = {
  attachments: Attachment[];
  onRemove?: (id: string) => void;
  onRetry?: (id: string) => void;
  /** Accessible name of the list. Default "Attachments". */
  label?: string;
  className?: string;
  /** Render something after the chips (e.g. an "Add" tile). */
  children?: ReactNode;
};

/**
 * A wrapping row of chips. New chips pop in from 0.9; a removed chip shrinks away and its
 * neighbours slide into the gap. Nothing animates on first render.
 */
export function AttachmentList({ attachments, onRemove, onRetry, label = "Attachments", className = "", children }: AttachmentListProps) {
  const reduced = useSafeReducedMotion();
  return (
    <ul aria-label={label} className={`relative flex flex-wrap items-end gap-2 ${className}`}>
      <AnimatePresence initial={false} mode="popLayout">
        {attachments.map((a) => (
          <motion.li
            key={a.id}
            layout={reduced ? false : "position"}
            className="flex min-w-0"
            initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1, transition: reduced ? reducedFade : { ...snappy, opacity: enter } }}
            exit={{ opacity: 0, scale: reduced ? 1 : 0.9, transition: reduced ? reducedFade : exitFast }}
            transition={reduced ? instant : smooth}
          >
            <AttachmentChip attachment={a} onRemove={onRemove} onRetry={onRetry} />
          </motion.li>
        ))}
      </AnimatePresence>
      {children}
    </ul>
  );
}

/* ---------- Parts ------------------------------------------------------------- */

function Thumb({ src, reduced }: { src: string; reduced: boolean }) {
  const [loaded, setLoaded] = useState(false);
  const ref = useRef<HTMLImageElement>(null);
  // A cached or data: image can finish before hydration attaches onLoad.
  useEffect(() => {
    const img = ref.current;
    if (img?.complete && img.naturalWidth > 0) setLoaded(true);
  }, [src]);
  return (
    <motion.img
      ref={ref}
      src={src}
      alt=""
      decoding="async"
      draggable={false}
      onLoad={() => setLoaded(true)}
      className="absolute inset-0 size-full object-cover select-none dark:brightness-[.93] dark:saturate-[.96]"
      initial={false}
      animate={loaded ? { opacity: 1, filter: "blur(0px)" } : { opacity: 0, filter: reduced ? "blur(0px)" : `blur(${blur.soft})` }}
      transition={reduced ? reducedFade : { duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
    />
  );
}

/** A 20px ring: springs to `value` (0–1), or spins a quarter arc while the size is unknown. */
export function ProgressRing({ value, name }: { value?: number; name: string }) {
  const reduced = useSafeReducedMotion();
  const ref = useRef<SVGSVGElement>(null);
  const inView = useInView(ref);
  const known = value !== undefined;
  return (
    <svg
      ref={ref}
      viewBox={`0 0 ${RING} ${RING}`}
      className={`size-5 -rotate-90 text-brand ${known ? "" : "animate-spin reduced:animate-none"}`}
      style={known ? undefined : { animationDuration: "900ms", animationPlayState: inView ? "running" : "paused" }}
      role="progressbar"
      aria-label={`Uploading ${name}`}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={known ? Math.round(value * 100) : undefined}
    >
      <circle cx={RING / 2} cy={RING / 2} r={R} fill="none" stroke="currentColor" strokeOpacity={0.18} strokeWidth={2} />
      <motion.circle
        cx={RING / 2}
        cy={RING / 2}
        r={R}
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        initial={false}
        animate={{ pathLength: known ? Math.max(0.02, value) : 0.25 }}
        transition={reduced ? instant : smooth}
      />
    </svg>
  );
}

function ErrorGlyph() {
  return (
    <svg viewBox="0 0 16 16" className="size-4 text-danger-text" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" aria-hidden>
      <circle cx="8" cy="8" r="6.25" />
      <path d="M8 4.75v3.5" />
      <path d="M8 11.1v.15" strokeWidth={2} />
    </svg>
  );
}

function RetryIcon({ name, onRetry }: { name: string; onRetry: () => void }) {
  return (
    <button
      type="button"
      aria-label={`Retry ${name}`}
      onClick={onRetry}
      className={`inline-flex size-8 cursor-pointer items-center justify-center rounded-pill bg-surface-raised text-danger-text shadow-resting hover-fine:text-text ${pressIcon}`}
    >
      <svg viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M13 8a5 5 0 1 1-1.6-3.66" />
        <path d="M13 2.75v2.5h-2.5" />
      </svg>
    </button>
  );
}

/** Shakes the element once each time `on` turns true (rule: errors shake, never loop). */
function useShake(on: boolean, reduced: boolean) {
  const ref = useRef<HTMLDivElement>(null);
  const was = useRef(on);
  useEffect(() => {
    if (on && !was.current && !reduced && ref.current) {
      ref.current.animate(
        [{ translate: "0" }, { translate: "-3px" }, { translate: "3px" }, { translate: "-2px" }, { translate: "1px" }, { translate: "0" }],
        { duration: 320, easing: "cubic-bezier(0.22, 1, 0.36, 1)" },
      );
    }
    was.current = on;
  }, [on, reduced]);
  return ref;
}
