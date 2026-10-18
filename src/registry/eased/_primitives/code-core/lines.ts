/**
 * The line decoration model: which lines of a block are highlighted, focused, added or
 * removed. Every Eased code component reads it, so `highlight="3-5"` means the same thing
 * in Code Block, Code Tabs, Streaming Code and Diff Block.
 */

/**
 * 1-based line numbers. A string of numbers and inclusive ranges ("3-5, 9, 12-14"), a single
 * number, or an array of numbers and `[from, to]` pairs.
 */
export type LineRange = string | number | ReadonlyArray<number | readonly [number, number]>;

/** What a line is marked as. A line can be both highlighted and added; `dim` is derived from `focus`. */
export type LineMark = {
  highlight: boolean;
  /** In the focused set: when any line is focused, the rest dim until the block is hovered. */
  focus: boolean;
  /** Dimmed because other lines are focused. */
  dim: boolean;
  diff: "add" | "remove" | null;
};

export type LineDecorations = {
  highlight?: LineRange;
  focus?: LineRange;
  added?: LineRange;
  removed?: LineRange;
};

/** Parse a `LineRange` into a set of 1-based line numbers, clamped to `1…total` when given. */
export function parseLineRange(range: LineRange | undefined, total = Infinity): Set<number> {
  const out = new Set<number>();
  if (range === undefined || range === "") return out;
  const add = (from: number, to: number) => {
    const lo = Math.max(1, Math.min(from, to));
    const hi = Math.min(total, Math.max(from, to));
    for (let n = lo; n <= hi; n++) out.add(n);
  };
  if (typeof range === "number") add(range, range);
  else if (typeof range === "string") {
    for (const part of range.split(/[\s,]+/)) {
      const m = /^(\d+)(?:\s*[-–]\s*(\d+))?$/.exec(part.trim());
      if (m) add(Number(m[1]), Number(m[2] ?? m[1]));
    }
  } else {
    for (const item of range) {
      if (typeof item === "number") add(item, item);
      else add(item[0], item[1]);
    }
  }
  return out;
}

/** One `LineMark` per line, index 0 = line 1. */
export function decorateLines(total: number, { highlight, focus, added, removed }: LineDecorations): LineMark[] {
  const h = parseLineRange(highlight, total);
  const f = parseLineRange(focus, total);
  const a = parseLineRange(added, total);
  const r = parseLineRange(removed, total);
  const focusing = f.size > 0;
  return Array.from({ length: total }, (_, i) => {
    const n = i + 1;
    return {
      highlight: h.has(n),
      focus: f.has(n),
      dim: focusing && !f.has(n),
      diff: a.has(n) ? "add" : r.has(n) ? "remove" : null,
    };
  });
}

/**
 * The cross-lane diff contract (lane 3 → lane 2: Diff Block, Approval Card, Diff Morph).
 * Shaped like one hunk of jsdiff's `structuredPatch`, but with each line's kind made explicit
 * instead of encoded in a "+"/"-"/" " prefix. Line numbers are 1-based.
 */
export type DiffLine = { kind: "add" | "remove" | "context"; text: string };
export type DiffHunk = {
  oldStart: number;
  oldLines: number;
  newStart: number;
  newLines: number;
  lines: DiffLine[];
};
