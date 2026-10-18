/**
 * realtime-core: deterministic live data for tickers, order books, candles and vitals.
 * A seeded stream, a pausable clock, flash-on-change state, and OHLC and depth models that sit
 * on chart-core's scales. Import from here; the files behind it may move.
 */
export { createRng, roundTo, seedFrom, type Rng } from "./rng";
export { change, createTickStream, STREAM_EPOCH, type SeriesSpec, type Tick, type TickStream, type TickStreamOptions } from "./stream";
export { useClock, type Clock, type ClockOptions } from "./clock";
export { useTicker, type Ticker, type UseTickerOptions } from "./use-ticker";
export { FLASH_MS, flashDirection, useFlash, useFlashMap, type Flash, type FlashDirection } from "./flash";
export { candleLayout, candleScale, candlesFromStream, pushPrice, toCandles, type Candle, type CandleShape } from "./candles";
export { depth, depthCurve, syntheticBook, type BookLevel, type Depth, type DepthLevel, type OrderBook, type SyntheticBookOptions } from "./orderbook";
