/**
 * HR / recruiting: one company, "Northpeak Systems" (~180 people), hiring for one req at a
 * time. Every person is invented. Salaries are USD per year; payslips are monthly.
 */
import type { Interval } from "../calendar-core/availability";
import type { FlowGraph } from "../flow-core/types";
import { createRng } from "../realtime-core/rng";
import type { TimelineEvent } from "../timeline-core/types";
import { daysAgo, daysFromNow, hoursAgo } from "./shared";

/* ---------- Hiring ----------------------------------------------------------------------- */

export const hiringStages = ["Applied", "Screen", "Interview", "Offer", "Hired"] as const;
export type HiringStage = (typeof hiringStages)[number];

/** The open req every recruiting demo is about. */
export const opening = {
  id: "req-142",
  title: "Senior Frontend Engineer",
  team: "Apps",
  location: "Remote, US",
  hiringManager: "Ines Duarte",
  openedAt: daysAgo(38),
};

export type Candidate = {
  id: string;
  name: string;
  /** The role they applied for. */
  role: string;
  stage: HiringStage;
  source: "Referral" | "LinkedIn" | "Careers page" | "Agency" | "Wellfound";
  /** Their current title and company. */
  current: string;
  /** Mean interview rating on the 1–4 scale, once anyone has scored them. */
  score?: number;
  appliedAt: number;
  /** When they entered their current stage. */
  stageAt: number;
};

// Days in stage come from a seeded RNG so the board reads lived-in, the same on every render.
const rng = createRng("hr/pipeline");
const inStage = (maxDays: number) => hoursAgo(rng.int(5, maxDays * 24));

const C = (id: string, name: string, stage: HiringStage, source: Candidate["source"], current: string, applied: number, score?: number, maxDays = 6): Candidate => ({
  id,
  name,
  role: opening.title,
  stage,
  source,
  current,
  score,
  appliedAt: daysAgo(applied),
  stageAt: inStage(Math.min(maxDays, applied)),
});

/** The req-142 pipeline, in each column's order. */
export const candidates: Candidate[] = [
  C("cd4", "Diego Herrera", "Applied", "Careers page", "Frontend Engineer, Kestrel", 1, undefined, 1),
  C("cd8", "Priya Natarajan", "Applied", "LinkedIn", "UI Engineer, Brightline", 2, undefined, 2),
  C("cd9", "Owen Fitzgerald", "Applied", "Careers page", "Software Engineer, Halcyon", 3, undefined, 3),
  C("cd10", "Lena Vogel", "Applied", "Agency", "Senior Engineer, Tannery", 4, undefined, 4),
  C("cd2", "Tomasz Nowak", "Screen", "LinkedIn", "Staff Engineer, Quarry", 9, 3.0),
  C("cd6", "Ben Carter", "Screen", "Referral", "Frontend Lead, Marlow", 7, 2.5),
  C("cd11", "Sofia Marín", "Screen", "Wellfound", "Engineer, Pocketful", 6),
  C("cd1", "Aisha Bello", "Interview", "Referral", "Senior Engineer, Lumen Labs", 16, 3.4),
  C("cd5", "Fatima Zahra", "Interview", "Agency", "Frontend Engineer, Corvid", 12, 3.1),
  C("cd12", "Kenji Watanabe", "Interview", "LinkedIn", "Design Engineer, Arcadia", 14, 2.9),
  C("cd13", "Marcus Reed", "Offer", "Referral", "Senior Engineer, Fieldnote", 27, 3.7, 4),
  C("cd7", "Hannah Kowalski", "Hired", "LinkedIn", "Senior Engineer, Polaris", 41, 3.6, 9),
];

export const candidateById = (id: string) => candidates.find((c) => c.id === id);

/** The 1–4 interview scale every scorecard uses (Greenhouse and Ashby use the same four). */
export const ratingScale = [
  { value: 1, label: "Strong no" },
  { value: 2, label: "No" },
  { value: 3, label: "Yes" },
  { value: 4, label: "Strong yes" },
] as const;
export type Rating = (typeof ratingScale)[number]["value"];

export type Scorecard = {
  id: string;
  interviewer: string;
  round: string;
  /** Overall recommendation on the 1–4 scale. */
  rating: Rating;
  /** One line from their notes. */
  note: string;
  submittedAt: number;
};

/** Aisha's submitted scorecards. */
export const scorecards: Scorecard[] = [
  { id: "sc1", interviewer: "Jonas Lindqvist", round: "System design", rating: 4, note: "Drew the sync model unprompted; clear trade-offs.", submittedAt: hoursAgo(3) },
  { id: "sc2", interviewer: "Mei Chen", round: "Technical", rating: 3, note: "Solid on rendering; light on testing strategy.", submittedAt: hoursAgo(20) },
  { id: "sc3", interviewer: "Adaeze Okafor", round: "Product sense", rating: 3, note: "Good instincts, asked about the user first.", submittedAt: daysAgo(1, 9, 40) },
  { id: "sc4", interviewer: "Rosa Delgado", round: "Recruiter screen", rating: 3, note: "Clear on why Northpeak; comp in band.", submittedAt: daysAgo(5, 12, 10) },
];

/** The scorecard the viewer (Ines, the hiring manager) still has to fill in. */
export const scorecardTemplate = {
  candidateId: "cd1",
  round: "Frontend craft",
  interviewer: "Ines Duarte",
  criteria: [
    { id: "code", label: "Code quality", hint: "Readable, typed, tested where it matters" },
    { id: "ui", label: "UI craft", hint: "States, motion, accessibility" },
    { id: "debug", label: "Debugging", hint: "Finds the cause, not a workaround" },
    { id: "comm", label: "Communication", hint: "Explains choices, takes feedback" },
  ],
};

/** Aisha's touchpoints, newest first. */
export const candidateTimeline: TimelineEvent[] = [
  { id: "ct1", at: hoursAgo(3), title: "Scorecard from Jonas Lindqvist", detail: "Strong yes · System design", tone: "success", actor: { name: "Jonas Lindqvist" } },
  { id: "ct2", at: daysAgo(1, 15, 0), title: "Technical interview", detail: "60 min with Jonas Lindqvist and Mei Chen", actor: { name: "Mei Chen" } },
  { id: "ct3", at: daysAgo(2, 10, 15), title: "Moved to Interview", detail: "by Ines Duarte", actor: { name: "Ines Duarte" } },
  { id: "ct4", at: daysAgo(5, 11, 0), title: "Recruiter screen", detail: "Notice period 4 weeks · open to remote", actor: { name: "Rosa Delgado" } },
  { id: "ct5", at: daysAgo(9, 16, 20), title: "Emailed about a screen", detail: "Replied within 2 hours", actor: { name: "Rosa Delgado" } },
  { id: "ct6", at: daysAgo(16, 9, 12), title: "Referred by Lucas Moreau", detail: "“Worked with her at Lumen; best UI engineer I know.”", actor: { name: "Lucas Moreau" } },
];

/* ---------- Interviews ------------------------------------------------------------------- */

const at = (day: number, hh: number, mm = 0) => daysFromNow(day, hh, mm);
const free = (day: number, ...spans: [number, number][]): Interval[] =>
  spans.map(([a, b]) => ({ start: at(day, Math.floor(a), Math.round((a % 1) * 60)), end: at(day, Math.floor(b), Math.round((b % 1) * 60)) }));

/** The panel for Aisha's onsite and when each of them is free over the next three working days (UTC). */
export const interviewPanel: { person: string; title: string; free: Interval[] }[] = [
  {
    person: "Jonas Lindqvist",
    title: "Eng Manager, Platform",
    free: [...free(1, [9, 12], [14, 17]), ...free(2, [9, 10.5], [13, 18]), ...free(3, [10, 16])],
  },
  {
    person: "Mei Chen",
    title: "CTO",
    free: [...free(1, [10.5, 15.5]), ...free(2, [11, 12.5], [15, 17.5]), ...free(3, [9, 11], [13.5, 15])],
  },
  {
    person: "Adaeze Okafor",
    title: "Design Lead",
    free: [...free(1, [8, 11.5], [14.5, 18]), ...free(2, [9, 12], [15.5, 18]), ...free(3, [9.5, 12], [13, 17])],
  },
];
/** The working days the scheduler pages through. */
export const interviewDays = [daysFromNow(1, 0, 0), daysFromNow(2, 0, 0), daysFromNow(3, 0, 0)];
/** Kept for older demos: the first day only. */
export const interviewAvailability = interviewPanel.map(({ person, free: f }) => ({ person, free: f.filter((i) => +i.start < daysFromNow(2, 0, 0)) }));

/* ---------- People ----------------------------------------------------------------------- */

export type OrgPerson = { title: string; team: string; location: string };

const P = (id: string, label: string, title: string, team: string, location = "Remote, US") => ({ id, label, data: { title, team, location } });

/** Org chart, top to bottom (`layoutFlow(orgChart, { direction: "TB" })`). */
export const orgChart: FlowGraph<OrgPerson> = {
  nodes: [
    P("ceo", "Arjun Mehta", "CEO", "Executive", "New York"),
    P("cto", "Mei Chen", "CTO", "Engineering", "San Francisco"),
    P("cpo", "Lucas Moreau", "VP Product", "Product", "New York"),
    P("cfo", "Rachel Stein", "CFO", "Finance", "New York"),
    P("eng1", "Jonas Lindqvist", "Eng Manager, Platform", "Engineering"),
    P("eng2", "Ines Duarte", "Eng Manager, Apps", "Engineering", "Austin"),
    P("sec", "Tariq Haddad", "Security Lead", "Engineering"),
    P("p1", "Noor Siddiqui", "Staff Engineer", "Platform"),
    P("p2", "Elliot Brandt", "Senior Engineer", "Platform"),
    P("p3", "Camila Reyes", "SRE", "Platform"),
    P("a1", "Hannah Kowalski", "Senior Frontend Engineer", "Apps"),
    P("a2", "Yusuf Demir", "Mobile Engineer", "Apps"),
    P("a3", "Chloé Martin", "Frontend Engineer", "Apps"),
    P("des", "Adaeze Okafor", "Design Lead", "Design", "London"),
    P("pm1", "Hana Sato", "Product Manager", "Product"),
    P("d1", "Mateo Rossi", "Product Designer", "Design", "London"),
    P("d2", "Grace Liu", "Product Designer", "Design"),
    P("ctl", "Daniel Osei", "Controller", "Finance", "New York"),
    P("ppl", "Rosa Delgado", "Head of People", "People", "Austin"),
    P("rec", "Sam Whitfield", "Recruiter", "People", "Austin"),
  ],
  edges: [
    ["ceo", "cto"], ["ceo", "cpo"], ["ceo", "cfo"],
    ["cto", "eng1"], ["cto", "eng2"], ["cto", "sec"],
    ["eng1", "p1"], ["eng1", "p2"], ["eng1", "p3"],
    ["eng2", "a1"], ["eng2", "a2"], ["eng2", "a3"],
    ["cpo", "des"], ["cpo", "pm1"],
    ["des", "d1"], ["des", "d2"],
    ["cfo", "ctl"], ["cfo", "ppl"],
    ["ppl", "rec"],
  ].map(([from, to]) => ({ from, to })),
};

/** Team absences (timed items: whole days, end exclusive). */
export const timeOff = [
  { id: "to1", person: "Jonas Lindqvist", type: "Vacation", start: daysFromNow(3, 0, 0), end: daysFromNow(8, 0, 0) },
  { id: "to2", person: "Adaeze Okafor", type: "Sick", start: daysAgo(1, 0, 0), end: daysFromNow(1, 0, 0) },
  { id: "to3", person: "Mei Chen", type: "Conference", start: daysFromNow(10, 0, 0), end: daysFromNow(13, 0, 0) },
  { id: "to4", person: "Lucas Moreau", type: "Parental leave", start: daysFromNow(20, 0, 0), end: daysFromNow(76, 0, 0) },
];
export const timeOffBalance = { person: "Aisha Bello", vacationDays: 14.5, sickDays: 6 };

/* ---------- Payroll ---------------------------------------------------------------------- */

/** Jonas's October payslip inputs: $175,000 a year, paid monthly, California. */
export const payrollProfile = {
  employee: "Jonas Lindqvist",
  title: "Eng Manager, Platform",
  period: { start: Date.UTC(2026, 9, 1), end: Date.UTC(2026, 9, 31), paidOn: Date.UTC(2026, 9, 30) },
  gross: 14_583.33,
  /** Pre-tax benefits: medical, dental and vision, plus transit. */
  benefits: 306.25,
  /** 401(k) contribution choices, as a share of gross. */
  retirementRates: [0.04, 0.06, 0.1, 0.15] as const,
  defaultRetirementRate: 0.06,
  /** Effective rates on taxable pay (after 401(k) and benefits), close to a 2026 single filer in CA. */
  federalRate: 0.2,
  stateRate: 0.081,
  /** Social Security + Medicare, on gross; 401(k) does not lower it. */
  ficaRate: 0.0765,
};

export type PayLine = { id: string; label: string; amount: number; kind: "tax" | "retirement" | "benefit" };

/** The deductions for a 401(k) rate, largest first within their kind. Amounts are negative. */
export function payslip(retirementRate: number = payrollProfile.defaultRetirementRate): { gross: number; lines: PayLine[]; net: number } {
  const p = payrollProfile;
  const cents = (v: number) => Math.round(v * 100) / 100;
  const retirement = cents(p.gross * retirementRate);
  const taxable = p.gross - retirement - p.benefits;
  const lines: PayLine[] = [
    { id: "federal", label: "Federal income tax", amount: -cents(taxable * p.federalRate), kind: "tax" },
    { id: "fica", label: "Social Security and Medicare", amount: -cents(p.gross * p.ficaRate), kind: "tax" },
    { id: "state", label: "California income tax", amount: -cents(taxable * p.stateRate), kind: "tax" },
    { id: "401k", label: "401(k)", amount: -retirement, kind: "retirement" },
    { id: "benefits", label: "Medical, dental and transit", amount: -p.benefits, kind: "benefit" },
  ];
  return { gross: p.gross, lines, net: cents(p.gross + lines.reduce((s, l) => s + l.amount, 0)) };
}

/** Kept for older demos: October at the default rate. */
export const payroll = { period: "Oct 2026", ...payslip() };

/* ---------- Reviews and offers ----------------------------------------------------------- */

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

export const offer = { candidateId: "cd13", role: opening.title, base: 186_000, bonusTarget: 0.1, equityShares: 12_000, strikeUsd: 4.2, vestingYears: 4, cliffMonths: 12, startDate: daysFromNow(28, 0, 0) };
