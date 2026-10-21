/** Analytics / SaaS admin: one product, "Orbit", a B2B analytics app. */
import type { TimelineEvent } from "../timeline-core/types";
import { FIXTURE_NOW, daysAgo, daysFromNow, hoursAgo, lastDays, lastMonths, minutesAgo, series } from "./shared";

const days = lastDays(90);
/** 90 days of daily metrics. Revenue up, activation flat, churn edging down. */
export const metricsDaily = {
  days,
  mrr: series("saas/mrr", { count: 90, start: 182_400, trend: 0.14, noise: 0.004 }),
  activeUsers: series("saas/dau", { count: 90, start: 8_920, trend: 0.22, noise: 0.04, weekly: 0.3 }),
  signups: series("saas/signups", { count: 90, start: 214, trend: 0.08, noise: 0.18, weekly: 0.35 }),
  churnRate: series("saas/churn", { count: 90, start: 0.031, trend: -0.18, noise: 0.05, decimals: 4 }),
  /** Share of new workspaces that connect data in their first week: flat, a little noisy. */
  activation: series("saas/activation", { count: 90, start: 0.414, trend: -0.01, noise: 0.03, decimals: 4 }),
};
/** 180 days of the same metrics, so a 90-day range can compare against the 90 days before it. */
export const metricsHistory = {
  days: lastDays(180),
  mrr: series("saas/mrr-180", { count: 180, start: 161_800, trend: 0.29, noise: 0.004 }),
  activeUsers: series("saas/dau-180", { count: 180, start: 7_340, trend: 0.48, noise: 0.04, weekly: 0.3 }),
  signups: series("saas/signups-180", { count: 180, start: 168, trend: 0.52, noise: 0.07, weekly: 0.25 }),
  churnRate: series("saas/churn-180", { count: 180, start: 0.036, trend: -0.3, noise: 0.025, decimals: 4 }),
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
export const usage = { plan: "growth", eventsUsed: 1_642_000, eventsLimit: 2_000_000, seatsUsed: 7, seatsLimit: 10, renewsAt: daysAgo(-13, 0, 0), nextInvoiceUsd: 99 };

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
  { id: "o1", label: "Install the snippet", done: true, description: "Paste one script tag, or add the npm package.", action: "View snippet", minutes: 2 },
  { id: "o2", label: "Connect a data source", done: true, description: "Postgres, Snowflake, BigQuery or Stripe.", action: "Connect", minutes: 5 },
  { id: "o3", label: "Build your first dashboard", done: false, description: "Start from the SaaS template or a blank canvas.", action: "Open template", minutes: 4 },
  { id: "o4", label: "Invite your team", done: false, description: "Teammates see what you see. Viewers are free.", action: "Invite", minutes: 1 },
  { id: "o5", label: "Set a weekly digest", done: false, description: "Monday 9:00 AM, straight to Slack or email.", action: "Schedule", minutes: 1 },
];

/** Where each KPI comes from: the rows a drilldown shows under its chart. */
export const kpiBreakdown: Record<string, { id: string; label: string; value: number; previous: number }[]> = {
  mrr: [
    { id: "scale", label: "Scale", value: 96_420, previous: 89_310 },
    { id: "growth", label: "Growth", value: 71_280, previous: 69_700 },
    { id: "starter", label: "Starter", value: 26_150, previous: 26_980 },
    { id: "enterprise", label: "Enterprise", value: 14_090, previous: 12_320 },
  ],
  active: [
    { id: "web", label: "Web app", value: 7_412, previous: 7_018 },
    { id: "slack", label: "Slack digest", value: 2_266, previous: 2_041 },
    { id: "api", label: "API", value: 812, previous: 794 },
    { id: "mobile", label: "Mobile", value: 394, previous: 359 },
  ],
  activation: [
    { id: "organic", label: "Organic search", value: 0.468, previous: 0.461 },
    { id: "referral", label: "Referral", value: 0.452, previous: 0.47 },
    { id: "paid", label: "Paid social", value: 0.318, previous: 0.336 },
    { id: "partner", label: "Partners", value: 0.401, previous: 0.389 },
  ],
  churn: [
    { id: "starter", label: "Starter", value: 0.048, previous: 0.053 },
    { id: "growth", label: "Growth", value: 0.021, previous: 0.024 },
    { id: "scale", label: "Scale", value: 0.009, previous: 0.008 },
    { id: "enterprise", label: "Enterprise", value: 0.004, previous: 0.006 },
  ],
};

/**
 * Usage-based pricing: a platform fee, seats past the included ones, and graduated event
 * tiers priced per 1,000 events (each tier's rate applies only to the events inside it).
 */
export const usagePricing = {
  currency: "USD",
  platform: 49,
  seats: { included: 3, unit: 15, max: 100 },
  events: {
    min: 100_000,
    max: 100_000_000,
    tiers: [
      { upTo: 1_000_000, per1k: 0, label: "Included" },
      { upTo: 10_000_000, per1k: 0.09, label: "Growth" },
      { upTo: 50_000_000, per1k: 0.06, label: "Volume" },
      { upTo: Infinity, per1k: 0.04, label: "Scale" },
    ],
  },
  yearlyDiscount: 0.17,
};

/** The workspace's subscription, its upcoming invoice and payment method. */
export const billing = {
  plan: "Growth",
  interval: "month" as const,
  renewsAt: daysFromNow(13, 0, 0),
  card: { brand: "Visa", last4: "4417", expires: "08/28" },
  lines: [
    { id: "plan", label: "Growth plan", amount: 99 },
    { id: "sync", label: "Warehouse sync add-on", amount: 30 },
    { id: "events", label: "Events over 2M (est.)", amount: 0 },
  ],
  invoices: [
    { id: "INV-0931", at: daysAgo(18, 0, 0), amount: 129, status: "paid" as const },
    { id: "INV-0874", at: daysAgo(48, 0, 0), amount: 141.6, status: "paid" as const },
    { id: "INV-0812", at: daysAgo(79, 0, 0), amount: 114, status: "paid" as const },
  ],
  cancelReasons: [
    { id: "price", label: "It costs too much" },
    { id: "missing", label: "It’s missing something we need" },
    { id: "switch", label: "We’re moving to another tool" },
    { id: "pause", label: "We only need it seasonally" },
    { id: "other", label: "Something else" },
  ],
};

export type OrbitNotification = TimelineEvent<{ unread: boolean; context?: string }>;
/** The notification feed: three days deep, mixed kinds, some unread. Newest first. */
export const notificationFeed: OrbitNotification[] = [
  { id: "f1", at: minutesAgo(4), title: "commented on Q3 retention", actor: { name: "Jonas Lindqvist" }, kind: "comment", data: { unread: true, context: "“Can we split this by plan?”" } },
  { id: "f2", at: minutesAgo(38), title: "Weekly digest is ready", kind: "report", data: { unread: true, context: "MRR up 4.9%, churn down" } },
  { id: "f3", at: hoursAgo(3), title: "Snowflake sync failed", kind: "alert", tone: "danger", data: { unread: true, context: "Credentials expired" } },
  { id: "f4", at: hoursAgo(6), title: "shared Activation by channel", actor: { name: "Adaeze Okafor" }, kind: "share", data: { unread: false, context: "Dashboard" } },
  { id: "f5", at: daysAgo(1, 16, 12), title: "You’re at 82% of this month’s events", kind: "billing", tone: "warning", data: { unread: false, context: "1.64M of 2M" } },
  { id: "f6", at: daysAgo(1, 11, 40), title: "joined the workspace", actor: { name: "Sofia Esposito" }, kind: "member", data: { unread: false, context: "Viewer" } },
  { id: "f7", at: daysAgo(3, 9, 5), title: "mentioned you in Pricing page funnel", actor: { name: "Lucas Moreau" }, kind: "comment", data: { unread: false, context: "“@Priya does this match Stripe?”" } },
  { id: "f8", at: daysAgo(4, 15, 30), title: "Export finished", kind: "report", data: { unread: false, context: "events_sep.csv, 48 MB" } },
];
/** What arrives while the feed is open, for live demos. */
export const incomingNotifications: OrbitNotification[] = [
  { id: "i1", at: FIXTURE_NOW, title: "replied to your comment", actor: { name: "Jonas Lindqvist" }, kind: "comment", data: { unread: true, context: "“Done, it’s on the second tab.”" } },
  { id: "i2", at: FIXTURE_NOW, title: "Snowflake sync recovered", kind: "alert", tone: "success", data: { unread: true, context: "2.1M rows backfilled" } },
];
