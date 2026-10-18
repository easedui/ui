"use client";

import { useState } from "react";
import { Button } from "../button/button";
import { DemoFrame } from "../lib/demo-frame";
import { rowGridRow } from "../lib/layout";
import { Badge } from "./badge";

type Folder = { id: string; name: string; count: number; icon: string };

const START: Folder[] = [
  { id: "inbox", name: "Inbox", count: 12, icon: "M3 9.5h3.5l1 2h3l1-2H15M3 9.5V13a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V9.5M3 9.5 5 4h8l2 5.5" },
  { id: "mentions", name: "Mentions", count: 3, icon: "M11.5 9a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Zm0 0v1a1.75 1.75 0 0 0 3.5 0V9a6 6 0 1 0-2.4 4.8" },
  { id: "review", name: "Needs review", count: 98, icon: "M4 9.5 7.5 13 14 5" },
  { id: "drafts", name: "Drafts", count: 0, icon: "M11.5 4.5l2 2L7 13H5v-2l6.5-6.5Z" },
];

export function BadgeDemo() {
  const [folders, setFolders] = useState(START);
  const [selected, setSelected] = useState("inbox");

  // Opening a folder reads it, and its badge leaves.
  const open = (id: string) => {
    setSelected(id);
    setFolders((f) => f.map((x) => (x.id === id ? { ...x, count: 0 } : x)));
  };
  // New mail lands in the folders you're not looking at; "Needs review" crosses 99 → 99+.
  const deliver = () =>
    setFolders((f) =>
      f.map((x) =>
        x.id === selected || x.id === "drafts" ? x : { ...x, count: x.count + 1 + Math.floor(Math.random() * 3) },
      ),
    );

  return (
    <DemoFrame
      title="Mail"
      actions={
        <Button size="sm" onClick={deliver}>
          Receive mail
        </Button>
      }
    >
      <nav aria-label="Folders" className="p-1.5 pb-2.5">
        <ul>
          {folders.map((f) => (
            <li key={f.id}>
              <button
                type="button"
                onClick={() => open(f.id)}
                aria-current={selected === f.id ? "page" : undefined}
                className={`flex h-9 w-full cursor-pointer items-center gap-2.5 rounded-control px-2.5 text-left text-ui-sm transition-[color,background-color,border-color,box-shadow] duration-150 ease-standard focus-ring ${
                  selected === f.id ? "bg-surface-hover text-text" : "text-text-secondary hover-fine:bg-surface-hover hover-fine:text-text"
                }`}
              >
                <svg viewBox="0 0 18 18" aria-hidden className="size-4 shrink-0 fill-none stroke-current" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                  <path d={f.icon} />
                </svg>
                <span className="min-w-0 flex-1 truncate">{f.name}</span>
                <Badge count={f.count} tone={f.id === "mentions" ? "brand" : "neutral"} aria-label={`${f.count} unread`} />
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="mx-4 border-t border-line-subtle" />

      <section aria-labelledby="badge-demo-status" className="flex flex-col gap-3 p-4">
        <h3 id="badge-demo-status" className="text-ui-xs font-medium tracking-caps text-text-muted uppercase">
          Services
        </h3>
        {/* The badge track is as wide as the widest badge, so every badge starts on one x. */}
        <ul className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 text-ui-sm">
          <Service name="API" badge={<Badge tone="success" dot="live">Operational</Badge>} />
          <Service name="Webhooks" badge={<Badge tone="warning" dot>Degraded</Badge>} />
          <Service name="Search" badge={<Badge tone="info">Beta</Badge>} />
          <Service name="Exports" badge={<Badge tone="neutral" count={4}>Queued</Badge>} />
        </ul>
      </section>
    </DemoFrame>
  );
}

function Service({ name, badge }: { name: string; badge: React.ReactNode }) {
  return (
    <li className={`${rowGridRow} h-9`}>
      <span className="truncate text-text-secondary">{name}</span>
      <span className="flex">{badge}</span>
    </li>
  );
}
