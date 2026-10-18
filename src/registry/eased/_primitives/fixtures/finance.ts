/** Finance / FX / banking: one product, "Ledgerly", a multi-currency business account. */
import type { SeriesSpec } from "../realtime-core/stream";
import type { TimelineEvent } from "../timeline-core/types";
import { daysAgo, daysFromNow, lastMonths, series } from "./shared";

export type FxPair = { id: string; base: string; quote: string; rate: number; decimals: number; change24h: number };
/** Mid rates on 18 Oct 2026; `change24h` is a share. */
export const fxPairs: FxPair[] = [
  { id: "EURUSD", base: "EUR", quote: "USD", rate: 1.0842, decimals: 4, change24h: 0.0021 },
  { id: "GBPUSD", base: "GBP", quote: "USD", rate: 1.2718, decimals: 4, change24h: -0.0034 },
  { id: "USDJPY", base: "USD", quote: "JPY", rate: 149.36, decimals: 2, change24h: 0.0047 },
  { id: "USDCHF", base: "USD", quote: "CHF", rate: 0.8817, decimals: 4, change24h: -0.0012 },
  { id: "AUDUSD", base: "AUD", quote: "USD", rate: 0.6631, decimals: 4, change24h: 0.0008 },
  { id: "USDCAD", base: "USD", quote: "CAD", rate: 1.3794, decimals: 4, change24h: -0.0019 },
  { id: "EURGBP", base: "EUR", quote: "GBP", rate: 0.8525, decimals: 4, change24h: 0.0055 },
];
/** The pairs as tick-stream series: `createTickStream({ seed: "fx", series: fxSeries, intervalMs: 1500 })`. */
export const fxSeries: SeriesSpec[] = fxPairs.map((p) => ({ id: p.id, initial: p.rate, decimals: p.decimals, volatility: 0.00012 }));

export const accounts = [
  { id: "acc-usd", name: "Operating", currency: "USD", balance: 284_913.42, last4: "4417" },
  { id: "acc-eur", name: "EU payroll", currency: "EUR", balance: 61_208.9, last4: "0932" },
  { id: "acc-gbp", name: "UK suppliers", currency: "GBP", balance: 18_744.15, last4: "7781" },
  { id: "acc-sav", name: "Tax reserve", currency: "USD", balance: 120_000, last4: "2050" },
];

export type Txn = { amount: number; currency: string; category: string; merchant: string; status: "pending" | "settled" | "failed"; accountId: string };
const T = (id: string, at: number, merchant: string, amount: number, category: string, status: Txn["status"] = "settled", currency = "USD", accountId = "acc-usd"): TimelineEvent<Txn> => ({
  id,
  at,
  title: merchant,
  kind: category,
  tone: status === "failed" ? "danger" : status === "pending" ? "warning" : amount > 0 ? "success" : "neutral",
  data: { amount, currency, category, merchant, status, accountId },
});
/** Transactions over 10 days (negative = money out). Group with `groupByDay`. */
export const transactions: TimelineEvent<Txn>[] = [
  T("t01", daysAgo(0, 13, 52), "Amazon Web Services", -4_812.37, "Infrastructure", "pending"),
  T("t02", daysAgo(0, 10, 14), "Stripe payout", 18_240.0, "Revenue"),
  T("t03", daysAgo(0, 8, 3), "Figma", -675.0, "Software"),
  T("t04", daysAgo(1, 17, 40), "Delta Air Lines", -1_284.6, "Travel"),
  T("t05", daysAgo(1, 12, 22), "Blue Bottle Coffee", -38.5, "Meals"),
  T("t06", daysAgo(2, 9, 0), "Gusto payroll", -96_420.18, "Payroll"),
  T("t07", daysAgo(2, 9, 1), "Personio", -2_310.0, "Payroll", "settled", "EUR", "acc-eur"),
  T("t08", daysAgo(3, 15, 47), "WeWork", -3_900.0, "Rent"),
  T("t09", daysAgo(3, 11, 30), "Stripe payout", 22_915.44, "Revenue"),
  T("t10", daysAgo(4, 14, 5), "Google Workspace", -1_152.0, "Software"),
  T("t11", daysAgo(5, 16, 18), "Thornbury Print Ltd", -842.2, "Suppliers", "settled", "GBP", "acc-gbp"),
  T("t12", daysAgo(6, 10, 44), "Linear", -480.0, "Software", "failed"),
  T("t13", daysAgo(7, 9, 15), "Stripe payout", 19_607.12, "Revenue"),
  T("t14", daysAgo(8, 13, 2), "Uber", -64.9, "Travel"),
  T("t15", daysAgo(9, 18, 31), "HMRC VAT", -12_480.0, "Tax", "settled", "GBP", "acc-gbp"),
];

export const budgets = [
  { category: "Infrastructure", budget: 18_000, spent: 14_906 },
  { category: "Software", budget: 6_500, spent: 7_218 },
  { category: "Travel", budget: 9_000, spent: 4_377 },
  { category: "Meals", budget: 1_500, spent: 1_162 },
  { category: "Marketing", budget: 22_000, spent: 16_840 },
];

const months = lastMonths(12);
/** 12 months of cash flow (USD); the last three are forecast. */
export const cashflow = {
  months,
  inflow: series("fin/in", { count: 12, start: 212_000, trend: 0.36, noise: 0.05 }),
  outflow: series("fin/out", { count: 12, start: 188_000, trend: 0.21, noise: 0.04 }),
  forecastFrom: 9,
};

export const recurringPayments = [
  { id: "r1", payee: "WeWork", amount: 3_900, currency: "USD", next: daysFromNow(2) },
  { id: "r2", payee: "Gusto payroll", amount: 96_420.18, currency: "USD", next: daysFromNow(12) },
  { id: "r3", payee: "Google Workspace", amount: 1_152, currency: "USD", next: daysFromNow(17) },
  { id: "r4", payee: "AWS", amount: 4_800, currency: "USD", next: daysFromNow(14) },
  { id: "r5", payee: "Thornbury Print Ltd", amount: 840, currency: "GBP", next: daysFromNow(5) },
];

export const loan = { principal: 250_000, annualRate: 0.0725, termMonths: 60, currency: "USD" };
