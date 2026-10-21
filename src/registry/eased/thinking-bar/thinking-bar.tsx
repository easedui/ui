"use client";

import { Collapsible } from "@base-ui/react/collapsible";
import { useEffect, useRef, useState, type HTMLProps, type ReactNode } from "react";
import { AutoHeight } from "../_primitives/auto-height/auto-height";
import { NumberRoll } from "../_primitives/number-roll/number-roll";
import { TextSwap } from "../_primitives/text-swap/text-swap";
import { formatElapsed, useElapsed, useStatusCarousel } from "../_primitives/thinking-core/thinking-core";
import { ShimmerText } from "../shimmer-text/shimmer-text";

export type ThinkingStatus = "thinking" | "done";

export type ThinkingBarProps = {
  /** `thinking` shimmers and counts; `done` settles to "Thought for 12s". */
  status: ThinkingStatus;
  /** When thinking began (epoch ms or Date). Omit to count from when `status` turns `thinking`. */
  startedAt?: number | Date;
  /** When it ended. With `startedAt`, a reloaded message shows its real duration. */
  endedAt?: number | Date;
  /** The label while thinking. Default "Thinking". */
  label?: string;
  /**
   * Status lines to rotate through after `label` while thinking, e.g. ["Reading 4 sources",
   * "Comparing plans"]. Each holds 2–4s by length and swaps in; the last one holds.
   */
  lines?: string[];
  /** The label once done, before the duration. Default "Thought for". */
  doneLabel?: string;
  /** Shown before the label: a Agent Orb, an icon. */
  icon?: ReactNode;
  /** The reasoning. When present the bar is a disclosure with a chevron; without it, a plain line. */
  children?: ReactNode;
  /** Open state (controlled). */
  open?: boolean;
  /** Initial open state (uncontrolled). Default: open while thinking when `autoOpen`. */
  defaultOpen?: boolean;
  /** Called for every change, the automatic ones included. */
  onOpenChange?: (open: boolean) => void;
  /** Open the reasoning while thinking. Default true. Stops once the user toggles it. */
  autoOpen?: boolean;
  /** Close the reasoning this many ms after `done`, or `false` to leave it. Default 1000. Stops once the user toggles it. */
  autoClose?: number | false;
  /**
   * `inline` (default): a 14px muted line with the chevron after the text, for the top of a
   * chat reply. `row`: a full-width 13px row with the chevron on the trailing edge, matching
   * Agent Run's header, for a trace or console that stacks it over a rail.
   */
  variant?: "inline" | "row";
  className?: string;
};

function Chevron({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={`size-4 shrink-0 [transition:rotate_var(--eased-duration-spring-smooth)_var(--eased-spring-smooth)] group-data-panel-open:rotate-90 reduced:[transition:none] ${className}`}
    >
      <path d="m6.5 4 4 4-4 4" />
    </svg>
  );
}

/** Keeps a closing panel rendered until AutoHeight has collapsed it, then hides it (as Accordion does). */
function PanelBody({ open, htmlProps }: { open: boolean; htmlProps: HTMLProps<HTMLDivElement> }) {
  const [collapsed, setCollapsed] = useState(!open);
  const { hidden, children, ...rest } = htmlProps;
  void hidden;
  return (
    <div {...rest} hidden={!open && collapsed}>
      <AutoHeight open={open} onOpenChangeComplete={(isOpen) => setCollapsed(!isOpen)} innerClassName="pt-2">
        <div className="border-l border-line-subtle pl-3 text-ui-sm text-text-muted text-pretty">{children}</div>
      </AutoHeight>
    </div>
  );
}

/**
 * The line above a reasoning model's answer. While thinking, the label shimmers and a seconds
 * counter rolls beside it; when done, "Thinking" swaps to "Thought for" and the counter, the
 * same element, glides along to read "Thought for 12s". With reasoning inside it is a
 * disclosure: it opens while thinking and folds away a second after the answer starts,
 * unless the reader has already opened or closed it themselves.
 */
export function ThinkingBar({
  status,
  startedAt,
  endedAt,
  label = "Thinking",
  lines,
  doneLabel = "Thought for",
  icon,
  children,
  open: openProp,
  defaultOpen,
  onOpenChange,
  autoOpen = true,
  autoClose = 1000,
  variant = "inline",
  className = "",
}: ThinkingBarProps) {
  const thinking = status === "thinking";
  const seconds = useElapsed({ running: thinking, startedAt, endedAt });
  const rotation = [label, ...(lines ?? [])];
  const line = useStatusCarousel(rotation, { paused: !thinking });
  const hasBody = children !== undefined && children !== null && children !== false;

  // Open state: controlled, or ours, driven by status until the reader takes over.
  const [ownOpen, setOwnOpen] = useState(defaultOpen ?? (autoOpen && thinking));
  const open = openProp ?? ownOpen;
  const touched = useRef(false);
  const latest = useRef({ onOpenChange, openProp });
  useEffect(() => {
    latest.current = { onOpenChange, openProp };
  });
  const setOpen = (next: boolean) => {
    if (latest.current.openProp === undefined) setOwnOpen(next);
    latest.current.onOpenChange?.(next);
  };

  useEffect(() => {
    // A new thinking run hands control back to the automatic behaviour.
    if (thinking) touched.current = false;
    if (touched.current) return;
    if (thinking) {
      if (autoOpen) {
        if (latest.current.openProp === undefined) setOwnOpen(true);
        latest.current.onOpenChange?.(true);
      }
      return;
    }
    if (autoClose === false) return;
    const t = window.setTimeout(() => {
      if (touched.current) return;
      if (latest.current.openProp === undefined) setOwnOpen(false);
      latest.current.onOpenChange?.(false);
    }, autoClose);
    return () => clearTimeout(t);
  }, [thinking, autoOpen, autoClose]);

  const counted = seconds >= 1;
  const text = thinking ? line : counted ? doneLabel : `${doneLabel} a moment`;
  const spoken = thinking ? `${label}…` : counted ? `${doneLabel} ${seconds} ${seconds === 1 ? "second" : "seconds"}` : `${doneLabel} a moment`;

  const title = (
    <>
      {icon && <span className="inline-flex shrink-0 items-center">{icon}</span>}
      <span aria-hidden className="inline-flex min-w-0 items-center">
        <ShimmerText active={thinking} className="text-current">
          {text}
        </ShimmerText>
        <TextSwap swapKey={counted ? "on" : "off"} className="tabular-nums">
          {counted ? (
            <>
              {" "}
              <NumberRoll value={seconds} formatter={formatElapsed} aria-hidden />
            </>
          ) : null}
        </TextSwap>
      </span>
      <span className="sr-only">{spoken}</span>
    </>
  );

  const rowVariant = variant === "row";
  // The row variant reads like Agent Run's header: secondary while it thinks, full text once it has thought.
  const row = rowVariant ? `flex h-8 min-w-0 items-center gap-1.5 text-ui-sm ${thinking ? "text-text-secondary" : "text-text"}` : "inline-flex max-w-full items-center gap-1.5 text-ui text-text-muted";
  const trigger = rowVariant
    ? "-mx-1.5 w-[calc(100%+--spacing(3))] cursor-pointer rounded-control-sm px-1.5 text-left transition-colors duration-150 ease-standard focus-ring hover-fine:bg-surface-hover"
    : "-mx-1 cursor-pointer rounded-control-xs px-1 text-left transition-colors duration-150 ease-standard focus-ring hover-fine:text-text-secondary";
  const live = (
    <span role="status" className="sr-only">
      {thinking ? "" : spoken}
    </span>
  );

  if (!hasBody) {
    return (
      <div className={`min-w-0 ${className}`} aria-busy={thinking || undefined}>
        <div className={`${row} ${rowVariant ? "w-full" : ""}`}>{title}</div>
        {live}
      </div>
    );
  }

  return (
    <Collapsible.Root
      open={open}
      onOpenChange={(next) => {
        touched.current = true;
        setOpen(next);
      }}
      className={`min-w-0 ${className}`}
      aria-busy={thinking || undefined}
    >
      <Collapsible.Trigger className={`group ${row} ${trigger}`}>
        {title}
        <Chevron className={rowVariant ? "ms-auto text-text-muted" : ""} />
      </Collapsible.Trigger>
      <Collapsible.Panel keepMounted render={(htmlProps, state) => <PanelBody open={state.open} htmlProps={htmlProps} />}>
        {children}
      </Collapsible.Panel>
      {live}
    </Collapsible.Root>
  );
}
