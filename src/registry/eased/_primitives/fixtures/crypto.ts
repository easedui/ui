/** Crypto / web3: one product, "Tidepool", a wallet and exchange. */
import type { FlowGraph } from "../flow-core/types";
import type { SeriesSpec } from "../realtime-core/stream";
import type { SyntheticBookOptions } from "../realtime-core/orderbook";
import type { TimelineEvent } from "../timeline-core/types";
import { hoursAgo, minutesAgo } from "./shared";

export type Token = { symbol: string; name: string; price: number; decimals: number; change24h: number; marketCap: number; volume24h: number; chain: string };
/** Prices in USD on 18 Oct 2026; `change24h` is a share. */
export const tokens: Token[] = [
  { symbol: "BTC", name: "Bitcoin", price: 67_321.5, decimals: 2, change24h: 0.0184, marketCap: 1_327_000_000_000, volume24h: 31_400_000_000, chain: "Bitcoin" },
  { symbol: "ETH", name: "Ether", price: 3_418.27, decimals: 2, change24h: -0.0093, marketCap: 411_200_000_000, volume24h: 16_900_000_000, chain: "Ethereum" },
  { symbol: "SOL", name: "Solana", price: 162.41, decimals: 2, change24h: 0.0412, marketCap: 76_300_000_000, volume24h: 3_800_000_000, chain: "Solana" },
  { symbol: "LINK", name: "Chainlink", price: 14.682, decimals: 3, change24h: -0.0217, marketCap: 9_100_000_000, volume24h: 512_000_000, chain: "Ethereum" },
  { symbol: "ARB", name: "Arbitrum", price: 0.8124, decimals: 4, change24h: 0.0066, marketCap: 3_300_000_000, volume24h: 288_000_000, chain: "Arbitrum" },
  { symbol: "USDC", name: "USD Coin", price: 1.0001, decimals: 4, change24h: 0.0001, marketCap: 34_800_000_000, volume24h: 6_200_000_000, chain: "Ethereum" },
];
/** Token prices as stream series (USDC barely moves). */
export const tokenSeries: SeriesSpec[] = tokens.map((t) => ({ id: t.symbol, initial: t.price, decimals: t.decimals, volatility: t.symbol === "USDC" ? 0.00002 : t.symbol === "BTC" ? 0.0006 : 0.0011 }));

/** Feed to `syntheticBook({ ...btcBook, mid, index })`. */
export const btcBook: Omit<SyntheticBookOptions, "mid" | "index"> = { seed: "crypto/BTC-USD", tickSize: 0.5, levels: 14, baseSize: 0.42, sizeDecimals: 4 };

export const wallet = {
  address: "0x7a3F9c21B4e8D05a6C1f93E2b7D4c8A90e15Bf62",
  ens: "mara.eth",
  balances: [
    { symbol: "ETH", amount: 4.2817 },
    { symbol: "USDC", amount: 12_480.55 },
    { symbol: "ARB", amount: 3_150 },
    { symbol: "LINK", amount: 212.4 },
  ],
};

type CryptoTxn = { hash: string; confirmations: number; required: number; gasGwei: number; feeUsd: number; amount: number; symbol: string };
export const cryptoTransactions: TimelineEvent<CryptoTxn>[] = [
  { id: "x1", at: minutesAgo(1), title: "Swap 1,000 USDC → 0.2924 ETH", status: "active", data: { hash: "0x9f2e…a41c", confirmations: 4, required: 12, gasGwei: 18, feeUsd: 2.84, amount: 1_000, symbol: "USDC" } },
  { id: "x2", at: minutesAgo(26), title: "Received 0.5 ETH from 0x41b…e09", status: "complete", data: { hash: "0x3c71…0b2d", confirmations: 12, required: 12, gasGwei: 14, feeUsd: 1.12, amount: 0.5, symbol: "ETH" } },
  { id: "x3", at: hoursAgo(3), title: "Bridge 800 USDC to Arbitrum", status: "complete", data: { hash: "0xe8a0…77f3", confirmations: 12, required: 12, gasGwei: 22, feeUsd: 4.1, amount: 800, symbol: "USDC" } },
  { id: "x4", at: hoursAgo(7), title: "Approve LINK spending", status: "error", detail: "Reverted: out of gas", data: { hash: "0x51d4…c9e8", confirmations: 0, required: 12, gasGwei: 31, feeUsd: 3.66, amount: 0, symbol: "LINK" } },
];

export const gasTiers = [
  { id: "slow", label: "Slow", gwei: 12, etaSeconds: 180, feeUsd: 0.94 },
  { id: "normal", label: "Normal", gwei: 18, etaSeconds: 45, feeUsd: 1.41 },
  { id: "fast", label: "Fast", gwei: 27, etaSeconds: 15, feeUsd: 2.12 },
];

/** USDC → ETH split across two pools. */
export const swapRoute: FlowGraph<{ share?: number; fee?: number }> = {
  nodes: [
    { id: "usdc", label: "USDC", detail: "1,000.00" },
    { id: "uni", label: "Uniswap v3 · 0.05%", data: { share: 0.7, fee: 0.0005 } },
    { id: "curve", label: "Curve tricrypto", data: { share: 0.3, fee: 0.0004 } },
    { id: "eth", label: "ETH", detail: "≈ 0.2924" },
  ],
  edges: [
    { from: "usdc", to: "uni", label: "70%" },
    { from: "usdc", to: "curve", label: "30%" },
    { from: "uni", to: "eth" },
    { from: "curve", to: "eth" },
  ],
};

export const staking = { symbol: "ETH", apy: 0.0352, lockOptionsDays: [0, 30, 90, 180], minStake: 0.01 };
