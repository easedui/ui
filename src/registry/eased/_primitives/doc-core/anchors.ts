import { redline, type RedlineSegment } from "./redline";
import { blockById, type Doc } from "./types";

/**
 * A durable pointer at a span of one block's text, for comments and AI suggestions. It keeps
 * offsets for speed and a quote with context (like the W3C TextQuoteSelector) so it can be
 * found again after the text changes.
 */
export type TextAnchor = {
  id: string;
  blockId: string;
  start: number;
  end: number;
  /** The anchored text when created. */
  quote: string;
  /** Up to `context` characters either side, to disambiguate repeated phrases. */
  prefix: string;
  suffix: string;
};

export type Comment = TextAnchor & {
  kind: "comment";
  author: string;
  body: string;
  /** Epoch ms. */
  createdAt: number;
  resolved?: boolean;
  /** Replies, oldest first. */
  replies?: { id: string; author: string; body: string; createdAt: number }[];
};

export type Suggestion = TextAnchor & {
  kind: "suggestion";
  /** The text proposed in place of `quote` (empty to delete it). */
  replacement: string;
  /** Why: "Caps liability at 12 months' fees, per playbook §3." */
  rationale?: string;
  author?: string;
  /** 0–1, for AI suggestions. */
  confidence?: number;
  status: "pending" | "accepted" | "rejected";
};

/** An anchor over `block.text.slice(start, end)`. */
export function createAnchor(doc: Doc, blockId: string, start: number, end: number, { id, context = 24 }: { id: string; context?: number }): TextAnchor {
  const text = blockById(doc, blockId)?.text ?? "";
  const s = Math.max(0, Math.min(start, end, text.length));
  const e = Math.min(text.length, Math.max(start, end));
  return { id, blockId, start: s, end: e, quote: text.slice(s, e), prefix: text.slice(Math.max(0, s - context), s), suffix: text.slice(e, e + context) };
}

/** An anchor over the first occurrence of `quote` in a block (after `from`): handy for fixtures and AI output that cites text. */
export function anchorQuote(doc: Doc, blockId: string, quote: string, { id, from = 0, context }: { id: string; from?: number; context?: number }): TextAnchor | null {
  const text = blockById(doc, blockId)?.text ?? "";
  const i = text.indexOf(quote, from);
  return i < 0 ? null : createAnchor(doc, blockId, i, i + quote.length, { id, context });
}

export type ResolvedAnchor = { blockId: string; start: number; end: number; status: "exact" | "moved" | "orphaned" };

/**
 * Where an anchor points in `doc` now: `exact` when the offsets still hold the quote, `moved`
 * when the quote was found elsewhere (the occurrence whose context matches best, nearest the
 * old offset), `orphaned` when the quoted text is gone (show it as "on deleted text").
 */
export function resolveAnchor(doc: Doc, anchor: TextAnchor): ResolvedAnchor {
  const home = blockById(doc, anchor.blockId);
  if (home && home.text.slice(anchor.start, anchor.end) === anchor.quote) return { blockId: home.id, start: anchor.start, end: anchor.end, status: "exact" };
  if (!anchor.quote) return { blockId: anchor.blockId, start: 0, end: 0, status: "orphaned" };
  const candidates = home ? [home, ...doc.blocks.filter((b) => b !== home)] : doc.blocks;
  let best: { blockId: string; start: number; score: number } | null = null;
  for (const b of candidates) {
    for (let i = b.text.indexOf(anchor.quote); i >= 0; i = b.text.indexOf(anchor.quote, i + 1)) {
      const before = b.text.slice(Math.max(0, i - anchor.prefix.length), i);
      const after = b.text.slice(i + anchor.quote.length, i + anchor.quote.length + anchor.suffix.length);
      const score =
        sharedSuffix(before, anchor.prefix) + sharedPrefix(after, anchor.suffix) + (b.id === anchor.blockId ? 1000 - Math.min(999, Math.abs(i - anchor.start)) / 1000 : 0);
      if (!best || score > best.score) best = { blockId: b.id, start: i, score };
    }
  }
  return best ? { blockId: best.blockId, start: best.start, end: best.start + anchor.quote.length, status: "moved" } : { blockId: anchor.blockId, start: 0, end: 0, status: "orphaned" };
}

const sharedPrefix = (a: string, b: string) => {
  let n = 0;
  while (n < a.length && n < b.length && a[n] === b[n]) n++;
  return n;
};
const sharedSuffix = (a: string, b: string) => {
  let n = 0;
  while (n < a.length && n < b.length && a[a.length - 1 - n] === b[b.length - 1 - n]) n++;
  return n;
};

/**
 * Maps an offset in the redline's "before" text to the "after" text. Offsets inside deleted
 * text land at the deletion point; `bias` decides which side of an insertion at the offset.
 */
export function mapOffset(offset: number, segments: readonly RedlineSegment[], bias: "before" | "after" = "after"): number {
  let a = 0;
  let b = 0;
  for (const s of segments) {
    if (s.kind === "insert") {
      if (a < offset || (a === offset && bias === "after")) b += s.text.length;
      continue;
    }
    const len = s.text.length;
    if (offset < a + len) return s.kind === "equal" ? b + (offset - a) : b;
    a += len;
    if (s.kind === "equal") b += len;
  }
  return b;
}

/** An anchor moved through an edit of its block (offsets mapped, quote and context refreshed). */
export function rebaseAnchor<A extends TextAnchor>(anchor: A, before: string, after: string, segments = redline(before, after).segments): A {
  const start = mapOffset(anchor.start, segments, "after");
  const end = Math.max(start, mapOffset(anchor.end, segments, "before"));
  const context = Math.max(anchor.prefix.length, anchor.suffix.length, 24);
  return { ...anchor, start, end, quote: after.slice(start, end), prefix: after.slice(Math.max(0, start - context), start), suffix: after.slice(end, end + context) };
}

export type MarkedRun = { text: string; start: number; end: number; ids: string[] };

/**
 * A block's text cut into runs at every anchor edge, each run listing the anchors covering
 * it: render runs with `ids.length` as `<mark>` (overlaps nest naturally as multiple ids).
 */
export function splitByAnchors(text: string, anchors: readonly { id: string; start: number; end: number }[]): MarkedRun[] {
  const cuts = new Set([0, text.length]);
  for (const a of anchors) {
    cuts.add(Math.max(0, Math.min(text.length, a.start)));
    cuts.add(Math.max(0, Math.min(text.length, a.end)));
  }
  const points = [...cuts].sort((x, y) => x - y);
  const runs: MarkedRun[] = [];
  for (let i = 0; i < points.length - 1; i++) {
    const [s, e] = [points[i], points[i + 1]];
    if (e <= s) continue;
    runs.push({ text: text.slice(s, e), start: s, end: e, ids: anchors.filter((a) => a.start < e && a.end > s).map((a) => a.id) });
  }
  return runs;
}

/**
 * The anchored span of a DOM selection inside one rendered block. Blocks must render their
 * text verbatim inside an element with `data-doc-block={block.id}` (marks and ins are fine;
 * extra text such as clause numbers must sit outside it). Null for collapsed or cross-block
 * selections.
 */
export function anchorFromSelection(selection: Selection | null = typeof window === "undefined" ? null : window.getSelection()): { blockId: string; start: number; end: number; quote: string } | null {
  if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return null;
  const range = selection.getRangeAt(0);
  const blockOf = (n: Node) => (n.nodeType === Node.ELEMENT_NODE ? (n as Element) : n.parentElement)?.closest<HTMLElement>("[data-doc-block]") ?? null;
  const block = blockOf(range.startContainer);
  if (!block || block !== blockOf(range.endContainer)) return null;
  const offsetOf = (node: Node, offset: number) => {
    const r = document.createRange();
    r.selectNodeContents(block);
    r.setEnd(node, offset);
    return r.toString().length;
  };
  const start = offsetOf(range.startContainer, range.startOffset);
  const end = offsetOf(range.endContainer, range.endOffset);
  return { blockId: block.dataset.docBlock!, start, end, quote: range.toString() };
}

/** The block text with a suggestion applied, and its redline: render it inline or in an Approval Card. */
export function suggestionPreview(doc: Doc, s: Suggestion) {
  const block = blockById(doc, s.blockId);
  const at = resolveAnchor(doc, s);
  const before = block?.text ?? "";
  const after = at.status === "orphaned" ? before : before.slice(0, at.start) + s.replacement + before.slice(at.end);
  return { before, after, anchor: at, redline: redline(before, after, { idPrefix: `${s.id}:` }) };
}

/**
 * Accepts a suggestion: a new document with the replacement in place, and every other anchor
 * (comments, other suggestions) on that block rebased through the edit so it still points at
 * its text.
 */
export function applySuggestion<A extends TextAnchor>(doc: Doc, s: Suggestion, others: readonly A[] = []): { doc: Doc; anchors: A[] } {
  const { before, after, anchor, redline: r } = suggestionPreview(doc, s);
  if (anchor.status === "orphaned") return { doc, anchors: [...others] };
  const next: Doc = { ...doc, blocks: doc.blocks.map((b) => (b.id === anchor.blockId ? { ...b, text: after } : b)) };
  const anchors = others.map((a) => (a.blockId === anchor.blockId && a.id !== s.id ? rebaseAnchor(a, before, after, r.segments) : a));
  return { doc: next, anchors };
}
