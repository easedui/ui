/** AI / agents: one product, "Relay", an agent workspace. */
import type { FlowGraph } from "../flow-core/types";
import type { Step, ToolState } from "../thinking-core/types";
import type { TimelineEvent } from "../timeline-core/types";
import { createRng, roundTo } from "../realtime-core/rng";
import { daysAgo, hoursAgo, lastDays, minutesAgo, series } from "./shared";

export type AiModel = { id: string; name: string; provider: string; contextTokens: number; inputPerMTok: number; outputPerMTok: number; p50LatencyMs: number; tier: "frontier" | "fast" | "open" };

export const aiModels: AiModel[] = [
  { id: "atlas-3-pro", name: "Atlas 3 Pro", provider: "Northwind AI", contextTokens: 400_000, inputPerMTok: 5, outputPerMTok: 25, p50LatencyMs: 1840, tier: "frontier" },
  { id: "atlas-3-mini", name: "Atlas 3 Mini", provider: "Northwind AI", contextTokens: 200_000, inputPerMTok: 0.8, outputPerMTok: 4, p50LatencyMs: 610, tier: "fast" },
  { id: "kestrel-2", name: "Kestrel 2", provider: "Fieldline", contextTokens: 128_000, inputPerMTok: 2.5, outputPerMTok: 10, p50LatencyMs: 1120, tier: "frontier" },
  { id: "orca-70b", name: "Orca 70B", provider: "Open weights", contextTokens: 64_000, inputPerMTok: 0.6, outputPerMTok: 0.6, p50LatencyMs: 890, tier: "open" },
];

const t0 = minutesAgo(3);
/** A finished research run: 7 steps, 45s, one with sub-steps. Feed it to Step Rail or `summarizeSteps`. */
export const agentRun: Step[] = [
  { id: "plan", label: "Planned the research", status: "complete", detail: "4 questions", startedAt: t0, endedAt: t0 + 2_100 },
  {
    id: "search",
    label: "Searched the web",
    status: "complete",
    detail: "14 sources",
    startedAt: t0 + 2_100,
    endedAt: t0 + 11_400,
    steps: [
      { id: "search-1", label: "EU AI Act enforcement timeline", status: "complete", startedAt: t0 + 2_100, endedAt: t0 + 6_000 },
      { id: "search-2", label: "GPAI code of practice signatories", status: "complete", startedAt: t0 + 6_000, endedAt: t0 + 11_400 },
    ],
  },
  { id: "read", label: "Read 6 pages", status: "complete", detail: "digital-strategy.ec.europa.eu", startedAt: t0 + 11_400, endedAt: t0 + 24_800 },
  { id: "query", label: "Queried the policy database", status: "complete", detail: "212 rows", startedAt: t0 + 24_800, endedAt: t0 + 29_300 },
  { id: "draft", label: "Drafted the brief", status: "complete", detail: "1,180 words", startedAt: t0 + 29_300, endedAt: t0 + 39_900 },
  { id: "cite", label: "Checked citations", status: "complete", detail: "11 of 11 verified", startedAt: t0 + 39_900, endedAt: t0 + 43_200 },
  { id: "done", label: "Shared with Priya Raman", status: "complete", startedAt: t0 + 43_200, endedAt: t0 + 45_000 },
];

/** One tool call of a live run: present-tense `label` while it runs, `doneLabel` once it lands. */
export type LiveToolCall = {
  id: string;
  name: string;
  label: string;
  doneLabel: string;
  detail: string;
  input: Record<string, unknown>;
  output?: unknown;
  /** Set when the call fails; the run may retry with the next call. */
  errorText?: string;
  count?: number;
  countLabel?: string;
};

/** One step of a live run, before the clock stamps it: a console script activates and settles these in order. */
export type LiveStep = {
  id: string;
  label: string;
  doneLabel: string;
  /** The second line once the step settles. */
  detail?: string;
  /** Tokens the step adds to the run's usage when it settles. */
  tokens: { input: number; output: number };
  tools?: LiveToolCall[];
};

/**
 * The research run above as it happens, for Agent Run Console: the same seven steps in the
 * present tense, with each step's tool calls (one fails and is retried), the reasoning before
 * the first step, per-step token usage and the brief it produces. Timing belongs to the demo.
 */
export const liveRun = {
  id: "run_8f3k2",
  title: "EU AI Act brief for legal",
  model: aiModels[0],
  startedBy: "Priya Raman",
  thinking: {
    lines: ["Reading the request", "Choosing sources"],
    reasoning:
      "Legal wants a two-page brief on GPAI obligations under the EU AI Act: the enforcement dates and who has signed the code of practice. Plan four questions, search for the timeline and the signatory list, read the Commission’s own pages rather than summaries, query the policy database for counts by country, and verify every citation before sharing.",
  },
  steps: [
    { id: "plan", label: "Planning the research", doneLabel: "Planned the research", detail: "4 questions", tokens: { input: 1_840, output: 320 } },
    {
      id: "search",
      label: "Searching the web",
      doneLabel: "Searched the web",
      detail: "14 sources",
      tokens: { input: 6_210, output: 480 },
      tools: [
        { id: "s1", name: "web_search", label: "Searching", doneLabel: "Searched", detail: "“EU AI Act enforcement timeline”", input: { query: "EU AI Act GPAI enforcement timeline" }, output: { results: 8, top: "digital-strategy.ec.europa.eu" }, count: 8, countLabel: "sources" },
        { id: "s2", name: "web_search", label: "Searching", doneLabel: "Searched", detail: "“GPAI code of practice signatories”", input: { query: "GPAI code of practice signatories" }, output: { results: 6, top: "artificialintelligenceact.eu" }, count: 6, countLabel: "sources" },
      ],
    },
    {
      id: "read",
      label: "Reading 6 pages",
      doneLabel: "Read 6 pages",
      detail: "digital-strategy.ec.europa.eu",
      tokens: { input: 18_900, output: 640 },
      tools: [
        { id: "r1", name: "fetch_page", label: "Reading", doneLabel: "Read", detail: "digital-strategy.ec.europa.eu/en/policies/ai-pact", input: { url: "https://digital-strategy.ec.europa.eu/en/policies/ai-pact" }, output: { words: 4_812, title: "AI Pact" }, count: 4_812, countLabel: "words" },
        { id: "r2", name: "fetch_page", label: "Reading", doneLabel: "Read", detail: "artificialintelligenceact.eu/implementation-timeline", input: { url: "https://artificialintelligenceact.eu/implementation-timeline" }, output: { words: 2_140, title: "Implementation timeline" }, count: 2_140, countLabel: "words" },
      ],
    },
    {
      id: "query",
      label: "Querying the policy database",
      doneLabel: "Queried the policy database",
      detail: "212 rows · 1 retry",
      tokens: { input: 2_300, output: 410 },
      tools: [
        { id: "q1", name: "sql_query", label: "Querying", doneLabel: "Queried", detail: "signatories by country", input: { sql: "select country, count(*) from signatories group by 1" }, errorText: "permission denied for table signatories" },
        { id: "q2", name: "sql_query", label: "Retrying", doneLabel: "Queried", detail: "signatories_public by country", input: { sql: "select country, count(*) from signatories_public group by 1" }, output: { rows: 212 }, count: 212, countLabel: "rows" },
      ],
    },
    { id: "draft", label: "Drafting the brief", doneLabel: "Drafted the brief", detail: "1,180 words", tokens: { input: 4_100, output: 2_950 } },
    {
      id: "cite",
      label: "Checking citations",
      doneLabel: "Checked citations",
      detail: "11 of 11 verified",
      tokens: { input: 3_600, output: 210 },
      tools: [{ id: "c1", name: "verify_citations", label: "Verifying", doneLabel: "Verified", detail: "11 citations", input: { document: "briefs/eu-ai-act-gpai.md" }, output: { verified: 11, failed: 0 }, count: 11, countLabel: "verified" }],
    },
    {
      id: "share",
      label: "Sharing with Priya Raman",
      doneLabel: "Shared with Priya Raman",
      tokens: { input: 900, output: 60 },
      tools: [{ id: "sh1", name: "share_document", label: "Sharing", doneLabel: "Shared", detail: "priya@relay.dev", input: { path: "briefs/eu-ai-act-gpai.md", with: ["priya@relay.dev"] }, output: { url: "https://relay.dev/d/8f3k2" } }],
    },
  ] as LiveStep[],
  /** What the run produces, shown once it completes. */
  result: {
    title: "AI Act brief: GPAI obligations",
    path: "briefs/eu-ai-act-gpai.md",
    words: 1_180,
    citations: 11,
    excerpt:
      "Obligations for general-purpose AI providers apply from 2 August 2025; the Commission’s enforcement powers follow a year later. Twenty-six providers have signed the code of practice, with the largest holdout now in talks. Three obligations touch Relay directly: transparency documentation, a copyright policy and training-data summaries.",
  },
};

/** A finished tool call, as its row shows it. */
export type RecordedToolCall = {
  id: string;
  name: string;
  label: string;
  detail: string;
  state: ToolState;
  durationMs: number;
  count?: number;
  countLabel?: string;
  input: Record<string, unknown>;
  output?: unknown;
  errorText?: string;
};

/** A settled step with its tool calls and token usage, timed on the fixture clock. */
export type RecordedStep = Step & { tokens: { input: number; output: number }; tools?: RecordedToolCall[] };

export type RunStatus = "completed" | "failed" | "stopped";

/** A run as the console lists it: who ran what, when, with its full trace and what came of it. */
export type RunRecord = {
  id: string;
  title: string;
  status: RunStatus;
  model: AiModel;
  startedBy: string;
  startedAt: number;
  endedAt: number;
  thinking: { startedAt: number; endedAt: number; reasoning: string };
  steps: RecordedStep[];
  usage: { inputTokens: number; outputTokens: number; cost: number };
  result?: { title: string; detail: string; excerpt: string };
  error?: string;
};

const costOf = (input: number, output: number, model: AiModel) => roundTo((input * model.inputPerMTok + output * model.outputPerMTok) / 1_000_000, 2);

/** Lays steps end to end from `start`, each `seconds` long, so their times agree with their details. */
function lay(start: number, items: (Omit<RecordedStep, "startedAt" | "endedAt"> & { seconds: number })[]): RecordedStep[] {
  let t = start;
  return items.map(({ seconds, ...step }) => {
    const laid = { ...step, startedAt: t, endedAt: t + seconds * 1000 };
    t = laid.endedAt;
    return laid;
  });
}

function record(
  r: Omit<RunRecord, "endedAt" | "steps" | "thinking" | "usage"> & { thinkSeconds: number; reasoning: string; steps: (Omit<RecordedStep, "startedAt" | "endedAt"> & { seconds: number })[] },
): RunRecord {
  const { thinkSeconds, reasoning, steps: items, ...rest } = r;
  const thinkEnd = r.startedAt + thinkSeconds * 1000;
  const steps = lay(thinkEnd, items);
  const inputTokens = steps.reduce((s, x) => s + x.tokens.input, 0);
  const outputTokens = steps.reduce((s, x) => s + x.tokens.output, 0);
  return {
    ...rest,
    thinking: { startedAt: r.startedAt, endedAt: thinkEnd, reasoning },
    steps,
    endedAt: steps[steps.length - 1].endedAt!,
    usage: { inputTokens, outputTokens, cost: costOf(inputTokens, outputTokens, r.model) },
  };
}

/** Earlier runs for the console's list, newest first; `liveRun` goes above them while it runs. Mixed endings. */
export const runs: RunRecord[] = [
  record({
    id: "run_7c1d9",
    title: "Q3 churn drivers by plan",
    status: "completed",
    model: aiModels[0],
    startedBy: "Priya Raman",
    startedAt: hoursAgo(2),
    thinkSeconds: 3,
    reasoning: "Churn rose on the Growth plan in Q3. Query churn by plan and cohort, compare against Q2, and look for the step where cancellations cluster before writing anything.",
    steps: [
      { id: "plan", label: "Planned the analysis", status: "complete", detail: "3 questions", seconds: 2.4, tokens: { input: 1_620, output: 290 } },
      {
        id: "query",
        label: "Queried churn by plan",
        status: "complete",
        detail: "1,840 rows",
        seconds: 6.1,
        tokens: { input: 2_980, output: 350 },
        tools: [{ id: "q1", name: "sql_query", label: "Queried", detail: "churn_events, Q3 by plan", state: "done", durationMs: 1_210, count: 1_840, countLabel: "rows", input: { sql: "select plan, cohort, count(*) from churn_events where quarter = '2026-Q3' group by 1, 2" }, output: { rows: 1_840 } }],
      },
      {
        id: "compare",
        label: "Compared Q3 cohorts with Q2",
        status: "complete",
        detail: "3 charts",
        seconds: 13.8,
        tokens: { input: 6_400, output: 820 },
        tools: [{ id: "c1", name: "run_code", label: "Ran", detail: "cohort_compare.py", state: "done", durationMs: 9_400, count: 3, countLabel: "charts", input: { file: "cohort_compare.py" }, output: { charts: 3, largestDelta: "+2.1 pts, Growth, month 2" } }],
      },
      { id: "draft", label: "Drafted the summary", status: "complete", detail: "640 words", seconds: 9.7, tokens: { input: 3_300, output: 950 } },
    ],
    result: {
      title: "Q3 churn: three drivers",
      detail: "640 words · 3 charts",
      excerpt: "Growth-plan churn rose 2.1 points in Q3, almost all of it in the second month after upgrade. Accounts that never invited a teammate churned at three times the rate of those that did; the price change explains less than half a point.",
    },
  }),
  record({
    id: "run_6b0a4",
    title: "Refactor billing webhooks",
    status: "failed",
    model: aiModels[0],
    startedBy: "Tomás Herrera",
    startedAt: hoursAgo(5),
    thinkSeconds: 2,
    reasoning: "The Stripe handlers retry on every 5xx and re-process invoice.paid. Key each write on the event id so a retry is a no-op, then run the suite.",
    steps: [
      {
        id: "read",
        label: "Read the webhook handlers",
        status: "complete",
        detail: "2 files",
        seconds: 4.2,
        tokens: { input: 5_100, output: 240 },
        tools: [
          { id: "r1", name: "read_file", label: "Read", detail: "api/webhooks/stripe.ts", state: "done", durationMs: 310, count: 312, countLabel: "lines", input: { path: "api/webhooks/stripe.ts" }, output: { lines: 312 } },
          { id: "r2", name: "read_file", label: "Read", detail: "lib/billing/invoices.ts", state: "done", durationMs: 220, count: 148, countLabel: "lines", input: { path: "lib/billing/invoices.ts" }, output: { lines: 148 } },
        ],
      },
      { id: "plan", label: "Planned the change", status: "complete", detail: "Idempotency key on the event id", seconds: 3.1, tokens: { input: 2_200, output: 410 } },
      {
        id: "edit",
        label: "Edited 2 files",
        status: "complete",
        detail: "+38 −12",
        seconds: 7.9,
        tokens: { input: 7_900, output: 2_100 },
        tools: [{ id: "e1", name: "edit_file", label: "Edited", detail: "api/webhooks/stripe.ts", state: "done", durationMs: 640, input: { path: "api/webhooks/stripe.ts", hunks: 3 }, output: { added: 38, removed: 12 } }],
      },
      {
        id: "test",
        label: "Ran the test suite",
        status: "error",
        detail: "4 of 112 failed",
        seconds: 41,
        tokens: { input: 7_600, output: 1_200 },
        tools: [{ id: "t1", name: "run_tests", label: "Ran", detail: "pnpm test billing", state: "error", durationMs: 38_600, input: { command: "pnpm test billing" }, errorText: "4 of 112 tests failed: invoice.paid is handled twice when a retry lands before the first write commits." }],
      },
    ],
    error: "4 of 112 tests failed: invoice.paid is handled twice when a retry lands before the first write commits.",
  }),
  record({
    id: "run_5e9f1",
    title: "Vendor DPA comparison",
    status: "stopped",
    model: aiModels[0],
    startedBy: "Priya Raman",
    startedAt: daysAgo(1, 16, 12),
    thinkSeconds: 2,
    reasoning: "Compare the three vendor DPAs on sub-processor notice, breach timelines and audit rights; flag anything weaker than our standard terms.",
    steps: [
      { id: "plan", label: "Planned the comparison", status: "complete", detail: "3 vendors, 6 clauses", seconds: 1.9, tokens: { input: 1_400, output: 260 } },
      {
        id: "read",
        label: "Read 3 DPAs",
        status: "complete",
        detail: "2 of 3 read",
        seconds: 11.2,
        tokens: { input: 7_900, output: 310 },
        tools: [
          { id: "d1", name: "fetch_page", label: "Read", detail: "northwind.ai/legal/dpa", state: "done", durationMs: 2_900, count: 6_120, countLabel: "words", input: { url: "https://northwind.ai/legal/dpa" }, output: { words: 6_120 } },
          { id: "d2", name: "fetch_page", label: "Read", detail: "fieldline.com/dpa", state: "done", durationMs: 2_140, count: 4_480, countLabel: "words", input: { url: "https://fieldline.com/dpa" }, output: { words: 4_480 } },
          { id: "d3", name: "fetch_page", label: "Read", detail: "orca-weights.org/dpa", state: "denied", durationMs: 0, input: { url: "https://orca-weights.org/dpa" } },
        ],
      },
      { id: "compare", label: "Comparing clauses", status: "skipped", detail: "Stopped by Priya Raman", seconds: 0.6, tokens: { input: 600, output: 40 } },
    ],
  }),
  record({
    id: "run_4d8e0",
    title: "Onboarding email sequence",
    status: "completed",
    model: aiModels[1],
    startedBy: "Mei Okafor",
    startedAt: daysAgo(1, 9, 40),
    thinkSeconds: 1,
    reasoning: "Five emails over two weeks, one ask each: welcome, first integration, invite a teammate, reporting, a human check-in.",
    steps: [
      { id: "plan", label: "Planned the sequence", status: "complete", detail: "5 emails", seconds: 1.8, tokens: { input: 1_100, output: 210 } },
      {
        id: "read",
        label: "Read the onboarding checklist",
        status: "complete",
        detail: "docs/onboarding.md",
        seconds: 3.4,
        tokens: { input: 2_600, output: 120 },
        tools: [{ id: "r1", name: "read_file", label: "Read", detail: "docs/onboarding.md", state: "done", durationMs: 180, count: 96, countLabel: "lines", input: { path: "docs/onboarding.md" }, output: { lines: 96 } }],
      },
      { id: "draft", label: "Drafted 5 emails", status: "complete", detail: "1,420 words", seconds: 14.6, tokens: { input: 4_900, output: 1_800 } },
      {
        id: "check",
        label: "Checked tone and links",
        status: "complete",
        detail: "9 of 9 links ok",
        seconds: 4,
        tokens: { input: 2_600, output: 170 },
        tools: [{ id: "l1", name: "check_links", label: "Checked", detail: "9 links", state: "done", durationMs: 2_300, count: 9, countLabel: "links", input: { document: "emails/onboarding.md" }, output: { ok: 9, broken: 0 } }],
      },
    ],
    result: {
      title: "Onboarding sequence: 5 emails",
      detail: "1,420 words · 9 links",
      excerpt: "Day 0 welcomes and sets one goal; day 2 shows the first integration; day 5 asks for a teammate; day 9 covers reporting; day 14 checks in with a human. Every email has one link and one ask.",
    },
  }),
];

/** The same run as a graph: two searches fan out and join. */
export const agentFlow: FlowGraph = {
  nodes: [
    { id: "plan", label: "Plan", detail: "2.1s" },
    { id: "search-1", label: "Search: enforcement", detail: "3.9s" },
    { id: "search-2", label: "Search: signatories", detail: "5.4s" },
    { id: "read", label: "Read sources", detail: "13.4s" },
    { id: "draft", label: "Draft brief", detail: "10.6s" },
    { id: "review", label: "Human review", detail: "Priya Raman" },
  ],
  edges: [
    { from: "plan", to: "search-1" },
    { from: "plan", to: "search-2" },
    { from: "search-1", to: "read" },
    { from: "search-2", to: "read" },
    { from: "read", to: "draft" },
    { from: "draft", to: "review" },
  ],
};

export type ToolCall = { id: string; name: string; input: Record<string, unknown>; state: ToolState; durationMs?: number; summary?: string };
export const toolCalls: ToolCall[] = [
  { id: "tc1", name: "web_search", input: { query: "EU AI Act GPAI obligations August 2025" }, state: "done", durationMs: 1_420, summary: "8 results" },
  { id: "tc2", name: "fetch_page", input: { url: "https://digital-strategy.ec.europa.eu/en/policies/ai-pact" }, state: "done", durationMs: 2_310, summary: "4,812 words" },
  { id: "tc3", name: "sql_query", input: { sql: "select country, count(*) from signatories group by 1" }, state: "done", durationMs: 380, summary: "27 rows" },
  { id: "tc4", name: "send_email", input: { to: "legal@relay.dev", subject: "AI Act brief: draft for review" }, state: "awaiting-approval" },
  { id: "tc5", name: "create_ticket", input: { project: "COMPLY", title: "Map GPAI duties to vendors" }, state: "error", durationMs: 920, summary: "403: missing scope tickets:write" },
];

/** Context window by source, tokens (of 200,000). */
export const contextWindow = [
  { source: "System prompt", tokens: 3_240 },
  { source: "Tools", tokens: 8_910 },
  { source: "Files", tokens: 61_400 },
  { source: "Conversation", tokens: 54_870 },
  { source: "Memory", tokens: 2_150 },
];

const days = lastDays(30);
/** 30 days of usage: tokens (M), requests, p50 latency (ms), spend (USD). Mixed trends. */
export const usageDaily = {
  days,
  tokensM: series("ai/tokens", { count: 30, start: 38, trend: 0.42, noise: 0.08, weekly: 0.22, decimals: 1 }),
  requests: series("ai/requests", { count: 30, start: 18_400, trend: 0.31, noise: 0.07, weekly: 0.25 }),
  p50LatencyMs: series("ai/latency", { count: 30, start: 1_260, trend: -0.14, noise: 0.05 }),
  spendUsd: series("ai/spend", { count: 30, start: 412, trend: 0.18, noise: 0.09, weekly: 0.2, decimals: 2 }),
};

export type EvalRow = { id: string; suite: string; model: string; cases: number; passed: number; score: number; deltaVsLast: number };
export const evalResults: EvalRow[] = [
  { id: "e1", suite: "Contract QA", model: "Atlas 3 Pro", cases: 240, passed: 221, score: 0.921, deltaVsLast: 0.018 },
  { id: "e2", suite: "Contract QA", model: "Kestrel 2", cases: 240, passed: 204, score: 0.85, deltaVsLast: -0.006 },
  { id: "e3", suite: "Tool use", model: "Atlas 3 Pro", cases: 180, passed: 163, score: 0.906, deltaVsLast: 0.041 },
  { id: "e4", suite: "Tool use", model: "Atlas 3 Mini", cases: 180, passed: 139, score: 0.772, deltaVsLast: 0.012 },
  { id: "e5", suite: "Refusals", model: "Orca 70B", cases: 120, passed: 97, score: 0.808, deltaVsLast: -0.025 },
  { id: "e6", suite: "Summaries", model: "Atlas 3 Mini", cases: 300, passed: 271, score: 0.903, deltaVsLast: 0 },
];

/** Chat threads for a Session Sidebar (group with `groupByDay`). */
export const sessions: TimelineEvent[] = [
  { id: "s1", at: minutesAgo(4), title: "EU AI Act brief for legal" },
  { id: "s2", at: hoursAgo(2), title: "Q3 churn drivers by plan" },
  { id: "s3", at: hoursAgo(5), title: "Refactor billing webhooks" },
  { id: "s4", at: daysAgo(1, 16, 12), title: "Vendor DPA comparison" },
  { id: "s5", at: daysAgo(1, 9, 40), title: "Onboarding email sequence" },
  { id: "s6", at: daysAgo(3, 11, 5), title: "Postgres index advice" },
  { id: "s7", at: daysAgo(6, 15, 20), title: "Board update outline" },
  { id: "s8", at: daysAgo(12, 10, 0), title: "Pricing page copy" },
];

/** One delta of a streamed reply: when it landed (ms after the request was sent), its text and its output tokens. */
export type StreamChunk = { at: number; text: string; tokens: number };
/** One model's reply to the compare prompt, as it streamed. `endedAt` is when the stream closed. */
export type CompareRun = { model: AiModel; chunks: StreamChunk[]; endedAt: number };

/**
 * Splits a reply into the chunks a provider would stream: one or two words each, about four
 * characters a token, the first after `firstTokenMs`, then paced at `tokensPerSecond` with
 * seeded jitter and the odd stall, so two runs race the way real ones do.
 */
function streamOf(seed: string, text: string, firstTokenMs: number, tokensPerSecond: number): { chunks: StreamChunk[]; endedAt: number } {
  const rng = createRng(seed);
  const words = text.match(/\S+\s*/g) ?? [];
  const chunks: StreamChunk[] = [];
  let at = firstTokenMs;
  for (let i = 0; i < words.length; ) {
    const take = rng.chance(0.35) ? 2 : 1;
    const piece = words.slice(i, i + take).join("");
    i += take;
    const tokens = Math.max(1, Math.round(piece.length / 4));
    chunks.push({ at: Math.round(at), text: piece, tokens });
    at += (tokens / tokensPerSecond) * 1000 * rng.range(0.6, 1.4) + (rng.chance(0.04) ? rng.range(120, 260) : 0);
  }
  return { chunks, endedAt: Math.round(at) };
}

const atlasPro = aiModels.find((m) => m.id === "atlas-3-pro")!;
const kestrel = aiModels.find((m) => m.id === "kestrel-2")!;

/**
 * One prompt sent to two models at once, for Multi-model Compare. Atlas 3 Pro answers later
 * and at more length; Kestrel 2 answers first, shorter and for about a third of the cost.
 * Neither is the obvious winner, which is why the person picks.
 */
export const modelCompare: { prompt: string; inputTokens: number; runs: CompareRun[] } = {
  prompt: "Our p95 API latency went from 180ms to 420ms after Tuesday's deploy. What should we check first? Keep it under 150 words.",
  inputTokens: 182,
  runs: [
    {
      model: atlasPro,
      ...streamOf(
        "ai/compare/atlas",
        [
          "Start with what changed on Tuesday, then work outward.",
          "",
          "1. **Query count.** Compare queries per request before and after the deploy. A relation now loaded in a loop is the usual cause of a jump this size.",
          "2. **Connection pool.** If traffic grew but the pool didn't, requests queue for a connection. Check `pool_wait_ms` on the database dashboard.",
          "3. **Cache keys.** A new field in a cache key empties the cache on deploy. A hit rate still below last week's points here.",
          "4. **Who is slow.** If p50 barely moved, the slow requests share something: large accounts, one region or one endpoint.",
          "",
          "If ten traces from after the deploy don't narrow it down, roll back one service at a time.",
        ].join("\n"),
        atlasPro.p50LatencyMs,
        46,
      ),
    },
    {
      model: kestrel,
      ...streamOf(
        "ai/compare/kestrel",
        [
          "Check these in order:",
          "",
          "- **Queries per request.** A lazy-loaded relation added in the deploy often doubles p95 while p50 barely moves.",
          "- **Cache hit rate.** If a key format changed, the cache went cold on Tuesday and may not have recovered.",
          "- **Pool wait time.** A saturated connection pool shows up as queueing, not as slow queries.",
          "",
          "Then pull ten slow traces from after the deploy and ten from before. The span that grew is your answer.",
        ].join("\n"),
        kestrel.p50LatencyMs,
        78,
      ),
    },
  ],
};

/**
 * One step of a plan an agent proposes before it runs: the line to approve, what it will do, the
 * tools it may call, the log it prints and its result line. `failure` is a first attempt that
 * fails (its log and error), so a retry can succeed.
 */
export type PlanStep = {
  id: string;
  label: string;
  description: string;
  tools: string[];
  output: string[];
  result: string;
  failure?: { output: string[]; error: string };
};

/**
 * The plan for Plan → Execute Board: Relay moves Sam’s Stripe webhooks to the v2 events API in
 * seven steps. The test run fails once on two stale fixtures; the changelog step is the one a
 * reviewer is likely to cancel. Timing belongs to the demo.
 */
export const webhookPlan = {
  id: "RLY-218",
  title: "Move billing webhooks to Stripe v2 events",
  request: "Move our Stripe webhooks to the v2 events API. We can’t drop any invoice events while it happens.",
  requestedBy: "Sam Lindqvist",
  model: aiModels[0],
  steps: [
    {
      id: "snapshot",
      label: "Back up the current webhook endpoints",
      description: "Export the 14 endpoints with their event filters and signing secrets, so the switch can be rolled back in one command.",
      tools: ["stripe.webhook_endpoints.list", "fs.write"],
      output: ["$ stripe webhook_endpoints list --limit 100", "14 endpoints · 23 event types", "Wrote ops/webhooks-backup.json (6.2 kB)"],
      result: "14 endpoints saved",
    },
    {
      id: "map",
      label: "Map v1 event types to v2 events",
      description: "Match each of the 23 subscribed v1 types to its v2 event and flag any that were renamed or have no equivalent.",
      tools: ["docs.search", "code.read"],
      output: ["Reading src/billing/webhooks.ts", "23 types subscribed, 21 map one to one", "Renamed: invoice.upcoming → invoice.upcoming_v2", "Renamed: customer.source.expiring → payment_method.expiring"],
      result: "21 mapped, 2 renamed",
    },
    {
      id: "handler",
      label: "Update the handler for v2 payloads",
      description: "Edit the webhook handler to read thin events and fetch the full object only when a branch needs it.",
      tools: ["code.edit"],
      output: ["Edited src/billing/webhooks.ts", "Edited src/billing/events.ts", "Added src/billing/fetch-related.ts", "3 files changed, +142 −87"],
      result: "3 files changed",
    },
    {
      id: "tests",
      label: "Run the billing test suite",
      description: "Run the 148 webhook and invoice tests against the new handler, including replays of real payloads.",
      tools: ["shell.run"],
      output: ["$ pnpm test billing", "Regenerated 2 fixtures from v2 samples", "148 passed in 41.2s"],
      result: "148 of 148 passed",
      failure: {
        output: ["$ pnpm test billing", "✕ invoice.paid replays once per event", "✕ invoice.payment_failed marks the account past due", "146 passed, 2 failed in 39.8s", "invoice_paid.json and payment_failed.json are still v1 payloads"],
        error: "2 of 148 tests failed",
      },
    },
    {
      id: "changelog",
      label: "Draft a changelog entry for the docs",
      description: "Write a short entry for the public changelog that explains the new event names to integrators.",
      tools: ["docs.write"],
      output: ["Drafted docs/changelog/webhooks-v2.md", "182 words"],
      result: "Draft saved",
    },
    {
      id: "switch",
      label: "Point the 14 endpoints at v2",
      description: "Update each endpoint’s API version and keep the old signing secrets valid for 24 hours, so no delivery is rejected mid-switch.",
      tools: ["stripe.webhook_endpoints.update"],
      output: ["Updating 14 endpoints", "we_1Q8xK2 → 2026-09-30.v2", "we_1Q8xM7 → 2026-09-30.v2", "14 of 14 updated · old secrets expire in 24 hours"],
      result: "14 of 14 updated",
    },
    {
      id: "notify",
      label: "Post a summary to #billing-eng",
      description: "Share what changed, where the backup lives and the one command that rolls it back.",
      tools: ["slack.post_message"],
      output: ["Posted to #billing-eng", "relay.slack.com/archives/C04B1LLNG/p1760970412"],
      result: "Posted to #billing-eng",
    },
  ] as PlanStep[],
};
