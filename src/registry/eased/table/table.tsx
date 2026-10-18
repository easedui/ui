"use client";

import { useTable, type RowData } from "@tanstack/react-table";
import type { CSSProperties, ReactNode } from "react";
import { easedFeatures, TableView, type EasedColumnDef, type TableDensity } from "../_primitives/table-core/table-core";

export { easedColumns, type EasedColumnDef, type EasedColumnMeta, type TableDensity } from "../_primitives/table-core/table-core";

export type TableProps<TData extends RowData> = {
  /** Rows. Keep the array stable (state or a memo): a new array every render rebuilds the row model. */
  data: ReadonlyArray<TData>;
  /** TanStack column definitions, made with `easedColumns<TData>()`. Keep them at module scope or memoised. */
  columns: ReadonlyArray<EasedColumnDef<TData>>;
  /** A stable id per row. Defaults to the row index. */
  getRowId?: (row: TData, index: number) => string;
  /** The table's accessible name (a visually hidden caption). */
  label: string;
  /** `dense` (36px rows, default) or `comfortable` (48px rows). */
  density?: TableDensity;
  /** Pin the header while the body scrolls. Default true; bound the table's height for it to apply. */
  stickyHeader?: boolean;
  /** Shown when `data` is empty. */
  empty?: ReactNode;
  className?: string;
  style?: CSSProperties;
};

/**
 * A premium hairline table on TanStack Table: half-pixel row rules, a sentence-case muted
 * header, tabular numbers right-aligned on one edge, one emphasised cell per row, and two
 * densities. Columns are plain TanStack column defs; cells can come from the Cells kit.
 */
export function Table<TData extends RowData>({
  data,
  columns,
  getRowId,
  label,
  density = "dense",
  stickyHeader = true,
  empty,
  className,
  style,
}: TableProps<TData>) {
  const table = useTable({ features: easedFeatures, data: data as TData[], columns, getRowId, enableSorting: false });
  return (
    <TableView
      table={table}
      label={label}
      density={density}
      stickyHeader={stickyHeader}
      empty={empty}
      className={className}
      style={style}
    />
  );
}
