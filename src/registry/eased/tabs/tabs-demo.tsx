"use client";

import { Avatar } from "../avatar/avatar";
import { DemoFrame } from "../lib/demo-frame";
import { rowGrid, rowGridRow } from "../lib/layout";
import { Tab, Tabs, TabsList, TabsPanel, TabsPanels } from "./tabs";

const STATS = [
  { label: "Deploys this week", value: "18", note: "4 more than last week" },
  { label: "Success rate", value: "97.2%", note: "1 failed on Tuesday" },
  { label: "Median build", value: "1m 42s", note: "12s slower" },
];

const ACTIVITY: { who: string; what: string; target: string; when: string; prose?: boolean }[] = [
  { who: "Maya Okafor", what: "deployed", target: "main@4f2a91c", when: "4m ago" },
  { who: "Jonas Berg", what: "opened", target: "Checkout copy tweaks", when: "38m ago", prose: true },
  { who: "Preview bot", what: "built", target: "feat/gift-cards", when: "1h ago" },
  { who: "Lena Park", what: "rolled back", target: "main@a19e03d", when: "Yesterday" },
  { who: "Maya Okafor", what: "added a domain", target: "shop.acme.co", when: "Mon" },
];

const MEMBERS = [
  { name: "Maya Okafor", email: "maya@acme.co", role: "Owner" },
  { name: "Jonas Berg", email: "jonas@acme.co", role: "Developer" },
  { name: "Lena Park", email: "lena@acme.co", role: "Developer" },
];

const SETTINGS = [
  ["Framework", "Next.js"],
  ["Root directory", "apps/web"],
  ["Node.js", "22.x"],
] as const;

export function TabsDemo() {
  return (
    <DemoFrame title="acme-storefront" meta="Production">
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-2 pb-4">
        <Tabs defaultValue="overview">
          <TabsList aria-label="Project">
            <Tab value="overview">Overview</Tab>
            <Tab value="activity">Activity</Tab>
            <Tab value="members">Members</Tab>
            <Tab value="settings">Settings</Tab>
          </TabsList>

          <TabsPanels className="mt-3">
            <TabsPanel value="overview">
              <dl className="flex flex-col">
                {STATS.map((s) => (
                  <div key={s.label} className="flex items-baseline justify-between gap-3 border-b border-line-subtle py-2.5 last:border-b-0">
                    <div className="min-w-0">
                      <dt className="text-ui-sm text-text-secondary">{s.label}</dt>
                      <p className="text-ui-xs text-text-muted">{s.note}</p>
                    </div>
                    <dd className="text-ui-lg font-medium text-text tabular-nums">{s.value}</dd>
                  </div>
                ))}
              </dl>
            </TabsPanel>

            <TabsPanel value="activity">
              <ol className="flex flex-col">
                {ACTIVITY.map((a, i) => (
                  <li key={i} className="flex h-11 min-w-0 items-center gap-3">
                    <Avatar name={a.who} size="sm" />
                    <p className="min-w-0 flex-1 truncate text-ui-sm text-text-secondary">
                      <span className="text-text">{a.who}</span> {a.what} <span className={a.prose ? "text-text" : "font-mono text-ui-xs text-text"}>{a.target}</span>
                    </p>
                    <span className="shrink-0 text-ui-xs text-text-muted tabular-nums">{a.when}</span>
                  </li>
                ))}
              </ol>
            </TabsPanel>

            <TabsPanel value="members">
              <ul className={`${rowGrid} gap-x-3`}>
                {MEMBERS.map((m) => (
                  <li key={m.email} className={`${rowGridRow} h-12`}>
                    <Avatar name={m.name} size="md" />
                    <div className="min-w-0">
                      <p className="truncate text-ui-sm text-text">{m.name}</p>
                      <p className="truncate text-ui-xs text-text-muted">{m.email}</p>
                    </div>
                    <span className="truncate text-ui-xs text-text-muted">{m.role}</span>
                  </li>
                ))}
              </ul>
            </TabsPanel>
            <TabsPanel value="settings">
              {/* A fixed key track, so every value starts on one x instead of hugging the right edge. */}
              <dl className="grid grid-cols-[8rem_minmax(0,1fr)] gap-x-3">
                {SETTINGS.map(([k, v]) => (
                  <div key={k} className={`${rowGridRow} h-10 border-b border-line-subtle last:border-b-0`}>
                    <dt className="text-ui-sm text-text-secondary">{k}</dt>
                    <dd className="truncate font-mono text-ui-xs text-text">{v}</dd>
                  </div>
                ))}
              </dl>
            </TabsPanel>
          </TabsPanels>
        </Tabs>
      </div>
    </DemoFrame>
  );
}
