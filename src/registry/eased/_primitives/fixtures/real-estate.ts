/**
 * Real estate / CRE: one brokerage, "Meridian Partners", office and industrial in Austin.
 * Areas in sq ft, rents in USD per sq ft per year (full service). The Lamar is the subject
 * building across the pack: its stacking plan, leases, comps and underwriting all agree.
 */
import { createRng } from "../realtime-core/rng";
import type { TimelineEvent } from "../timeline-core/types";
import { daysAgo, daysFromNow, hoursAgo, lastMonths, series } from "./shared";

export type Property = { id: string; name: string; address: string; type: "Office" | "Industrial" | "Retail"; sqft: number; askingRentPsf: number; occupancy: number; capRate?: number; price?: number };
export const properties: Property[] = [
  { id: "pr1", name: "The Lamar", address: "1120 N Lamar Blvd, Austin, TX", type: "Office", sqft: 186_400, askingRentPsf: 52.5, occupancy: 0.795, capRate: 0.0625, price: 94_500_000 },
  { id: "pr2", name: "Riverside Commons", address: "2400 E Riverside Dr, Austin, TX", type: "Retail", sqft: 64_200, askingRentPsf: 38, occupancy: 0.93, capRate: 0.0675, price: 31_200_000 },
  { id: "pr3", name: "Tech Ridge Logistics", address: "12800 Center Lake Dr, Austin, TX", type: "Industrial", sqft: 312_000, askingRentPsf: 13.75, occupancy: 1, capRate: 0.0575, price: 68_000_000 },
  { id: "pr4", name: "Domain Tower II", address: "11601 Alterra Pkwy, Austin, TX", type: "Office", sqft: 241_000, askingRentPsf: 58, occupancy: 0.71 },
];

export const brokers = ["Carmen Diaz", "Will Hartley", "Nia Brooks", "Owen Park"] as const;

export type Deal = { id: string; name: string; tenant: string; sqft: number; valueUsd: number; broker: string; stage: string; updatedAt: number };
export const dealStages = ["Prospect", "Tour", "Proposal", "LOI", "Lease out", "Closed"] as const;
/** Twelve live deals; `valueUsd` is the lease's total contract value. dl5 and dl8 have gone quiet. */
export const deals: Deal[] = [
  { id: "dl1", name: "Lamar · Fl 9", tenant: "Ripple Health", sqft: 14_200, valueUsd: 3_727_500, broker: "Carmen Diaz", stage: "LOI", updatedAt: hoursAgo(3) },
  { id: "dl2", name: "Domain II · Fl 14–15", tenant: "Kinetic Labs", sqft: 38_600, valueUsd: 11_194_000, broker: "Will Hartley", stage: "Proposal", updatedAt: daysAgo(1) },
  { id: "dl3", name: "Tech Ridge · Bldg B", tenant: "Parcelpoint", sqft: 96_000, valueUsd: 6_600_000, broker: "Carmen Diaz", stage: "Lease out", updatedAt: daysAgo(2) },
  { id: "dl4", name: "Riverside · Suite 120", tenant: "Juniper Coffee", sqft: 2_400, valueUsd: 456_000, broker: "Nia Brooks", stage: "Tour", updatedAt: daysAgo(4) },
  { id: "dl5", name: "Lamar · Fl 3", tenant: "Greystone Legal", sqft: 9_800, valueUsd: 2_572_500, broker: "Will Hartley", stage: "Prospect", updatedAt: daysAgo(19) },
  { id: "dl6", name: "Domain II · Fl 6", tenant: "Atlas Robotics", sqft: 21_000, valueUsd: 6_090_000, broker: "Nia Brooks", stage: "Closed", updatedAt: daysAgo(8) },
  { id: "dl7", name: "Domain II · Fl 9", tenant: "Northwind Media", sqft: 12_400, valueUsd: 3_596_000, broker: "Owen Park", stage: "Prospect", updatedAt: daysAgo(3) },
  { id: "dl8", name: "Lamar · Suite 1110", tenant: "Fable Health", sqft: 6_200, valueUsd: 1_627_500, broker: "Owen Park", stage: "Tour", updatedAt: daysAgo(16) },
  { id: "dl9", name: "Tech Ridge · Bldg A", tenant: "Coldchain Co.", sqft: 54_000, valueUsd: 3_712_500, broker: "Carmen Diaz", stage: "Tour", updatedAt: hoursAgo(20) },
  { id: "dl10", name: "Lamar · Suite 730", tenant: "Copperline Design", sqft: 7_300, valueUsd: 1_916_250, broker: "Nia Brooks", stage: "Proposal", updatedAt: daysAgo(5) },
  { id: "dl11", name: "Domain II · Fl 3", tenant: "Verity Bank", sqft: 18_500, valueUsd: 6_438_000, broker: "Will Hartley", stage: "LOI", updatedAt: daysAgo(2) },
  { id: "dl12", name: "Riverside · Suite 210", tenant: "Bloom Pediatrics", sqft: 3_100, valueUsd: 706_800, broker: "Owen Park", stage: "Closed", updatedAt: daysAgo(11) },
];

export type LeaseOption = { at: number; kind: "renewal" | "termination" | "expansion"; label: string };
export type Suite = { id: string; sqft: number; tenant: string | null; rentPsf?: number; expiresAt: number | null; options?: LeaseOption[] };
export type Floor = { floor: number; suites: Suite[] };

const lease = (id: string, sqft: number, tenant: string, rentPsf: number, expiresInDays: number, options?: LeaseOption[]): Suite => ({
  id,
  sqft,
  tenant,
  rentPsf,
  expiresAt: daysFromNow(expiresInDays, 0, 0),
  options,
});
const vacant = (id: string, sqft: number): Suite => ({ id, sqft, tenant: null, expiresAt: null });

/** The Lamar's stacking plan, floors 12 down to 5 (23,300 SF each); suites west to east. */
export const stackingPlan: Floor[] = [
  { floor: 12, suites: [lease("1200", 23_300, "Bluebonnet Capital", 49, 820, [{ at: daysFromNow(640, 0, 0), kind: "renewal", label: "Renewal notice, 5 yr" }])] },
  { floor: 11, suites: [lease("1100", 7_700, "Mosaic Studio", 47.5, 95), vacant("1110", 6_200), lease("1120", 9_400, "Pecan Street Ventures", 51, 610)] },
  { floor: 10, suites: [lease("1000", 12_800, "Ripple Health", 44, 140, [{ at: daysFromNow(20, 0, 0), kind: "renewal", label: "Renewal notice, 3 yr" }]), vacant("1010", 4_600), lease("1020", 5_900, "Lone Star Title", 50.5, 1_100)] },
  { floor: 9, suites: [vacant("900", 14_200), lease("920", 9_100, "Cedar & Vine Architects", 48, 520)] },
  { floor: 8, suites: [lease("800", 23_300, "Halden & Co.", 53, 1_460, [{ at: daysFromNow(730, 0, 0), kind: "termination", label: "Termination right" }])] },
  { floor: 7, suites: [lease("700", 7_800, "Austin Dental Group", 46, 410), lease("710", 8_200, "Trellis Insurance", 49.5, 950), vacant("730", 7_300)] },
  { floor: 6, suites: [lease("600", 11_500, "Northfield Partners", 47, 300, [{ at: daysFromNow(120, 0, 0), kind: "expansion", label: "Expansion right, Fl 7" }]), lease("620", 11_800, "Kestrel Analytics", 54.5, 1_700)] },
  { floor: 5, suites: [lease("500", 9_800, "Bright Path Learning", 42, 60), vacant("510", 6_000), lease("520", 7_500, "Sol Wellness", 51.5, 780)] },
];

/** Lease starts are seeded so they look like a real rent roll: 3 to 10 year terms. */
const starts = createRng("cre/lease-starts");

/** Every lease in The Lamar as a span (`packLanes`, `timeAxis`), soonest expiry first. */
export const leases: TimelineEvent<{ suite: string; floor: number; sqft: number; rentPsf: number; options: LeaseOption[] }>[] = stackingPlan
  .flatMap((f) => f.suites.filter((s) => s.tenant).map((s) => ({ f, s })))
  .sort((a, b) => (a.s.expiresAt ?? 0) - (b.s.expiresAt ?? 0))
  .map(({ f, s }) => {
    const termYears = starts.int(3, 10);
    const end = s.expiresAt ?? 0;
    return {
      id: `ls-${s.id}`,
      at: end - Math.round(termYears * 365.25) * 86_400_000,
      end,
      title: s.tenant ?? "",
      detail: `Suite ${s.id}`,
      data: { suite: s.id, floor: f.floor, sqft: s.sqft, rentPsf: s.rentPsf ?? 0, options: s.options ?? [] },
    };
  });

/** Signed lease comps around The Lamar: size is the lease, not the building. */
export type Comp = { id: string; building: string; tenant: string; distanceMi: number; sqft: number; rentPsf: number; termMonths: number; signedAt: number };
const compRng = createRng("cre/comps");
export const comps: Comp[] = (
  [
    ["cp1", "Shoal Creek Plaza", "Brightwave", 0.6, 11_200, 50.25, 84, 48],
    ["cp2", "300 West 6th", "Halcyon Pay", 1.4, 22_600, 61, 120, 90],
    ["cp3", "Northshore Annex", "Ironleaf Legal", 1.9, 8_400, 47.5, 64, 130],
    ["cp4", "Mueller Office II", "Tandem Bio", 3.2, 16_900, 44, 96, 22],
    ["cp5", "Seaholm Offices", "Quarry Studio", 1.1, 6_800, 55.75, 60, 61],
    ["cp6", "Westlake Centre", "Pinyon Capital", 4.6, 13_300, 49, 87, 176],
    ["cp7", "Plaza on the Lake", "Arbor Dental", 2.7, 5_200, 52, 66, 35],
  ] as const
).map(([id, building, tenant, distanceMi, sqft, rentPsf, termMonths, days]) => ({
  id,
  building,
  tenant,
  distanceMi,
  sqft,
  rentPsf,
  termMonths,
  // Signed mid-morning to late afternoon, as real executions are.
  signedAt: daysAgo(days, compRng.int(9, 17), compRng.pick([0, 15, 30, 45])),
}));
/** The subject the comps are pulled for: suite 900, quoted at The Lamar's asking rent. */
export const compSubject = { id: "subject", building: "The Lamar", tenant: "Suite 900", sqft: 14_200, rentPsf: 52.5, termMonths: 84 };

/** Broker calendar for Mon 19 – Wed 21 Oct: busy blocks (UTC); 9:00–18:00 is the bookable window. */
export const tourBusy = [
  { start: daysFromNow(1, 9, 0), end: daysFromNow(1, 10, 30) },
  { start: daysFromNow(1, 13, 0), end: daysFromNow(1, 14, 0) },
  { start: daysFromNow(2, 11, 0), end: daysFromNow(2, 12, 30) },
  { start: daysFromNow(3, 15, 0), end: daysFromNow(3, 17, 0) },
];

export const market = {
  months: lastMonths(12),
  vacancy: series("cre/vacancy", { count: 12, start: 0.214, trend: -0.06, noise: 0.01, decimals: 4 }),
  askingRentPsf: series("cre/rent", { count: 12, start: 47.1, trend: 0.035, noise: 0.004, decimals: 2 }),
  netAbsorptionSqft: series("cre/absorption", { count: 12, start: 210_000, trend: 0.4, noise: 0.35, min: -150_000 }),
};

/** The Lamar, suite 900: Ripple Health's LOI at 4% of contract value, split four ways. */
export const commission = {
  dealId: "dl1",
  rate: 0.04,
  base: 3_727_500,
  parties: [
    { id: "cd", name: "Carmen Diaz", role: "Lead broker", share: 0.45 },
    { id: "wh", name: "Will Hartley", role: "Co-broker", share: 0.25 },
    { id: "op", name: "Owen Park", role: "Referral", share: 0.1 },
    { id: "house", name: "Meridian Partners", role: "House", share: 0.2 },
  ],
};
/** @deprecated Use `commission.parties`. */
export const commissionSplit = commission.parties.map((p) => ({ broker: p.name, share: p.share }));

/** Underwriting The Lamar at its ask: five-year hold, unlevered. Rates are shares. */
export const underwriting = {
  propertyId: "pr1",
  sqft: 186_400,
  price: 94_500_000,
  rentPsf: 52.5,
  vacancy: 0.13,
  opexPsf: 14,
  rentGrowth: 0.03,
  expenseGrowth: 0.03,
  exitCap: 0.065,
  holdYears: 5,
  sellingCost: 0.02,
  /** The fund's unlevered hurdle. */
  targetIrr: 0.08,
  /** Sensitivity axes: exit cap rows, rent growth columns. */
  exitCaps: [0.06, 0.0625, 0.065, 0.0675, 0.07],
  rentGrowths: [0.01, 0.02, 0.03, 0.04, 0.05],
};
