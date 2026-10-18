import { createRng, roundTo, seedFrom } from "./rng";

export type BookLevel = { price: number; size: number };
/** Bids best (highest) first, asks best (lowest) first. */
export type OrderBook = { bids: BookLevel[]; asks: BookLevel[] };

export type DepthLevel = BookLevel & {
  /** Cumulative size from the best price out to this level. */
  total: number;
  /** `total` over the larger side's deepest total, 0–1: the depth bar's width. */
  share: number;
  /** The level's size changed since the previous book (see `depth(book, { previous })`). */
  changed: boolean;
};

export type Depth = {
  bids: DepthLevel[];
  asks: DepthLevel[];
  /** Midpoint of the best bid and ask. */
  mid: number;
  spread: number;
  /** Spread in basis points of the mid. */
  spreadBps: number;
  maxTotal: number;
};

const levelKey = (l: BookLevel) => l.price.toFixed(10);

/**
 * The depth model for an order book: cumulative totals, bar shares on one scale for both sides
 * (so the sides compare), the spread, and which levels changed since `previous`.
 */
export function depth(book: OrderBook, { levels = 12, previous }: { levels?: number; previous?: OrderBook } = {}): Depth {
  const prev = new Map<string, number>();
  if (previous) for (const l of [...previous.bids, ...previous.asks]) prev.set(levelKey(l), l.size);
  const side = (ls: BookLevel[]) => {
    let total = 0;
    return ls.slice(0, levels).map((l) => {
      total += l.size;
      const before = prev.get(levelKey(l));
      return { ...l, total, share: 0, changed: previous !== undefined && before !== l.size };
    });
  };
  const bids = side(book.bids);
  const asks = side(book.asks);
  const maxTotal = Math.max(bids[bids.length - 1]?.total ?? 0, asks[asks.length - 1]?.total ?? 0) || 1;
  for (const l of [...bids, ...asks]) l.share = l.total / maxTotal;
  const bestBid = bids[0]?.price ?? 0;
  const bestAsk = asks[0]?.price ?? bestBid;
  const mid = (bestBid + bestAsk) / 2;
  const spread = bestAsk - bestBid;
  return { bids, asks, mid, spread, spreadBps: mid ? (spread / mid) * 10_000 : 0, maxTotal };
}

/** Cumulative depth curves (price, total) for a depth chart, each side from the spread outwards. */
export function depthCurve(d: Depth) {
  return {
    bids: d.bids.map((l) => [l.price, l.total] as const),
    asks: d.asks.map((l) => [l.price, l.total] as const),
  };
}

export type SyntheticBookOptions = {
  seed: number | string;
  /** The mid price, e.g. from a `TickStream` tick. */
  mid: number;
  /** The book's tick index: consecutive indexes change only some levels. */
  index: number;
  /** Price increment. Default 0.01. */
  tickSize?: number;
  /** Levels per side. Default 14. */
  levels?: number;
  /** Typical size of a level near the spread. Default 1.5. */
  baseSize?: number;
  /** Size decimals. Default 4. */
  sizeDecimals?: number;
  /** Share of levels that change per tick. Default 0.3. */
  churn?: number;
};

/**
 * A believable, deterministic order book around `mid`: sizes grow away from the spread with a
 * few walls, the spread breathes between one and three ticks, and from one `index` to the next
 * only about `churn` of the levels change, so flash-on-change reads like a real feed.
 */
export function syntheticBook({ seed, mid, index, tickSize = 0.01, levels = 14, baseSize = 1.5, sizeDecimals = 4, churn = 0.3 }: SyntheticBookOptions): OrderBook {
  const base = seedFrom(String(seed));
  const decimals = (String(tickSize).split(".")[1] ?? "").length;
  const changedAt = (side: number, level: number, i: number) => createRng(base ^ seedFrom(`${side}/${level}/${i}`)).next() < churn;
  // The last index ≤ `index` at which this level changed (geometric, so a short walk back).
  const lastChange = (side: number, level: number) => {
    for (let i = index, n = 0; i > 0 && n < 48; i--, n++) if (changedAt(side, level, i)) return i;
    return 0;
  };
  const sizeOf = (side: number, level: number) => {
    const r = createRng(base ^ seedFrom(`size/${side}/${level}/${lastChange(side, level)}`));
    const shape = 1 + level * 0.22;
    const wall = r.chance(0.08) ? r.range(2.5, 4) : 1;
    return roundTo(baseSize * shape * wall * r.range(0.35, 1.65), sizeDecimals);
  };
  // The spread re-rolls every few ticks, not every tick, so the price levels hold still between.
  const halfSpread = ((1 + createRng(base ^ seedFrom(`spread/${Math.floor(index / 6)}`)).int(0, 2)) * tickSize) / 2;
  const bestBid = Math.floor((mid - halfSpread) / tickSize) * tickSize;
  const bestAsk = Math.max(bestBid + tickSize, Math.ceil((mid + halfSpread) / tickSize) * tickSize);
  const bids: BookLevel[] = [];
  const asks: BookLevel[] = [];
  for (let l = 0; l < levels; l++) {
    bids.push({ price: roundTo(bestBid - l * tickSize, decimals), size: sizeOf(0, l) });
    asks.push({ price: roundTo(bestAsk + l * tickSize, decimals), size: sizeOf(1, l) });
  }
  return { bids, asks };
}
