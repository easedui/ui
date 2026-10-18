# Table

A premium hairline table on TanStack Table. You bring TanStack column definitions; it brings half-pixel row rules, a quiet sentence-case header, numbers right-aligned on one edge, one emphasised cell per row and two densities. Fill the cells with the Cells kit.

```tsx
import { easedColumns, Table } from "@/components/eased/table/table";
import { PersonCell, StatusCell } from "@/components/eased/cells/cells";

const col = easedColumns<Invoice>();
const columns = col.columns([
  col.accessor("customer", { header: "Customer", cell: (c) => <PersonCell name={c.getValue()} />, meta: { emphasis: true, grow: true } }),
  col.accessor("status", { header: "Status", cell: (c) => <StatusCell tone="success">{c.getValue()}</StatusCell> }),
  col.accessor("amount", { header: "Amount", meta: { align: "end" } }),
]);

<Table label="Invoices" data={invoices} columns={columns} getRowId={(r) => r.id} className="min-h-0 flex-1" />
```

## Props

| Prop | Type | Default | |
|---|---|---|---|
| `data` | `T[]` | | Keep it stable (state or memo). |
| `columns` | `EasedColumnDef<T>[]` | | From `easedColumns<T>()`, at module scope or memoised. |
| `getRowId` | `(row, index) => string` | index | |
| `label` | `string` | | Accessible name, as a hidden caption. |
| `density` | `"dense" \| "comfortable"` | `"dense"` | 36px or 48px rows. |
| `stickyHeader` | `boolean` | `true` | Give the table a bounded height for it to apply. |
| `empty` | `ReactNode` | `"Nothing here yet"` | |

Column `meta`: `align: "end"` for numbers, `emphasis` for the one strong cell, `grow` for the column that gives way when the table is narrow, `width`, and `className` (e.g. `@max-md:hidden`).

**Motion signature:** it stays still on purpose. Hover lights a row with no transition, so moving the pointer or keyboard down a column never leaves a trail, and density changes snap instead of animating height. The cells carry the motion.
