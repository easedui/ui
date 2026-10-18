/**
 * crypto-core: the small pieces every Eased crypto block shares, so a wallet, a swap and an
 * order book read as one product: the token glyph, chain tints, address truncation and the
 * price and amount formats. Import from here.
 */
import type { CSSProperties } from "react";
import { minusFormatter } from "../../lib/format";

/* ---------- Token glyph ------------------------------------------------------------------ */

/**
 * Monochrome marks for the common symbols. No brand logos: a disc with a glyph reads as
 * "a token" at 20px, sits on any theme and never clashes with the page's accent.
 */
const GLYPHS: Record<string, string> = {
  BTC: "₿",
  ETH: "Ξ",
  SOL: "◎",
  USDC: "$",
  USDT: "₮",
  DAI: "◈",
  LINK: "⬢",
};

export type TokenGlyphProps = {
  symbol: string;
  /** Pixel size of the disc. Default 20; the glyph scales with it. */
  size?: number;
  className?: string;
};

/** A token's disc: sunken fill, the alpha image ring, and a glyph (or the symbol's first letter). */
export function TokenGlyph({ symbol, size = 20, className = "" }: TokenGlyphProps) {
  const glyph = GLYPHS[symbol.toUpperCase()] ?? symbol.slice(0, 1).toUpperCase();
  return (
    <span
      aria-hidden
      style={{ width: size, height: size, fontSize: Math.round(size * 0.55) } as CSSProperties}
      className={`relative inline-flex shrink-0 items-center justify-center rounded-full bg-surface-active font-medium leading-none text-text-secondary image-ring select-none ${className}`}
    >
      {glyph}
    </span>
  );
}

/* ---------- Chain tints ------------------------------------------------------------------ */

export type ChainTone = "info" | "brand" | "success" | "warning" | "neutral";

/** A chain's tint as a token, for washes and dots. Never decoration beyond one glow (rule 35/36). */
export const CHAIN_TONE_VAR: Record<ChainTone, string> = {
  info: "var(--color-info)",
  brand: "var(--color-brand)",
  success: "var(--color-success)",
  warning: "var(--color-warning)",
  neutral: "var(--color-text-muted)",
};

/** A ≤ 10%-alpha radial glow of a chain's tone, for the top of a card (rule 36). */
export const chainGlow = (tone: ChainTone, alpha = 10) =>
  `radial-gradient(120% 80% at 0% 0%, color-mix(in oklch, ${CHAIN_TONE_VAR[tone]} ${alpha}%, transparent), transparent 70%)`;

/* ---------- Formats ---------------------------------------------------------------------- */

/** Default locale for every crypto format: prices read `$67,321.50`, never `US$`. Pass your own. */
export const CRYPTO_LOCALE = "en-US";

/** `0x7a3F…Bf62`: the head and tail a person actually checks. */
export function truncateAddress(address: string, head = 6, tail = 4) {
  if (address.length <= head + tail + 1) return address;
  return `${address.slice(0, head)}…${address.slice(-tail)}`;
}

/** Fraction digits for a USD price: cents above $1, more below, so small tokens stay legible. */
export function priceDecimals(price: number) {
  const p = Math.abs(price);
  if (p >= 1000) return 2;
  if (p >= 1) return p >= 10 ? 2 : 3;
  if (p >= 0.01) return 4;
  return 6;
}

/** Intl options for a USD price with `priceDecimals`, ready for NumberRoll's `format`. */
export const usdFormat = (price: number, decimals = priceDecimals(price)): Intl.NumberFormatOptions => ({
  style: "currency",
  currency: "USD",
  minimumFractionDigits: decimals,
  maximumFractionDigits: decimals,
});

/** Significant decimals for a token amount: fewer for big holdings, more for fractions of a coin. */
export function amountDecimals(amount: number) {
  const a = Math.abs(amount);
  if (a === 0) return 2;
  if (a >= 1000) return 2;
  if (a >= 1) return 4;
  return 6;
}

/** `4.2817`, `12,480.55`, `0.002914` — token amounts at a sensible precision. */
export const formatAmount = (amount: number, { locale = CRYPTO_LOCALE, decimals = amountDecimals(amount) }: { locale?: Intl.LocalesArgument; decimals?: number } = {}) =>
  new Intl.NumberFormat(locale, { minimumFractionDigits: Math.min(2, decimals), maximumFractionDigits: decimals }).format(amount);

/** `$12,480.55` (or `$4.2K` compact). */
export const formatUsd = (value: number, { locale = CRYPTO_LOCALE, decimals, compact = false }: { locale?: Intl.LocalesArgument; decimals?: number; compact?: boolean } = {}) =>
  new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "USD",
    notation: compact ? "compact" : "standard",
    minimumFractionDigits: decimals ?? (compact ? 0 : 2),
    maximumFractionDigits: decimals ?? (compact ? 1 : 2),
  }).format(value);

/** `+1.84%` / `−0.93%`, always signed, one decimal unless told otherwise. */
export const formatChange = (share: number, { locale = CRYPTO_LOCALE, decimals = 2 }: { locale?: Intl.LocalesArgument; decimals?: number } = {}) =>
  minusFormatter(locale, { style: "percent", minimumFractionDigits: decimals, maximumFractionDigits: decimals, signDisplay: "exceptZero" })(share);

/**
 * The market colour of a move: up reads success, down reads danger (trading convention), flat is
 * muted. Only for market moves (prices, rates, P&L). A fall in a metric the user owns, like
 * spend or a balance, reads warning instead (rule 119).
 */
export const moveTone = (delta: number) => (delta > 0 ? "text-success-text" : delta < 0 ? "text-danger-text" : "text-text-muted");
