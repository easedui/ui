"use client";

import { Avatar } from "../avatar/avatar";
import { DemoFrame } from "../lib/demo-frame";
import { Carousel } from "./carousel";

const STORIES = [
  {
    metric: "9 → 2 days",
    label: "to close the books each month",
    quote: "Reconciliation used to eat the first week of every month. Now the ledger is clean by the 2nd and finance spends that week on forecasting.",
    name: "Maya Okafor",
    role: "Controller, Fieldwork",
  },
  {
    metric: "€184k",
    label: "in duplicate payments caught in Q2",
    quote: "It flagged two invoices from the same supplier with different PO numbers on day one. That alone paid for the year.",
    name: "Jonas Weber",
    role: "Head of AP, Nordlicht",
  },
  {
    metric: "3.4×",
    label: "more invoices per person",
    quote: "We grew from 40 to 130 suppliers without hiring. Approvals happen in Slack and nobody chases signatures any more.",
    name: "Priya Raman",
    role: "Finance Ops Lead, Tidepool",
  },
  {
    metric: "41 min",
    label: "from receipt to approved expense",
    quote: "People snap a receipt and forget about it. Policy checks run before a manager ever sees it.",
    name: "Tomás Herrera",
    role: "CFO, Brightline Studio",
  },
  {
    metric: "0",
    label: "audit findings for the first time in four years",
    quote: "Every approval has a trail our auditors could follow without asking us a single question.",
    name: "Hana Sato",
    role: "VP Finance, Kumo Health",
  },
];

/** Customer stories: swipe, drag with a mouse, press the arrows or focus the track and use arrow keys. */
export function CarouselDemo() {
  return (
    <DemoFrame title="Customer stories" meta={`${STORIES.length} teams`}>
      <div className="flex min-h-0 flex-1 flex-col py-4 [--carousel-inset:16px]">
        <Carousel aria-label="Customer stories" slideSize="min(85%, 22rem)" className="min-h-0 flex-1" slideClassName="flex">
          {STORIES.map((s) => (
            <figure
              key={s.name}
              className="flex w-full flex-col rounded-control border border-line-subtle bg-surface-sunken p-4 select-none"
            >
              <p className="text-display-2xl font-semibold text-text tabular-nums">{s.metric}</p>
              <p className="mt-0.5 text-ui-sm text-text-muted">{s.label}</p>
              <blockquote className="mt-4 line-clamp-5 text-ui text-pretty text-text-secondary">“{s.quote}”</blockquote>
              <figcaption className="mt-auto flex items-center gap-2.5 pt-4">
                <Avatar name={s.name} size="md" />
                <span className="flex min-w-0 flex-col">
                  <span className="truncate text-ui-sm font-medium text-text">{s.name}</span>
                  <span className="truncate text-ui-xs text-text-muted">{s.role}</span>
                </span>
              </figcaption>
            </figure>
          ))}
        </Carousel>
      </div>
    </DemoFrame>
  );
}
