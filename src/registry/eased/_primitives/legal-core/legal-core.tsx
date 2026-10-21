"use client";

/**
 * legal-core: the pieces every Eased legal block shares, so a review, a version compare and an
 * obligations list read as one product: the inline redline, the clause label, the AI mark,
 * deadline wording and the legal date formats. Import from here.
 */
import type { ReactNode } from "react";
import type { RedlineSegment } from "../doc-core/doc-core";

/** Default locale for every legal format. Pass your own. */
export const LEGAL_LOCALE = "en-US";

/* ---------- Formats ---------------------------------------------------------------------- */

const DAY = 86_400_000;
const HOUR = 3_600_000;

/** `Oct 27`, or `Oct 27, 2027` outside the current year. UTC unless you pass a zone. */
export function formatLegalDate(t: number, { now, locale = LEGAL_LOCALE, timeZone = "UTC" }: { now?: number; locale?: Intl.LocalesArgument; timeZone?: string } = {}) {
  const sameYear = now === undefined || new Date(now).getUTCFullYear() === new Date(t).getUTCFullYear();
  return new Intl.DateTimeFormat(locale, { month: "short", day: "numeric", year: sameYear ? undefined : "numeric", timeZone }).format(t);
}

export type Countdown = {
  /** Short, for a ring or a chip: `9d`, `22h`, `45m`, `2d` (overdue). */
  short: string;
  /** Spoken and for tooltips: "Due in 9 days", "Due in 22 hours", "Overdue by 2 days". */
  long: string;
  overdue: boolean;
  /** Milliseconds until due (negative once overdue). */
  remaining: number;
};

/** How far off a deadline is, in the largest whole unit that reads at a glance. */
export function countdown(due: number, now: number, locale: Intl.LocalesArgument = LEGAL_LOCALE): Countdown {
  const remaining = due - now;
  const abs = Math.abs(remaining);
  // Days from a day and a half, hours under that. Time left counts down in whole units (10.8
  // days left is "10d"); time overdue rounds, so 45 hours late reads "2 days".
  const days = remaining < 0 ? Math.round(abs / DAY) : Math.floor(abs / DAY);
  const [n, unit, letter] = abs >= 1.5 * DAY ? [days, "day", "d"] : abs >= HOUR ? [Math.floor(abs / HOUR), "hour", "h"] : [Math.max(1, Math.floor(abs / 60_000)), "minute", "m"];
  const count = new Intl.NumberFormat(locale, { style: "unit", unit: unit as "day", unitDisplay: "long" }).format(n);
  const overdue = remaining < 0;
  return { short: `${n}${letter}`, long: overdue ? `Overdue by ${count}` : `Due in ${count}`, overdue, remaining };
}

/** `93%` for a model confidence. */
export const formatConfidence = (v: number, locale: Intl.LocalesArgument = LEGAL_LOCALE) => new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 0 }).format(v);

/* ---------- Clause label ----------------------------------------------------------------- */

/**
 * The clause number in a fixed track and its caption, for any row that cites a clause:
 * `4  Limitation of liability`. Put it in a `grid-cols-[2rem_minmax(0,1fr)]` row (or use
 * `CLAUSE_GRID`) so every number and every caption share one edge (rule 101).
 */
export const CLAUSE_GRID = "grid grid-cols-[2rem_minmax(0,1fr)]";

export function ClauseLabel({ number, title, className = "" }: { number?: string; title?: ReactNode; className?: string }) {
  return (
    <>
      <span className={`text-ui-sm text-text-muted tabular-nums ${className}`}>{number}</span>
      <span className={`min-w-0 truncate text-ui-sm font-medium text-text ${className}`}>{title}</span>
    </>
  );
}

/* ---------- Redline ---------------------------------------------------------------------- */

const count = (s: string, c: string) => s.split(c).length - 1;

/**
 * Word diffs split "thirty (30)" → "forty-five (45)" around the bracket they share, leaving
 * "thirty (30" struck and ")" plain. This moves a closing bracket that an edit opened back into
 * the edit (both sides), so each side reads as a whole phrase. Pure; safe in render.
 */
export function tidyRedline(segments: readonly RedlineSegment[]): RedlineSegment[] {
  const out = segments.map((s) => ({ ...s }));
  for (let i = 0; i < out.length; i++) {
    const s = out[i];
    if (s.kind === "equal" || !s.changeId) continue;
    let j = i;
    while (j + 1 < out.length && out[j + 1].kind !== "equal" && out[j + 1].changeId === s.changeId) j++;
    const next = out[j + 1];
    const m = next && /^[)\]]/.exec(next.text);
    const group = out.slice(i, j + 1);
    if (m && group.every((g) => count(g.text, "(") + count(g.text, "[") > count(g.text, ")") + count(g.text, "]"))) {
      for (const g of group) g.text += m[0];
      next.text = next.text.slice(1);
    }
    i = j;
  }
  return out.filter((s) => s.text);
}

export type RedlineTextProps = {
  segments: readonly RedlineSegment[];
  /** Show only one side: `before` hides inserts, `after` hides deletes. Default both (a redline). */
  side?: "both" | "before" | "after";
  /** Change ids that are being rejected right now: their inserts strike through and dim. */
  striking?: ReadonlySet<string>;
  className?: string;
};

/**
 * A lawyer's inline redline: inserted words in success ink with an underline, deleted words
 * struck in danger ink, the rest as written. Inserts and deletes are real `<ins>`/`<del>`, so
 * screen readers and copy-paste keep the meaning. Colours change on a 150ms tween, so a
 * strike that lands mid-swap stays smooth.
 */
export function RedlineText({ segments, side = "both", striking, className = "" }: RedlineTextProps) {
  return (
    <span className={className}>
      {segments.map((s, i) => {
        if (s.kind === "equal") return <span key={i}>{s.text}</span>;
        if (s.kind === "insert") {
          if (side === "before") return null;
          const struck = s.changeId && striking?.has(s.changeId);
          // A replacement's insert sits right after its delete: keep a hair of space between them.
          const afterDelete = side === "both" && segments[i - 1]?.kind === "delete";
          return (
            <ins
              key={i}
              className={`rounded-control-2xs no-underline transition-[color,background-color,text-decoration-color,opacity] duration-150 ease-standard ${
                side === "after" ? "bg-success-subtle text-success-text" : "underline decoration-success-text/40 decoration-1 underline-offset-[3px] text-success-text"
              } ${afterDelete ? "ms-[0.3em]" : ""} ${struck ? "line-through decoration-danger-text opacity-60" : ""}`}
            >
              {s.text}
            </ins>
          );
        }
        if (side === "after") return null;
        return (
          <del
            key={i}
            className={`rounded-control-2xs transition-colors duration-150 ease-standard ${side === "before" ? "bg-danger-subtle text-danger-text no-underline" : "text-danger-text line-through decoration-danger-text/60"}`}
          >
            {s.text}
          </del>
        );
      })}
    </span>
  );
}

/* ---------- Icons ------------------------------------------------------------------------ */

/** The Brief AI mark: a four-point spark. 16px grid, 1.5px stroke. */
export function SparkIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinejoin="round" aria-hidden className={`shrink-0 ${className}`}>
      <path d="M8 2.5c.4 2.9 2.1 4.6 5 5-2.9.4-4.6 2.1-5 5-.4-2.9-2.1-4.6-5-5 2.9-.4 4.6-2.1 5-5Z" />
    </svg>
  );
}

export function CheckIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden className={`shrink-0 ${className}`}>
      <path d="M3.5 8.5l3 3 6-7" />
    </svg>
  );
}

export function ChevronIcon({ dir, className = "size-4" }: { dir: "up" | "down" | "left" | "right"; className?: string }) {
  const d = { up: "M4 10l4-4 4 4", down: "M4 6.5l4 4 4-4", left: "M10 4 6 8l4 4", right: "M6 4l4 4-4 4" }[dir];
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden className={`shrink-0 ${className}`}>
      <path d={d} />
    </svg>
  );
}
