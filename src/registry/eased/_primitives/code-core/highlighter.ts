import type { HighlighterCore, LanguageRegistration } from "shiki/core";
import { easedCream, easedStone } from "./themes";

/**
 * The Shiki singleton every Eased code component shares.
 *
 * - One `HighlighterCore` per page (and per server process), created on first use. Shiki,
 *   its JavaScript regex engine and every grammar are dynamic imports, so a page that never
 *   shows code never downloads them, and one that shows only `bash` never loads TSX.
 * - The JavaScript regex engine, not Oniguruma: no WASM, so it runs in the browser, on the
 *   server and at the edge alike.
 * - Output is plain data (`CodeLine[]`), not HTML: each token carries its light and dark
 *   colour, so the renderer picks one with CSS `light-dark()` and a theme switch never
 *   re-highlights. The data is serialisable, so a server can highlight and hand the result
 *   to a client component (`tokens` prop) with no flash of plain text.
 */

/** One run of text in one colour. `light`/`dark` are hex; missing means "inherit the foreground". */
export type CodeToken = { content: string; light?: string; dark?: string; italic?: boolean; bold?: boolean };
/** One line of code as coloured runs. An empty array is a blank line. */
export type CodeLine = CodeToken[];

/** Languages with a grammar; anything else renders as plain text. */
export type CodeLang = "tsx" | "ts" | "js" | "jsx" | "json" | "css" | "bash" | "html" | "md" | "python" | "diff";

type Loader = () => Promise<{ default: LanguageRegistration[] }>;

const GRAMMARS: Record<CodeLang, { id: string; load: Loader }> = {
  tsx: { id: "tsx", load: () => import("shiki/langs/tsx.mjs") },
  ts: { id: "typescript", load: () => import("shiki/langs/typescript.mjs") },
  js: { id: "javascript", load: () => import("shiki/langs/javascript.mjs") },
  jsx: { id: "jsx", load: () => import("shiki/langs/jsx.mjs") },
  json: { id: "json", load: () => import("shiki/langs/json.mjs") },
  css: { id: "css", load: () => import("shiki/langs/css.mjs") },
  bash: { id: "bash", load: () => import("shiki/langs/bash.mjs") },
  html: { id: "html", load: () => import("shiki/langs/html.mjs") },
  md: { id: "markdown", load: () => import("shiki/langs/markdown.mjs") },
  python: { id: "python", load: () => import("shiki/langs/python.mjs") },
  diff: { id: "diff", load: () => import("shiki/langs/diff.mjs") },
};

const ALIASES: Record<string, CodeLang> = {
  typescript: "ts",
  javascript: "js",
  mjs: "js",
  cjs: "js",
  mts: "ts",
  cts: "ts",
  sh: "bash",
  shell: "bash",
  shellscript: "bash",
  zsh: "bash",
  console: "bash",
  markdown: "md",
  mdx: "md",
  py: "python",
  patch: "diff",
  jsonc: "json",
  htm: "html",
};

/** Short display names for the language pill. */
export const LANG_LABEL: Record<CodeLang, string> = {
  tsx: "TSX",
  ts: "TypeScript",
  js: "JavaScript",
  jsx: "JSX",
  json: "JSON",
  css: "CSS",
  bash: "Shell",
  html: "HTML",
  md: "Markdown",
  python: "Python",
  diff: "Diff",
};

/** Resolve a fence name or file extension ("typescript", "sh", "py") to a supported language, or null. */
export function resolveLang(lang: string | undefined | null): CodeLang | null {
  if (!lang) return null;
  const key = lang.toLowerCase().trim();
  if (key in GRAMMARS) return key as CodeLang;
  return ALIASES[key] ?? null;
}

/** The language a file name implies: `button.tsx` → "tsx", `README.md` → "md". */
export function langFromFilename(name: string | undefined): CodeLang | null {
  const ext = name?.split(".").pop();
  return ext && ext !== name ? resolveLang(ext) : null;
}

const THEMES = { light: easedCream.name!, dark: easedStone.name! };

let core: Promise<HighlighterCore> | null = null;
/** The resolved highlighter, so cached grammars tokenise synchronously. */
let ready: HighlighterCore | null = null;
const loading = new Map<CodeLang, Promise<void>>();
const loaded = new Set<CodeLang>();

/** The shared highlighter, created on first call with both Eased themes and no grammars. */
export function getHighlighter(): Promise<HighlighterCore> {
  core ??= Promise.all([import("shiki/core"), import("shiki/engine/javascript")]).then(([{ createHighlighterCore }, { createJavaScriptRegexEngine }]) =>
    createHighlighterCore({
      themes: [easedStone, easedCream],
      langs: [],
      // Forgiving: a grammar pattern the JS engine cannot compile is skipped, not fatal.
      engine: createJavaScriptRegexEngine({ forgiving: true }),
    }),
  ).then((h) => (ready = h));
  return core;
}

/** Load one grammar (once; concurrent callers share the request). */
export function loadLang(lang: CodeLang): Promise<void> {
  if (loaded.has(lang)) return Promise.resolve();
  let p = loading.get(lang);
  if (!p) {
    p = Promise.all([getHighlighter(), GRAMMARS[lang].load()])
      .then(([h, mod]) => h.loadLanguage(...mod.default))
      .then(() => {
        loaded.add(lang);
      })
      .catch((error) => {
        loading.delete(lang);
        throw error;
      });
    loading.set(lang, p);
  }
  return p;
}

/** Plain lines, for unsupported languages and for the frame before highlighting lands. */
export function plainLines(code: string): CodeLine[] {
  return splitLines(code).map((text) => (text ? [{ content: text }] : []));
}

/** Split on \n (and \r\n), dropping one trailing newline so a file's last line is not a blank row. */
export function splitLines(code: string): string[] {
  return code.replace(/\r\n?/g, "\n").replace(/\n$/, "").split("\n");
}

// Results by language + code, so remounts (tab switches, collapsing) never re-tokenise.
const CACHE_MAX = 200;
const cache = new Map<string, CodeLine[]>();

function remember(key: string, lines: CodeLine[]) {
  if (cache.size >= CACHE_MAX) cache.delete(cache.keys().next().value!);
  cache.set(key, lines);
  return lines;
}

/**
 * Synchronously return highlighted lines if this exact code has been highlighted before, or
 * if its grammar is already loaded (tokenising is synchronous once the grammar is in).
 * Returns null when highlighting needs an async load first.
 */
export function peekHighlight(code: string, lang: string | undefined | null): CodeLine[] | null {
  const resolved = resolveLang(lang);
  if (!resolved) return plainLines(code);
  const key = `${resolved}\0${code}`;
  const hit = cache.get(key);
  if (hit) return hit;
  if (!loaded.has(resolved) || !ready) return null;
  return tokenize(ready, key, code, resolved);
}

function tokenize(h: HighlighterCore, key: string, code: string, lang: CodeLang) {
  const source = code.replace(/\r\n?/g, "\n").replace(/\n$/, "");
  const raw = h.codeToTokensWithThemes(source, { lang: GRAMMARS[lang].id, themes: THEMES });
  return remember(key, raw.map(mergeLine));
}

/**
 * Highlight `code` as `lang` into light/dark token lines. Unknown languages come back as
 * plain lines. Works on the server and in the browser.
 */
export async function highlight(code: string, lang: string | undefined | null): Promise<CodeLine[]> {
  const resolved = resolveLang(lang);
  if (!resolved) return plainLines(code);
  const key = `${resolved}\0${code}`;
  const hit = cache.get(key);
  if (hit) return hit;
  await loadLang(resolved);
  return tokenize(await getHighlighter(), key, code, resolved);
}

// Shiki's FontStyle bit flags.
const ITALIC = 1;
const BOLD = 2;

/** Convert Shiki's per-theme variants to Eased tokens and merge neighbours that look identical. */
function mergeLine(line: { content: string; variants: Record<string, { color?: string; fontStyle?: number }> }[]): CodeLine {
  const out: CodeToken[] = [];
  for (const t of line) {
    const l = t.variants.light ?? {};
    const d = t.variants.dark ?? {};
    const style = (l.fontStyle ?? 0) > 0 ? l.fontStyle! : 0;
    const token: CodeToken = { content: t.content };
    if (l.color) token.light = l.color.toLowerCase();
    if (d.color) token.dark = d.color.toLowerCase();
    if (style & ITALIC) token.italic = true;
    if (style & BOLD) token.bold = true;
    const prev = out[out.length - 1];
    // Whitespace takes on any colour, so it joins the previous run.
    const blank = !t.content.trim();
    if (prev && (blank || (prev.light === token.light && prev.dark === token.dark && prev.italic === token.italic && prev.bold === token.bold))) {
      prev.content += t.content;
    } else out.push(token);
  }
  return out;
}
