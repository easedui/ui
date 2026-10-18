/** Health: one clinic, "Willow Health", primary care. The patient is fictional. Units follow US conventions (mg/dL, bpm, mmHg). */
import type { SeriesSpec } from "../realtime-core/stream";
import type { TimelineEvent } from "../timeline-core/types";
import { daysAgo, daysFromNow, hoursAgo, lastDays, series } from "./shared";

export const patient = { id: "pt-2041", name: "Elena Marsh", dob: Date.UTC(1984, 2, 11), mrn: "WH-0049217", pcp: "Dr. Samuel Achebe", allergies: ["Penicillin"] };

/** Live vitals as stream series: `createTickStream({ seed: "vitals", series: vitalsSeries, intervalMs: 1000 })`. */
export const vitalsSeries: SeriesSpec[] = [
  { id: "hr", initial: 72, kind: "level", volatility: 0.025, meanRevert: 0.12, decimals: 0, min: 48, max: 160 },
  { id: "spo2", initial: 98, kind: "level", volatility: 0.004, meanRevert: 0.3, decimals: 0, min: 90, max: 100 },
  { id: "rr", initial: 15, kind: "level", volatility: 0.03, meanRevert: 0.2, decimals: 0, min: 8, max: 30 },
];
/** Normal ranges; outside reads warning. */
export const vitalRanges = { hr: { low: 50, high: 100, unit: "bpm" }, spo2: { low: 95, high: 100, unit: "%" }, rr: { low: 12, high: 20, unit: "/min" } };

export type LabResult = { id: string; test: string; value: number; unit: string; low: number; high: number; history: number[]; at: number };
export const labResults: LabResult[] = [
  { id: "lab1", test: "LDL cholesterol", value: 142, unit: "mg/dL", low: 0, high: 130, history: [158, 151, 149, 142], at: daysAgo(3) },
  { id: "lab2", test: "HbA1c", value: 5.6, unit: "%", low: 4, high: 5.7, history: [5.9, 5.8, 5.7, 5.6], at: daysAgo(3) },
  { id: "lab3", test: "TSH", value: 2.1, unit: "mIU/L", low: 0.4, high: 4, history: [1.8, 2.4, 2, 2.1], at: daysAgo(3) },
  { id: "lab4", test: "Vitamin D", value: 24, unit: "ng/mL", low: 30, high: 100, history: [19, 21, 26, 24], at: daysAgo(3) },
  { id: "lab5", test: "Hemoglobin", value: 13.4, unit: "g/dL", low: 12, high: 15.5, history: [13.1, 13.6, 13.2, 13.4], at: daysAgo(3) },
];

export const providers = [
  { id: "dr1", name: "Dr. Samuel Achebe", role: "Family medicine", onCall: true },
  { id: "dr2", name: "Dr. Leah Goldberg", role: "Internal medicine", onCall: false },
  { id: "np1", name: "Marcus Webb, NP", role: "Nurse practitioner", onCall: true },
];

/** Booked appointments (timed items for `placeDayItems`). */
export const appointments = [
  { id: "ap1", providerId: "dr1", patient: "Elena Marsh", reason: "Follow-up: lipids", start: daysFromNow(1, 9, 0), end: daysFromNow(1, 9, 20) },
  { id: "ap2", providerId: "dr1", patient: "Jamal Wright", reason: "Annual physical", start: daysFromNow(1, 9, 30), end: daysFromNow(1, 10, 15) },
  { id: "ap3", providerId: "dr2", patient: "Grace Kim", reason: "Telehealth: BP review", start: daysFromNow(1, 9, 40), end: daysFromNow(1, 10, 0) },
  { id: "ap4", providerId: "np1", patient: "Luis Ortega", reason: "Flu vaccine", start: daysFromNow(1, 11, 0), end: daysFromNow(1, 11, 10) },
  { id: "ap5", providerId: "dr1", patient: "Anika Patel", reason: "New patient intake", start: daysFromNow(2, 14, 0), end: daysFromNow(2, 15, 0) },
];

export const medications = [
  { id: "rx1", name: "Atorvastatin", dose: "20 mg", schedule: ["21:00"], refillsLeft: 2, nextRefill: daysFromNow(6) },
  { id: "rx2", name: "Vitamin D3", dose: "2,000 IU", schedule: ["08:00"], refillsLeft: 5, nextRefill: daysFromNow(24) },
  { id: "rx3", name: "Cetirizine", dose: "10 mg", schedule: ["08:00"], refillsLeft: 0, nextRefill: daysFromNow(2) },
];

/** Elena's chart history (newest first). */
export const patientTimeline: TimelineEvent[] = [
  { id: "pe1", at: hoursAgo(20), title: "Lab results posted", kind: "lab", detail: "LDL 142 mg/dL, above range", tone: "warning" },
  { id: "pe2", at: daysAgo(3, 8, 40), title: "Blood draw", kind: "lab" },
  { id: "pe3", at: daysAgo(3, 8, 15), title: "Office visit: Dr. Samuel Achebe", kind: "encounter", detail: "Annual physical" },
  { id: "pe4", at: daysAgo(48, 15, 0), title: "Telehealth: seasonal allergies", kind: "encounter", detail: "Started cetirizine 10 mg" },
  { id: "pe5", at: daysAgo(190, 10, 20), title: "Atorvastatin started", kind: "medication" },
];

const week = lastDays(7);
export const activity = {
  days: week,
  steps: series("health/steps", { count: 7, start: 7_400, trend: 0.12, noise: 0.22, weekly: 0.15 }),
  sleepHours: series("health/sleep", { count: 7, start: 6.9, noise: 0.08, decimals: 1 }),
  restingHr: series("health/rhr", { count: 7, start: 64, trend: -0.03, noise: 0.02 }),
};

export const queue = [
  { id: "q1", name: "Jamal W.", checkedInAt: hoursAgo(0.45), reason: "Annual physical" },
  { id: "q2", name: "Grace K.", checkedInAt: hoursAgo(0.3), reason: "BP review" },
  { id: "q3", name: "Luis O.", checkedInAt: hoursAgo(0.1), reason: "Vaccine" },
];
