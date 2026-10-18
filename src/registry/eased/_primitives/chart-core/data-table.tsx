import type { ReactNode } from "react";

export type ChartDataColumn<D> = {
  /** Column header, e.g. the series label. */
  label: string;
  /** The cell's text for a row. */
  value: (datum: D, index: number) => ReactNode;
};

export type ChartDataTableProps<D> = {
  /** What the table lists, e.g. "Revenue by day". */
  caption: string;
  data: readonly D[];
  /** The row header (usually the formatted date or category). */
  rowLabel: (datum: D, index: number) => ReactNode;
  /** Header of the row-label column. Default "Date". */
  rowLabelHeader?: string;
  columns: readonly ChartDataColumn<D>[];
};

/**
 * Every point of a chart as a real `<table>`, visually hidden. Screen reader users get the
 * whole dataset in table navigation, and anyone who cannot tell two hues apart has the
 * numbers. Pair it with an `aria-hidden` SVG.
 */
export function ChartDataTable<D>({ caption, data, rowLabel, rowLabelHeader = "Date", columns }: ChartDataTableProps<D>) {
  return (
    <table className="sr-only">
      <caption>{caption}</caption>
      <thead>
        <tr>
          <th scope="col">{rowLabelHeader}</th>
          {columns.map((c) => (
            <th key={c.label} scope="col">
              {c.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((d, i) => (
          <tr key={i}>
            <th scope="row">{rowLabel(d, i)}</th>
            {columns.map((c) => (
              <td key={c.label}>{c.value(d, i)}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
