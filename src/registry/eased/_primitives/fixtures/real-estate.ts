/** Real estate / CRE: one brokerage, "Meridian Partners", office and industrial in Austin. Areas in sq ft, rents in USD per sq ft per year. */
import type { TimelineEvent } from "../timeline-core/types";
import { daysAgo, daysFromNow, hoursAgo, lastMonths, series } from "./shared";

export type Property = { id: string; name: string; address: string; type: "Office" | "Industrial" | "Retail"; sqft: number; askingRentPsf: number; occupancy: number; capRate?: number; price?: number };
export const properties: Property[] = [
  { id: "pr1", name: "The Lamar", address: "1120 N Lamar Blvd, Austin, TX", type: "Office", sqft: 186_400, askingRentPsf: 52.5, occupancy: 0.87, capRate: 0.0625, price: 94_500_000 },
  { id: "pr2", name: "Riverside Commons", address: "2400 E Riverside Dr, Austin, TX", type: "Retail", sqft: 64_200, askingRentPsf: 38, occupancy: 0.93, capRate: 0.0675, price: 31_200_000 },
  { id: "pr3", name: "Tech Ridge Logistics", address: "12800 Center Lake Dr, Austin, TX", type: "Industrial", sqft: 312_000, askingRentPsf: 13.75, occupancy: 1, capRate: 0.0575, price: 68_000_000 },
  { id: "pr4", name: "Domain Tower II", address: "11601 Alterra Pkwy, Austin, TX", type: "Office", sqft: 241_000, askingRentPsf: 58, occupancy: 0.71 },
];

export type Deal = { id: string; name: string; tenant: string; sqft: number; valueUsd: number; broker: string; stage: string; updatedAt: number };
export const dealStages = ["Prospect", "Tour", "Proposal", "LOI", "Lease out", "Closed"] as const;
export const deals: Deal[] = [
  { id: "dl1", name: "Lamar · Fl 9", tenant: "Ripple Health", sqft: 14_200, valueUsd: 3_727_500, broker: "Carmen Diaz", stage: "LOI", updatedAt: hoursAgo(3) },
  { id: "dl2", name: "Domain II · Fl 14–15", tenant: "Kinetic Labs", sqft: 38_600, valueUsd: 11_194_000, broker: "Will Hartley", stage: "Proposal", updatedAt: daysAgo(1) },
  { id: "dl3", name: "Tech Ridge · Bldg B", tenant: "Parcelpoint", sqft: 96_000, valueUsd: 6_600_000, broker: "Carmen Diaz", stage: "Lease out", updatedAt: daysAgo(2) },
  { id: "dl4", name: "Riverside · Suite 120", tenant: "Juniper Coffee", sqft: 2_400, valueUsd: 456_000, broker: "Nia Brooks", stage: "Tour", updatedAt: daysAgo(4) },
  { id: "dl5", name: "Lamar · Fl 3", tenant: "Greystone Legal", sqft: 9_800, valueUsd: 2_572_500, broker: "Will Hartley", stage: "Prospect", updatedAt: daysAgo(19) },
  { id: "dl6", name: "Domain II · Fl 6", tenant: "Atlas Robotics", sqft: 21_000, valueUsd: 6_090_000, broker: "Nia Brooks", stage: "Closed", updatedAt: daysAgo(8) },
];

/** The Lamar's stacking plan: floors top-down, suites with tenant and lease expiry (epoch ms; null = vacant). */
export const stackingPlan = [12, 11, 10, 9, 8, 7].map((floor, f) => ({
  floor,
  suites: [
    { id: `${floor}A`, sqft: 7_800, tenant: ["Bluebonnet Capital", "Vacant", "Ripple Health", "Vacant", "Halden & Co.", "Austin Dental Group"][f], expiresAt: [daysFromNow(820), null, daysFromNow(140), null, daysFromNow(1_460), daysFromNow(410)][f] },
    { id: `${floor}B`, sqft: 7_700, tenant: ["Bluebonnet Capital", "Mosaic Studio", "Vacant", "Pecan Street Ventures", "Halden & Co.", "Vacant"][f], expiresAt: [daysFromNow(820), daysFromNow(95), null, daysFromNow(610), daysFromNow(1_460), null][f] },
  ],
}));

/** Leases as spans for a Lease Timeline (`packLanes`, `timeAxis`). */
export const leases: TimelineEvent<{ sqft: number; rentPsf: number }>[] = [
  { id: "ls1", at: daysAgo(900), end: daysFromNow(820), title: "Bluebonnet Capital", detail: "Fl 12", data: { sqft: 15_500, rentPsf: 49 } },
  { id: "ls2", at: daysAgo(400), end: daysFromNow(95), title: "Mosaic Studio", detail: "11B", tone: "warning", data: { sqft: 7_700, rentPsf: 47.5 } },
  { id: "ls3", at: daysAgo(1_200), end: daysFromNow(140), title: "Ripple Health", detail: "10A · renewal option", data: { sqft: 7_800, rentPsf: 44 } },
  { id: "ls4", at: daysAgo(200), end: daysFromNow(1_460), title: "Halden & Co.", detail: "Fl 8", data: { sqft: 15_500, rentPsf: 53 } },
  { id: "ls5", at: daysAgo(700), end: daysFromNow(410), title: "Austin Dental Group", detail: "7A", data: { sqft: 7_800, rentPsf: 46 } },
];

export const comps = [
  { id: "cp1", name: "Shoal Creek Plaza", distanceMi: 0.6, sqft: 142_000, rentPsf: 50.25, signedAt: daysAgo(48), subject: false },
  { id: "cp2", name: "300 West 6th", distanceMi: 1.4, sqft: 454_000, rentPsf: 61, signedAt: daysAgo(90), subject: false },
  { id: "cp3", name: "Northshore Annex", distanceMi: 1.9, sqft: 88_000, rentPsf: 47.5, signedAt: daysAgo(130), subject: false },
  { id: "cp4", name: "Mueller Office II", distanceMi: 3.2, sqft: 120_500, rentPsf: 44, signedAt: daysAgo(22), subject: false },
];

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

export const commissionSplit = [
  { broker: "Carmen Diaz", share: 0.5 },
  { broker: "Will Hartley", share: 0.3 },
  { broker: "House", share: 0.2 },
];
