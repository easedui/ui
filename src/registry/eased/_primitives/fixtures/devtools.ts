/** Devtools: one product, "Fathom", a deploy platform; the repo is `fathom/web`. */
import type { FlowGraph } from "../flow-core/types";
import type { TimelineEvent } from "../timeline-core/types";
import { createRng } from "../realtime-core/rng";
import { daysAgo, hoursAgo, minutesAgo, series } from "./shared";

/** A CI run mid-flight: install done, checks running in parallel, deploy waiting. */
export const pipeline: FlowGraph<{ durationMs?: number }> = {
  nodes: [
    { id: "install", label: "Install", status: "complete", detail: "38s", data: { durationMs: 38_000 } },
    { id: "lint", label: "Lint", status: "complete", detail: "21s", data: { durationMs: 21_000 } },
    { id: "typecheck", label: "Typecheck", status: "active", detail: "Running…" },
    { id: "unit", label: "Unit tests", status: "active", detail: "412 / 1,206" },
    { id: "build", label: "Build", status: "pending" },
    { id: "e2e", label: "E2E tests", status: "pending", detail: "Chromium" },
    { id: "deploy", label: "Deploy", status: "pending", detail: "Production" },
  ],
  edges: [
    { from: "install", to: "typecheck" },
    { from: "install", to: "unit" },
    { from: "lint", to: "build" },
    { from: "typecheck", to: "build" },
    { from: "unit", to: "build" },
    { from: "build", to: "e2e" },
    { from: "e2e", to: "deploy" },
  ],
};

type LogData = { stage: string; level: "info" | "warn" | "error" };
const L = (i: number, stage: string, title: string, level: LogData["level"] = "info"): TimelineEvent<LogData> => ({
  id: `log-${i}`,
  at: minutesAgo(6) + i * 1_350,
  title,
  kind: stage,
  tone: level === "error" ? "danger" : level === "warn" ? "warning" : "neutral",
  data: { stage, level },
});
/** A deploy log that fails in build (stream it line by line, oldest first). */
export const deployLog: TimelineEvent<LogData>[] = [
  L(0, "clone", "Cloning github.com/fathom/web (branch main, commit 4f9c2ab)"),
  L(1, "clone", "Cloned in 1.8s"),
  L(2, "install", "pnpm install --frozen-lockfile"),
  L(3, "install", "Packages: +1,284"),
  L(4, "install", "Done in 23.6s"),
  L(5, "build", "next build"),
  L(6, "build", "Creating an optimized production build…"),
  L(7, "build", "⚠ Compiled with 2 warnings in 41s", "warn"),
  L(8, "build", "Collecting page data…"),
  L(9, "build", "Type error: Property 'currency' does not exist on type 'Invoice'.", "error"),
  L(10, "build", "  at src/app/billing/invoice-row.tsx:42:18", "error"),
  L(11, "build", "Build failed after 1m 12s", "error"),
];

/** An incident, newest first. */
export const incident = {
  id: "INC-2291",
  title: "Elevated 5xx on api.fathom.dev",
  severity: "SEV-2" as const,
  startedAt: hoursAgo(1.6),
  events: [
    { id: "i6", at: minutesAgo(8), title: "Monitoring: error rate back under 0.1%", tone: "success", actor: { name: "Status bot" } },
    { id: "i5", at: minutesAgo(19), title: "Fix deployed: connection pool raised to 80", tone: "info", actor: { name: "Mateo Alvarez" } },
    { id: "i4", at: minutesAgo(41), title: "Identified: pgbouncer pool exhausted after 2.14 deploy", tone: "warning", actor: { name: "Hana Kobayashi" } },
    { id: "i3", at: minutesAgo(63), title: "Severity raised to SEV-2", tone: "danger", actor: { name: "Hana Kobayashi" } },
    { id: "i2", at: minutesAgo(81), title: "Investigating elevated 502s in us-east-1", tone: "warning", actor: { name: "Mateo Alvarez" } },
    { id: "i1", at: minutesAgo(96), title: "Alert: 5xx rate 4.2% (threshold 1%)", tone: "danger", actor: { name: "PagerDuty" } },
  ] satisfies TimelineEvent[],
};

const up = createRng("devtools/uptime");
/** 90 days of daily uptime (0–1) per service, with a couple of real dips. */
export const uptime = ["API", "Dashboard", "Edge network", "Webhooks"].map((name, s) => ({
  name,
  days: Array.from({ length: 90 }, (_, d) => {
    if (s === 0 && d === 89) return 0.9871;
    if (s === 3 && d === 61) return 0.9934;
    if (s === 2 && d === 23) return 0.9989;
    return up.chance(0.05) ? 0.9995 : 1;
  }),
}));

export const envVars = [
  { key: "DATABASE_URL", value: "postgres://fathom:•••@db.internal:5432/web", environments: ["Production", "Preview"], updatedAt: daysAgo(12) },
  { key: "STRIPE_SECRET_KEY", value: "sk_live_51Nx•••Q2c", environments: ["Production"], updatedAt: daysAgo(40) },
  { key: "NEXT_PUBLIC_POSTHOG_KEY", value: "phc_8Jk2LmWq3", environments: ["Production", "Preview", "Development"], updatedAt: daysAgo(3) },
  { key: "RESEND_API_KEY", value: "re_7bT•••Lp9", environments: ["Production", "Preview"], updatedAt: hoursAgo(5) },
];

export const apiKeys = [
  { id: "key_1", name: "Production server", prefix: "fth_live_9KQ2", createdAt: daysAgo(120), lastUsedAt: minutesAgo(2), scopes: ["deploy", "read"] },
  { id: "key_2", name: "GitHub Actions", prefix: "fth_live_X3mA", createdAt: daysAgo(45), lastUsedAt: hoursAgo(3), scopes: ["deploy"] },
  { id: "key_3", name: "Local dev (Hana)", prefix: "fth_test_p7Lr", createdAt: daysAgo(9), lastUsedAt: daysAgo(2), scopes: ["read"] },
];

/** Commits for a Branch Graph: `parents` link them; two branches merge into main. */
export const commits = [
  { sha: "4f9c2ab", message: "Merge pull request #812 from fathom/invoice-currency", author: "Hana Kobayashi", branch: "main", parents: ["b71e0d3", "9a2c4f1"], at: hoursAgo(1) },
  { sha: "9a2c4f1", message: "Show invoice currency on billing rows", author: "Mateo Alvarez", branch: "invoice-currency", parents: ["c03d9e8"], at: hoursAgo(3) },
  { sha: "c03d9e8", message: "Add currency to Invoice type", author: "Mateo Alvarez", branch: "invoice-currency", parents: ["e5f61b0"], at: hoursAgo(6) },
  { sha: "b71e0d3", message: "Bump next to 16.4.2", author: "Renovate", branch: "main", parents: ["e5f61b0"], at: hoursAgo(9) },
  { sha: "e5f61b0", message: "Cache deploy logs at the edge", author: "Ama Owusu", branch: "main", parents: ["0d8a7c2"], at: daysAgo(1, 17, 4) },
  { sha: "0d8a7c2", message: "Fix flaky webhook retry test", author: "Ama Owusu", branch: "main", parents: [], at: daysAgo(1, 11, 30) },
];

/** One request's phases (ms), for a Request Inspector waterfall. */
export const requestPhases = [
  { phase: "DNS", startMs: 0, durationMs: 12 },
  { phase: "TCP", startMs: 12, durationMs: 18 },
  { phase: "TLS", startMs: 30, durationMs: 27 },
  { phase: "Waiting (TTFB)", startMs: 57, durationMs: 184 },
  { phase: "Download", startMs: 241, durationMs: 36 },
];

export const npmPackage = {
  name: "@fathom/sdk",
  version: "4.12.0",
  previousVersion: "4.11.3",
  weeklyDownloads: series("devtools/downloads", { count: 12, start: 182_000, trend: 0.27, noise: 0.06 }),
  /** Week starts (UTC), oldest first. */
  weeks: Array.from({ length: 12 }, (_, i) => daysAgo((11 - i) * 7, 0, 0)),
};
