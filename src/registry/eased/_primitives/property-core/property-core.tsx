/**
 * What every Eased real-estate block shares, so a pipeline, a stacking plan, a lease timeline
 * and a comps table read as one product: CRE units (SF, $/SF/yr, terms), the lease-expiry
 * status and its colours, and the vacancy hatch.
 */
import { trueMinus } from "../../lib/format";

export const RE_LOCALE = "en-US";

const cache = new Map<string, Intl.NumberFormat>();
const nf = (locale: string, o: Intl.NumberFormatOptions) => {
  const k = `${locale}|${JSON.stringify(o)}`;
  let f = cache.get(k);
  if (!f) cache.set(k, (f = new Intl.NumberFormat(locale, o)));
  return f;
};

/** Format options for NumberRoll and Intl: whole dollars, or `$3.7M` with `compact`. */
export const usdOptions = (compact = false, currency = "USD"): Intl.NumberFormatOptions =>
  compact
    ? { style: "currency", currency, notation: "compact", maximumFractionDigits: 1 }
    : { style: "currency", currency, maximumFractionDigits: 0 };
/** Rent per square foot per year: `$52.50`. */
export const psfOptions = (currency = "USD"): Intl.NumberFormatOptions => ({ style: "currency", currency, minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** `$3,727,500`, or `$3.7M` with `compact`; negatives use the true minus. */
export const formatUsd = (v: number, { compact = false, locale = RE_LOCALE, currency = "USD" } = {}) => trueMinus(nf(locale, usdOptions(compact, currency)).format(v));
/** `$52.50` (append the `/SF` unit yourself, muted). */
export const formatPsf = (v: number, { locale = RE_LOCALE, currency = "USD" } = {}) => trueMinus(nf(locale, psfOptions(currency)).format(v));
/** `14,200 SF`; `compact` gives `14.2K SF`. */
export const formatSqft = (v: number, { compact = false, locale = RE_LOCALE } = {}) =>
  `${nf(locale, compact ? { notation: "compact", maximumFractionDigits: 1 } : { maximumFractionDigits: 0 }).format(v)} SF`;
/** `6.25%` from `0.0625`. */
export const formatRate = (v: number, { decimals = 2, locale = RE_LOCALE } = {}) =>
  trueMinus(nf(locale, { style: "percent", minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(v));
/** A lease term: `7 yr`, `5 yr 4 mo`, `9 mo`. */
export function formatTerm(months: number) {
  const y = Math.floor(months / 12);
  const m = Math.round(months % 12);
  if (!y) return `${m} mo`;
  return m ? `${y} yr ${m} mo` : `${y} yr`;
}

const DAY = 86_400_000;
/** Whole days from `now` to `t`, negative in the past. */
export const daysUntil = (t: number, now: number) => Math.round((t - now) / DAY);

/** "in 3 months", "in 2 years", "2 months ago", through Intl.RelativeTimeFormat. */
export function relativeExpiry(t: number, now: number, locale = RE_LOCALE) {
  const days = daysUntil(t, now);
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  if (Math.abs(days) < 45) return rtf.format(days, "day");
  if (Math.abs(days) < 640) return rtf.format(Math.round(days / 30.44), "month");
  return rtf.format(Math.round((days / 365.25) * 10) / 10, "year");
}

/**
 * A suite or lease as of a date: `vacant` (no tenant, or the lease has ended by then),
 * `expiring` (ends within `soonDays`, default a year: start the renewal talk) or `leased`.
 */
export type ExpiryStatus = "leased" | "expiring" | "vacant";
export function expiryStatus(expiresAt: number | null | undefined, asOf: number, { soonDays = 365 } = {}): ExpiryStatus {
  if (expiresAt == null || expiresAt <= asOf) return "vacant";
  return expiresAt - asOf <= soonDays * DAY ? "expiring" : "leased";
}

/** The vacancy hatch: 1px rules at 45° every 6px in the line colour, over the sunken surface. */
export const HATCH =
  "bg-surface-sunken bg-[repeating-linear-gradient(135deg,var(--eased-line)_0_1px,transparent_1px_6px)]";

/** Fills, borders and text for each status: tints mark state (R30, R31), vacancy is hatched. */
export const EXPIRY_TONE: Record<ExpiryStatus, { label: string; fill: string; text: string; swatch: string }> = {
  leased: { label: "Leased", fill: "bg-info-subtle", text: "text-info-text", swatch: "bg-info-subtle shadow-[inset_0_0_0_1px_var(--eased-info)]" },
  expiring: { label: "Expires within 12 mo", fill: "bg-warning-subtle", text: "text-warning-text", swatch: "bg-warning-subtle shadow-[inset_0_0_0_1px_var(--eased-warning)]" },
  vacant: { label: "Vacant", fill: HATCH, text: "text-text-muted", swatch: `${HATCH} shadow-[inset_0_0_0_1px_var(--eased-line)]` },
};

/** A legend key for the statuses: a 10px swatch and its label, one row. */
export function ExpiryLegend({ statuses = ["leased", "expiring", "vacant"], labels, className = "" }: { statuses?: ExpiryStatus[]; labels?: Partial<Record<ExpiryStatus, string>>; className?: string }) {
  return (
    <ul className={`flex min-w-0 flex-wrap items-center gap-x-4 gap-y-1 text-ui-xs text-text-muted ${className}`}>
      {statuses.map((s) => (
        <li key={s} className="flex min-w-0 items-center gap-1.5">
          <span aria-hidden className={`size-2.5 shrink-0 rounded-control-2xs ${EXPIRY_TONE[s].swatch}`} />
          <span className="truncate">{labels?.[s] ?? EXPIRY_TONE[s].label}</span>
        </li>
      ))}
    </ul>
  );
}
