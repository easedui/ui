"use client";

import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState, type ComponentPropsWithoutRef } from "react";
import { TextSwap } from "../text-swap/text-swap";
import { exitFast, fade, reducedFade, snappy, swap, swapIn, swapOut, swapShown, useSafeReducedMotion } from "../../lib/motion";
import { pressIcon } from "../../lib/press";

/** How long the check stays before the copy icon returns, ms. */
export const COPIED_MS = 1600;

/** Write text to the clipboard, falling back to a hidden textarea where the async API is blocked. */
export async function writeClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const el = document.createElement("textarea");
      el.value = text;
      el.setAttribute("readonly", "");
      el.style.cssText = "position:fixed;opacity:0;pointer-events:none";
      document.body.append(el);
      el.select();
      const ok = document.execCommand("copy");
      el.remove();
      return ok;
    } catch {
      return false;
    }
  }
}

/**
 * Copy state for any trigger: `copy()` writes the text and flips `copied` for `COPIED_MS`.
 * Copying again restarts the timer, so the check never flickers off between quick copies.
 */
export function useCopy(text: string | (() => string), { timeout = COPIED_MS, onCopy }: { timeout?: number; onCopy?: (text: string) => void } = {}) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const copy = useCallback(async () => {
    const value = typeof text === "function" ? text() : text;
    if (!(await writeClipboard(value))) return false;
    onCopy?.(value);
    setCopied(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), timeout);
    return true;
  }, [text, timeout, onCopy]);
  return { copied, copy };
}

/**
 * The copy → check morph. The two sheets lift and blur away while the check draws itself in
 * on the snappy spring; going back, the check leaves faster than it came (exit ≤ 0.75 ×
 * enter). Reduced motion: a plain cross-fade.
 */
export function CopyIcon({ copied, className = "" }: { copied: boolean; className?: string }) {
  const reduced = useSafeReducedMotion();
  return (
    <span aria-hidden className={`relative inline-flex size-4 shrink-0 items-center justify-center ${className}`}>
      <AnimatePresence initial={false} mode="popLayout">
        {copied ? (
          <motion.svg
            key="check"
            viewBox="0 0 16 16"
            fill="none"
            className="size-4 overflow-visible"
            initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.8, filter: "blur(2px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            exit={reduced ? { opacity: 0, transition: reducedFade } : { ...swapOut, transition: { ...swap, opacity: exitFast, filter: exitFast } }}
            transition={reduced ? reducedFade : { ...snappy, opacity: fade, filter: fade }}
          >
            <motion.path
              d="M3.25 8.5 6.5 11.75 12.75 4.75"
              stroke="currentColor"
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={reduced ? false : { pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ ...snappy, delay: 0.04 }}
            />
          </motion.svg>
        ) : (
          <motion.svg
            key="copy"
            viewBox="0 0 16 16"
            fill="none"
            className="size-4"
            initial={reduced ? { opacity: 0 } : swapIn}
            animate={reduced ? { opacity: 1 } : swapShown}
            exit={reduced ? { opacity: 0, transition: reducedFade } : { opacity: 0, scale: 0.85, filter: "blur(2px)", transition: { ...snappy, opacity: exitFast, filter: exitFast } }}
            transition={reduced ? reducedFade : swap}
          >
            <rect x="5.25" y="5.25" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="1.5" />
            <path d="M10.75 5.25V4.5a1.75 1.75 0 0 0-1.75-1.75H4.5A1.75 1.75 0 0 0 2.75 4.5V9a1.75 1.75 0 0 0 1.75 1.75h.75" stroke="currentColor" strokeWidth="1.5" />
          </motion.svg>
        )}
      </AnimatePresence>
    </span>
  );
}

export type CopyButtonProps = Omit<ComponentPropsWithoutRef<"button">, "onClick" | "children" | "onCopy"> & {
  /** The text to copy, or a function that returns it at click time. */
  text: string | (() => string);
  /** Accessible name. Default "Copy code". */
  label?: string;
  /**
   * Slide a "Copied" label out to the left of the check (the button grows leftward on a
   * spring and shrinks back). Default true; pass false where there is no room.
   */
  showLabel?: boolean;
  /** Extend the target to 44×44px. Default true; pass false inside a row of other targets. */
  hitArea?: boolean;
  /** Radius class. Default `rounded-control-sm`; pass `radius-nested` inside a padded control. */
  radius?: string;
  onCopy?: (text: string) => void;
};

/**
 * A 32px ghost copy button with the copy → check morph. Announces "Copied" politely to
 * screen readers. Its right edge stays put when the label slides out, so park it at the
 * end of a row.
 */
export function CopyButton({ text, label = "Copy code", showLabel = true, hitArea = true, radius = "rounded-control-sm", onCopy, className = "", ...props }: CopyButtonProps) {
  const { copied, copy } = useCopy(text, { onCopy });
  return (
    <>
      <button
        type="button"
        aria-label={label}
        {...props}
        onClick={() => void copy()}
        className={`relative inline-flex h-8 min-w-8 shrink-0 cursor-pointer items-center justify-center ${radius} px-2 text-ui-sm font-medium whitespace-nowrap select-none ${
          copied ? "text-text" : "text-text-muted hover-fine:text-text"
        } hover-fine:bg-surface-hover active:bg-surface-active ${pressIcon} ${hitArea ? "hit-area" : ""} ${className}`}
      >
        {showLabel && (
          <TextSwap swapKey={copied ? "copied" : "idle"} aria-hidden>
            {copied ? <span className="pr-1.5">Copied</span> : null}
          </TextSwap>
        )}
        <CopyIcon copied={copied} />
      </button>
      <span role="status" className="sr-only">
        {copied ? "Copied" : ""}
      </span>
    </>
  );
}
