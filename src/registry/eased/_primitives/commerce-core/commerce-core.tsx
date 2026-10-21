"use client";

/**
 * commerce-core: the pieces every Eased e-commerce block shares, so a product card, a cart and
 * a wishlist read as one store: drawn product art, colour swatches, the price line, the
 * quantity stepper and the money and stock formats. Import from here.
 */
import { AnimatePresence, motion, useAnimate } from "motion/react";
import { useEffect, useId, useRef, type ComponentProps, type CSSProperties } from "react";
import { trueMinus } from "../../lib/format";
import { ease, reducedFade, swap, swapIn, swapOut, swapShown, useSafeReducedMotion } from "../../lib/motion";
import { pressIcon } from "../../lib/press";
import { NumberRoll } from "../number-roll/number-roll";

/* ---------- Types ------------------------------------------------------------------------ */

/** One buyable combination, as every commerce block takes it. */
export type ProductVariant = {
  id: string;
  /** Colourway name, e.g. "Moss". */
  color: string;
  /** The colourway's swatch colour (product data, like a photo). */
  swatch: string;
  /** "M", or "One size". */
  size: string;
  stock: number;
  price: number;
  compareAt?: number;
};

/* ---------- Formats ---------------------------------------------------------------------- */

export const COMMERCE_LOCALE = "en-US";

export type MoneyOptions = { currency?: string; locale?: Intl.LocalesArgument; /** Default: none for whole amounts, 2 otherwise. */ decimals?: number };

/** Intl options for a price, ready for NumberRoll's `format`: `$248`, `$89.50`. */
export const moneyFormat = (value: number, { currency = "USD", decimals }: MoneyOptions = {}): Intl.NumberFormatOptions => {
  const d = decimals ?? (Number.isInteger(value) ? 0 : 2);
  return { style: "currency", currency, minimumFractionDigits: d, maximumFractionDigits: d };
};

/** `$248`, `$1,284.50`, `−$51.30` (true minus). */
export const formatMoney = (value: number, { locale = COMMERCE_LOCALE, ...o }: MoneyOptions = {}) =>
  trueMinus(new Intl.NumberFormat(locale, moneyFormat(value, o)).format(value));

/** `−20%` for a markdown, or undefined when there is none. */
export const discountLabel = (price: number, compareAt?: number, locale: Intl.LocalesArgument = COMMERCE_LOCALE) =>
  compareAt && compareAt > price
    ? trueMinus(new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 0, signDisplay: "always" }).format(-(1 - price / compareAt)))
    : undefined;

export type StockState = "in" | "low" | "out";
/** `out` at 0, `low` at or under `lowAt` (default 3), else `in`. */
export const stockState = (stock: number, lowAt = 3): StockState => (stock <= 0 ? "out" : stock <= lowAt ? "low" : "in");

/* ---------- Price ------------------------------------------------------------------------ */

export type PriceProps = MoneyOptions & {
  value: number;
  /** The original price; shown struck through when higher than `value`. */
  compareAt?: number;
  /** Roll the digits when the value changes. Default true. */
  roll?: boolean;
  className?: string;
};

/** The selling price (rolls when it changes), then the struck original, muted. */
export function Price({ value, compareAt, roll = true, currency = "USD", locale = COMMERCE_LOCALE, decimals, className = "" }: PriceProps) {
  const sale = compareAt !== undefined && compareAt > value;
  const fmt = moneyFormat(value, { currency, decimals });
  const spoken = `${formatMoney(value, { currency, locale, decimals })}${sale ? `, was ${formatMoney(compareAt, { currency, locale, decimals })}` : ""}`;
  return (
    <span className={`inline-flex items-baseline gap-1.5 tabular-nums ${className}`}>
      <span className="sr-only">{spoken}</span>
      <span aria-hidden className="text-text">
        {roll ? <NumberRoll value={value} locale={locale} format={fmt} aria-hidden /> : formatMoney(value, { currency, locale, decimals })}
      </span>
      <AnimatePresence initial={false}>
        {sale && (
          <motion.s
            key="was"
            aria-hidden
            className="text-text-muted decoration-text-muted/70"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.1 } }}
          >
            {formatMoney(compareAt, { currency, locale, decimals })}
          </motion.s>
        )}
      </AnimatePresence>
    </span>
  );
}

/* ---------- Swatch ----------------------------------------------------------------------- */

/** A colourway dot. The colour is product data (like a photo), so it is the one raw value allowed in. */
export function Swatch({ color, size = 16, className = "" }: { color: string; size?: number; className?: string }) {
  return (
    <span
      aria-hidden
      style={{ "--swatch": color, width: size, height: size } as CSSProperties}
      className={`relative inline-block shrink-0 rounded-pill bg-(--swatch) image-ring after:rounded-[inherit] ${className}`}
    />
  );
}

/* ---------- Product art ------------------------------------------------------------------ */

export type ProductArtKind = "jacket" | "shell" | "crew" | "short" | "pack" | "beanie";

export type ProductArtProps = {
  kind: ProductArtKind;
  /** The colourway's hex: the garment's fill; the backdrop is a 12% tint of it on the sunken surface. */
  color: string;
  /** Accessible name, e.g. "Ridgeline Down Jacket in Moss". Leave it out when a caption already names it. */
  label?: string;
  /** Classes for the frame. Give it a size or an aspect ratio; the art keeps 4:5 and centres. */
  className?: string;
};

const BODY = "M50 25h20c4 4 10 6 16 8 8 3 12 10 14 22l4 52q0 4-4 4h-8q-3 0-3-3l-3-42v52q0 4-4 4H38q-4 0-4-4V66l-3 42q0 3-3 3h-8q-4 0-4-4l4-52c2-12 6-19 14-22 6-2 12-4 16-8Z";

/**
 * A drawn product shot: a garment silhouette in the colourway over a soft tint of it, lit from
 * the top left, with a contact shadow. Stands in for photography in demos and empty states;
 * swap it for an `<img>` with `image-ring` in production.
 */
export function ProductArt({ kind, color, label, className = "" }: ProductArtProps) {
  const id = useId().replace(/:/g, "");
  const shade = `url(#${id}s)`;
  const line = "stroke-black/20";
  const lift = "stroke-white/15";
  return (
    <span
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      style={{ "--art": color } as CSSProperties}
      className={`relative flex items-center justify-center overflow-hidden bg-[color-mix(in_oklch,var(--art)_13%,var(--color-surface-sunken))] image-ring after:rounded-[inherit] ${className}`}
    >
      <svg viewBox="0 0 120 150" className="size-full dark:brightness-[.93] dark:saturate-[.96]" aria-hidden>
        <defs>
          <linearGradient id={`${id}s`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#fff" stopOpacity="0.2" />
            <stop offset="0.45" stopColor="#fff" stopOpacity="0" />
            <stop offset="1" stopColor="#000" stopOpacity="0.22" />
          </linearGradient>
          <filter id={`${id}b`} x="-20%" y="-200%" width="140%" height="500%">
            <feGaussianBlur stdDeviation="2.5" />
          </filter>
        </defs>
        <ellipse cx="60" cy="131" rx={kind === "beanie" ? 30 : 36} ry="3.5" fill="#000" opacity="0.16" filter={`url(#${id}b)`} />
        <g fill="var(--art)" strokeWidth="1" fillRule="evenodd" strokeLinecap="round">
          {(kind === "jacket" || kind === "shell" || kind === "crew") && (
            <>
              {kind === "shell" && <path d="M45 32c-3-15 6-22 15-22s18 7 15 22Z" />}
              {kind === "shell" && <path d="M45 32c-3-15 6-22 15-22s18 7 15 22Z" fill={shade} />}
              <path d={BODY} />
              <path d={BODY} fill={shade} />
              <path d="M86 38v28M34 38v28" fill="none" className={line} />
            </>
          )}
          {kind === "jacket" && (
            <g fill="none">
              <path d="M48 21q12-4 24 0v11q-12 4-24 0Z" fill="var(--art)" />
              <path d="M48 21q12-4 24 0v11q-12 4-24 0Z" fill={shade} />
              {[48, 60, 72, 84, 96, 108].map((y) => (
                <path key={y} d={`M34 ${y}q26 3 52 0`} className={line} />
              ))}
              {[49, 61, 73, 85, 97, 109].map((y) => (
                <path key={y} d={`M36 ${y}q24 3 48 0`} className={lift} />
              ))}
              {[62, 76, 90, 104].map((y) => (
                <path key={y} d={`M${18 + (y - 62) / 14} ${y}h12M${90 - (y - 62) / 14} ${y}h12`} className={line} />
              ))}
              <path d="M60 32v90" className="stroke-black/30" strokeWidth="1.2" />
              <path d="M45 88l3 12M75 88l-3 12" className={line} />
            </g>
          )}
          {kind === "shell" && (
            <g fill="none">
              <path d="M50 30q10 5 20 0" className={line} />
              <path d="M60 30v92" className="stroke-black/30" strokeWidth="1.2" />
              <path d="M66 46l12-4M44 90l3 12M76 90l-3 12" className={line} />
              <path d="M38 50q22 6 44 0" className={lift} />
              <path d="M54 33v6M66 33v6" className="stroke-black/25" strokeWidth="1.5" />
            </g>
          )}
          {kind === "crew" && (
            <g fill="none">
              <path d="M48 26q12 12 24 0" className="stroke-black/25" strokeWidth="3" />
              <path d="M34 112h52M20 100h11M89 100h11" className={line} />
              {Array.from({ length: 13 }, (_, i) => 37 + i * 4).map((x) => (
                <path key={x} d={`M${x} 113v8`} className="stroke-black/12" />
              ))}
              <path d="M38 52q22 5 44 0" className={lift} />
            </g>
          )}
          {kind === "short" && (
            <>
              <path d="M32 42h56l5 62q0 3-3 3l-26 3q-3 0-3-3l-1-34-1 34q0 3-3 3l-26-3q-3 0-3-3Z" />
              <path d="M32 42h56l5 62q0 3-3 3l-26 3q-3 0-3-3l-1-34-1 34q0 3-3 3l-26-3q-3 0-3-3Z" fill={shade} />
              <g fill="none">
                <path d="M32 52h56" className={line} />
                <path d="M60 52v20M40 52q2 12 12 14M80 52q-2 12-12 14M44 42v10M76 42v10" className={line} />
                <path d="M57 46q3 6 6 0" className="stroke-black/30" strokeWidth="1.2" />
                <path d="M36 60q8 2 14 0" className={lift} />
              </g>
            </>
          )}
          {kind === "pack" && (
            <>
              <path d="M52 30q0-10 8-10t8 10" fill="none" className="stroke-black/35" strokeWidth="3" />
              <rect x="34" y="28" width="52" height="98" rx="16" />
              <rect x="34" y="28" width="52" height="98" rx="16" fill={shade} />
              <path d="M34 58q0-30 26-30t26 30q-26 6-52 0Z" />
              <path d="M34 58q0-30 26-30t26 30q-26 6-52 0Z" fill={shade} />
              <rect x="43" y="76" width="34" height="40" rx="9" />
              <g fill="none">
                <path d="M34 58q26 6 52 0" className={line} />
                <rect x="43" y="76" width="34" height="40" rx="9" className={line} />
                <path d="M47 84h26" className="stroke-black/30" strokeWidth="1.2" />
                <path d="M30 72h8M82 72h8M30 100h8M82 100h8" className="stroke-black/30" strokeWidth="2" />
                <path d="M42 40q18-8 36 0" className={lift} />
              </g>
            </>
          )}
          {kind === "beanie" && (
            <>
              <path d="M32 96c0-34 12-50 28-50s28 16 28 50Z" />
              <path d="M32 96c0-34 12-50 28-50s28 16 28 50Z" fill={shade} />
              <rect x="29" y="90" width="62" height="28" rx="7" />
              <rect x="29" y="90" width="62" height="28" rx="7" fill={shade} />
              <g fill="none">
                {[-18, -9, 0, 9, 18].map((dx) => (
                  <path key={dx} d={`M${60 + dx * 1.4} 92Q${60 + dx * 1.1} 60 60 47`} className="stroke-black/12" />
                ))}
                {Array.from({ length: 14 }, (_, i) => 33 + i * 4).map((x) => (
                  <path key={x} d={`M${x} 93v22`} className="stroke-black/15" />
                ))}
                <path d="M29 92h62" className={line} />
                <path d="M42 64q8-10 18-12" className={lift} strokeWidth="1.5" />
              </g>
            </>
          )}
        </g>
      </svg>
    </span>
  );
}

/* ---------- Quantity stepper ------------------------------------------------------------- */

export type QtyStepperProps = {
  value: number;
  onValueChange: (value: number) => void;
  min?: number;
  max?: number;
  /** At `min`, the minus becomes a bin and calls this instead. */
  onRemove?: () => void;
  /** What is being counted, for the buttons' names: "Ridgeline Down Jacket". */
  label: string;
  locale?: Intl.LocalesArgument;
  className?: string;
};

/**
 * − 2 +, 32px, digits rolling in the direction of the step. With `onRemove`, the minus morphs
 * into a bin at the minimum, so the last press removes the line instead of dead-ending.
 */
export function QtyStepper({ value, onValueChange, min = 1, max = 99, onRemove, label, locale = COMMERCE_LOCALE, className = "" }: QtyStepperProps) {
  const reduced = useSafeReducedMotion();
  const bin = onRemove !== undefined && value <= min;
  const btn = `relative inline-flex h-full w-8 shrink-0 cursor-pointer items-center justify-center rounded-[inherit] text-text-secondary hover-fine:not-disabled:bg-surface-hover hover-fine:not-disabled:text-text disabled:cursor-not-allowed disabled:text-text-disabled ${pressIcon}`;
  return (
    <div role="group" aria-label={`Quantity, ${label}`} className={`inline-flex h-control-sm shrink-0 items-stretch rounded-control-sm border border-line p-px [--pad:1px] ${className}`}>
      <button
        type="button"
        aria-label={bin ? `Remove ${label}` : `Decrease quantity, ${label}`}
        disabled={!bin && value <= min}
        onClick={() => (bin ? onRemove?.() : onValueChange(Math.max(min, value - 1)))}
        className={`${btn} radius-nested`}
      >
        <span className="inline-grid place-items-center *:col-start-1 *:row-start-1">
          <AnimatePresence initial={false}>
            <motion.svg
              key={bin ? "bin" : "minus"}
              viewBox="0 0 16 16"
              className="size-4"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
              initial={reduced ? { opacity: 0 } : swapIn}
              animate={reduced ? { opacity: 1 } : swapShown}
              exit={reduced ? { opacity: 0 } : swapOut}
              transition={reduced ? reducedFade : swap}
            >
              {bin ? <path d="M3 4.5h10M6.5 4.5V3h3v1.5M4.5 4.5l.6 8.1a1 1 0 0 0 1 .9h3.8a1 1 0 0 0 1-.9l.6-8.1" /> : <path d="M4 8h8" />}
            </motion.svg>
          </AnimatePresence>
        </span>
      </button>
      <output aria-live="polite" aria-label={`Quantity ${value}`} className="flex min-w-7 items-center justify-center text-ui-sm font-medium text-text tabular-nums">
        <NumberRoll value={value} locale={locale} aria-hidden />
      </output>
      <button
        type="button"
        aria-label={`Increase quantity, ${label}`}
        disabled={value >= max}
        onClick={() => onValueChange(Math.min(max, value + 1))}
        className={`${btn} radius-nested`}
      >
        <svg viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" aria-hidden>
          <path d="M4 8h8M8 4v8" />
        </svg>
      </button>
    </div>
  );
}

/* ---------- Icons ------------------------------------------------------------------------ */

/** The bag glyph every block's cart button uses, 16px, 1.5 stroke. */
export function BagIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={`shrink-0 ${className}`} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3.25 5.25h9.5l-.7 7.6a1.5 1.5 0 0 1-1.5 1.4h-5.1a1.5 1.5 0 0 1-1.5-1.4Z" />
      <path d="M5.75 5.25V4.5a2.25 2.25 0 0 1 4.5 0v.75" />
    </svg>
  );
}


/* ---------- Bag button ------------------------------------------------------------------- */

export type BagButtonProps = Omit<ComponentProps<"button">, "children" | "type"> & {
  /** Items in the bag. The count rolls, and pops whenever it goes up. */
  count: number;
  locale?: Intl.LocalesArgument;
};

/**
 * The header's bag: a 32px icon button with a count bubble that rolls its digits and pops on
 * every add, so a quick add elsewhere on the page lands somewhere visible. Hidden at zero.
 */
export function BagButton({ count, locale = COMMERCE_LOCALE, className = "", ref, ...props }: BagButtonProps) {
  const reduced = useSafeReducedMotion();
  const [scope, animate] = useAnimate<HTMLSpanElement>();
  const prev = useRef(count);
  useEffect(() => {
    if (count > prev.current && prev.current > 0 && !reduced && scope.current) {
      animate(scope.current, { scale: [1, 1.22, 1] }, { duration: 0.4, ease: ease.enter });
    }
    prev.current = count;
  }, [count, reduced, animate, scope]);
  return (
    <button
      ref={ref}
      type="button"
      aria-label={`Bag, ${count} item${count === 1 ? "" : "s"}`}
      {...props}
      className={`relative inline-flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-control-sm text-text-secondary hover-fine:bg-surface-hover hover-fine:text-text ${pressIcon} ${className}`}
    >
      <BagIcon className="size-[18px]" />
      <AnimatePresence initial={false}>
        {count > 0 && (
          <motion.span
            key="count"
            aria-hidden
            className="absolute -top-0.5 -right-0.5 flex"
            initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1, transition: reduced ? reducedFade : swap }}
            exit={{ opacity: 0, scale: reduced ? 1 : 0.8, transition: { duration: 0.1 } }}
          >
            <span ref={scope} className="flex h-4 min-w-4 items-center justify-center rounded-pill bg-text px-1 text-ui-2xs font-medium text-surface tabular-nums ring-2 ring-surface">
              <NumberRoll value={count} locale={locale} aria-hidden />
            </span>
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}
