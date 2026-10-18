"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import {
  fromFilePart,
  isFilePart,
  isTextPart,
  messageText,
  type ChatMessage,
  type ChatRole,
  type GroupPosition,
} from "../_primitives/chat-core/chat-core";
import { AttachmentChip } from "../attachment/attachment-chip";
import { enter, exitFast, reducedFade, smooth, swap, swapIn, swapOut, swapShown, useSafeReducedMotion } from "../lib/motion";
import { pressIcon } from "../lib/press";

export type MessageProps = {
  /** An AI SDK `UIMessage` (or Eased `ChatMessage`). Its text and file parts are rendered; pass `children` to render parts yourself. */
  message?: ChatMessage;
  /** Defaults to `message.role`. User messages sit in a bubble on the right; assistant messages are flush (rule 95). */
  role?: ChatRole;
  /**
   * Where it sits in a run from one author (`groupMessages` gives you this). Bubble corners
   * that touch a neighbour tighten, and morph as the next message lands. Default `single`.
   */
  position?: GroupPosition;
  /** Replaces the rendered text, e.g. with a streaming Response. */
  children?: ReactNode;
  /** An action row under the message: Copy, Retry, thumbs. */
  actions?: ReactNode;
  /** `hover` (default): shown on hover and focus with a fine pointer, always on touch. It keeps its space either way. */
  actionsVisible?: "hover" | "always";
  /** Rise in once on mount: pass true for messages that arrive after the list has rendered. */
  animateIn?: boolean;
  className?: string;
};

const BIG = "var(--eased-radius-panel)";
const SMALL = "var(--eased-radius-control-xs)";

/** The bubble's end-side corners by group position: tight where it touches a neighbour. */
const CORNERS: Record<GroupPosition, [top: string, bottom: string]> = {
  single: [BIG, BIG],
  first: [BIG, SMALL],
  middle: [SMALL, SMALL],
  last: [SMALL, BIG],
};

/**
 * One chat message. The user's sits in a sunken bubble on the right, the assistant's flush
 * on the left. Consecutive bubbles from one author merge: the corners where they meet
 * tighten from 16px to 6px, transitioning as the next one lands, so the run reflows instead
 * of snapping. Files show as thumbnails above the bubble.
 */
export function Message({
  message,
  role = message?.role ?? "assistant",
  position = "single",
  children,
  actions,
  actionsVisible = "hover",
  animateIn = false,
  className = "",
}: MessageProps) {
  const reduced = useSafeReducedMotion();
  const user = role === "user";
  const files = message?.parts.filter(isFilePart) ?? [];
  const text = message ? message.parts.filter(isTextPart).map((p) => p.text).join("") : "";
  const body = children ?? (text ? <p className="whitespace-pre-wrap break-words text-pretty">{text}</p> : null);
  const [top, bottom] = CORNERS[position];

  return (
    <motion.div
      data-role={role}
      data-position={position}
      className={`group flex min-w-0 flex-col gap-1.5 ${user ? "items-end" : "items-start"} ${className}`}
      initial={animateIn ? (reduced ? { opacity: 0 } : { opacity: 0, y: 8 }) : false}
      animate={{ opacity: 1, y: 0 }}
      transition={reduced ? reducedFade : { ...smooth, opacity: enter }}
    >
      {files.length > 0 && (
        <ul aria-label="Attachments" className={`flex max-w-[85%] flex-wrap gap-2 ${user ? "justify-end" : ""}`}>
          {files.map((p, i) => (
            <li key={`${p.url}-${i}`} className="flex min-w-0">
              <AttachmentChip attachment={fromFilePart(p, `${message!.id}-${i}`)} />
            </li>
          ))}
        </ul>
      )}
      {body &&
        (user ? (
          <div
            className="max-w-[85%] min-w-0 bg-surface-sunken px-3.5 py-2 text-ui text-text transition-[border-radius] duration-(--eased-duration-standard) ease-standard reduced:transition-none"
            style={
              {
                borderStartStartRadius: BIG,
                borderEndStartRadius: BIG,
                borderStartEndRadius: top,
                borderEndEndRadius: bottom,
              } as CSSProperties
            }
          >
            {body}
          </div>
        ) : (
          <div className="w-full min-w-0 text-ui text-text">{body}</div>
        ))}
      {actions && (
        <div
          className={`flex items-center gap-0.5 ${user ? "-mr-2" : "-ml-2"} ${
            actionsVisible === "hover"
              ? "transition-opacity duration-150 ease-standard pointer-fine:opacity-0 pointer-fine:group-hover-fine:opacity-100 pointer-fine:group-focus-within:opacity-100"
              : ""
          }`}
        >
          {actions}
        </div>
      )}
    </motion.div>
  );
}

/* ---------- Actions ----------------------------------------------------------- */

export type MessageActionProps = {
  label: string;
  onClick?: () => void;
  children: ReactNode;
  /** Pressed state for toggles such as thumbs up. */
  pressed?: boolean;
};

/** A 28px ghost icon button for the action row. */
export function MessageAction({ label, onClick, children, pressed }: MessageActionProps) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={pressed}
      onClick={onClick}
      className={`inline-flex size-7 cursor-pointer items-center justify-center rounded-control-xs text-text-muted hover-fine:bg-surface-hover hover-fine:text-text aria-pressed:text-text [&_svg]:size-4 ${pressIcon}`}
    >
      {children}
    </button>
  );
}

/** Copy, morphing to a check for 1.6s once the text is on the clipboard. */
export function CopyAction({ message, text }: { message?: ChatMessage; text?: string }) {
  const reduced = useSafeReducedMotion();
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text ?? (message ? messageText(message) : ""));
    } catch {
      return;
    }
    setCopied(true);
    clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), 1600);
  };
  return (
    <MessageAction label={copied ? "Copied" : "Copy"} onClick={copy}>
      <span className="relative inline-flex size-4">
        {/* Both icons share one grid cell, so the swap never changes the layout (popLayout cannot lift an SVG out of flow). */}
        <span className="inline-grid shrink-0 place-items-center *:col-start-1 *:row-start-1">
          <AnimatePresence initial={false}>
            <motion.svg
              key={copied ? "check" : "copy"}
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="size-4"
              aria-hidden
              initial={reduced ? { opacity: 0 } : swapIn}
              animate={reduced ? { opacity: 1 } : swapShown}
              exit={reduced ? { opacity: 0, transition: reducedFade } : { ...swapOut, transition: { ...swap, opacity: exitFast, filter: exitFast } }}
              transition={reduced ? reducedFade : swap}
            >
              {copied ? (
                <path d="M3.5 8.5l3 3 6-7" />
              ) : (
                <>
                  <rect x="5.25" y="5.25" width="8" height="8" rx="1.75" />
                  <path d="M10.75 5.25v-1a1.5 1.5 0 0 0-1.5-1.5h-4.5a2 2 0 0 0-2 2v4.5a1.5 1.5 0 0 0 1.5 1.5h1" />
                </>
              )}
            </motion.svg>
          </AnimatePresence>
        </span>
      </span>
      <span role="status" className="sr-only">
        {copied ? "Copied to clipboard" : ""}
      </span>
    </MessageAction>
  );
}
