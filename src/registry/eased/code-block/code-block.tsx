"use client";

import type { ReactNode } from "react";
import { CopyButton } from "../_primitives/code-core/copy";
import { CODE_FRAME, CODE_HEADER, LangGlyph, LangPill } from "../_primitives/code-core/code-chrome";
import { CodeCollapse, CodeLines, useCodeLines } from "../_primitives/code-core/code-lines";
import { langFromFilename, type CodeLang, type CodeLine } from "../_primitives/code-core/highlighter";
import type { LineDecorations } from "../_primitives/code-core/lines";

export type CodeBlockProps = LineDecorations & {
  /** The source to show and copy. One trailing newline is ignored. */
  code: string;
  /**
   * tsx, ts, js, jsx, json, css, bash, html, md, python or diff (aliases like "typescript",
   * "sh" and "py" work). Default: from the `title`'s extension; anything else is plain text.
   */
  lang?: CodeLang | (string & {});
  /** A file name for the title bar. Without it, the copy button floats over the code. */
  title?: string;
  /** Replace the file glyph in the title bar. */
  icon?: ReactNode;
  /** Show the language pill in the title bar. Default true. */
  showLang?: boolean;
  /** A line-number gutter. Default false. */
  lineNumbers?: boolean;
  /** Number of the first line, for excerpts. Default 1. */
  startLine?: number;
  /**
   * Collapse blocks longer than this many lines under a progressive blur with "Show N more
   * lines". Default 20; 0 never collapses. Blocks collapse only when 3 or more lines would hide.
   */
  collapseAfter?: number;
  /** Start a collapsible block expanded. Default false. */
  defaultExpanded?: boolean;
  /** Show the copy button. Default true. */
  copy?: boolean;
  onCopy?: (code: string) => void;
  /** Soft-wrap long lines instead of scrolling sideways. Default false. */
  wrap?: boolean;
  /** Pre-highlighted lines from `highlight()` (e.g. on the server), so the first paint is already coloured. */
  tokens?: CodeLine[];
  className?: string;
};

/**
 * Code Block: Shiki highlighting in Eased's stone (dark) and cream (light) themes, a file
 * title bar with a language pill, a copy button that morphs into a check while "Copied"
 * slides out, highlighted and focused lines, and long blocks that collapse under a
 * progressive blur. Grammars load on demand; the theme follows `.dark`/`data-theme`.
 */
export function CodeBlock({
  code,
  lang,
  title,
  icon,
  showLang = true,
  lineNumbers = false,
  startLine,
  collapseAfter = 20,
  defaultExpanded,
  copy = true,
  onCopy,
  wrap,
  tokens,
  highlight,
  focus,
  added,
  removed,
  className = "",
}: CodeBlockProps) {
  const language = lang ?? langFromFilename(title) ?? undefined;
  const { lines } = useCodeLines(code, language, tokens);
  const label = title ? `Copy ${title}` : "Copy code";

  return (
    <figure className={`m-0 ${CODE_FRAME} ${className}`}>
      {title !== undefined && (
        <figcaption className={CODE_HEADER}>
          {icon ?? <LangGlyph lang={language} />}
          <span className="min-w-0 flex-1 truncate font-mono text-ui-sm text-text-secondary">{title}</span>
          {showLang && <LangPill lang={language} />}
          {copy && <CopyButton text={code} label={label} onCopy={onCopy} />}
        </figcaption>
      )}
      <CodeCollapse lines={lines.length} collapseAfter={collapseAfter} defaultExpanded={defaultExpanded}>
        <CodeLines
          lines={lines}
          lineNumbers={lineNumbers}
          startLine={startLine}
          wrap={wrap}
          label={title}
          highlight={highlight}
          focus={focus}
          added={added}
          removed={removed}
          className={title === undefined && copy ? "[&_[data-line]:first-child]:pr-12" : ""}
        />
      </CodeCollapse>
      {title === undefined && copy && (
        // Pointer devices reveal it on hover or focus; touch screens always show it.
        <div className="absolute top-1.5 right-1.5 z-10 rounded-control-sm bg-surface-sunken transition-opacity duration-150 ease-standard pointer-fine:opacity-0 pointer-fine:group-hover:opacity-100 pointer-fine:focus-within:opacity-100">
          <CopyButton text={code} label={label} showLabel={false} onCopy={onCopy} />
        </div>
      )}
    </figure>
  );
}
