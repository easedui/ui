"use client";

import { AnimatePresence, motion } from "motion/react";
import { useRef, type ReactNode } from "react";
import { AutoHeight } from "../_primitives/auto-height/auto-height";
import { exitFast, reducedFade, swap, swapIn, swapOut, swapShown, useSafeReducedMotion } from "../lib/motion";
import { pressIcon } from "../lib/press";

export type AlertTone = "neutral" | "info" | "success" | "warning" | "danger";

export type AlertProps = {
  /** neutral for notes, info for context, success after it worked, warning before it might not, danger when it did not. Default "info". */
  tone?: AlertTone;
  /** One line, in sentence case. */
  title: ReactNode;
  /** Detail under the title: what happened and what to do next. */
  children?: ReactNode;
  /** Replace the tone's icon (16px), or `null` for none. */
  icon?: ReactNode;
  /** Buttons under the description, e.g. a small secondary "Retry". */
  actions?: ReactNode;
  /** Shows a close button that calls this. Pair with `open` to animate the alert away. */
  onDismiss?: () => void;
  /** False collapses the alert and fades it out; true springs it open. Default true. */
  open?: boolean;
  /**
   * "status" (default) is announced politely when it appears; "alert" interrupts, for errors
   * the person must act on now. "none" for alerts present on page load.
   */
  role?: "status" | "alert" | "none";
  className?: string;
  /**
   * Classes for the inner wrapper that collapses with the alert. Put the gap above a
   * dismissible alert here (`pt-3`) instead of on a flex parent, so it closes with the alert.
   */
  innerClassName?: string;
};

const TONE: Record<AlertTone, { box: string; icon: string }> = {
  neutral: { box: "border-line-subtle bg-surface-sunken", icon: "text-text-secondary" },
  info: { box: "border-info/20 bg-info-subtle", icon: "text-info-text" },
  success: { box: "border-success/20 bg-success-subtle", icon: "text-success-text" },
  warning: { box: "border-warning/25 bg-warning-subtle", icon: "text-warning-text" },
  danger: { box: "border-danger/20 bg-danger-subtle", icon: "text-danger-text" },
};

const path = { fill: "none", stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "round", strokeLinejoin: "round" } as const;

const ICONS: Record<AlertTone, ReactNode> = {
  neutral: (
    <svg viewBox="0 0 16 16" className="size-4">
      <circle cx="8" cy="8" r="6.25" {...path} />
      <path d="M8 7.25v3.5M8 5.25v.01" {...path} />
    </svg>
  ),
  info: (
    <svg viewBox="0 0 16 16" className="size-4">
      <circle cx="8" cy="8" r="6.25" {...path} />
      <path d="M8 7.25v3.5M8 5.25v.01" {...path} />
    </svg>
  ),
  success: (
    <svg viewBox="0 0 16 16" className="size-4">
      <circle cx="8" cy="8" r="6.25" {...path} />
      <path d="M5.5 8.25 7.25 10l3.25-3.75" {...path} />
    </svg>
  ),
  warning: (
    <svg viewBox="0 0 16 16" className="size-4">
      <path d="M7.13 2.5a1 1 0 0 1 1.74 0l5.2 9.25a1 1 0 0 1-.87 1.5H2.8a1 1 0 0 1-.87-1.5Z" {...path} />
      <path d="M8 6.5v2.75M8 11.25v.01" {...path} />
    </svg>
  ),
  danger: (
    <svg viewBox="0 0 16 16" className="size-4">
      <circle cx="8" cy="8" r="6.25" {...path} />
      <path d="M8 4.75V8.5M8 10.75v.01" {...path} />
    </svg>
  ),
};

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Where focus goes when the alert is dismissed: the next focusable element among its siblings
 * (past its single-child wrappers), else the previous one. The alert itself turns inert as it
 * collapses, so it is only the last resort.
 */
function focusTarget(root: HTMLElement) {
  let own: HTMLElement = root;
  while (own.parentElement && own.parentElement.childElementCount === 1) own = own.parentElement;
  const candidates = [...(own.parentElement?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? [])].filter(
    (el) => !root.contains(el) && el.getClientRects().length > 0,
  );
  const after = candidates.find((el) => root.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING);
  return after ?? candidates.at(-1) ?? null;
}

/**
 * An inline callout for context, success, warnings and errors, tinted by tone. It springs
 * open and closed on its own height, so the page below glides instead of jumping; when the
 * tone changes the tint cross-fades and the icon swaps with a blur.
 */
export function Alert({ tone = "info", title, children, icon, actions, onDismiss, open = true, role = "status", className = "", innerClassName = "" }: AlertProps) {
  const reduced = useSafeReducedMotion();
  const glyph = icon === undefined ? ICONS[tone] : icon;
  const box = useRef<HTMLDivElement>(null);

  // The Dismiss button is about to collapse away: hand focus on before it drops to <body>.
  const dismiss = () => {
    const root = box.current;
    if (root?.contains(document.activeElement)) (focusTarget(root) ?? root).focus();
    onDismiss?.();
  };

  return (
    <AutoHeight open={open} className={className} innerClassName={innerClassName}>
      <div
        ref={box}
        tabIndex={-1}
        role={role === "none" ? undefined : role}
        className={`grid grid-cols-[auto_minmax(0,1fr)_auto] gap-x-2.5 rounded-control border px-3 py-2.5 outline-none transition-colors duration-150 ease-standard ${TONE[tone].box}`}
      >
        {/* Icon centred on the title's 20px first line (rule 58). */}
        <span aria-hidden className={`relative flex h-5 w-4 items-center transition-colors duration-150 ease-standard ${glyph ? "" : "hidden"} ${TONE[tone].icon}`}>
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={tone}
              className="flex"
              initial={reduced ? { opacity: 0 } : swapIn}
              animate={reduced ? { opacity: 1 } : swapShown}
              exit={reduced ? { opacity: 0, transition: reducedFade } : { ...swapOut, transition: exitFast }}
              transition={reduced ? reducedFade : swap}
            >
              {glyph}
            </motion.span>
          </AnimatePresence>
        </span>
        <div className={`flex min-w-0 flex-col gap-0.5 ${glyph ? "" : "col-span-2"}`}>
          <p className="text-ui font-medium text-text text-pretty">{title}</p>
          {children != null && <div className="text-ui-sm text-text-secondary text-pretty">{children}</div>}
          {actions != null && <div className="mt-2 flex flex-wrap items-center gap-2">{actions}</div>}
        </div>
        {onDismiss ? (
          <button
            type="button"
            aria-label="Dismiss"
            onClick={dismiss}
            className={`-me-1 -mt-0.5 flex size-6 cursor-pointer items-center justify-center rounded-control-xs text-text-muted hover-fine:bg-surface-hover hover-fine:text-text ${pressIcon}`}
          >
            <svg viewBox="0 0 16 16" aria-hidden className="size-3.5">
              <path d="M4.5 4.5l7 7M11.5 4.5l-7 7" {...path} />
            </svg>
          </button>
        ) : (
          <span />
        )}
      </div>
    </AutoHeight>
  );
}
