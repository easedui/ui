"use client";

import { TextSwap } from "../text-swap/text-swap";
import { LANG_LABEL, resolveLang, type CodeLang } from "./highlighter";

/** The shell every Eased code surface shares: 16px panel, subtle edge, sunken code well. */
export const CODE_FRAME =
  "group @container relative min-w-0 overflow-hidden rounded-panel border border-line-subtle bg-surface-sunken text-ui text-text [--pad:0px] [--radius-outer:var(--eased-radius-panel)]";

/**
 * The 40px title bar (41 with its rule, the same as a row of underline tabs). Its left inset
 * matches the code's 16px so the file name sits on the code's left edge; the right inset is
 * 8px so a 32px copy button's icon lands on the code's right edge (rules 104, 105).
 */
export const CODE_HEADER = "box-content flex h-10 min-w-0 items-center gap-2 border-b border-line-subtle bg-surface pr-2 pl-4";

/** A 16px glyph for a language: a prompt for shells, a sheet for everything else. */
export function LangGlyph({ lang, className = "" }: { lang?: string | null; className?: string }) {
  const shell = resolveLang(lang) === "bash";
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden className={`size-4 shrink-0 text-text-muted ${className}`}>
      {shell ? (
        <>
          <rect x="1.75" y="2.75" width="12.5" height="10.5" rx="2.25" stroke="currentColor" strokeWidth="1.5" />
          <path d="m4.75 6.25 1.75 1.75-1.75 1.75M8.5 9.75h2.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </>
      ) : (
        <>
          <path d="M9.25 1.75H5a2.25 2.25 0 0 0-2.25 2.25v8A2.25 2.25 0 0 0 5 14.25h6A2.25 2.25 0 0 0 13.25 12V5.75l-4-4Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
          <path d="M9.25 1.75v2.5c0 .83.67 1.5 1.5 1.5h2.5" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        </>
      )}
    </svg>
  );
}

/**
 * The language pill. The label swaps with y + blur and the pill's width springs, so switching
 * between files of different languages reads as one pill changing, not a new one. Under
 * 320px of block width it steps aside so the file name keeps the room.
 */
export function LangPill({ lang }: { lang?: string | null }) {
  const resolved = resolveLang(lang);
  const label = resolved ? LANG_LABEL[resolved as CodeLang] : lang;
  if (!label) return null;
  return (
    <span className="inline-flex h-5 shrink-0 items-center @max-xs:hidden rounded-control-xs bg-surface-hover px-1.5 text-ui-xs text-text-muted select-none">
      <TextSwap>{label}</TextSwap>
    </span>
  );
}
