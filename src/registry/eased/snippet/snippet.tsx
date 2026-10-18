"use client";

import { useRef } from "react";
import { TextSwap } from "../_primitives/text-swap/text-swap";
import { CopyButton } from "../_primitives/code-core/copy";
import { CODE_SCHEME, useCodeLines } from "../_primitives/code-core/code-lines";
import type { CodeLang } from "../_primitives/code-core/highlighter";
import { useScrollFades } from "../lib/dom";

export type SnippetProps = {
  /** The one-line command. Changing it swaps the text and springs the width. */
  text: string;
  /** Shown before the command and never copied. Default "$"; null hides it. */
  prefix?: string | null;
  /** Grammar for the command. Default "bash". */
  lang?: CodeLang | (string & {});
  /** Accessible name of the copy button. Default "Copy command". */
  label?: string;
  onCopy?: (text: string) => void;
  className?: string;
};

/**
 * Snippet: a one-line command with a `$` prompt and a copy button. When the command changes
 * (pnpm ↔ npm) the old text lifts away, the new one rises in, and the pill's width springs to
 * fit, so the copy button glides instead of jumping. Too long for its container, the line
 * scrolls sideways under 20px edge fades rather than wrapping.
 */
export function Snippet({ text, prefix = "$", lang = "bash", label = "Copy command", onCopy, className = "" }: SnippetProps) {
  const { lines } = useCodeLines(text, lang);
  const scroller = useRef<HTMLDivElement>(null);
  useScrollFades(scroller, "x");
  const line = lines[0] ?? [];

  return (
    <div
      className={`inline-flex h-control-lg max-w-full min-w-0 items-center rounded-control border border-line-subtle bg-surface-sunken pr-0.75 pl-3.5 font-mono text-ui-sm text-text [--pad:3px] [--radius-outer:var(--eased-radius-control)] ${CODE_SCHEME} ${className}`}
    >
      {prefix !== null && (
        <span aria-hidden className="mr-2 shrink-0 text-text-muted select-none">
          {prefix}
        </span>
      )}
      <div ref={scroller} className="fade-x mr-1 min-w-0 flex-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <code className="block whitespace-pre">
          <TextSwap swapKey={text}>
            <span>
              {line.map((t, i) => (
                <span key={i} style={{ color: t.light && t.dark ? `light-dark(${t.light}, ${t.dark})` : t.light ?? t.dark }}>
                  {t.content}
                </span>
              ))}
            </span>
          </TextSwap>
        </code>
      </div>
      <CopyButton text={text} label={label} showLabel={false} radius="radius-nested" onCopy={onCopy} className="font-sans" />
    </div>
  );
}
