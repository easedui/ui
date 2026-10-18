import type { ThemeRegistration } from "shiki/core";

/**
 * Eased's two syntax themes, in the warm stone/cream palette of `eased.css`.
 *
 * Every hue is low-chroma and sits on the neutral's warm side (clay keywords, sage strings,
 * cream-gold functions, amber numbers, one cool slate for types so the eye can find them).
 * Colours are authored in OKLCH and stored as hex because Shiki needs hex. Each token clears
 * WCAG 4.5:1 on `surface-sunken` in its theme (comments included), so nothing is decoration.
 * The theme backgrounds are only a fallback: code-core paints the block with Eased tokens.
 */

type Palette = {
  bg: string;
  fg: string;
  comment: string;
  punctuation: string;
  keyword: string;
  string: string;
  fn: string;
  number: string;
  type: string;
  property: string;
  attribute: string;
  parameter: string;
  inserted: string;
  deleted: string;
};

/** eased-stone (dark), on `surface-sunken` (oklch 17.8% 0.006 80). */
const stone: Palette = {
  bg: "#13110e",
  fg: "#e2ded5", // oklch(90% .012 85)   14.0:1
  comment: "#8a857e", // oklch(62% .012 80)   5.2:1
  punctuation: "#9b9891", // oklch(68% .01 80)   6.6:1
  keyword: "#daa28a", // oklch(76% .075 45)  8.6:1
  string: "#afc798", // oklch(80% .07 130)  10.3:1
  fn: "#ebd19c", // oklch(87% .075 85)  12.7:1
  number: "#e6ad7f", // oklch(79% .09 60)   9.6:1
  type: "#9dc6ce", // oklch(80% .045 210) 10.3:1
  property: "#d4c9b9", // oklch(84% .025 75)  11.5:1
  attribute: "#d9c099", // oklch(82% .06 80)   10.8:1
  parameter: "#e0cdbe", // oklch(86% .03 60)   12.3:1
  inserted: "#89d298", // oklch(80% .11 150)  10.5:1
  deleted: "#ed8c84", // oklch(74% .12 25)   7.8:1
};

/** eased-cream (light), on `surface-sunken` (oklch 98% 0.003 80). */
const cream: Palette = {
  bg: "#f9f8f6",
  fg: "#2a2520", // oklch(27% .012 70)  14.2:1
  comment: "#726e67", // oklch(54% .012 80)  4.8:1
  punctuation: "#66635d", // oklch(50% .01 80)   5.7:1
  keyword: "#9a4729", // oklch(50% .12 40)   6.0:1
  string: "#476d2f", // oklch(49% .10 135)  5.7:1
  fn: "#7b5117", // oklch(47% .09 70)   6.6:1
  number: "#9f5618", // oklch(53% .12 55)   5.2:1
  type: "#246476", // oklch(47% .07 220)  6.3:1
  property: "#524536", // oklch(40% .03 70)   8.7:1
  attribute: "#876125", // oklch(52% .09 75)   5.3:1
  parameter: "#594233", // oklch(40% .04 55)   8.8:1
  inserted: "#067132", // oklch(48% .13 150)  5.8:1
  deleted: "#b02a2d", // oklch(50% .17 25)   6.2:1
};

function theme(name: string, type: "light" | "dark", p: Palette): ThemeRegistration {
  return {
    name,
    type,
    colors: { "editor.background": p.bg, "editor.foreground": p.fg },
    fg: p.fg,
    bg: p.bg,
    settings: [
      { settings: { foreground: p.fg, background: p.bg } },
      { scope: ["comment", "punctuation.definition.comment", "string.comment"], settings: { foreground: p.comment, fontStyle: "italic" } },
      {
        scope: ["punctuation", "meta.brace", "meta.delimiter", "punctuation.separator", "punctuation.terminator", "punctuation.accessor", "meta.tag.punctuation", "punctuation.definition.tag"],
        settings: { foreground: p.punctuation },
      },
      {
        scope: ["keyword", "storage", "storage.type", "storage.modifier", "keyword.operator.new", "keyword.operator.expression", "keyword.control", "variable.language.this", "variable.language.super"],
        settings: { foreground: p.keyword },
      },
      { scope: ["keyword.operator", "keyword.operator.assignment"], settings: { foreground: p.punctuation } },
      {
        scope: ["string", "string.quoted", "string.template", "punctuation.definition.string", "markup.inline.raw", "markup.fenced_code"],
        settings: { foreground: p.string },
      },
      { scope: ["constant.character.escape", "string.regexp", "punctuation.definition.template-expression"], settings: { foreground: p.number } },
      {
        scope: ["entity.name.function", "support.function", "meta.function-call entity.name.function", "variable.function", "entity.name.method"],
        settings: { foreground: p.fn },
      },
      {
        scope: ["constant.numeric", "constant.language", "constant.language.boolean", "constant.other", "support.constant", "variable.other.constant", "keyword.other.unit"],
        settings: { foreground: p.number },
      },
      {
        scope: ["entity.name.type", "entity.name.class", "support.type", "support.class", "entity.other.inherited-class", "storage.type.class.jsdoc", "meta.type.annotation entity.name.type", "entity.name.namespace"],
        settings: { foreground: p.type },
      },
      {
        scope: ["variable.other.property", "variable.other.object.property", "meta.object-literal.key", "support.variable.property", "support.type.property-name", "meta.property-name", "entity.name.tag.yaml"],
        settings: { foreground: p.property },
      },
      { scope: ["support.type.property-name.json", "support.type.property-name.json punctuation"], settings: { foreground: p.keyword } },
      { scope: ["variable.parameter", "meta.parameters variable"], settings: { foreground: p.parameter } },
      { scope: ["entity.name.tag", "support.class.component", "entity.name.tag.css", "entity.name.tag.html"], settings: { foreground: p.keyword } },
      { scope: ["entity.other.attribute-name", "entity.other.attribute-name.class.css", "entity.other.attribute-name.id.css"], settings: { foreground: p.attribute } },
      { scope: ["support.type.property-name.css", "support.type.vendored.property-name.css"], settings: { foreground: p.property } },
      { scope: ["support.constant.property-value.css", "keyword.other.unit.css", "constant.other.color"], settings: { foreground: p.number } },
      { scope: ["variable.other.readwrite", "variable.other.object", "variable"], settings: { foreground: p.fg } },
      // Shell: commands read as functions, flags as parameters.
      { scope: ["entity.name.command", "support.function.builtin.shell"], settings: { foreground: p.fn } },
      { scope: ["variable.parameter.option", "constant.other.option"], settings: { foreground: p.attribute } },
      // Plain arguments stay in the foreground, so a command reads as command + flags, not a wall of string colour.
      { scope: ["string.unquoted.argument", "string.unquoted.argument.shell"], settings: { foreground: p.fg } },
      // Markdown.
      { scope: ["markup.heading", "entity.name.section", "punctuation.definition.heading"], settings: { foreground: p.fn, fontStyle: "bold" } },
      { scope: ["markup.bold"], settings: { fontStyle: "bold" } },
      { scope: ["markup.italic"], settings: { fontStyle: "italic" } },
      { scope: ["markup.underline.link", "string.other.link"], settings: { foreground: p.type } },
      { scope: ["punctuation.definition.list.begin.markdown", "beginning.punctuation.definition.list.markdown"], settings: { foreground: p.keyword } },
      // Python decorators.
      { scope: ["entity.name.function.decorator", "meta.decorator", "punctuation.definition.decorator"], settings: { foreground: p.attribute } },
      // Diff.
      { scope: ["markup.inserted", "punctuation.definition.inserted"], settings: { foreground: p.inserted } },
      { scope: ["markup.deleted", "punctuation.definition.deleted"], settings: { foreground: p.deleted } },
      { scope: ["meta.diff.range", "meta.diff.header", "meta.diff.index", "punctuation.definition.range.diff"], settings: { foreground: p.type } },
    ],
  };
}

export const easedStone = theme("eased-stone", "dark", stone);
export const easedCream = theme("eased-cream", "light", cream);
