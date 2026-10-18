import { diffChars, diffSentences, diffWords, diffWordsWithSpace, structuredPatch, type ChangeObject } from "diff";
import type { Doc, DocBlock } from "./types";

/** A run of text in an inline redline. Rendered as plain, `<ins>` or `<del>`. */
export type RedlineSegment = {
  kind: "equal" | "insert" | "delete";
  text: string;
  /** Inserts and deletes that form one edit share a change id (a replacement is a delete + an insert). */
  changeId?: string;
};

/** One reviewable edit: accept or reject it as a unit. */
export type RedlineChange = {
  id: string;
  kind: "insert" | "delete" | "replace";
  deleted: string;
  inserted: string;
};

export type Redline = {
  segments: RedlineSegment[];
  changes: RedlineChange[];
  /** Words added and removed, for "+12 −3". */
  stats: { inserted: number; deleted: number; changes: number };
};

export type RedlineOptions = {
  /** `word` (default) reads like a lawyer's redline; `char` for codes and figures; `sentence` for long rewrites. */
  granularity?: "word" | "char" | "sentence";
  /** Word boundaries follow this locale's `Intl.Segmenter` (so "1.5%" changes as "1.5", not ".5"). Default the runtime's. */
  locale?: string;
  /** Prefix for change ids, so two blocks' changes stay unique: `${prefix}${n}`. Default `c`. */
  idPrefix?: string;
};

const words = (s: string) => (s.match(/\S+/g) ?? []).length;

/**
 * An inline redline between two strings on the `diff` package: segments for rendering, and
 * the edits grouped into changes you can accept or reject. A delete next to an insert is one
 * replacement, and up to three characters of space or punctuation between two edits are folded
 * in, so "three (3) months" → "twelve (12) months" reads as one change, not two.
 *
 *   const { segments, changes, stats } = redline(clause.text, revised.text);
 */
export function redline(before: string, after: string, { granularity = "word", idPrefix = "c", locale }: RedlineOptions = {}): Redline {
  const raw: ChangeObject<string>[] =
    granularity === "char" ? diffChars(before, after) : granularity === "sentence" ? diffSentences(before, after) : diffByWords(before, after, locale);

  // Group into runs: equal text, or a change (deleted + inserted), folding short space/punctuation equals between two changes.
  type Run = { equal: string } | { deleted: string; inserted: string };
  const runs: Run[] = [];
  for (let i = 0; i < raw.length; i++) {
    const p = raw[i];
    const last = runs[runs.length - 1];
    if (!p.added && !p.removed) {
      const next = raw[i + 1];
      const bridges = last && "deleted" in last && next && (next.added || next.removed) && /^[\s\p{P}]{1,3}$/u.test(p.value);
      if (bridges) {
        last.deleted += p.value;
        last.inserted += p.value;
      } else runs.push({ equal: p.value });
      continue;
    }
    if (!last || "equal" in last) runs.push({ deleted: "", inserted: "" });
    const run = runs[runs.length - 1] as { deleted: string; inserted: string };
    if (p.removed) run.deleted += p.value;
    else run.inserted += p.value;
  }

  // A pure insert or delete takes the space before it with it, so rejecting "days of notice."
  // gives "days." and not "days ." (word diffs leave that space in the equal text).
  for (let i = 1; i < runs.length; i++) {
    const run = runs[i];
    const prev = runs[i - 1];
    const next = runs[i + 1];
    if ("equal" in run || "deleted" in prev || (run.deleted && run.inserted)) continue;
    const text = run.deleted || run.inserted;
    const ws = /\s+$/.exec(prev.equal)?.[0];
    if (!ws || /\s$/.test(text) || (next && "equal" in next && /^\s/.test(next.equal))) continue;
    prev.equal = prev.equal.slice(0, -ws.length);
    if (run.deleted) run.deleted = ws + run.deleted;
    else run.inserted = ws + run.inserted;
  }

  const segments: RedlineSegment[] = [];
  const changes: RedlineChange[] = [];
  let ins = 0;
  let del = 0;
  for (const run of runs) {
    if ("equal" in run) {
      segments.push({ kind: "equal", text: run.equal });
      continue;
    }
    // Trim the whitespace both sides share at the ends back out into plain text.
    let { deleted, inserted } = run;
    const lead = commonEdge(deleted, inserted, "start");
    const trail = commonEdge(deleted.slice(lead.length), inserted.slice(lead.length), "end");
    deleted = deleted.slice(lead.length, deleted.length - trail.length);
    inserted = inserted.slice(lead.length, inserted.length - trail.length);
    if (lead) segments.push({ kind: "equal", text: lead });
    const id = `${idPrefix}${changes.length + 1}`;
    if (deleted) segments.push({ kind: "delete", text: deleted, changeId: id });
    if (inserted) segments.push({ kind: "insert", text: inserted, changeId: id });
    if (deleted || inserted) changes.push({ id, kind: deleted && inserted ? "replace" : deleted ? "delete" : "insert", deleted, inserted });
    if (trail) segments.push({ kind: "equal", text: trail });
    ins += words(inserted);
    del += words(deleted);
  }
  return { segments: mergeEquals(segments), changes, stats: { inserted: ins, deleted: del, changes: changes.length } };
}

const segmenters = new Map<string, Intl.Segmenter>();
function diffByWords(before: string, after: string, locale?: string): ChangeObject<string>[] {
  if (typeof Intl === "undefined" || typeof Intl.Segmenter !== "function") return diffWordsWithSpace(before, after);
  const key = locale ?? "";
  let seg = segmenters.get(key);
  if (!seg) segmenters.set(key, (seg = new Intl.Segmenter(locale, { granularity: "word" })));
  return diffWords(before, after, { intlSegmenter: seg });
}

function commonEdge(a: string, b: string, edge: "start" | "end"): string {
  let n = 0;
  const max = Math.min(a.length, b.length);
  if (edge === "start") {
    while (n < max && a[n] === b[n] && /\s/.test(a[n])) n++;
    return a.slice(0, n);
  }
  while (n < max && a[a.length - 1 - n] === b[b.length - 1 - n] && /\s/.test(a[a.length - 1 - n])) n++;
  return n ? a.slice(a.length - n) : "";
}

function mergeEquals(segments: RedlineSegment[]) {
  const out: RedlineSegment[] = [];
  for (const s of segments) {
    const last = out[out.length - 1];
    if (last && last.kind === "equal" && s.kind === "equal") last.text += s.text;
    else if (s.text) out.push({ ...s });
  }
  return out;
}

export type Decision = "accept" | "reject";

/**
 * The text after deciding each change: accepted changes take their insert, rejected ones
 * keep the original. Undecided changes follow `pending` (default `reject`: the original stands).
 */
export function resolveRedline(segments: readonly RedlineSegment[], decisions: Record<string, Decision | undefined>, { pending = "reject" }: { pending?: Decision } = {}): string {
  let out = "";
  for (const s of segments) {
    if (s.kind === "equal") out += s.text;
    else {
      const d = (s.changeId && decisions[s.changeId]) || pending;
      if ((s.kind === "insert" && d === "accept") || (s.kind === "delete" && d === "reject")) out += s.text;
    }
  }
  return out;
}

export type BlockDiff = {
  id: string;
  status: "same" | "changed" | "added" | "removed";
  before?: DocBlock;
  after?: DocBlock;
  /** For changed blocks (and added/removed ones, as one insert/delete). */
  redline: Redline;
};

/**
 * Two versions of a document compared block by block (matched by id): the order of `after`,
 * with removed blocks kept where they were. Change ids are prefixed by block id, so they are
 * unique across the document.
 */
export function diffDocs(before: Doc, after: Doc, options: Omit<RedlineOptions, "idPrefix"> = {}) {
  const old = new Map(before.blocks.map((b, i) => [b.id, { b, i }]));
  const kept = new Set(after.blocks.map((b) => b.id));
  const out: BlockDiff[] = [];
  const emitRemovedBefore = (limit: number, from: { i: number }) => {
    for (; from.i < limit; from.i++) {
      const b = before.blocks[from.i];
      if (!kept.has(b.id)) out.push({ id: b.id, status: "removed", before: b, redline: redline(b.text, "", { ...options, idPrefix: `${b.id}:` }) });
    }
  };
  const cursor = { i: 0 };
  for (const b of after.blocks) {
    const prev = old.get(b.id);
    if (prev) emitRemovedBefore(prev.i, cursor);
    if (prev && cursor.i <= prev.i) cursor.i = prev.i + 1;
    const r = redline(prev?.b.text ?? "", b.text, { ...options, idPrefix: `${b.id}:` });
    out.push({ id: b.id, status: !prev ? "added" : r.changes.length || prev.b.title !== b.title ? "changed" : "same", before: prev?.b, after: b, redline: r });
  }
  emitRemovedBefore(before.blocks.length, cursor);
  const stats = out.reduce((s, d) => ({ inserted: s.inserted + d.redline.stats.inserted, deleted: s.deleted + d.redline.stats.deleted, changes: s.changes + d.redline.stats.changes }), {
    inserted: 0,
    deleted: 0,
    changes: 0,
  });
  return { blocks: out, stats, changed: out.filter((d) => d.status !== "same").length };
}

/**
 * Line hunks between two texts, shaped exactly like code-core's `DiffHunk` (`oldStart`,
 * `oldLines`, `newStart`, `newLines`, `lines: { kind, text }[]`), so a Diff Block can render a
 * document version diff without doc-core depending on code-core.
 */
export function lineHunks(before: string, after: string, { context = 3 }: { context?: number } = {}) {
  const patch = structuredPatch("before", "after", before, after, undefined, undefined, { context });
  return patch.hunks.map((h) => ({
    oldStart: h.oldStart,
    oldLines: h.oldLines,
    newStart: h.newStart,
    newLines: h.newLines,
    lines: h.lines
      .filter((l) => !l.startsWith("\\"))
      .map((l) => ({ kind: l[0] === "+" ? ("add" as const) : l[0] === "-" ? ("remove" as const) : ("context" as const), text: l.slice(1) })),
  }));
}
