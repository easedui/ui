/**
 * A small seeded RNG (mulberry32). Same seed, same sequence, on the server and in every
 * browser, so seeded demos hydrate without a mismatch and look the same in every screenshot.
 */

export type Rng = {
  /** Uniform in [0, 1). */
  next(): number;
  /** Uniform in [min, max). */
  range(min: number, max: number): number;
  /** Integer in [min, max], both inclusive. */
  int(min: number, max: number): number;
  /** Standard normal (mean 0, sd 1), Box–Muller. */
  normal(): number;
  /** True with probability `p`. */
  chance(p: number): boolean;
  /** One item of a non-empty list. */
  pick<T>(items: readonly T[]): T;
  /** A shuffled copy (Fisher–Yates). */
  shuffle<T>(items: readonly T[]): T[];
  /** The internal state, to resume a stream later with `createRng(state)`. */
  state(): number;
};

/** A 32-bit seed from any string (FNV-1a), so seeds can be readable: `seedFrom("crypto/BTC")`. */
export function seedFrom(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** A seeded generator. `seed` is a number or a string (hashed with `seedFrom`). */
export function createRng(seed: number | string): Rng {
  let s = (typeof seed === "string" ? seedFrom(seed) : seed) >>> 0;
  const next = () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const rng: Rng = {
    next,
    range: (min, max) => min + (max - min) * next(),
    int: (min, max) => Math.floor(min + (max - min + 1) * next()),
    normal: () => {
      const u = 1 - next();
      const v = next();
      return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    },
    chance: (p) => next() < p,
    pick: (items) => items[Math.floor(next() * items.length)],
    shuffle: (items) => {
      const out = [...items];
      for (let i = out.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1));
        [out[i], out[j]] = [out[j], out[i]];
      }
      return out;
    },
    state: () => s,
  };
  return rng;
}

/** Rounds to `decimals` places without float noise (0.1 + 0.2 → 0.3). */
export function roundTo(value: number, decimals: number): number {
  const k = 10 ** decimals;
  return Math.round(value * k) / k;
}
