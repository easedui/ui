"use client";

import { AnimatePresence, animate, motion, useMotionValue } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Kbd } from "../kbd/kbd";
import { isEditable } from "../lib/dom";
import { enter, exit, reducedFade, smooth, swap, swapIn, swapOut, swapShown, useSafeReducedMotion } from "../lib/motion";
import { useIsMac } from "../lib/platform";
import { press } from "../lib/press";

export type UndoPillLabels = {
  /** The button label. Default "Undo". */
  undo: string;
  /** The shortcut hint beside it, one keycap per space-separated key. Default "⌘ Z" on Apple platforms, "Ctrl Z" elsewhere. */
  shortcut: (mac: boolean) => string;
};

export type UndoPillProps = {
  /** Show the pill. Keep it mounted and toggle this so the exit animates. */
  open: boolean;
  /** What happened, e.g. `Deleted "Q3 roadmap.pdf"`. Changing it restarts the countdown. */
  message: string;
  onUndo: () => void;
  /** Called when the countdown runs out: commit the destructive action here. */
  onExpire: () => void;
  /** Countdown length in ms. Changing it while open restarts the countdown. */
  duration?: number;
  /** Bind ⌘Z / Ctrl+Z to undo while the pill is open. Ignored while typing in a field. */
  shortcut?: boolean;
  /** Pause the countdown while the pointer is over the pill. Default true. */
  pauseOnHover?: boolean;
  /** Pause the countdown while focus is inside the pill. Default true. */
  pauseOnFocus?: boolean;
  /** Called when hover or focus pauses the countdown, and when it resumes. */
  onPause?: () => void;
  onResume?: () => void;
  /** Where the pill sits in its positioned parent: centred at the bottom (default) or top, or "none" to place it yourself. */
  placement?: "bottom" | "top" | "none";
  labels?: Partial<UndoPillLabels>;
  /** Appended to the pill's classes; placement is kept. */
  className?: string;
};

const RING = 2 * Math.PI * 7; // circumference of the r=7 countdown ring

const PLACEMENT = {
  // Inset on both sides and centred with auto margins, so the pill may grow to the full width
  // less 16px a side before its message truncates (a left-1/2 box is capped at half).
  bottom: "absolute inset-x-4 bottom-4 mx-auto w-max max-w-[calc(100%-2rem)]",
  top: "absolute inset-x-4 top-4 mx-auto w-max max-w-[calc(100%-2rem)]",
  none: "",
};

const DEFAULT_LABELS: UndoPillLabels = { undo: "Undo", shortcut: (mac) => (mac ? "⌘ Z" : "Ctrl Z") };

/**
 * The never-act-immediately pattern: a destructive action shows this pill with
 * a draining ring; Undo reverts it, and only expiry commits it.
 */
export function UndoPill({
  open,
  message,
  onUndo,
  onExpire,
  duration = 5000,
  shortcut = true,
  pauseOnHover = true,
  pauseOnFocus = true,
  onPause,
  onResume,
  placement = "bottom",
  labels,
  className = "",
}: UndoPillProps) {
  const reduce = useSafeReducedMotion();
  const mac = useIsMac();
  const text = { ...DEFAULT_LABELS, ...labels };

  // Hover and focus are held apart. Clicking Undo removes the pill under the pointer, so
  // neither leave nor blur fires: both reset whenever the pill opens, or it would reopen paused.
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setHovered(false);
      setFocused(false);
    }
  }
  const paused = open && ((pauseOnHover && hovered) || (pauseOnFocus && focused));

  const remaining = useRef(duration);
  const startedAt = useRef(0);
  const drained = useMotionValue(0);
  const callbacks = useRef({ onExpire, onPause, onResume });
  useEffect(() => {
    callbacks.current = { onExpire, onPause, onResume };
  });

  // Opening, a new message (a new action) or a new duration starts the countdown over.
  useEffect(() => {
    if (!open) return;
    remaining.current = duration;
    drained.jump(0);
  }, [open, message, duration, drained]);

  // The timer owns expiry, and the ring is driven from the same clock in JS, so neither
  // reduced motion nor a global animation clamp can drain it early.
  useEffect(() => {
    if (!open || paused) return;
    startedAt.current = performance.now();
    const t = window.setTimeout(() => callbacks.current.onExpire(), remaining.current);
    const ring = animate(drained, RING, { duration: Math.max(0, remaining.current) / 1000, ease: "linear" });
    return () => {
      window.clearTimeout(t);
      ring.stop();
      remaining.current -= performance.now() - startedAt.current;
    };
  }, [open, paused, message, duration, drained]);

  const wasPaused = useRef(paused);
  useEffect(() => {
    if (wasPaused.current === paused) return;
    wasPaused.current = paused;
    if (paused) callbacks.current.onPause?.();
    else if (open) callbacks.current.onResume?.();
  }, [paused, open]);

  const undo = useCallback(() => {
    if (open) onUndo();
  }, [open, onUndo]);

  useEffect(() => {
    if (!open || !shortcut) return;
    const onKey = (e: KeyboardEvent) => {
      if (isEditable(e.target)) return;
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && e.key.toLowerCase() === "z") {
        e.preventDefault();
        undo();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, shortcut, undo]);

  const rise = placement === "top" ? -1 : 1;

  return (
    <>
      {/* A live region must exist before its text changes, so it stays mounted outside the pill. */}
      <span role="status" className="sr-only">
        {open ? message : ""}
      </span>
      <AnimatePresence>
        {open && (
          <motion.div
            layout
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 12 * rise, scale: 0.97, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
            exit={
              reduce
                ? { opacity: 0, transition: reducedFade }
                : { opacity: 0, y: 6 * rise, scale: 0.98, filter: "blur(4px)", transition: exit }
            }
            transition={reduce ? reducedFade : { ...smooth, opacity: enter, filter: enter }}
            onPointerEnter={() => setHovered(true)}
            onPointerLeave={() => setHovered(false)}
            onFocus={() => setFocused(true)}
            onBlur={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget)) setFocused(false);
            }}
            className={`z-10 flex h-11 items-center gap-3 rounded-pill border border-line bg-surface-raised pr-1.5 pl-3 text-ui shadow-overlay ${PLACEMENT[placement]} ${className}`}
          >
            <svg viewBox="0 0 18 18" className="size-[18px] shrink-0 -rotate-90" aria-hidden>
              <circle cx="9" cy="9" r="7" fill="none" strokeWidth="2" className="stroke-line" />
              <motion.circle
                cx="9"
                cy="9"
                r="7"
                fill="none"
                strokeWidth="2"
                strokeLinecap="round"
                strokeDasharray={RING}
                className="stroke-text-secondary"
                style={{ strokeDashoffset: drained }}
              />
            </svg>

            <motion.span layout="position" className="relative min-w-0 overflow-hidden whitespace-nowrap text-text">
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.span
                  key={message}
                  className="block truncate"
                  initial={reduce ? { opacity: 0 } : swapIn}
                  animate={swapShown}
                  exit={reduce ? { opacity: 0 } : swapOut}
                  transition={reduce ? reducedFade : swap}
                >
                  {message}
                </motion.span>
              </AnimatePresence>
            </motion.span>

            <motion.button
              layout="position"
              type="button"
              onClick={undo}
              className={`inline-flex h-control-sm shrink-0 cursor-pointer items-center gap-1.5 rounded-pill bg-surface-hover px-3 text-ui-sm font-medium text-text hover-fine:bg-surface-active ${press}`}
            >
              {text.undo}
              {shortcut && <Kbd keys={text.shortcut(mac).split(" ")} listen={false} />}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export type UndoQueueOptions<T> = {
  /** The pill's text for the pending items, e.g. `items.length === 1 ? "Deleted …" : "Deleted 3 files"`. */
  message: (items: T[]) => string;
  /** Put the items back. */
  onUndo?: (items: T[]) => void;
  /** The countdown ran out: make the action permanent. */
  onCommit?: (items: T[]) => void;
};

/**
 * The state machine every Undo Pill needs: actions taken while the pill is open join one
 * batch, Undo restores the whole batch, expiry commits it. Spread `pill` onto `<UndoPill>`.
 */
export function useUndoQueue<T>({ message, onUndo, onCommit }: UndoQueueOptions<T>) {
  const [pending, setPending] = useState<T[]>([]);
  const push = useCallback((item: T) => setPending((p) => [...p, item]), []);
  const undo = () => {
    onUndo?.(pending);
    setPending([]);
  };
  const commit = () => {
    onCommit?.(pending);
    setPending([]);
  };
  return {
    pending,
    push,
    undo,
    commit,
    pill: { open: pending.length > 0, message: pending.length > 0 ? message(pending) : "", onUndo: undo, onExpire: commit },
  };
}
