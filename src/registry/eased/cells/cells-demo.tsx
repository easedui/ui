"use client";

import { useState } from "react";
import { Button } from "../button/button";
import { DemoFrame } from "../lib/demo-frame";
import { easedColumns, Table } from "../table/table";
import { DeltaCell, PersonCell, ProgressCell, RelativeTimeCell, StatusCell } from "./cells";

type Account = {
  id: string;
  name: string;
  mrr: number;
  delta: number;
  onboarding: number;
  state: "Active" | "Trial" | "Paused";
  seen: number;
};

const NOW = Date.UTC(2026, 9, 18, 12);
const M = 60_000;

const START: Account[] = [
  { id: "a1", name: "Northwind", mrr: 12_480, delta: 0.124, onboarding: 100, state: "Active", seen: NOW - 4 * M },
  { id: "a2", name: "Lumen Labs", mrr: 8_920, delta: -0.038, onboarding: 82, state: "Active", seen: NOW - 52 * M },
  { id: "a3", name: "Fieldnote", mrr: 4_310, delta: 0.061, onboarding: 64, state: "Trial", seen: NOW - 3 * 60 * M },
  { id: "a4", name: "Ostrava Co.", mrr: 3_750, delta: 0, onboarding: 45, state: "Active", seen: NOW - 26 * 60 * M },
  { id: "a5", name: "Pine & Pixel", mrr: 2_180, delta: -0.117, onboarding: 30, state: "Paused", seen: NOW - 5 * 24 * 60 * M },
  { id: "a6", name: "Halcyon", mrr: 1_640, delta: 0.219, onboarding: 18, state: "Trial", seen: NOW - 9 * M },
  { id: "a7", name: "Brightwell", mrr: 1_205, delta: 0.042, onboarding: 72, state: "Active", seen: NOW - 7 * 60 * M },
  { id: "a8", name: "Marlow Studio", mrr: 980, delta: -0.021, onboarding: 55, state: "Active", seen: NOW - 2 * 24 * 60 * M },
  { id: "a9", name: "Quill", mrr: 640, delta: 0.087, onboarding: 9, state: "Trial", seen: NOW - 31 * M },
];

const TONE = { Active: "success", Trial: "info", Paused: "neutral" } as const;
const usd = { style: "currency", currency: "USD", maximumFractionDigits: 0 } as const;

const col = easedColumns<Account>();
const columns = col.columns([
  col.accessor("name", { header: "Account", cell: (c) => <PersonCell name={c.getValue()} />, meta: { emphasis: true, grow: true } }),
  col.accessor("mrr", {
    header: "MRR",
    cell: (c) => <DeltaCell value={c.getValue()} delta={c.row.original.delta} format={usd} locale="en-US" />,
    meta: { align: "end" },
  }),
  col.accessor("onboarding", {
    header: "Onboarding",
    cell: (c) => <ProgressCell value={c.getValue()} label={`${c.row.original.name} onboarding`} />,
    meta: { className: "@max-[24rem]:hidden" },
  }),
  col.accessor("state", {
    header: "Status",
    cell: (c) => (
      <StatusCell tone={TONE[c.getValue()]} live={c.getValue() === "Active"}>
        {c.getValue()}
      </StatusCell>
    ),
    meta: { className: "@max-[36rem]:hidden" },
  }),
  col.accessor("seen", {
    header: "Last seen",
    cell: (c) => <RelativeTimeCell date={c.getValue()} now={NOW} />,
    meta: { align: "end", className: "@max-[36rem]:hidden" },
  }),
]);

// A month passes: revenue drifts, onboarding moves forward.
const advance = (rows: Account[]) =>
  rows.map((r) => {
    const delta = Math.round((Math.random() * 0.3 - 0.12) * 1000) / 1000;
    return {
      ...r,
      mrr: Math.max(200, Math.round(r.mrr * (1 + delta))),
      delta,
      onboarding: Math.min(100, r.onboarding + Math.round(Math.random() * 25)),
    };
  });

export function CellsDemo() {
  const [rows, setRows] = useState(START);
  return (
    <DemoFrame
      title="Accounts"
      actions={
        <Button size="sm" onClick={() => setRows(advance)}>
          Next month
        </Button>
      }
    >
      <Table label="Accounts" data={rows} columns={columns} getRowId={(r) => r.id} className="min-h-0 flex-1" />
    </DemoFrame>
  );
}
