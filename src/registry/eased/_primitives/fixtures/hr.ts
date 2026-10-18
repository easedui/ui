/** HR / recruiting: one company, "Northpeak Systems" (~180 people). Salaries in USD per year. */
import type { Interval } from "../calendar-core/availability";
import type { FlowGraph } from "../flow-core/types";
import type { TimelineEvent } from "../timeline-core/types";
import { daysAgo, daysFromNow, hoursAgo } from "./shared";

export const hiringStages = ["Applied", "Screen", "Interview", "Offer", "Hired"] as const;
export type Candidate = { id: string; name: string; role: string; stage: (typeof hiringStages)[number]; source: string; score?: number; appliedAt: number };
export const candidates: Candidate[] = [
  { id: "cd1", name: "Aisha Bello", role: "Senior Frontend Engineer", stage: "Interview", source: "Referral", score: 4.4, appliedAt: daysAgo(16) },
  { id: "cd2", name: "Tomasz Nowak", role: "Senior Frontend Engineer", stage: "Screen", source: "LinkedIn", score: 3.8, appliedAt: daysAgo(9) },
  { id: "cd3", name: "Grace Liu", role: "Product Designer", stage: "Offer", source: "Dribbble", score: 4.7, appliedAt: daysAgo(31) },
  { id: "cd4", name: "Diego Herrera", role: "Data Engineer", stage: "Applied", source: "Careers page", appliedAt: daysAgo(1) },
  { id: "cd5", name: "Fatima Zahra", role: "Data Engineer", stage: "Interview", source: "Agency", score: 4.1, appliedAt: daysAgo(12) },
  { id: "cd6", name: "Ben Carter", role: "Product Designer", stage: "Screen", source: "Referral", score: 3.5, appliedAt: daysAgo(7) },
  { id: "cd7", name: "Ines Duarte", role: "Engineering Manager", stage: "Hired", source: "LinkedIn", score: 4.6, appliedAt: daysAgo(44) },
];

/** Aisha's touchpoints, newest first. */
export const candidateTimeline: TimelineEvent[] = [
  { id: "ct1", at: hoursAgo(3), title: "Scorecard submitted: Jonas Lindqvist", detail: "Strong yes · system design 4/4", tone: "success" },
  { id: "ct2", at: daysAgo(1, 15, 0), title: "Technical interview", detail: "60 min · Jonas Lindqvist, Mei Chen" },
  { id: "ct3", at: daysAgo(5, 11, 0), title: "Recruiter screen", detail: "Notice period 4 weeks" },
  { id: "ct4", at: daysAgo(16, 9, 12), title: "Referred by Lucas Moreau" },
];

/** Org chart, top to bottom (`layoutFlow(orgChart, { direction: "TB" })`). */
export const orgChart: FlowGraph<{ title: string; reports?: number }> = {
  nodes: [
    { id: "ceo", label: "Arjun Mehta", data: { title: "CEO" } },
    { id: "cto", label: "Mei Chen", data: { title: "CTO", reports: 64 } },
    { id: "cpo", label: "Lucas Moreau", data: { title: "VP Product", reports: 18 } },
    { id: "cfo", label: "Rachel Stein", data: { title: "CFO", reports: 9 } },
    { id: "eng1", label: "Jonas Lindqvist", data: { title: "Eng Manager, Platform", reports: 11 } },
    { id: "eng2", label: "Ines Duarte", data: { title: "Eng Manager, Apps", reports: 9 } },
    { id: "des", label: "Adaeze Okafor", data: { title: "Design Lead", reports: 6 } },
  ],
  edges: [
    { from: "ceo", to: "cto" },
    { from: "ceo", to: "cpo" },
    { from: "ceo", to: "cfo" },
    { from: "cto", to: "eng1" },
    { from: "cto", to: "eng2" },
    { from: "cpo", to: "des" },
  ],
};

/** Team absences (timed items: whole days, end exclusive). */
export const timeOff = [
  { id: "to1", person: "Jonas Lindqvist", type: "Vacation", start: daysFromNow(3, 0, 0), end: daysFromNow(8, 0, 0) },
  { id: "to2", person: "Adaeze Okafor", type: "Sick", start: daysAgo(1, 0, 0), end: daysFromNow(1, 0, 0) },
  { id: "to3", person: "Mei Chen", type: "Conference", start: daysFromNow(10, 0, 0), end: daysFromNow(13, 0, 0) },
  { id: "to4", person: "Lucas Moreau", type: "Parental leave", start: daysFromNow(20, 0, 0), end: daysFromNow(76, 0, 0) },
];
export const timeOffBalance = { person: "Aisha Bello", vacationDays: 14.5, sickDays: 6 };

/** Panelists' free time tomorrow (UTC), for `intersectAvailability`. */
export const interviewAvailability: { person: string; free: Interval[] }[] = [
  { person: "Jonas Lindqvist", free: [{ start: daysFromNow(1, 9, 0), end: daysFromNow(1, 12, 0) }, { start: daysFromNow(1, 14, 0), end: daysFromNow(1, 17, 0) }] },
  { person: "Mei Chen", free: [{ start: daysFromNow(1, 10, 30), end: daysFromNow(1, 15, 30) }] },
  { person: "Adaeze Okafor", free: [{ start: daysFromNow(1, 8, 0), end: daysFromNow(1, 11, 30) }, { start: daysFromNow(1, 14, 30), end: daysFromNow(1, 18, 0) }] },
];

/** One October payslip, gross → net (monthly, USD), for a waterfall. */
export const payroll = {
  period: "Oct 2026",
  gross: 14_583.33,
  lines: [
    { label: "Federal income tax", amount: -2_412.5 },
    { label: "Social Security", amount: -904.17 },
    { label: "Medicare", amount: -211.46 },
    { label: "State tax (CA)", amount: -1_031.8 },
    { label: "401(k)", amount: -875 },
    { label: "Health insurance", amount: -186.25 },
    { label: "Commuter benefit", amount: -120 },
  ],
};

export const reviewCycle = {
  name: "H2 2026 performance review",
  steps: [
    { id: "self", label: "Self review", status: "complete" as const, due: daysAgo(10) },
    { id: "peer", label: "Peer feedback", status: "complete" as const, due: daysAgo(3) },
    { id: "manager", label: "Manager review", status: "active" as const, due: daysFromNow(5) },
    { id: "calibration", label: "Calibration", status: "pending" as const, due: daysFromNow(14) },
    { id: "share", label: "Share results", status: "pending" as const, due: daysFromNow(21) },
  ],
};

export const offer = { candidateId: "cd3", role: "Product Designer", base: 168_000, bonusTarget: 0.1, equityShares: 12_000, strikeUsd: 4.2, vestingYears: 4, cliffMonths: 12, startDate: daysFromNow(28, 0, 0) };
