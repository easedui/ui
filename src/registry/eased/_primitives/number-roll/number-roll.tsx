"use client";

import {
  AnimatePresence,
  animate,
  motion,
  useMotionValue,
  useTransform,
  type MotionValue,
  type Transition,
} from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { exitFast, fade, instant, snappy, useSafeReducedMotion } from "../../lib/motion";

export type RollDirection = "up" | "down";

/** One piece of a formatted number: a digit that rolls, or a symbol that swaps. */
export type RollPart =
  | { kind: "digit"; key: string; digit: number; text: string }
  | { kind: "symbol"; key: string; text: string };

export type NumberRollFormat = {
  /** Locale(s) for `Intl.NumberFormat`. Defaults to the runtime locale. */
  locale?: Intl.LocalesArgument;
  /** @deprecated Use `locale`. Kept for one release. */
  locales?: Intl.LocalesArgument;
  /** `Intl.NumberFormat` options: currency, percent, compact, units, fixed decimals … */
  format?: Intl.NumberFormatOptions;
  /**
   * Format the number yourself. Overrides `locale`/`format`; digits in the returned string
   * roll and everything else swaps. Places are counted from the right of the string.
   */
  formatter?: (value: number) => string;
};

export type NumberRollProps = NumberRollFormat & {
  value: number;
  /**
   * Which way changed digits travel. `auto` (default) rolls up as the number's size grows and
   * down as it shrinks, like an odometer; `up`/`down` force one direction.
   */
  direction?: "auto" | RollDirection;
  /** False shows changes at once, e.g. while a drag drives the value. Default true. */
  animated?: boolean;
  /** The spring each digit rides. Default `snappy`. */
  transition?: Transition;
  /**
   * Hide the number from assistive tech when something else already announces it
   * (a progressbar's aria-valuenow, a label that includes it). Default false.
   */
  "aria-hidden"?: boolean;
  className?: string;
};

const FACES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

/** Splits a number into keyed parts. Integer places are keyed from the decimal point, so the ones column stays put as the number grows. */
export function toRollParts(value: number, { locale, locales, format, formatter }: NumberRollFormat = {}): RollPart[] {
  if (formatter) return stringParts(formatter(value));
  const raw = new Intl.NumberFormat(locale ?? locales, format).formatToParts(value);
  const intDigits = raw.filter((p) => p.type === "integer").reduce((n, p) => n + p.value.length, 0);
  const parts: RollPart[] = [];
  const seen: Record<string, number> = {};
  let place = intDigits; // integer places still to the right of the next digit, plus one
  let fraction = 0;
  for (const p of raw) {
    if (p.type === "integer") {
      for (const ch of p.value) {
        place--;
        const d = digitOf(ch);
        parts.push(d === null ? { kind: "symbol", key: `i${place}:${ch}`, text: ch } : { kind: "digit", key: `i${place}`, digit: d, text: ch });
      }
    } else if (p.type === "fraction") {
      for (const ch of p.value) {
        const d = digitOf(ch);
        parts.push(d === null ? { kind: "symbol", key: `f${fraction}:${ch}`, text: ch } : { kind: "digit", key: `f${fraction}`, digit: d, text: ch });
        fraction++;
      }
    } else if (p.type === "group") {
      parts.push({ kind: "symbol", key: `g${place}`, text: p.value });
    } else if (p.type === "decimal") {
      parts.push({ kind: "symbol", key: "dec", text: p.value });
    } else {
      // Currency, signs, percent, compact suffixes, units, literals: keyed by type and content,
      // so "K" → "M" swaps while "$" stays and slides.
      const n = (seen[p.type] = (seen[p.type] ?? -1) + 1);
      parts.push({ kind: "symbol", key: `${p.type}${n}:${p.value}`, text: p.value });
    }
  }
  return parts;
}

function stringParts(text: string): RollPart[] {
  const chars = [...text];
  return chars.map((ch, i) => {
    const place = chars.length - 1 - i;
    const d = digitOf(ch);
    return d === null ? { kind: "symbol", key: `s${place}:${ch}`, text: ch } : { kind: "digit", key: `c${place}`, digit: d, text: ch };
  });
}

/** Reads ASCII and other Unicode decimal digits (Arabic-Indic, Devanagari …), so localized numerals roll too. */
function digitOf(ch: string): number | null {
  if (ch >= "0" && ch <= "9") return ch.charCodeAt(0) - 48;
  if (!/\p{Nd}/u.test(ch)) return null;
  // Unicode lays every decimal script out as contiguous runs of ten starting at zero.
  let code = ch.codePointAt(0)!;
  let n = 0;
  while (n < 60 && /\p{Nd}/u.test(String.fromCodePoint(code - 1))) {
    code--;
    n++;
  }
  return n % 10;
}

/**
 * Tabular digits that roll in the direction of change, with locale-aware separators.
 * Each digit is a ten-face cylinder on a spring, so a 9 → 0 carry rolls forward instead of
 * rewinding, and a value that changes mid-roll redirects from where the digit is.
 * New places fade in from the side they roll from; the rest slide over to make room.
 */
export function NumberRoll({
  value,
  locale: localeProp,
  locales,
  format,
  formatter,
  direction = "auto",
  animated = true,
  transition = snappy,
  "aria-hidden": ariaHidden = false,
  className = "",
}: NumberRollProps) {
  const reduced = useSafeReducedMotion();
  const roll = animated && !reduced;
  const locale = localeProp ?? locales;

  // Direction comes from the change between renders (adjusting state while rendering, not an effect).
  const [last, setLast] = useState({ value, dir: 1 as 1 | -1 });
  if (value !== last.value) {
    const grew = Math.abs(value) >= Math.abs(last.value);
    setLast({ value, dir: direction === "up" ? 1 : direction === "down" ? -1 : grew ? 1 : -1 });
  }
  const dir = direction === "auto" ? last.dir : direction === "up" ? 1 : -1;

  // `format` is usually an inline object; key the memo on its contents.
  const formatKey = JSON.stringify(format ?? null);
  const options = useMemo(() => JSON.parse(formatKey) as Intl.NumberFormatOptions | null, [formatKey]);
  const parts = useMemo(
    () => toRollParts(value, { locale, format: options ?? undefined, formatter }),
    [value, locale, options, formatter],
  );
  const label = parts.map((p) => p.text).join("");

  const enterY = `${dir * 50}%`;

  return (
    <span className={`relative inline-flex whitespace-nowrap tabular-nums ${className}`}>
      {!ariaHidden && <span className="sr-only">{label}</span>}
      <span aria-hidden className="inline-flex select-none">
        <AnimatePresence mode="popLayout" initial={false}>
          {parts.map((part) => (
            <motion.span
              key={part.key}
              layout={roll ? "position" : false}
              className="inline-block whitespace-pre"
              initial={roll ? { opacity: 0, y: enterY, filter: "blur(2px)" } : { opacity: 0 }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={
                roll
                  ? { opacity: 0, y: `${-dir * 50}%`, filter: "blur(2px)", transition: exitFast }
                  : { opacity: 0, transition: instant }
              }
              transition={roll ? { ...transition, opacity: fade, filter: fade } : instant}
            >
              {part.kind === "digit" ? (
                <Digit digit={part.digit} zero={part.text.codePointAt(0)! - part.digit} dir={dir} roll={roll} transition={transition} />
              ) : (
                part.text
              )}
            </motion.span>
          ))}
        </AnimatePresence>
      </span>
    </span>
  );
}

/** Keeps a value in [-5, 5): a face's distance from the centre of the cylinder, in faces. */
const around = (x: number) => ((((x + 5) % 10) + 10) % 10) - 5;

type DigitProps = { digit: number; /** Code point of this script's zero, so faces draw in the locale's numerals. */ zero: number; dir: 1 | -1; roll: boolean; transition: Transition };

function Digit({ digit, zero, dir, roll, transition }: DigitProps) {
  // `pos` is the cylinder's rotation in faces; it only ever moves by whole steps in `dir`.
  const pos = useMotionValue(digit);
  const shown = useRef(digit);
  const target = useRef(digit);

  useEffect(() => {
    const from = shown.current;
    if (digit === from) return;
    shown.current = digit;
    const steps = dir > 0 ? (digit - from + 10) % 10 : -((from - digit + 10) % 10);
    target.current += steps;
    if (roll) animate(pos, target.current, transition);
    else pos.jump(target.current);
  }, [digit, dir, roll, transition, pos]);

  return (
    // The cell is padded 0.15em top and bottom (and pulled back by the same margin) so the
    // feathered mask never touches the glyph of a tight display line height.
    <span className="relative inline-block overflow-clip [margin-block:-0.15em] [padding-block:0.15em] [mask-image:linear-gradient(to_bottom,transparent,#000_20%,#000_80%,transparent)]">
      <span className="invisible">{String.fromCodePoint(zero)}</span>
      {FACES.map((face) => (
        <Face key={face} face={face} glyph={String.fromCodePoint(zero + face)} pos={pos} />
      ))}
    </span>
  );
}

function Face({ face, glyph, pos }: { face: number; glyph: string; pos: MotionValue<number> }) {
  const y = useTransform(pos, (p) => `${around(face - p) * 100}%`);
  return (
    <motion.span style={{ y }} className="absolute inset-0 text-center [padding-block:0.15em]">
      {glyph}
    </motion.span>
  );
}
