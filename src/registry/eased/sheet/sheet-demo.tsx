"use client";

import { useId, useState, type ReactNode } from "react";
import { Avatar } from "../avatar/avatar";
import { Badge } from "../badge/badge";
import { Button } from "../button/button";
import { Checkbox, CheckboxGroup } from "../checkbox/checkbox";
import { DemoFrame } from "../lib/demo-frame";
import { rowGrid, rowGridRow } from "../lib/layout";
import { Radio, RadioGroup } from "../radio-group/radio-group";
import { Segmented } from "../segmented/segmented";
import { Switch } from "../switch/switch";
import { ToggleGroup, ToggleGroupItem } from "../toggle-group/toggle-group";
import {
  Sheet,
  SheetBody,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./sheet";

type Status = "paid" | "pending" | "refunded";
type Range = "today" | "7d" | "30d" | "all";
type Sort = "newest" | "oldest" | "total";
type Line = { name: string; qty: number; price: number };
type Order = { id: number; customer: string; placed: Date; status: Status; fulfilled: boolean; country: string; lines: Line[] };

const NOW = Date.UTC(2026, 9, 18, 16);
const ago = (days: number, hour = 10) => new Date(NOW - days * 86_400_000 - (16 - hour) * 3_600_000);

const ORDERS: Order[] = [
  { id: 1048, customer: "Maya Chen", placed: ago(0, 14), status: "paid", fulfilled: false, country: "DE", lines: [{ name: "Linen overshirt", qty: 1, price: 148 }, { name: "Canvas tote", qty: 2, price: 34 }] },
  { id: 1047, customer: "Jonas Weber", placed: ago(0, 9), status: "pending", fulfilled: false, country: "DE", lines: [{ name: "Merino crew", qty: 1, price: 120 }] },
  { id: 1046, customer: "Amara Okafor", placed: ago(2), status: "paid", fulfilled: true, country: "GB", lines: [{ name: "Selvedge denim", qty: 1, price: 210 }, { name: "Wool socks", qty: 3, price: 18 }] },
  { id: 1045, customer: "Lucas Moreau", placed: ago(3), status: "refunded", fulfilled: true, country: "FR", lines: [{ name: "Field jacket", qty: 1, price: 295 }] },
  { id: 1044, customer: "Priya Natarajan", placed: ago(5), status: "paid", fulfilled: false, country: "US", lines: [{ name: "Oxford shirt", qty: 2, price: 98 }] },
  { id: 1043, customer: "Sofia Lindgren", placed: ago(8), status: "paid", fulfilled: true, country: "US", lines: [{ name: "Chore coat", qty: 1, price: 245 }, { name: "Canvas tote", qty: 1, price: 34 }] },
  { id: 1042, customer: "Mateo García", placed: ago(12), status: "pending", fulfilled: false, country: "CA", lines: [{ name: "Merino crew", qty: 2, price: 120 }] },
  { id: 1041, customer: "Hana Sato", placed: ago(19), status: "paid", fulfilled: true, country: "GB", lines: [{ name: "Linen trousers", qty: 1, price: 135 }] },
  { id: 1040, customer: "Ethan Brooks", placed: ago(26), status: "refunded", fulfilled: false, country: "US", lines: [{ name: "Wool socks", qty: 4, price: 18 }] },
  { id: 1039, customer: "Léa Dubois", placed: ago(41), status: "paid", fulfilled: true, country: "FR", lines: [{ name: "Field jacket", qty: 1, price: 295 }, { name: "Oxford shirt", qty: 1, price: 98 }] },
];

const COUNTRIES = [
  { code: "US", name: "United States" },
  { code: "GB", name: "United Kingdom" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
  { code: "CA", name: "Canada" },
];
const countryName = (code: string) => COUNTRIES.find((c) => c.code === code)?.name ?? code;

const STATUS_LABEL: Record<Status, string> = { paid: "Paid", pending: "Pending", refunded: "Refunded" };
const RANGE_DAYS: Record<Range, number> = { today: 1, "7d": 7, "30d": 30, all: Infinity };
const RANGES = [
  { value: "today", label: "Today" },
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "all", label: "All" },
] as const;

const dateFmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
const timeFmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "UTC" });
const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const SHIPPING = 12;
const totalOf = (o: Order) => o.lines.reduce((sum, l) => sum + l.qty * l.price, 0) + SHIPPING;

type Filters = { statuses: Status[]; range: Range; unfulfilled: boolean; sort: Sort; countries: string[] };
const NONE: Filters = { statuses: [], range: "all", unfulfilled: false, sort: "newest", countries: [] };

function apply(orders: Order[], f: Filters) {
  const list = orders.filter(
    (o) =>
      (f.statuses.length === 0 || f.statuses.includes(o.status)) &&
      NOW - o.placed.getTime() < RANGE_DAYS[f.range] * 86_400_000 &&
      (!f.unfulfilled || !o.fulfilled) &&
      (f.countries.length === 0 || f.countries.includes(o.country)),
  );
  const by = { newest: (a: Order, b: Order) => b.placed.getTime() - a.placed.getTime(), oldest: (a: Order, b: Order) => a.placed.getTime() - b.placed.getTime(), total: (a: Order, b: Order) => totalOf(b) - totalOf(a) };
  return list.sort(by[f.sort]);
}

export function SheetDemo() {
  const [orders, setOrders] = useState(ORDERS);
  const [filters, setFilters] = useState(NONE);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Order | null>(null);

  const shown = apply(orders, filters);
  const active =
    Number(filters.statuses.length > 0) + Number(filters.range !== "all") + Number(filters.unfulfilled) + Number(filters.countries.length > 0);
  const current = selected && orders.find((o) => o.id === selected.id);

  return (
    <DemoFrame
      title="Orders"
      meta={`${shown.length} of ${orders.length}`}
      actions={
        <Sheet>
          <SheetTrigger>
            <FilterIcon />
            Filters
            <Badge count={active} size="sm" aria-label={`${active} active`} />
          </SheetTrigger>
          <SheetContent>
            <FiltersPanel filters={filters} onChange={setFilters} results={shown.length} />
          </SheetContent>
        </Sheet>
      }
    >
      {shown.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-(--pad) text-center">
          <p className="text-ui text-text-secondary">No orders match these filters.</p>
          <Button size="sm" onClick={() => setFilters(NONE)}>
            Clear filters
          </Button>
        </div>
      ) : (
        <ul className={`${rowGrid} min-h-0 flex-1 content-start gap-x-3 overflow-y-auto overscroll-contain px-2 py-2 [--col:5.5rem]`} aria-label="Orders">
          {shown.map((o) => (
            <li key={o.id} className={rowGridRow}>
              <button
                type="button"
                onClick={() => {
                  setSelected(o);
                  setOpen(true);
                }}
                className={`${rowGridRow} h-12 cursor-pointer rounded-control-sm px-2 text-left transition-colors duration-150 ease-standard focus-ring hover-fine:bg-surface-hover active:bg-surface-active`}
              >
                <Avatar name={o.customer} size="sm" />
                <span className="flex min-w-0 flex-col">
                  <span className="truncate text-ui-sm text-text">{o.customer}</span>
                  <span className="truncate text-ui-xs text-text-muted tabular-nums">
                    #{o.id} · {dateFmt.format(o.placed)} · {STATUS_LABEL[o.status]}
                    {o.fulfilled ? "" : " · Unfulfilled"}
                  </span>
                </span>
                <span className="text-right text-ui-sm text-text tabular-nums">{money.format(totalOf(o))}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* One order sheet for every row: a bottom sheet at any width. */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="sm:max-w-xl">
          {current && (
            <OrderPanel
              order={current}
              onFulfil={() => setOrders((list) => list.map((o) => (o.id === current.id ? { ...o, fulfilled: true } : o)))}
            />
          )}
        </SheetContent>
      </Sheet>
    </DemoFrame>
  );
}

function FiltersPanel({ filters, onChange, results }: { filters: Filters; onChange: (f: Filters) => void; results: number }) {
  const id = useId();
  const set = (patch: Partial<Filters>) => onChange({ ...filters, ...patch });
  const shipTo =
    filters.countries.length === 0
      ? "All countries"
      : filters.countries.length <= 2
        ? filters.countries.map(countryName).join(", ")
        : `${countryName(filters.countries[0])} and ${filters.countries.length - 1} more`;

  return (
    <>
      <SheetHeader>
        <SheetTitle>Filters</SheetTitle>
        <SheetDescription>Narrow the orders list. Changes apply as you go.</SheetDescription>
      </SheetHeader>
      <SheetBody>
        <Section label="Payment" id={`${id}-status`}>
          <ToggleGroup
            multiple
            variant="chips"
            value={filters.statuses}
            onValueChange={(v) => set({ statuses: v as Status[] })}
            aria-labelledby={`${id}-status`}
            className="flex-wrap"
          >
            {(Object.keys(STATUS_LABEL) as Status[]).map((s) => (
              <ToggleGroupItem key={s} value={s}>
                {STATUS_LABEL[s]}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </Section>

        <Section label="Placed" id={`${id}-range`}>
          <Segmented options={RANGES} value={filters.range} onValueChange={(range) => set({ range })} fullWidth aria-labelledby={`${id}-range`} />
        </Section>

        <Section label="Ship to" id={`${id}-ship`}>
          <Sheet>
            <SheetTrigger
              aria-describedby={`${id}-ship`}
              render={
                <button
                  type="button"
                  className="flex h-control-md w-full cursor-pointer items-center justify-between gap-3 rounded-control border border-line px-3 text-left text-ui transition-colors duration-150 ease-standard focus-ring hover-fine:bg-surface-hover"
                />
              }
            >
              <span className="truncate text-text">{shipTo}</span>
              <ChevronIcon />
            </SheetTrigger>
            <SheetContent size="md">
              <CountriesPanel value={filters.countries} onChange={(countries) => set({ countries })} />
            </SheetContent>
          </Sheet>
        </Section>

        <Section label="Fulfilment" id={`${id}-fulfil`}>
          <Switch checked={filters.unfulfilled} onCheckedChange={(unfulfilled) => set({ unfulfilled })} description="Hide orders that have shipped.">
            Unfulfilled only
          </Switch>
        </Section>

        <Section label="Sort by" id={`${id}-sort`}>
          <RadioGroup value={filters.sort} onValueChange={(sort) => set({ sort })} aria-labelledby={`${id}-sort`} className="gap-0">
            <Radio value="newest">Newest first</Radio>
            <Radio value="oldest">Oldest first</Radio>
            <Radio value="total">Highest total</Radio>
          </RadioGroup>
        </Section>
      </SheetBody>
      <SheetFooter>
        <Button variant="ghost" size="sm" edge="start" className="me-auto" onClick={() => onChange(NONE)}>
          Clear all
        </Button>
        <SheetClose render={<Button variant="primary" size="sm" />}>{results === 1 ? "Show 1 order" : `Show ${results} orders`}</SheetClose>
      </SheetFooter>
    </>
  );
}

function CountriesPanel({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  return (
    <>
      <SheetHeader>
        <SheetTitle>Ship to</SheetTitle>
        <SheetDescription>Only show orders going to these countries.</SheetDescription>
      </SheetHeader>
      <SheetBody>
        <CheckboxGroup value={value} onValueChange={onChange} allValues={COUNTRIES.map((c) => c.code)} aria-label="Countries">
          {COUNTRIES.map((c) => (
            <Checkbox key={c.code} value={c.code}>
              {c.name}
            </Checkbox>
          ))}
        </CheckboxGroup>
      </SheetBody>
      <SheetFooter>
        <Button variant="ghost" size="sm" edge="start" className="me-auto" disabled={value.length === 0} onClick={() => onChange([])}>
          Any country
        </Button>
        <SheetClose render={<Button variant="primary" size="sm" />}>Done</SheetClose>
      </SheetFooter>
    </>
  );
}

function OrderPanel({ order, onFulfil }: { order: Order; onFulfil: () => void }) {
  const subtotal = order.lines.reduce((sum, l) => sum + l.qty * l.price, 0);
  return (
    <>
      <SheetHeader>
        <SheetTitle>Order #{order.id}</SheetTitle>
        <SheetDescription>
          {order.customer} · {timeFmt.format(order.placed)} · {countryName(order.country)}
        </SheetDescription>
      </SheetHeader>
      <SheetBody className="gap-4">
        <div className="flex items-center gap-1.5">
          <Badge tone={order.status === "paid" ? "success" : order.status === "pending" ? "warning" : "neutral"}>{STATUS_LABEL[order.status]}</Badge>
          <Badge tone={order.fulfilled ? "neutral" : "info"}>{order.fulfilled ? "Fulfilled" : "Unfulfilled"}</Badge>
        </div>
        <dl className={`${rowGrid} gap-x-3 gap-y-2 text-ui-sm [--col:5.5rem]`}>
          {order.lines.map((l) => (
            <div key={l.name} className={rowGridRow}>
              <dt className="w-6 text-text-muted tabular-nums">{l.qty}×</dt>
              <dd className="truncate text-text">{l.name}</dd>
              <dd className="text-right text-text tabular-nums">{money.format(l.qty * l.price)}</dd>
            </div>
          ))}
          <div className={`${rowGridRow} mt-2 border-t border-line-subtle pt-3`}>
            <dt className="col-span-2 text-text-secondary">Subtotal</dt>
            <dd className="text-right text-text-secondary tabular-nums">{money.format(subtotal)}</dd>
          </div>
          <div className={rowGridRow}>
            <dt className="col-span-2 text-text-secondary">Shipping</dt>
            <dd className="text-right text-text-secondary tabular-nums">{money.format(SHIPPING)}</dd>
          </div>
          <div className={rowGridRow}>
            <dt className="col-span-2 font-medium text-text">Total</dt>
            <dd className="text-right font-medium text-text tabular-nums">{money.format(subtotal + SHIPPING)}</dd>
          </div>
        </dl>
      </SheetBody>
      <SheetFooter>
        <Button variant="ghost" size="sm" edge="start" className="me-auto">
          <PrinterIcon />
          Print label
        </Button>
        {order.fulfilled ? (
          <SheetClose render={<Button size="sm" />}>Done</SheetClose>
        ) : (
          <SheetClose render={<Button variant="primary" size="sm" onClick={onFulfil} />}>Mark as fulfilled</SheetClose>
        )}
      </SheetFooter>
    </>
  );
}

function Section({ label, id, children }: { label: string; id: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <p id={id} className="text-ui-sm font-medium text-text">
        {label}
      </p>
      {children}
    </section>
  );
}

function FilterIcon() {
  return (
    <svg viewBox="0 0 16 16" className="size-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" aria-hidden>
      <path d="M2.5 4.5h11M4.5 8h7M6.5 11.5h3" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg viewBox="0 0 16 16" className="size-4 shrink-0 text-text-muted rtl:-scale-x-100" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="m6.5 4 4 4-4 4" />
    </svg>
  );
}

function PrinterIcon() {
  return (
    <svg viewBox="0 0 16 16" className="size-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M4.5 6V2.5h7V6M4.5 11.5h-1A1.5 1.5 0 0 1 2 10V7.5A1.5 1.5 0 0 1 3.5 6h9A1.5 1.5 0 0 1 14 7.5V10a1.5 1.5 0 0 1-1.5 1.5h-1M4.5 9.5h7v4h-7z" />
    </svg>
  );
}
