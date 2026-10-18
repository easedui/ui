"use client";

import { animate, motion, useMotionValue } from "motion/react";
import { useEffect, useId, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { AutoHeight } from "../auto-height/auto-height";
import { TextSwap } from "../text-swap/text-swap";
import { ProgressiveBlur } from "../../progressive-blur/progressive-blur";
import { enter, exit, reducedFade, snappy, useSafeReducedMotion } from "../../lib/motion";
import { press } from "../../lib/press";
import { highlight, peekHighlight, plainLines, type CodeLine } from "./highlighter";
import { decorateLines, type LineDecorations } from "./lines";

const noop = () => () => {};
/** False during SSR and hydration, true afterwards: lets remounts read caches the server never saw. */
export function useHydrated() {
  return useSyncExternalStore(noop, () => true, () => false);
}

/**
 * Highlighted lines for `code`. Precomputed `tokens` (from `highlight()` on the server) render
 * at once with no flash. Otherwise the first paint is plain text in the foreground colour
 * (identical metrics, so nothing shifts) and the colours land when the grammar has loaded;
 * after hydration, code whose grammar is already in tokenises synchronously, so switching
 * tabs or remounting never flashes.
 */
export function useCodeLines(code: string, lang: string | undefined, tokens?: CodeLine[]) {
  const hydrated = useHydrated();
  const key = `${lang ?? ""}\0${code}`;
  const sync = tokens ?? (hydrated ? peekHighlight(code, lang) : null);
  const [result, setResult] = useState<{ key: string; lines: CodeLine[] } | null>(null);
  const needsAsync = !sync;

  useEffect(() => {
    if (!needsAsync) return;
    let live = true;
    highlight(code, lang)
      .then((lines) => live && setResult({ key, lines }))
      .catch(() => {
        // A grammar failed to load: the plain text stays, which is still correct code.
      });
    return () => {
      live = false;
    };
  }, [key, code, lang, needsAsync]);

  const lines = sync ?? (result?.key === key ? result.lines : null);
  return { lines: lines ?? plainLines(code), highlighted: lines !== null };
}

/** `light-dark()` picks the token colour from the inherited `color-scheme`, so a theme flip never re-renders. */
function tokenColor(light?: string, dark?: string) {
  if (light && dark) return light === dark ? light : `light-dark(${light}, ${dark})`;
  return light ?? dark;
}

/**
 * The colour scheme follows Eased's dark convention (`.dark` or `data-theme="dark"` on an
 * ancestor), so `light-dark()` resolves with the rest of the tokens even in hosts that never
 * set `color-scheme` themselves.
 */
export const CODE_SCHEME = "scheme-light [.dark_&]:scheme-dark [[data-theme=dark]_&]:scheme-dark";

export type CodeLinesProps = LineDecorations & {
  lines: CodeLine[];
  /** Show a line-number gutter. */
  lineNumbers?: boolean;
  /** Soft-wrap long lines instead of scrolling sideways. Default false. */
  wrap?: boolean;
  /** Number shown on the first line. Default 1. */
  startLine?: number;
  /** Accessible name for the scroll region, e.g. the file name. */
  label?: string;
  className?: string;
};

/**
 * Renders token lines as a `<pre>`: one full-bleed row per line (highlights span the whole
 * scroll width), an optional gutter (`tabular-nums slashed-zero`, never selected or copied),
 * and a diff marker column when any line is added or removed. Focused lines dim the others
 * to 40% with a half-pixel blur until the pointer is over the block. The scroller is a
 * keyboard-focusable region when it overflows sideways.
 *
 * Line height is fixed at 20px (a deliberate exception to rule 41): collapse heights and
 * gutters are computed from it.
 */
export function CodeLines({ lines, lineNumbers = false, wrap = false, startLine = 1, label, highlight: hl, focus, added, removed, className = "" }: CodeLinesProps) {
  const marks = decorateLines(lines.length, { highlight: hl, focus, added, removed });
  const hasDiff = marks.some((m) => m.diff);
  const digits = String(startLine + lines.length - 1).length;
  const scroller = useRef<HTMLPreElement>(null);
  const [overflows, setOverflows] = useState(false);

  useEffect(() => {
    const el = scroller.current;
    if (!el || wrap) return;
    const check = () => setOverflows(el.scrollWidth > el.clientWidth + 1);
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    if (el.firstElementChild) ro.observe(el.firstElementChild);
    return () => ro.disconnect();
  }, [wrap, lines]);

  return (
    <pre
      ref={scroller}
      tabIndex={overflows ? 0 : undefined}
      role={overflows ? "region" : undefined}
      aria-label={overflows ? label ?? "Code" : undefined}
      className={`group m-0 font-mono text-ui-sm leading-5 text-text slashed-zero ${CODE_SCHEME} ${
        wrap ? "whitespace-pre-wrap break-words" : "overflow-x-auto whitespace-pre [scrollbar-width:thin]"
      } py-3 outline-none focus-visible:inset-ring-2 focus-visible:inset-ring-focus ${className}`}
    >
      <code className={`${wrap ? "block" : "inline-block min-w-full"} [font-variant-ligatures:none]`}>
        {lines.map((line, i) => {
          const m = marks[i];
          const n = startLine + i;
          return (
            <span
              key={i}
              data-line={n}
              data-highlighted={m.highlight || undefined}
              data-diff={m.diff ?? undefined}
              className={`relative flex min-h-5 pr-4 pl-4 transition-[background-color,opacity,filter] duration-200 ease-standard before:absolute before:inset-y-0 before:left-0 before:w-0.5 before:transition-colors before:duration-200 ${
                m.diff === "add"
                  ? "bg-success-subtle before:bg-success"
                  : m.diff === "remove"
                    ? "bg-danger-subtle before:bg-danger"
                    : m.highlight
                      ? "bg-brand-subtle before:bg-line-strong"
                      : "before:bg-transparent"
              } ${m.dim ? "opacity-40 blur-[0.5px] group-hover-fine:opacity-100 group-hover-fine:blur-none group-focus-visible:opacity-100 group-focus-visible:blur-none reduced:blur-none" : ""}`}
            >
              {lineNumbers && (
                <span
                  aria-hidden
                  className={`mr-4 shrink-0 text-right tabular-nums select-none ${m.highlight || m.diff ? "text-text-muted" : "text-text-disabled"}`}
                  style={{ minWidth: `${digits}ch` }}
                >
                  {n}
                </span>
              )}
              {hasDiff && (
                <span
                  aria-hidden
                  className={`mr-3 w-[1ch] shrink-0 select-none ${m.diff === "add" ? "text-success-text" : m.diff === "remove" ? "text-danger-text" : ""}`}
                >
                  {m.diff === "add" ? "+" : m.diff === "remove" ? "−" : " "}
                </span>
              )}
              <span className="min-w-0">
                {line.map((t, j) => (
                  <span
                    key={j}
                    style={{
                      color: tokenColor(t.light, t.dark),
                      fontStyle: t.italic ? "italic" : undefined,
                      fontWeight: t.bold ? 500 : undefined,
                    }}
                  >
                    {t.content}
                  </span>
                ))}
              </span>
              {m.diff && <span className="sr-only">{m.diff === "add" ? " (added)" : " (removed)"}</span>}
            </span>
          );
        })}
      </code>
    </pre>
  );
}

/** The top of the nearest scrolling ancestor's visible area (0 for the page). */
function scrollportTop(el: HTMLElement) {
  for (let p = el.parentElement; p; p = p.parentElement) {
    const { overflowY } = getComputedStyle(p);
    if ((overflowY === "auto" || overflowY === "scroll") && p.scrollHeight > p.clientHeight) return Math.max(0, p.getBoundingClientRect().top);
  }
  return 0;
}

/** Lines are 20px; the pre adds 12px of padding at the top. */
const LINE = 20;
const PAD_TOP = 12;

export type CodeCollapseProps = {
  /** Total number of lines in the block. */
  lines: number;
  /** Lines to show while collapsed. The block only collapses when at least 3 more would hide; 0 disables. */
  collapseAfter: number;
  /** Start expanded. Default false. */
  defaultExpanded?: boolean;
  /** The code (a `CodeLines`). */
  children: ReactNode;
  /** Classes for the blur's tint gradient, matching the code's background. Default the sunken surface. */
  tintClassName?: string;
};

/**
 * Collapse-after: a long block shows its first `collapseAfter` lines and the next half line
 * melts under a progressive blur, with "Show 42 more lines" floating on it. Expanding springs
 * the height open (Auto Height, no overshoot) while the blur and tint fade away; the button
 * stays at the foot of the block and its label swaps to "Show less", its chevron turning on
 * the snappy spring. Collapsing a block whose top is off-screen scrolls it back into view.
 * Reduced motion: the height snaps and the blur fades at 100ms.
 */
export function CodeCollapse({ lines, collapseAfter, defaultExpanded = false, children, tintClassName = "from-surface-sunken via-surface-sunken/70" }: CodeCollapseProps) {
  const collapsible = collapseAfter > 0 && lines - collapseAfter >= 3;
  const [expanded, setExpanded] = useState(defaultExpanded);
  const reduced = useSafeReducedMotion();
  const strength = useMotionValue(defaultExpanded ? 0 : 1);
  const root = useRef<HTMLDivElement>(null);
  const id = useId();

  useEffect(() => {
    const c = animate(strength, expanded ? 0 : 1, reduced ? reducedFade : expanded ? exit : enter);
    return () => c.stop();
  }, [expanded, reduced, strength]);

  if (!collapsible) return <>{children}</>;
  const hidden = lines - collapseAfter;
  // Show the cut-off line half-way so the blur has real code to melt.
  const collapsedHeight = PAD_TOP + (collapseAfter + 0.5) * LINE;

  const toggle = () => {
    const next = !expanded;
    setExpanded(next);
    if (!next) {
      const el = root.current;
      if (el && el.getBoundingClientRect().top < scrollportTop(el)) el.scrollIntoView({ block: "nearest", behavior: reduced ? "auto" : "smooth" });
    }
  };

  return (
    <div ref={root} className="relative scroll-mt-4">
      <AutoHeight fade={false}>
        <div id={id} className="overflow-y-clip" style={{ maxHeight: expanded ? undefined : collapsedHeight }}>
          {children}
          {/* Room for the button under the last line once expanded. */}
          {expanded && <div aria-hidden className="h-11" />}
        </div>
      </AutoHeight>
      <motion.div aria-hidden className={`pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-linear-to-t to-transparent ${tintClassName}`} style={{ opacity: strength }} />
      <ProgressiveBlur side="bottom" size={64} maxBlur={6} layers={4} tint={false} strength={strength} />
      <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center">
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={id}
          onClick={toggle}
          className={`pointer-events-auto inline-flex h-control-sm cursor-pointer items-center gap-1.5 rounded-control-sm border border-line bg-surface-raised px-3 text-ui-sm font-medium text-text-secondary shadow-resting select-none hover-fine:bg-surface-hover hover-fine:text-text active:bg-surface-active ${press}`}
        >
          <TextSwap swapKey={expanded ? "less" : "more"} direction={expanded ? -1 : 1}>
            {expanded ? "Show less" : `Show ${hidden} more ${hidden === 1 ? "line" : "lines"}`}
          </TextSwap>
          <motion.svg
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden
            className="size-4 shrink-0 text-text-muted"
            initial={false}
            animate={{ rotate: expanded ? 180 : 0 }}
            transition={reduced ? { duration: 0 } : snappy}
          >
            <path d="M4.5 6.5 8 10l3.5-3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </motion.svg>
        </button>
      </div>
    </div>
  );
}
