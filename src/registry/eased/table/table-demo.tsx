"use client";

import { useState } from "react";
import { IdCell, PersonCell, RelativeTimeCell, StatusCell } from "../cells/cells";
import { DemoFrame } from "../lib/demo-frame";
import { Segmented } from "../segmented/segmented";
import { easedColumns, Table, type TableDensity } from "./table";

type Invoice = {
  id: string;
  customer: string;
  status: "Paid" | "Due" | "Overdue" | "Draft";
  amount: number;
  issued: number;
};

// Fixed instant so server and client render the same relative times.
const NOW = Date.UTC(2026, 9, 18, 12);
const H = 3_600_000;

const INVOICES: Invoice[] = [
  { id: "INV-2041", customer: "Maya Okafor", status: "Paid", amount: 4280, issued: NOW - 2 * H },
  { id: "INV-2040", customer: "Jonas Weber", status: "Due", amount: 1150.5, issued: NOW - 9 * H },
  { id: "INV-2039", customer: "Priya Raman", status: "Overdue", amount: 12_600, issued: NOW - 26 * H },
  { id: "INV-2038", customer: "Leo Martín", status: "Paid", amount: 860, issued: NOW - 50 * H },
  { id: "INV-2037", customer: "Amara Diallo", status: "Draft", amount: 2340, issued: NOW - 74 * H },
  { id: "INV-2036", customer: "Hana Sato", status: "Paid", amount: 18_920, issued: NOW - 98 * H },
  { id: "INV-2035", customer: "Tomás Herrera", status: "Due", amount: 640.25, issued: NOW - 6 * 24 * H },
  { id: "INV-2034", customer: "Ingrid Larsen", status: "Paid", amount: 3075, issued: NOW - 8 * 24 * H },
  { id: "INV-2033", customer: "Kwame Mensah", status: "Overdue", amount: 5400, issued: NOW - 12 * 24 * H },
  { id: "INV-2032", customer: "Sofia Rossi", status: "Paid", amount: 990, issued: NOW - 15 * 24 * H },
  { id: "INV-2031", customer: "Ethan Brooks", status: "Paid", amount: 7210, issued: NOW - 21 * 24 * H },
];

const TONE = { Paid: "success", Due: "info", Overdue: "warning", Draft: "neutral" } as const;
const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 });

const col = easedColumns<Invoice>();
const columns = col.columns([
  col.accessor("id", {
    header: "Invoice",
    cell: (c) => <IdCell id={c.getValue()} copyable />,
    meta: { className: "@max-[36rem]:hidden" },
  }),
  col.accessor("customer", { header: "Customer", cell: (c) => <PersonCell name={c.getValue()} />, meta: { emphasis: true, grow: true } }),
  col.accessor("status", { header: "Status", cell: (c) => <StatusCell tone={TONE[c.getValue()]}>{c.getValue()}</StatusCell> }),
  col.accessor("amount", { header: "Amount", cell: (c) => money.format(c.getValue()), meta: { align: "end" } }),
  col.accessor("issued", {
    header: "Issued",
    cell: (c) => <RelativeTimeCell date={c.getValue()} now={NOW} />,
    meta: { align: "end", className: "@max-[26rem]:hidden" },
  }),
]);

const Rows = ({ gap }: { gap: number }) => (
  <svg viewBox="0 0 16 16" aria-hidden className="size-4 fill-none stroke-current" strokeWidth={1.5} strokeLinecap="round">
    {[0, 1, 2, 3].slice(0, gap === 3 ? 4 : 3).map((i) => (
      <path key={i} d={`M3 ${(gap === 3 ? 3.5 : 4) + i * (gap === 3 ? 3 : 4)}h10`} />
    ))}
  </svg>
);

export function TableDemo() {
  const [density, setDensity] = useState<TableDensity>("dense");
  return (
    <DemoFrame
      title="Invoices"
      actions={
        <Segmented
          aria-label="Row density"
          value={density}
          onValueChange={setDensity}
          options={[
            { value: "dense", icon: <Rows gap={3} />, "aria-label": "Dense rows" },
            { value: "comfortable", icon: <Rows gap={4} />, "aria-label": "Comfortable rows" },
          ]}
        />
      }
    >
      <Table label="Invoices" data={INVOICES} columns={columns} getRowId={(r) => r.id} density={density} className="min-h-0 flex-1" />
    </DemoFrame>
  );
}
