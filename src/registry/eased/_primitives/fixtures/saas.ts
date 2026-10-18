/** Analytics / SaaS admin: one product, "Orbit", a B2B analytics app. */
import type { TimelineEvent } from "../timeline-core/types";
import { daysAgo, hoursAgo, lastDays, lastMonths, minutesAgo, series } from "./shared";

const days = lastDays(90);
/** 90 days of daily metrics. Revenue up, activation flat, churn edging down. */
export const metricsDaily = {
  days,
  mrr: series("saas/mrr", { count: 90, start: 182_400, trend: 0.14, noise: 0.004 }),
  activeUsers: series("saas/dau", { count: 90, start: 8_920, trend: 0.22, noise: 0.04, weekly: 0.3 }),
  signups: series("saas/signups", { count: 90, start: 214, trend: 0.08, noise: 0.18, weekly: 0.35 }),
  churnRate: series("saas/churn", { count: 90, start: 0.031, trend: -0.18, noise: 0.05, decimals: 4 }),
};
export const metricsMonthly = { months: lastMonths(12), mrr: series("saas/mrr-m", { count: 12, start: 121_000, trend: 0.71, noise: 0.02 }) };

/** Stat tiles: value now and the same period before. */
export const kpis = [
  { id: "mrr", label: "MRR", value: 207_940, previous: 198_310, format: "currency" as const, currency: "USD" },
  { id: "active", label: "Weekly active", value: 10_884, previous: 10_212, format: "number" as const },
  { id: "activation", label: "Activation", value: 0.412, previous: 0.418, format: "percent" as const },
  { id: "churn", label: "Logo churn", value: 0.026, previous: 0.029, format: "percent" as const, lowerIsBetter: true },
];

export const funnel = [
  { stage: "Visited pricing", count: 24_810 },
  { stage: "Started trial", count: 3_942 },
  { stage: "Connected data", count: 2_317 },
  { stage: "Invited a teammate", count: 1_108 },
  { stage: "Converted", count: 486 },
];

export type Member = { id: string; name: string; email: string; role: "Owner" | "Admin" | "Member" | "Viewer"; lastActiveAt: number; avatarUrl?: string };
export const teamMembers: Member[] = [
  { id: "u1", name: "Priya Raman", email: "priya@orbit.app", role: "Owner", lastActiveAt: minutesAgo(3) },
  { id: "u2", name: "Jonas Lindqvist", email: "jonas@orbit.app", role: "Admin", lastActiveAt: hoursAgo(2) },
  { id: "u3", name: "Adaeze Okafor", email: "adaeze@orbit.app", role: "Member", lastActiveAt: hoursAgo(26) },
  { id: "u4", name: "Lucas Moreau", email: "lucas@orbit.app", role: "Member", lastActiveAt: daysAgo(4) },
  { id: "u5", name: "Sofia Esposito", email: "sofia.e@northpeak.io", role: "Viewer", lastActiveAt: daysAgo(11) },
];

export const plans = [
  { id: "starter", name: "Starter", monthly: 29, yearly: 24, seats: 3, events: "100K events / mo" },
  { id: "growth", name: "Growth", monthly: 99, yearly: 82, seats: 10, events: "2M events / mo", recommended: true },
  { id: "scale", name: "Scale", monthly: 349, yearly: 290, seats: 50, events: "25M events / mo" },
];
export const usage = { plan: "growth", eventsUsed: 1_642_000, eventsLimit: 2_000_000, seatsUsed: 8, seatsLimit: 10, renewsAt: daysAgo(-13, 0, 0), nextInvoiceUsd: 99 };

export const notifications: TimelineEvent<{ unread: boolean }>[] = [
  { id: "n1", at: minutesAgo(6), title: "Jonas commented on “Q3 retention”", kind: "comment", data: { unread: true } },
  { id: "n2", at: minutesAgo(48), title: "Weekly digest is ready", kind: "report", data: { unread: true } },
  { id: "n3", at: hoursAgo(5), title: "Snowflake sync failed: credentials expired", kind: "alert", tone: "danger", data: { unread: true } },
  { id: "n4", at: daysAgo(1, 15, 2), title: "Adaeze shared “Activation by channel”", kind: "share", data: { unread: false } },
  { id: "n5", at: daysAgo(2, 10, 30), title: "You’re at 82% of this month’s events", kind: "billing", tone: "warning", data: { unread: false } },
];

export const auditLog: TimelineEvent<{ target: string; before?: string; after?: string }>[] = [
  { id: "a1", at: minutesAgo(12), title: "Changed role", actor: { name: "Priya Raman" }, data: { target: "Lucas Moreau", before: "Viewer", after: "Member" } },
  { id: "a2", at: hoursAgo(3), title: "Rotated API key", actor: { name: "Jonas Lindqvist" }, data: { target: "Ingest key (prod)" } },
  { id: "a3", at: hoursAgo(20), title: "Updated retention policy", actor: { name: "Priya Raman" }, data: { target: "Raw events", before: "13 months", after: "25 months" } },
  { id: "a4", at: daysAgo(2, 9, 12), title: "Enabled SAML SSO", actor: { name: "Jonas Lindqvist" }, data: { target: "okta.orbit.app" } },
  { id: "a5", at: daysAgo(5, 16, 40), title: "Invited member", actor: { name: "Priya Raman" }, data: { target: "sofia.e@northpeak.io" } },
];

export const onboarding = [
  { id: "o1", label: "Install the snippet", done: true },
  { id: "o2", label: "Connect a data source", done: true },
  { id: "o3", label: "Build your first dashboard", done: false },
  { id: "o4", label: "Invite your team", done: false },
  { id: "o5", label: "Set a weekly digest", done: false },
];
