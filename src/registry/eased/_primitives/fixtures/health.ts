/** Health: one clinic, "Willow Health", primary care. The patient is fictional. Units follow US conventions (mg/dL, bpm, mmHg). */
import type { SeriesSpec } from "../realtime-core/stream";
import type { TimelineEvent } from "../timeline-core/types";
import { createRng, roundTo } from "../realtime-core/rng";
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

export type LabResult = {
  id: string;
  test: string;
  value: number;
  unit: string;
  /** Reference range. */
  low: number;
  high: number;
  /** One value per `labDraws` entry, oldest first; the last is `value`. */
  history: number[];
  at: number;
  /** Places shown. */
  decimals?: number;
  /** The span a range bar draws, wider than the reference range so a flag has room. */
  scale?: [number, number];
  panel?: string;
};
/** When each `history` value was drawn, oldest first. The last is the visit 3 days ago. */
export const labDraws = [daysAgo(361, 8, 20), daysAgo(255, 8, 45), daysAgo(131, 9, 10), daysAgo(3, 8, 40)];
export const labResults: LabResult[] = [
  { id: "lab1", test: "LDL cholesterol", value: 142, unit: "mg/dL", low: 0, high: 130, history: [158, 138, 127, 142], at: daysAgo(3), decimals: 0, scale: [60, 190], panel: "Lipid panel" },
  { id: "lab2", test: "HbA1c", value: 5.6, unit: "%", low: 4, high: 5.7, history: [5.9, 5.8, 5.6, 5.6], at: daysAgo(3), decimals: 1, scale: [4, 7], panel: "Metabolic" },
  { id: "lab3", test: "TSH", value: 2.1, unit: "mIU/L", low: 0.4, high: 4, history: [1.8, 2.4, 2, 2.1], at: daysAgo(3), decimals: 1, scale: [0, 6], panel: "Thyroid" },
  { id: "lab4", test: "Vitamin D", value: 24, unit: "ng/mL", low: 30, high: 100, history: [19, 28, 33, 24], at: daysAgo(3), decimals: 0, scale: [10, 110], panel: "Vitamins" },
  { id: "lab5", test: "Hemoglobin", value: 13.4, unit: "g/dL", low: 12, high: 15.5, history: [11.8, 12.6, 13.2, 13.4], at: daysAgo(3), decimals: 1, scale: [10, 17], panel: "Blood count" },
];

export type ProviderStatus = "on-call" | "available" | "in-visit" | "away";
export type Provider = {
  id: string;
  name: string;
  /** Short name for tight rows: "Dr. Achebe". */
  short: string;
  role: string;
  onCall: boolean;
  status: ProviderStatus;
  /** Shown beside the status: "until 6 PM", "back Mon". */
  statusNote?: string;
  /** Typical reply time for messages. */
  replies: string;
};
export const providers: Provider[] = [
  { id: "dr1", name: "Dr. Samuel Achebe", short: "Dr. Achebe", role: "Family medicine · PCP", onCall: true, status: "on-call", statusNote: "until 6 PM", replies: "Replies within a day" },
  { id: "np1", name: "Marcus Webb, NP", short: "Marcus Webb", role: "Nurse practitioner", onCall: true, status: "in-visit", statusNote: "free at 3 PM", replies: "Replies within a day" },
  { id: "rn1", name: "Priya Raman, RN", short: "Priya Raman", role: "Care coordinator", onCall: false, status: "available", replies: "Replies in about an hour" },
  { id: "dr2", name: "Dr. Leah Goldberg", short: "Dr. Goldberg", role: "Cardiology", onCall: false, status: "away", statusNote: "back Mon", replies: "Replies within 2 days" },
  { id: "rd1", name: "Tomás Ibarra, RD", short: "Tomás Ibarra", role: "Dietitian", onCall: false, status: "available", replies: "Replies within a day" },
];

/** Booked appointments (timed items for `placeDayItems`). */
export const appointments = [
  { id: "ap1", providerId: "dr1", patient: "Elena Marsh", reason: "Follow-up: lipids", start: daysFromNow(1, 9, 0), end: daysFromNow(1, 9, 20) },
  { id: "ap2", providerId: "dr1", patient: "Jamal Wright", reason: "Annual physical", start: daysFromNow(1, 9, 30), end: daysFromNow(1, 10, 15) },
  { id: "ap3", providerId: "dr2", patient: "Grace Kim", reason: "Telehealth: BP review", start: daysFromNow(1, 9, 40), end: daysFromNow(1, 10, 0) },
  { id: "ap4", providerId: "np1", patient: "Luis Ortega", reason: "Flu vaccine", start: daysFromNow(1, 11, 0), end: daysFromNow(1, 11, 10) },
  { id: "ap5", providerId: "dr1", patient: "Anika Patel", reason: "New patient intake", start: daysFromNow(2, 14, 0), end: daysFromNow(2, 15, 0) },
];

export type Medication = {
  id: string;
  name: string;
  dose: string;
  /** Daily dose times, "HH:MM" clinic time. */
  schedule: string[];
  refillsLeft: number;
  nextRefill: number;
  /** How to take it: "With dinner". */
  instructions?: string;
  /** Doses on hand at the start of today. */
  supply?: number;
};
export const medications: Medication[] = [
  { id: "rx1", name: "Atorvastatin", dose: "20 mg", schedule: ["21:00"], refillsLeft: 2, nextRefill: daysFromNow(6), instructions: "1 tablet at bedtime", supply: 7 },
  { id: "rx2", name: "Vitamin D3", dose: "2,000 IU", schedule: ["08:00"], refillsLeft: 5, nextRefill: daysFromNow(24), instructions: "1 capsule with breakfast", supply: 25 },
  { id: "rx3", name: "Cetirizine", dose: "10 mg", schedule: ["08:00"], refillsLeft: 0, nextRefill: daysFromNow(2), instructions: "1 tablet in the morning", supply: 3 },
  { id: "rx4", name: "Omega-3", dose: "1,000 mg", schedule: ["13:00"], refillsLeft: 3, nextRefill: daysFromNow(17), instructions: "1 softgel with lunch", supply: 18 },
];
/** Today's dose log so far (FIXTURE_NOW is 2:30 PM): breakfast doses at 8:12, cetirizine not yet, lunch at 1:05. */
export const doseLog: { medId: string; time: string; takenAt: number }[] = [
  { medId: "rx2", time: "08:00", takenAt: daysAgo(0, 8, 12) },
  { medId: "rx4", time: "13:00", takenAt: daysAgo(0, 13, 5) },
];
/** How late a dose may be before it reads as missed, minutes. */
export const doseGraceMinutes = 120;

/** Elena's chart history (newest first). */
export const patientTimeline: TimelineEvent[] = [
  { id: "pe1", at: hoursAgo(20), title: "Lab results posted", kind: "lab", detail: "LDL 142 mg/dL, above range", tone: "warning" },
  { id: "pe2", at: daysAgo(3, 8, 40), title: "Blood draw", kind: "lab" },
  { id: "pe3", at: daysAgo(3, 8, 15), title: "Office visit: Dr. Samuel Achebe", kind: "encounter", detail: "Annual physical" },
  { id: "pe4", at: daysAgo(48, 15, 0), title: "Telehealth: seasonal allergies", kind: "encounter", detail: "Started cetirizine 10 mg" },
  { id: "pe5", at: daysAgo(190, 10, 20), title: "Atorvastatin started", kind: "medication" },
];

const week = lastDays(7);
const sleepHours = series("health/sleep", { count: 7, start: 7.2, noise: 0.08, decimals: 1 });
const bedRng = createRng("health/bedtime");
export const activity = {
  days: week,
  steps: series("health/steps", { count: 7, start: 7_400, trend: 0.12, noise: 0.22, weekly: 0.15 }),
  sleepHours,
  restingHr: series("health/rhr", { count: 7, start: 64, trend: -0.03, noise: 0.02 }),
  stepGoal: 8_000,
  sleepGoal: 7.5,
  /** Each night ending on that day: bedtime and wake as epoch ms (UTC clinic time). */
  sleep: week.map((day, i) => {
    const bed = day - Math.round(bedRng.range(35, 95) / 5) * 5 * 60_000; // 22:25–23:25 the night before
    return { bed, wake: bed + Math.round((sleepHours[i] * 60) / 5) * 5 * 60_000 };
  }),
  /** Active minutes per day. */
  activeMinutes: series("health/active", { count: 7, start: 34, trend: 0.1, noise: 0.25 }).map((v) => roundTo(v, 0)),
};

/** Visit types for booking: length in minutes. */
export const visitTypes = [
  { id: "follow-up", label: "Follow-up", minutes: 20 },
  { id: "physical", label: "Annual physical", minutes: 40 },
  { id: "video", label: "Video visit", minutes: 20 },
];
/** Bookable hours per weekday (clinic time) and the lunch hour nobody books. */
export const clinicHours = { start: "08:30", end: "16:30", lunch: ["12:00", "13:00"] as const, slotMinutes: 30 };
/** Booked time per provider over the next five weekdays (Mon 19 – Fri 23 Oct), as busy intervals. */
export const providerBusy: Record<string, { start: number; end: number }[]> = Object.fromEntries(
  ["dr1", "np1", "dr2"].map((id) => {
    const rng = createRng(`health/busy/${id}`);
    const busy: { start: number; end: number }[] = [];
    for (let d = 1; d <= 5; d++) {
      for (let slot = 0; slot < 14; slot++) {
        const minutes = 8 * 60 + 30 + slot * 30 + (slot >= 7 ? 60 : 0);
        if (rng.chance(id === "dr1" ? 0.55 : 0.4)) busy.push({ start: daysFromNow(d, 0, minutes), end: daysFromNow(d, 0, minutes + 30) });
      }
    }
    return [id, busy];
  }),
);

export const queue = [
  { id: "q1", name: "Jamal W.", checkedInAt: hoursAgo(0.45), reason: "Annual physical" },
  { id: "q2", name: "Grace K.", checkedInAt: hoursAgo(0.3), reason: "BP review" },
  { id: "q3", name: "Luis O.", checkedInAt: hoursAgo(0.1), reason: "Vaccine" },
];
