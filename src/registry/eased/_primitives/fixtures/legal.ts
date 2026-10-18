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
