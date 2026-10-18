/**
 * The chart palette: six categorical hues in a fixed order, stepped separately for light and
 * dark and validated as a set (adjacent CVD ΔE ≥ 8.4, normal-vision ΔE ≥ 19.3, both themes).
 * Slots 3–5 sit under 3:1 on a white surface, which is why every chart ships a data table and
 * a legend: identity is never colour alone.
 *
 * They live here until `eased.css` carries them. Declared at zero specificity, so the same
 * variables in `eased.css` (or your own theme) win the moment they exist.
 */
const LIGHT = [
  "oklch(57.5% 0.163 255.5)", // blue
  "oklch(67.1% 0.175 40.6)", // orange
  "oklch(66.9% 0.141 162.1)", // aqua
  "oklch(76.4% 0.161 75.1)", // amber
  "oklch(71.6% 0.141 357.4)", // pink
  "oklch(52.7% 0.197 283.4)", // violet
];
const DARK = [
  "oklch(62.2% 0.161 255.1)",
  "oklch(62.2% 0.173 40.1)",
  "oklch(62.1% 0.128 163.1)",
  "oklch(67% 0.143 73.2)",
  "oklch(62.2% 0.171 0.8)",
  "oklch(67% 0.145 286.8)",
];

const vars = (colors: string[]) => colors.map((c, i) => `--eased-chart-${i + 1}:${c};`).join("");

/** The CSS the charts inject; also what to paste into `eased.css` to make the tokens global. */
export const CHART_TOKENS_CSS =
  `:where(:root){${vars(LIGHT)}--eased-chart-grid:var(--eased-line-subtle);--eased-chart-cursor:var(--eased-line-strong);}` +
  `:where(.dark,[data-theme="dark"]){${vars(DARK)}}`;

/**
 * Renders the chart tokens once per document (React 19 hoists and dedupes a `<style>` with
 * an `href`). Every chart renders it; you never need to.
 */
export function ChartTokens() {
  return (
    <style href="eased-chart-tokens" precedence="low">
      {CHART_TOKENS_CSS}
    </style>
  );
}

/** Number of categorical slots. A seventh series is not a generated hue: fold it into "Other". */
export const CHART_SLOTS = 6;

/**
 * The colour for series slot `n` (1-based) as a CSS variable. Slots past six fall back to
 * muted text rather than cycling, so two series never share a hue silently.
 */
export function chartColor(n: number) {
  return n >= 1 && n <= CHART_SLOTS ? `var(--eased-chart-${n})` : "var(--eased-text-muted)";
}
