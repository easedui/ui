/**
 * doc-core: documents for contract review and docs. A paragraph/clause model, inline redlines
 * (insert/delete, grouped into accept-or-reject changes) on the `diff` package, block-level
 * version diffs, and durable anchors for comments and AI suggestions.
 * Import from here; the files behind it may move.
 */
export { blockById, docFromText, numberClauses, type Doc, type DocBlock, type DocBlockKind, type Risk } from "./types";
export {
  diffDocs,
  lineHunks,
  redline,
  resolveRedline,
  type BlockDiff,
  type Decision,
  type Redline,
  type RedlineChange,
  type RedlineOptions,
  type RedlineSegment,
} from "./redline";
export {
  anchorFromSelection,
  anchorQuote,
  applySuggestion,
  createAnchor,
  mapOffset,
  rebaseAnchor,
  resolveAnchor,
  splitByAnchors,
  suggestionPreview,
  type Comment,
  type MarkedRun,
  type ResolvedAnchor,
  type Suggestion,
  type TextAnchor,
} from "./anchors";
