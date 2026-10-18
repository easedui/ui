/** AI / agents: one product, "Relay", an agent workspace. */
import type { FlowGraph } from "../flow-core/types";
import type { Step, ToolState } from "../thinking-core/types";
import type { TimelineEvent } from "../timeline-core/types";
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
