import { createRng, roundTo, type Rng } from "./rng";

/** One value the stream moves: a price, a rate, a level such as heart rate or requests/s. */
export type SeriesSpec = {
  id: string;
  /** Value at tick 0, and what `meanRevert` pulls back towards. */
  initial: number;
  /**
   * `price` walks multiplicatively (log-normal, never below 0): FX, stocks, tokens.
   * `level` walks additively around `initial`: heart rate, latency, queue depth. Default `price`.
   */
  kind?: "price" | "level";
  /** Per-tick standard deviation as a share of the value (price) or of `initial` (level). Default 0.001 price (≈ 0.1% a tick), 0.02 level. */
  volatility?: number;
  /** Per-tick drift as a share (price) or in units (level). Default 0. */
  drift?: number;
  /** 0–1, how hard each tick pulls back to `initial`. Default 0.004 price, 0.08 level. */
  meanRevert?: number;
  /** Places the emitted values are rounded to. Default 2. */
  decimals?: number;
  /** Clamp. */
  min?: number;
  max?: number;
};

export type Tick = {
  /** 0, 1, 2 …: the tick's position in the stream. */
  index: number;
  /** Epoch ms of the tick: `start + index × intervalMs`. */
  t: number;
  /** Each series' value at this tick, rounded to its `decimals`. */
  values: Record<string, number>;
};

export type TickStreamOptions = {
  /** Same seed, same stream, everywhere. */
  seed: number | string;
  series: readonly SeriesSpec[];
  /** Spacing of tick timestamps. Default 1000. */
  intervalMs?: number;
  /** Epoch ms of tick 0. Default 18 Oct 2026 14:30 UTC, so output never depends on the clock. */
  start?: number;
};

export type TickStream = {
  readonly series: readonly SeriesSpec[];
  readonly intervalMs: number;
  readonly start: number;
  /** The tick at `index` (random access; walked once, then cached). */
  at(index: number): Tick;
  /** `count` ticks ending at `end` (inclusive), oldest first; clipped at tick 0. */
  window(end: number, count: number): Tick[];
  /** One series' values over a window, oldest first: feed it to a Sparkline or Line Chart. */
  values(id: string, end: number, count: number): number[];
};

/** 18 Oct 2026 14:30 UTC: the fixed "now" every Eased fixture and stream is anchored to. */
export const STREAM_EPOCH = Date.UTC(2026, 9, 18, 14, 30);

type Walker = { spec: Required<Omit<SeriesSpec, "min" | "max">> & Pick<SeriesSpec, "min" | "max">; rng: Rng; raw: number[] };

/**
 * A deterministic, seeded tick stream: prices, rates or metrics as random walks that hydrate
 * identically and replay the same every time. Each series has its own generator
 * (`seed/id`), so adding a series never changes the others.
 *
 *   const fx = createTickStream({ seed: "fx", series: [{ id: "EURUSD", initial: 1.0842, decimals: 4 }] });
 *   fx.at(120).values.EURUSD; // 1.0857, always
 */
export function createTickStream({ seed, series, intervalMs = 1000, start = STREAM_EPOCH }: TickStreamOptions): TickStream {
  const walkers: Walker[] = series.map((s) => {
    const kind = s.kind ?? "price";
    return {
      spec: {
        id: s.id,
        initial: s.initial,
        kind,
        volatility: s.volatility ?? (kind === "price" ? 0.001 : 0.02),
        drift: s.drift ?? 0,
        meanRevert: s.meanRevert ?? (kind === "price" ? 0.004 : 0.08),
        decimals: s.decimals ?? 2,
        min: s.min,
        max: s.max,
      },
      rng: createRng(`${seed}/${s.id}`),
      raw: [s.initial],
    };
  });
  const cache = new Map<number, Tick>();

  const rawAt = (w: Walker, index: number) => {
    const { spec, rng, raw } = w;
    while (raw.length <= index) {
      const v = raw[raw.length - 1];
      const z = rng.normal();
      let next =
        spec.kind === "price"
          ? v * Math.exp(spec.drift + spec.volatility * z) + spec.meanRevert * (spec.initial - v)
          : v + spec.drift + spec.volatility * spec.initial * z + spec.meanRevert * (spec.initial - v);
      if (spec.kind === "price") next = Math.max(next, spec.initial * 1e-3);
      if (spec.min !== undefined) next = Math.max(spec.min, next);
      if (spec.max !== undefined) next = Math.min(spec.max, next);
      raw.push(next);
    }
    return raw[index];
  };

  const at = (index: number): Tick => {
    const i = Math.max(0, Math.floor(index));
    const hit = cache.get(i);
    if (hit) return hit;
    const values: Record<string, number> = {};
    for (const w of walkers) values[w.spec.id] = roundTo(rawAt(w, i), w.spec.decimals);
    const tick = { index: i, t: start + i * intervalMs, values };
    if (cache.size > 4096) cache.clear();
    cache.set(i, tick);
    return tick;
  };

  const slice = (end: number, count: number) => {
    const out: Tick[] = [];
    for (let i = Math.max(0, end - count + 1); i <= end; i++) out.push(at(i));
    return out;
  };

  return {
    series,
    intervalMs,
    start,
    at,
    window: slice,
    values: (id, end, count) => slice(end, count).map((t) => t.values[id]),
  };
}

/** Change between two values: absolute, as a share of `from`, and the direction. */
export function change(from: number, to: number) {
  const delta = to - from;
  return { delta, pct: from === 0 ? 0 : delta / Math.abs(from), direction: delta > 0 ? "up" : delta < 0 ? "down" : "flat" } as const;
}
