export type DocBlockKind = "heading" | "paragraph" | "clause";
export type Risk = "low" | "medium" | "high";

/** One block of a document. Offsets in anchors and redlines are into `text`. */
export type DocBlock = {
  /** Stable across versions: `diffDocs` matches blocks by it. */
  id: string;
  kind: DocBlockKind;
  text: string;
  /** Clause number, "4.2" (see `numberClauses`). */
  number?: string;
  /** A clause's caption, "Limitation of liability". */
  title?: string;
  /** Heading level (1–3) or clause depth (1 = "4", 2 = "4.2", 3 = "4.2.1"). Default 1. */
  level?: number;
  risk?: Risk;
};

export type Doc = { id: string; title: string; version?: string; blocks: DocBlock[] };

/** Assigns "1", "1.1", "1.1.1" … to clauses by `level`, restarting sub-numbers under each parent. Headings and paragraphs are skipped. Immutable. */
export function numberClauses(blocks: readonly DocBlock[]): DocBlock[] {
  const counters: number[] = [];
  return blocks.map((b) => {
    if (b.kind !== "clause") return b;
    const level = Math.max(1, b.level ?? 1);
    counters.length = level;
    for (let i = 0; i < level; i++) counters[i] ??= 0;
    counters[level - 1]++;
    return { ...b, number: counters.slice(0, level).join(".") };
  });
}

/**
 * A document from plain text: `# Title` and `## Heading` lines, numbered clauses ("4.", "4.2",
 * "4.2.1" with an optional "Title." caption), and blank-line paragraphs. Ids are `b1`, `b2` …
 * in order, so parse two versions with matching structure and they diff block by block.
 */
export function docFromText(text: string, { id = "doc" }: { id?: string } = {}): Doc {
  let title = "";
  const blocks: DocBlock[] = [];
  let n = 0;
  for (const chunk of text.replace(/\r\n?/g, "\n").split(/\n\s*\n/)) {
    const raw = chunk.trim();
    if (!raw) continue;
    const heading = /^(#{1,3})\s+([\s\S]*)$/.exec(raw);
    if (heading) {
      if (heading[1].length === 1 && !title) {
        title = heading[2].trim();
        continue;
      }
      blocks.push({ id: `b${++n}`, kind: "heading", level: heading[1].length - 1 || 1, text: heading[2].trim() });
      continue;
    }
    const clause = /^(\d+(?:\.\d+)*)\.?\s+(?:([A-Z][A-Za-z'’\- ]{1,48})\.\s+)?([\s\S]*)$/.exec(raw);
    if (clause) {
      // A caption is short ("Limitation of liability."); a longer first sentence is body text.
      const caption = clause[2] && clause[2].trim().split(/\s+/).length <= 6 ? clause[2].trim() : undefined;
      const body = caption ? clause[3] : raw.slice(clause[1].length).replace(/^\.?\s+/, "");
      blocks.push({ id: `b${++n}`, kind: "clause", number: clause[1], level: clause[1].split(".").length, title: caption, text: body.replace(/\s*\n\s*/g, " ").trim() });
      continue;
    }
    blocks.push({ id: `b${++n}`, kind: "paragraph", text: raw.replace(/\s*\n\s*/g, " ") });
  }
  return { id, title, blocks };
}

export const blockById = (doc: Doc, id: string) => doc.blocks.find((b) => b.id === id);
