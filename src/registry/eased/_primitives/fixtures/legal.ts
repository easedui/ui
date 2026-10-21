/** Legal: one product, "Brief", contract review for an in-house team at Northpeak Systems. */
import { anchorQuote, type Comment, type Suggestion } from "../doc-core/anchors";
import { numberClauses, type Doc } from "../doc-core/types";
import type { FlowGraph } from "../flow-core/types";
import type { TimelineEvent } from "../timeline-core/types";
import { daysAgo, daysFromNow, hoursAgo, minutesAgo } from "./shared";

/** The Master Services Agreement, as Northpeak sent it (v3). */
export const msa: Doc = {
  id: "msa-halcyon",
  title: "Master Services Agreement: Northpeak Systems × Halcyon Freight",
  version: "v3",
  blocks: numberClauses([
    { id: "intro", kind: "paragraph", text: "This Master Services Agreement is entered into on 1 November 2026 between Northpeak Systems, Inc. (“Supplier”) and Halcyon Freight Ltd (“Customer”)." },
    { id: "c-services", kind: "clause", title: "Services", text: "Supplier shall provide the services described in each Order Form in a professional manner consistent with industry standards." },
    { id: "c-fees", kind: "clause", title: "Fees and payment", text: "Customer shall pay all undisputed invoices within thirty (30) days of receipt. Late amounts accrue interest at 1.5% per month." },
    { id: "c-fees-tax", kind: "clause", level: 2, text: "Fees exclude taxes. Customer is responsible for all sales, use and value-added taxes." },
    { id: "c-term", kind: "clause", title: "Term and renewal", text: "This Agreement renews automatically for successive twelve (12) month terms unless either party gives notice at least thirty (30) days before renewal.", risk: "medium" },
    { id: "c-liability", kind: "clause", title: "Limitation of liability", text: "Each party’s total liability under this Agreement shall not exceed the fees paid in the three (3) months preceding the claim.", risk: "high" },
    { id: "c-indemnity", kind: "clause", title: "Indemnification", text: "Customer shall indemnify Supplier against all claims arising from Customer Data, without limitation.", risk: "high" },
    { id: "c-data", kind: "clause", title: "Data protection", text: "Supplier shall process personal data only on Customer’s documented instructions and in accordance with the Data Processing Addendum." },
    { id: "c-law", kind: "clause", title: "Governing law", text: "This Agreement is governed by the laws of the State of Delaware.", risk: "low" },
  ]),
};

/** Halcyon’s counter-draft (v4): same block ids, so `diffDocs(msa, msaRevised)` lines up. */
export const msaRevised: Doc = {
  ...msa,
  version: "v4",
  blocks: msa.blocks.map((b) => {
    switch (b.id) {
      case "c-fees":
        return { ...b, text: "Customer shall pay all undisputed invoices within forty-five (45) days of receipt. Late amounts accrue interest at 1% per month." };
      case "c-term":
        return { ...b, text: "This Agreement renews automatically for successive twelve (12) month terms unless either party gives notice at least sixty (60) days before renewal." };
      case "c-liability":
        return { ...b, text: "Each party’s total liability under this Agreement shall not exceed the fees paid in the twelve (12) months preceding the claim, except for breaches of Clause 6 (Data protection)." };
      case "c-indemnity":
        return { ...b, text: "Each party shall indemnify the other against third-party claims arising from its breach of this Agreement." };
      case "c-law":
        return { ...b, text: "This Agreement is governed by the laws of England and Wales." };
      default:
        return b;
    }
  }),
};

const suggest = (id: string, blockId: string, quote: string, replacement: string, rationale: string, confidence: number): Suggestion => ({
  ...anchorQuote(msa, blockId, quote, { id })!,
  kind: "suggestion",
  replacement,
  rationale,
  confidence,
  author: "Brief AI",
  status: "pending",
});
/** AI redlines against Northpeak’s playbook. */
export const suggestions: Suggestion[] = [
  suggest("s1", "c-liability", "three (3) months", "twelve (12) months", "Playbook §3: cap at 12 months’ fees; 3 months is below market for a freight customer.", 0.93),
  suggest("s2", "c-indemnity", "Customer shall indemnify Supplier against all claims arising from Customer Data, without limitation.", "Each party shall indemnify the other against third-party claims arising from its breach of this Agreement.", "One-sided and uncapped. Make it mutual and limited to third-party claims.", 0.88),
  suggest("s3", "c-term", "thirty (30) days", "sixty (60) days", "Customer procurement needs 60 days to run a renewal review.", 0.71),
];

export const comments: Comment[] = [
  {
    ...anchorQuote(msa, "c-fees", "1.5% per month", { id: "k1" })!,
    kind: "comment",
    author: "Daniel Osei",
    body: "Halcyon will push back on this; 1% is our usual fallback.",
    createdAt: hoursAgo(5),
    replies: [{ id: "k1r1", author: "Mei Lin", body: "Agreed. Accept 1% if they move on the cap.", createdAt: hoursAgo(3) }],
  },
  { ...anchorQuote(msa, "c-law", "State of Delaware", { id: "k2" })!, kind: "comment", author: "Mei Lin", body: "They’re UK-based; expect England and Wales.", createdAt: daysAgo(1, 11, 20) },
];

export type Matter = { id: string; name: string; client: string; practice: string; stage: "Intake" | "Discovery" | "Negotiation" | "Trial prep" | "Closed"; lead: string };
export const matters: Matter[] = [
  { id: "m1", name: "Halcyon Freight MSA", client: "Northpeak Systems", practice: "Commercial", stage: "Negotiation", lead: "Mei Lin" },
  { id: "m2", name: "Okafor v. Brightline Logistics", client: "Brightline Logistics", practice: "Employment", stage: "Discovery", lead: "Daniel Osei" },
  { id: "m3", name: "Series C financing", client: "Northpeak Systems", practice: "Corporate", stage: "Intake", lead: "Rachel Stein" },
  { id: "m4", name: "Trademark opposition: ORBITAL", client: "Orbit Analytics", practice: "IP", stage: "Trial prep", lead: "Tomás Ferreira" },
];

/** Okafor v. Brightline: filings, hearings and deadlines (past and upcoming). */
export const matterTimeline: TimelineEvent<{ matterId: string }>[] = [
  { id: "mt1", at: daysAgo(64, 9, 0), title: "Complaint filed", kind: "filing", data: { matterId: "m2" } },
  { id: "mt2", at: daysAgo(43, 16, 0), title: "Answer served", kind: "filing", data: { matterId: "m2" } },
  { id: "mt3", at: daysAgo(21, 10, 30), title: "Initial case management conference", kind: "hearing", data: { matterId: "m2" } },
  { id: "mt4", at: daysAgo(2, 17, 0), title: "Document production due", kind: "deadline", tone: "warning", status: "error", detail: "Overdue by 2 days", data: { matterId: "m2" } },
  { id: "mt5", at: daysFromNow(9, 17, 0), title: "Interrogatory responses due", kind: "deadline", data: { matterId: "m2" } },
  { id: "mt6", at: daysFromNow(23, 10, 0), title: "Deposition: R. Castellano", kind: "hearing", data: { matterId: "m2" } },
  { id: "mt7", at: daysFromNow(58, 9, 30), title: "Mediation", kind: "hearing", data: { matterId: "m2" } },
];

/** Deadlines as timed items for a calendar (`itemsByDay`, `placeDayItems`). */
export const deadlines = [
  { id: "d1", title: "Halcyon redline back", matterId: "m1", start: daysFromNow(1, 12, 0), end: daysFromNow(1, 13, 0) },
  { id: "d2", title: "Board consent: Series C", matterId: "m3", start: daysFromNow(4, 15, 0), end: daysFromNow(4, 16, 0) },
  { id: "d3", title: "Interrogatory responses", matterId: "m2", start: daysFromNow(9, 16, 0), end: daysFromNow(9, 17, 0) },
  { id: "d4", title: "Opposition evidence due", matterId: "m4", start: daysFromNow(11, 9, 0), end: daysFromNow(11, 10, 0) },
];

/** Who signs off on the MSA, top to bottom. */
export const approvalChain: FlowGraph<{ role: string }> = {
  nodes: [
    { id: "a1", label: "Mei Lin", detail: "Approved", status: "complete", data: { role: "Senior counsel" } },
    { id: "a2", label: "Rachel Stein", detail: "Reviewing", status: "active", data: { role: "General counsel" } },
    { id: "a3", label: "Arjun Mehta", status: "pending", data: { role: "CFO" } },
    { id: "a4", label: "Signature", status: "pending", data: { role: "DocuSign" } },
  ],
  edges: [
    { from: "a1", to: "a2" },
    { from: "a2", to: "a3" },
    { from: "a3", to: "a4" },
  ],
};

export const timeEntries = [
  { id: "te1", matterId: "m1", at: minutesAgo(40), minutes: 72, rate: 650, note: "Review Halcyon redline v4; markup liability cap" },
  { id: "te2", matterId: "m2", at: hoursAgo(4), minutes: 108, rate: 520, note: "Draft responses to interrogatories 1–14" },
  { id: "te3", matterId: "m1", at: daysAgo(1, 15, 0), minutes: 30, rate: 650, note: "Call with D. Osei re fallback positions" },
  { id: "te4", matterId: "m4", at: daysAgo(1, 10, 0), minutes: 156, rate: 480, note: "Compile evidence of prior use, ORBITAL mark" },
];

/* ---------- The Halcyon deal, end to end (Contract Review → Clause Diff → E-sign → Obligations) ---------- */

/** Northpeak’s reply (v5): keeps 45 days and the 12-month cap, meets in the middle on interest and law, adds insurance. */
export const msaFinal: Doc = {
  ...msaRevised,
  version: "v5",
  blocks: numberClauses(
    msaRevised.blocks.flatMap((b) => {
      switch (b.id) {
        case "c-fees":
          return [{ ...b, text: "Customer shall pay all undisputed invoices within forty-five (45) days of receipt. Late amounts accrue interest at 1.25% per month." }];
        case "c-liability":
          return [{ ...b, text: "Each party’s total liability under this Agreement shall not exceed the fees paid in the twelve (12) months preceding the claim, except for breaches of Clause 6 (Data protection), which are capped at two times (2×) those fees." }];
        case "c-law":
          return [
            { ...b, text: "This Agreement is governed by the laws of the State of New York." },
            { id: "c-insurance", kind: "clause" as const, title: "Insurance", text: "Each party shall maintain commercial general liability insurance of at least $2,000,000 per occurrence and provide a certificate on request." },
          ];
        default:
          return [b];
      }
    }),
  ),
};

/** The executed agreement’s dates, for obligations and the renewal notice. */
export const msaTerm = { effective: Date.UTC(2026, 10, 1), renews: Date.UTC(2027, 10, 1) };

export type Signer = {
  id: string;
  name: string;
  /** Title and company: "COO, Halcyon Freight". */
  role: string;
  email: string;
  status: "signed" | "current" | "waiting";
  /** When they signed (epoch ms). */
  signedAt?: number;
  /** The person viewing the envelope. */
  you?: boolean;
};

/** The v5 envelope out for signature: Halcyon has signed, Rachel is next, Arjun countersigns. */
export const envelope = {
  id: "ENV-26-4417",
  title: "Halcyon Freight MSA (v5)",
  pages: 9,
  sentAt: hoursAgo(26),
  signers: [
    { id: "sg1", name: "Priya Natarajan", role: "COO, Halcyon Freight", email: "priya.natarajan@halcyonfreight.co.uk", status: "signed", signedAt: hoursAgo(3) },
    { id: "sg2", name: "Rachel Stein", role: "General counsel, Northpeak", email: "rachel.stein@northpeak.io", status: "current", you: true },
    { id: "sg3", name: "Arjun Mehta", role: "CFO, Northpeak", email: "arjun.mehta@northpeak.io", status: "waiting" },
  ] satisfies Signer[],
};

export type Obligation = {
  id: string;
  /** The clause it was read from (an id in `msaFinal`). */
  blockId: string;
  party: "Customer" | "Supplier" | "Both";
  /** The duty in plain words. */
  text: string;
  /** When it falls due, as written: "Within 45 days of invoice". */
  due?: string;
  /** The words in the clause it rests on, verbatim. */
  quote: string;
  /** 0–1, the model’s confidence. Under 0.7 asks for review. */
  confidence: number;
  /** Why it is unsure, for low-confidence rows. */
  note?: string;
};

/** What Brief AI pulls out of the executed v5, in reading order. */
export const obligations: Obligation[] = [
  { id: "o1", blockId: "c-services", party: "Supplier", text: "Provide the services in each Order Form to industry standards", due: "Ongoing", quote: "provide the services described in each Order Form", confidence: 0.96 },
  { id: "o2", blockId: "c-fees", party: "Customer", text: "Pay undisputed invoices", due: "Within 45 days of invoice", quote: "pay all undisputed invoices within forty-five (45) days of receipt", confidence: 0.98 },
  { id: "o3", blockId: "c-fees-tax", party: "Customer", text: "Pay sales, use and value-added taxes on fees", due: "With each invoice", quote: "responsible for all sales, use and value-added taxes", confidence: 0.91 },
  {
    id: "o4",
    blockId: "c-term",
    party: "Both",
    text: "Give notice of non-renewal",
    due: "By Sep 2, 2027",
    quote: "gives notice at least sixty (60) days before renewal",
    confidence: 0.64,
    note: "“Before renewal” could mean the renewal date or the end of the notice period. Read as 60 days before Nov 1, 2027.",
  },
  { id: "o5", blockId: "c-indemnity", party: "Both", text: "Indemnify the other for third-party claims from its own breach", due: "On a claim", quote: "indemnify the other against third-party claims arising from its breach", confidence: 0.87 },
  { id: "o6", blockId: "c-data", party: "Supplier", text: "Process personal data only on documented instructions", due: "Ongoing", quote: "process personal data only on Customer’s documented instructions", confidence: 0.94 },
  {
    id: "o7",
    blockId: "c-data",
    party: "Supplier",
    text: "Notify Customer of a personal data breach",
    due: "Per the DPA",
    quote: "in accordance with the Data Processing Addendum",
    confidence: 0.52,
    note: "The notice window lives in the Data Processing Addendum, which wasn’t attached. Inferred, not quoted.",
  },
  { id: "o8", blockId: "c-insurance", party: "Both", text: "Keep $2M general liability cover; certificate on request", due: "Ongoing", quote: "maintain commercial general liability insurance of at least $2,000,000 per occurrence", confidence: 0.92 },
];

export type TrackedDeadline = {
  id: string;
  title: string;
  matterId: string;
  /** Epoch ms. */
  due: number;
  /** When the clock started (served, docketed, agreed): the ring is the share of that window left. */
  openedAt: number;
  kind: "Court" | "Contract" | "Filing" | "Internal";
  owner: string;
};

/** Every open deadline across the team’s matters, in no particular order. */
export const trackedDeadlines: TrackedDeadline[] = [
  { id: "td1", title: "Interrogatory responses", matterId: "m2", due: daysFromNow(9, 17, 0), openedAt: daysAgo(21, 9, 0), kind: "Court", owner: "Daniel Osei" },
  { id: "td2", title: "Halcyon redline back", matterId: "m1", due: daysFromNow(1, 12, 0), openedAt: daysAgo(6, 10, 0), kind: "Contract", owner: "Mei Lin" },
  { id: "td3", title: "Opposition evidence", matterId: "m4", due: daysFromNow(11, 9, 0), openedAt: daysAgo(40, 9, 0), kind: "Filing", owner: "Tomás Ferreira" },
  { id: "td4", title: "Document production", matterId: "m2", due: daysAgo(2, 17, 0), openedAt: daysAgo(32, 9, 0), kind: "Court", owner: "Daniel Osei" },
  { id: "td5", title: "Board consent: Series C", matterId: "m3", due: daysFromNow(4, 15, 0), openedAt: daysAgo(10, 9, 0), kind: "Internal", owner: "Rachel Stein" },
  { id: "td6", title: "Deposition: R. Castellano", matterId: "m2", due: daysFromNow(23, 10, 0), openedAt: daysAgo(5, 9, 0), kind: "Court", owner: "Daniel Osei" },
];

export type ConflictRecord = {
  id: string;
  /** As it appears in the matter records. */
  name: string;
  /** Other names it trades under. */
  aliases?: string[];
  role: "Client" | "Former client" | "Adverse party" | "Counterparty" | "Witness";
  matterId?: string;
  /** For former clients and closed matters: what and when. */
  matterName?: string;
  lead?: string;
};

/** The firm’s conflict index: every client, adverse party and related party on record. */
export const conflictIndex: ConflictRecord[] = [
  { id: "ci1", name: "Northpeak Systems, Inc.", aliases: ["Northpeak"], role: "Client", matterId: "m1", lead: "Mei Lin" },
  { id: "ci2", name: "Halcyon Freight Ltd", role: "Counterparty", matterId: "m1", lead: "Mei Lin" },
  { id: "ci3", name: "Brightline Logistics", aliases: ["Brightline"], role: "Client", matterId: "m2", lead: "Daniel Osei" },
  { id: "ci4", name: "Ade Okafor", role: "Adverse party", matterId: "m2", lead: "Daniel Osei" },
  { id: "ci5", name: "Rosa Castellano", role: "Witness", matterId: "m2", lead: "Daniel Osei" },
  { id: "ci6", name: "Orbit Analytics", role: "Client", matterId: "m4", lead: "Tomás Ferreira" },
  { id: "ci7", name: "Orbital Labs, Inc.", role: "Adverse party", matterId: "m4", lead: "Tomás Ferreira" },
  { id: "ci8", name: "Kestrel Air Cargo", role: "Former client", matterName: "Fleet leasing, closed 2024", lead: "Rachel Stein" },
  { id: "ci9", name: "Marlow Capital Partners", aliases: ["Marlow Capital"], role: "Counterparty", matterId: "m3", lead: "Rachel Stein" },
];

/** A new matter waiting on conflicts: Kestrel buying a Brightline depot. */
export const conflictIntake = {
  matter: "Kestrel Air Cargo: Leeds depot acquisition",
  parties: [
    { name: "Kestrel Air Cargo", side: "client" as const },
    { name: "Brightline Logistics Inc.", side: "adverse" as const },
    { name: "Fenwick & Shaw LLP", side: "adverse" as const },
    { name: "Leeds Depot Holdings Ltd", side: "adverse" as const },
    { name: "Rosa Castellano", side: "adverse" as const },
  ],
};
