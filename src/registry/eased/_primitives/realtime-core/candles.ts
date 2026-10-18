import { bands, linear, niceScale, type Domain } from "../chart-core/scales";
import type { TickStream } from "./stream";

/** One OHLC bar. `t` is the bucket's start, epoch ms. */
export type Candle = { t: number; open: number; high: number; low: number; close: number; volume?: number };

/** Buckets timestamped prices into candles (`bucketMs` wide, aligned to multiples of it). */
export function toCandles(points: readonly { t: number; value: number; volume?: number }[], bucketMs: number): Candle[] {
  const out: Candle[] = [];
  for (const p of points) {
    const t = Math.floor(p.t / bucketMs) * bucketMs;
    const last = out[out.length - 1];
    if (last && last.t === t) {
      last.high = Math.max(last.high, p.value);
      last.low = Math.min(last.low, p.value);
      last.close = p.value;
      if (p.volume !== undefined) last.volume = (last.volume ?? 0) + p.volume;
    } else {
      out.push({ t, open: last?.close ?? p.value, high: p.value, low: p.value, close: p.value, volume: p.volume });
      // A gap-free chart: the new candle opens at the previous close and spans it.
      const c = out[out.length - 1];
      c.high = Math.max(c.high, c.open);
      c.low = Math.min(c.low, c.open);
    }
  }
  return out;
}

/**
 * `count` candles from one stream series, each built from `ticksPerCandle` ticks and ending at
 * tick `end`. Deterministic, so the same chart renders on the server and the client.
 */
export function candlesFromStream(stream: TickStream, id: string, { end, count, ticksPerCandle = 12 }: { end: number; count: number; ticksPerCandle?: number }): Candle[] {
  const first = Math.max(0, end - count * ticksPerCandle + 1);
  const ticks = stream.window(end, end - first + 1);
  const bucketMs = stream.intervalMs * ticksPerCandle;
  return toCandles(
    ticks.map((t) => ({ t: t.t, value: t.values[id] })),
    bucketMs,
  ).slice(-count);
}

/**
 * Folds a live price into the candles: it updates the last candle while `t` is inside its
 * bucket and opens a new one when it isn't, keeping at most `max`. Immutable.
 */
export function pushPrice(candles: readonly Candle[], price: number, t: number, bucketMs: number, max = Infinity): Candle[] {
  const bucket = Math.floor(t / bucketMs) * bucketMs;
  const last = candles[candles.length - 1];
  if (last && last.t === bucket) {
    const next = { ...last, high: Math.max(last.high, price), low: Math.min(last.low, price), close: price };
    return [...candles.slice(0, -1), next];
  }
  const open = last?.close ?? price;
  const out = [...candles, { t: bucket, open, high: Math.max(open, price), low: Math.min(open, price), close: price }];
  return out.length > max ? out.slice(out.length - max) : out;
}

/** A clean price domain and gridlines for candles (chart-core `niceScale`, zero dropped). */
export function candleScale(candles: readonly Candle[], { ticks = 4 }: { ticks?: number } = {}) {
  return niceScale(
    candles.flatMap((c) => [c.low, c.high]),
    { zero: false, ticks },
  );
}

export type CandleShape = {
  candle: Candle;
  /** Up (close ≥ open) or down. */
  up: boolean;
  /** Centre x of the candle. */
  x: number;
  /** Body: top y and height (at least 1px, so a doji still shows). */
  bodyY: number;
  bodyHeight: number;
  /** The open's y: grow a body from here for the "candles grow from their open" entrance. */
  openY: number;
  /** Wick top (high) and bottom (low). */
  wickTop: number;
  wickBottom: number;
};

/**
 * Pixel geometry for candles in a `width × height` plot, on chart-core's `bands` (bodies capped
 * at `maxBar` px with air between) and `linear` y. Pass the `domain` you are springing to so
 * the candles and gridlines move together.
 */
export function candleLayout(
  candles: readonly Candle[],
  { width, height, domain = candleScale(candles).domain, maxBar = 12 }: { width: number; height: number; domain?: Domain; maxBar?: number },
) {
  const b = bands(candles.length, width, { maxBar, gap: 0.36 });
  const y = linear(domain, [height, 0]);
  const shapes: CandleShape[] = candles.map((c, i) => {
    const up = c.close >= c.open;
    const top = y(Math.max(c.open, c.close));
    const bottom = y(Math.min(c.open, c.close));
    return {
      candle: c,
      up,
      x: b.center(i),
      bodyY: top,
      bodyHeight: Math.max(1, bottom - top),
      openY: y(c.open),
      wickTop: y(c.high),
      wickBottom: y(c.low),
    };
  });
  return { shapes, bar: b.bar, band: b.band, y, domain };
}
