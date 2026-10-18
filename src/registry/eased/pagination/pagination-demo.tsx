"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { NumberRoll } from "../_primitives/number-roll/number-roll";
import { DemoFrame } from "../lib/demo-frame";
import { exitFast, instant, smooth, useSafeReducedMotion } from "../lib/motion";
import { Pagination } from "./pagination";

const PER_PAGE = 6;
const CUSTOMERS = ["Northwind Labs", "Halcyon Health", "Bramble & Co.", "Orbit Freight", "Juniper Legal", "Kestrel Studio", "Mosaic Foods", "Tidewater Bank", "Lumen Robotics", "Fieldnote Press", "Arbor Dental", "Quarry Supply"];
const STATUS = ["Paid", "Paid", "Due", "Paid", "Overdue", "Paid", "Due"] as const;

// 66 invoices, newest first, with amounts that look like real ones.
const INVOICES = Array.from({ length: 66 }, (_, i) => {
  const n = 2_418 - i;
  const date = new Date(Date.UTC(2026, 9, 17 - Math.floor(i * 1.6)));
  return {
    id: `INV-${n}`,
    customer: CUSTOMERS[(i * 5 + Math.floor(i / 6)) % CUSTOMERS.length],
    amount: 180 + ((i * 7_919) % 9_400) + ((i * 37) % 100) / 100,
    status: STATUS[(i * 3) % STATUS.length],
    date,
  };
});

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const day = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
const TONE = { Paid: "text-text-muted", Due: "text-text-secondary", Overdue: "text-warning-text" } as const;

export function PaginationDemo() {
  const reduced = useSafeReducedMotion();
  const [page, setPage] = useState(1);
  const [dir, setDir] = useState(1);
  const pages = Math.ceil(INVOICES.length / PER_PAGE);
  const rows = INVOICES.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const first = (page - 1) * PER_PAGE + 1;
  const last = Math.min(page * PER_PAGE, INVOICES.length);

  const go = (next: number) => {
    setDir(next > page ? 1 : -1);
    setPage(next);
  };

  return (
    <DemoFrame
      title="Invoices"
      meta={
        <span className="inline-flex items-baseline">
          <NumberRoll value={first} aria-hidden />–<NumberRoll value={last} aria-hidden />
          <span>&nbsp;of {INVOICES.length}</span>
          <span className="sr-only">{`Invoices ${first} to ${last} of ${INVOICES.length}`}</span>
        </span>
      }
    >
      <div className="relative min-h-0 flex-1 overflow-hidden">
        <AnimatePresence initial={false} mode="popLayout">
          <motion.ul
            key={page}
            className="grid grid-cols-[auto_1fr_auto] content-start px-(--pad) py-1"
            initial={reduced ? { opacity: 0 } : { opacity: 0, x: dir * 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={reduced ? { opacity: 0, transition: instant } : { opacity: 0, x: dir * -8, transition: exitFast }}
            transition={reduced ? instant : { ...smooth, opacity: { duration: 0.15 } }}
          >
            {rows.map((row) => (
              <li key={row.id} className="col-span-3 grid h-12 grid-cols-subgrid items-center gap-x-4 border-b border-line-subtle last:border-b-0">
                <span className="font-mono text-ui-sm text-text-muted tabular-nums slashed-zero">{row.id}</span>
                <span className="min-w-0">
                  <span className="block truncate text-ui font-medium text-text">{row.customer}</span>
                  <span className="block truncate text-ui-sm text-text-muted">
                    {day.format(row.date)} · <span className={TONE[row.status]}>{row.status}</span>
                  </span>
                </span>
                <span className="text-end text-ui text-text tabular-nums">{money.format(row.amount)}</span>
              </li>
            ))}
          </motion.ul>
        </AnimatePresence>
      </div>
      <div className="flex h-14 shrink-0 items-center justify-center border-t border-line-subtle px-(--pad)">
        {/* Numbered where there is room, compact in a narrow tile. */}
        <Pagination size="sm" count={pages} page={page} onPageChange={go} aria-label="Invoice pages" className="@max-sm:hidden!" />
        <Pagination size="sm" variant="compact" count={pages} page={page} onPageChange={go} aria-label="Invoice pages" className="hidden! -mx-2 flex-1 @max-sm:flex!" />
      </div>
    </DemoFrame>
  );
}
