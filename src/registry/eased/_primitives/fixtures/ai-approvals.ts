/** Relay's approval queue: tool calls its agents are waiting on, and the ones already decided. Times are relative to FIXTURE_NOW. */
import { hoursAgo, minutesAgo } from "./shared";

/** The glyph a request leads with in the queue. */
export type ApprovalKind = "email" | "database" | "payment" | "message" | "code" | "tool";

/** One tool call waiting on a person: what it does, which agent asked, why, and the change as before/after text. */
export type ApprovalRecord = {
  id: string;
  title: string;
  tool: string;
  kind: ApprovalKind;
  agent: string;
  reason: string;
  files: { path: string; before?: string; after: string }[];
  requestedAt: number;
};

/** A request that has been decided: it shows in the Decided list only. */
export type DecidedApproval = Omit<ApprovalRecord, "files" | "reason"> & {
  outcome: "done" | "denied" | "expired";
  decidedAt: number;
  edited?: boolean;
};

/** Waiting, oldest first: a migration, a spend cap, a customer email and a refund. */
export const approvalQueue: ApprovalRecord[] = [
  {
    id: "apr_7h2k",
    title: "Add an index on events.created_at",
    tool: "run_migration",
    kind: "database",
    agent: "Data agent",
    reason: "Dashboard queries scan 41M event rows; the index takes p95 from 2.8s to about 90ms. It builds concurrently, so writes are never locked.",
    files: [
      {
        path: "db/migrations/0042_events_created_at.sql",
        after: "-- Speeds up time-range queries on events.\ncreate index concurrently if not exists events_created_at_idx\n  on events (created_at desc);\n",
      },
    ],
    requestedAt: minutesAgo(18),
  },
  {
    id: "apr_9m4t",
    title: "Raise the GPU spend cap to $2,600 a month",
    tool: "update_budget",
    kind: "payment",
    agent: "Infra agent",
    reason: "Fine-tuning jobs hit the $2,000 cap on 14 October and were paused twice. The last three months averaged $2,340.",
    files: [
      {
        path: "infra/budgets.yaml",
        before: "gpu:\n  provider: lambda\n  monthly_cap_usd: 2000\n  alert_at: 0.8\n  pause_on_cap: true\n",
        after: "gpu:\n  provider: lambda\n  monthly_cap_usd: 2600\n  alert_at: 0.85\n  pause_on_cap: true\n",
      },
    ],
    requestedAt: minutesAgo(11),
  },
  {
    id: "apr_3q8n",
    title: "Send the renewal offer to Northwind",
    tool: "send_email",
    kind: "email",
    agent: "Billing agent",
    reason: "Their Team plan renews in 9 days and they have grown from 21 to 29 seats since March.",
    files: [
      {
        path: "drafts/northwind-renewal.eml",
        after:
          "To: Dana Okafor <dana.okafor@northwind.co>\nSubject: Your Relay renewal, with 20% off annual\n\nHi Dana,\n\nYour Team plan renews on 27 October. Your team has grown\nfrom 21 to 29 seats since March, so we’d like to offer the\nannual plan at 20% off: $5,568 a year instead of $6,960.\n\nReply to this email and I’ll switch it over before renewal.\n\nMaya, on behalf of Relay billing\n",
      },
    ],
    requestedAt: minutesAgo(6),
  },
  {
    id: "apr_6d1r",
    title: "Refund $1,240 to Halcyon Labs",
    tool: "issue_refund",
    kind: "payment",
    agent: "Support agent",
    reason: "Invoice INV-20931 was charged twice on 16 October. This refunds the duplicate charge only.",
    files: [
      {
        path: "refunds/halcyon-labs.json",
        after: '{\n  "customer": "cus_Q8f2Lk",\n  "invoice": "INV-20931",\n  "amount": 124000,\n  "currency": "usd",\n  "reason": "duplicate"\n}\n',
      },
    ],
    requestedAt: minutesAgo(3),
  },
];

/** A request that lands while the queue is open; its time is set when it arrives. */
export const incomingApproval: Omit<ApprovalRecord, "requestedAt"> = {
  id: "apr_2v7c",
  title: "Post the incident summary to #status",
  tool: "post_message",
  kind: "message",
  agent: "Support agent",
  reason: "The API latency incident is resolved. This closes it out for customers following #status.",
  files: [
    {
      path: "slack/status.md",
      after:
        "Resolved: API latency in us-east-1\nFrom 13:02 to 13:41 UTC some API requests took up to 8s.\nA cache node ran out of memory. It has been replaced and\nalerts now fire at 80% memory. No data was lost.\n",
    },
  ],
};

/** Decided earlier today, newest first: approved (once with edits), denied and expired. */
export const decidedApprovals: DecidedApproval[] = [
  { id: "apr_1x9p", title: "Turn on annual billing for Team", tool: "edit_file", kind: "code", agent: "Billing agent", outcome: "done", edited: true, requestedAt: minutesAgo(34), decidedAt: minutesAgo(29) },
  { id: "apr_8k3w", title: "Delete 1,204 stale trial accounts", tool: "delete_records", kind: "database", agent: "Data agent", outcome: "denied", requestedAt: minutesAgo(52), decidedAt: minutesAgo(47) },
  { id: "apr_5n6b", title: "Send the September usage report to Orbit", tool: "send_email", kind: "email", agent: "Billing agent", outcome: "expired", requestedAt: hoursAgo(3), decidedAt: hoursAgo(2) },
  { id: "apr_4j2m", title: "Deploy relay-api 2.14.0 to production", tool: "deploy", kind: "tool", agent: "Infra agent", outcome: "done", requestedAt: hoursAgo(4), decidedAt: hoursAgo(4) },
];
