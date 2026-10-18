"use client";

/**
 * table-core (P14): the shared layer under every Eased table. TanStack Table owns rows,
 * columns and sort state; this file owns what TanStack leaves to you: the feature set and
 * typed column meta (the adapters), hairline rules, density, the header sort button, and two
 * motion hooks, `useRowFlip` (rows glide to a new order) and `useSelectionStagger` (a range
 * selection lights up row by row).
 */

import {
  createColumnHelper,
  createSortedRowModel,
  metaHelper,
  rowSortingFeature,
  sortFn_alphanumeric,
  sortFn_basic,
  sortFn_datetime,
  sortFn_text,
  tableFeatures,
  type Column,
  type ColumnDef,
  type ReactTable,
  type RowData,
} from "@tanstack/react-table";
import { animate, motion, motionValue, type MotionValue } from "motion/react";
import {
  createContext,
  useContext,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type RefObject,
} from "react";
import { useScrollFades } from "../../lib/dom";
import { enter, smooth, stagger, useSafeReducedMotion } from "../../lib/motion";

/* ---------- TanStack adapters ----------------------------------------------------------- */

/** Per-column presentation, read by every Eased table. */
export type EasedColumnMeta = {
  /** `end` right-aligns the header and cells and sets tabular numbers. Use it for every numeric column. Default `start`. */
  align?: "start" | "end";
  /** The one emphasised cell per row (usually the name): full-strength text at weight 500. The rest read secondary. */
  emphasis?: boolean;
  /**
   * This column takes the space left over and truncates its content when the table is narrow,
   * instead of pushing the table into a horizontal scroll. Give it to one text column (the name).
   */
  grow?: boolean;
  /** A width hint for the column, e.g. `"7rem"` or `"40%"`. */
  width?: string;
  /** Classes for the column's header and cells, e.g. `"@max-md:hidden"` to drop a column in a narrow container. */
  className?: string;
};

/**
 * The feature set every Eased table is built with: sorting (with the four common comparators
 * registered) and typed column meta. One set for all tables, so one column helper serves
 * Table and Sortable Table; Table simply switches sorting off.
 */
export const easedFeatures = tableFeatures({
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
  sortFns: { alphanumeric: sortFn_alphanumeric, text: sortFn_text, datetime: sortFn_datetime, basic: sortFn_basic },
  columnMeta: metaHelper<EasedColumnMeta>(),
});
export type EasedFeatures = typeof easedFeatures;

/** A column definition for an Eased table. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- columns hold mixed value types, as in TanStack's own `columns` option
export type EasedColumnDef<TData extends RowData> = ColumnDef<EasedFeatures, TData, any>;
export type EasedTable<TData extends RowData> = ReactTable<EasedFeatures, TData>;

/** `const col = easedColumns<Invoice>()` then `col.columns([col.accessor("amount", { meta: { align: "end" } })])`. */
export function easedColumns<TData extends RowData>() {
  return createColumnHelper<EasedFeatures, TData>();
}

/** The `aria-sort` value for a header: set only on the column that is sorted, as the APG recommends. */
export function ariaSortOf<TData extends RowData>(column: Column<EasedFeatures, TData>) {
  const dir = column.getCanSort() ? column.getIsSorted() : false;
  return dir === "asc" ? "ascending" : dir === "desc" ? "descending" : undefined;
}

/* ---------- Density and hairlines ------------------------------------------------------- */

/** `dense`: 36px rows, 13px text (data-heavy views). `comfortable`: 48px rows, 14px text. Rule 92: one per block. */
export type TableDensity = "dense" | "comfortable";

export const DENSITY = {
  dense: { head: "h-8", row: "h-9", text: "text-ui-sm", headText: "text-ui-xs" },
  comfortable: { head: "h-10", row: "h-12", text: "text-ui", headText: "text-ui-sm" },
} as const;

const DensityContext = createContext<TableDensity>("dense");
/** The density of the table a cell renders in, so cells (avatars, meters) size themselves. */
export const useTableDensity = () => useContext(DensityContext);

/**
 * Hairlines (rule 19): half-pixel inset rings drawn as box-shadow, so they never change a
 * row's box. A bottom rule for rows and the header; they move with a row's transform.
 */
export const hairline = {
  row: "shadow-[inset_0_-0.5px_0_0_var(--eased-line)]",
  head: "shadow-[inset_0_-0.5px_0_0_var(--eased-line-strong)]",
} as const;

/**
 * Horizontal cell padding. Inner cells get 12px; the first and last get `--table-inset`
 * (the parent's `--pad`, 16px in a DemoFrame) so the first column sits on the same line as
 * the panel's title and the last column's right edge on the panel's right line (rule 101).
 */
export function cellPad(index: number, count: number) {
  const left = index === 0 ? "pl-(--table-inset)" : "pl-3";
  const right = index === count - 1 ? "pr-(--table-inset)" : "pr-3";
  return `${left} ${right}`;
}

/* ---------- The renderer --------------------------------------------------------------- */

export type TableViewProps<TData extends RowData> = {
  table: EasedTable<TData>;
  /** The table's accessible name, rendered as a visually hidden `<caption>`. */
  label: string;
  density?: TableDensity;
  /** Keep the header pinned while the body scrolls. Give the table a bounded height (e.g. `flex-1 min-h-0`). Default true. */
  stickyHeader?: boolean;
  /** Animate rows to a new order (FLIP). Default false; Sortable Table turns it on. */
  flip?: boolean;
  /** No FLIP above this many rendered rows. Default 60. */
  flipMaxRows?: number;
  /** Shown in place of rows when there are none. */
  empty?: ReactNode;
  className?: string;
  style?: CSSProperties;
};

// Feathers on the trailing edges only: a top feather would fade the sticky header.
const MASK: CSSProperties = {
  maskImage:
    "linear-gradient(to bottom, #000 calc(100% - var(--fade-bottom, 0px)), transparent), linear-gradient(to right, transparent, #000 var(--fade-start, 0px), #000 calc(100% - var(--fade-end, 0px)), transparent)",
  maskComposite: "intersect",
  WebkitMaskComposite: "source-in",
};

/**
 * Renders a TanStack table as Eased markup: a semantic `<table>` in a scroller that feathers
 * the edges with more content, a hairline header with sort buttons, and hairline rows.
 */
export function TableView<TData extends RowData>({
  table,
  label,
  density = "dense",
  stickyHeader = true,
  flip = false,
  flipMaxRows = 60,
  empty = "Nothing here yet",
  className = "",
  style,
}: TableViewProps<TData>) {
  const scroller = useRef<HTMLDivElement>(null);
  const body = useRef<HTMLTableSectionElement>(null);
  useScrollFades(scroller, "x");
  useScrollFades(scroller, "y");

  const d = DENSITY[density];
  const rows = table.getRowModel().rows;
  const count = table.getAllLeafColumns().length;
  const multi = (table.state.sorting?.length ?? 0) > 1;

  useRowFlip(
    body,
    rows.map((r) => r.id),
    { enabled: flip, maxRows: flipMaxRows },
  );

  return (
    <DensityContext.Provider value={density}>
      <div
        ref={scroller}
        style={{ ...MASK, ...style }}
        className={`relative min-w-0 overflow-auto overscroll-contain [--table-bg:var(--eased-surface)] [--table-inset:var(--pad,16px)] [scrollbar-width:thin] ${className}`}
      >
        <table className={`w-full border-separate border-spacing-0 text-left ${d.text}`}>
          <caption className="sr-only">{label}</caption>
          <thead>
            {table.getHeaderGroups().map((group) => (
              <tr key={group.id}>
                {group.headers.map((header, i) => {
                  const meta = header.column.columnDef.meta;
                  const end = meta?.align === "end";
                  const canSort = header.column.getCanSort();
                  return (
                    <th
                      key={header.id}
                      scope="col"
                      colSpan={header.colSpan}
                      aria-sort={ariaSortOf(header.column)}
                      style={meta?.width ? { width: meta.width } : undefined}
                      className={`${d.head} ${d.headText} p-0 align-middle font-medium whitespace-nowrap text-text-muted ${hairline.head} ${
                        stickyHeader ? "sticky top-0 z-10 bg-(--table-bg)" : ""
                      } ${end ? "text-right" : ""} ${meta?.grow ? "w-full max-w-0" : ""} ${meta?.className ?? ""}`}
                    >
                      {header.isPlaceholder ? null : canSort ? (
                        <SortButton
                          dir={header.column.getIsSorted()}
                          next={header.column.getNextSortingOrder() || header.column.getFirstSortDir()}
                          index={multi ? header.column.getSortIndex() : -1}
                          end={end}
                          className={cellPad(i, count)}
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          <table.FlexRender header={header} />
                        </SortButton>
                      ) : (
                        <div className={`flex h-full items-center ${end ? "justify-end" : ""} ${cellPad(i, count)}`}>
                          <table.FlexRender header={header} />
                        </div>
                      )}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody ref={body}>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={count} className="h-24 px-(--table-inset) text-center text-ui-sm text-text-muted">
                  {empty}
                </td>
              </tr>
            ) : (
              rows.map((row, r) => (
                <tr key={row.id} data-row-key={row.id} className={`group ${d.row} hover-fine:bg-surface-hover`}>
                  {row.getAllCells().map((cell, i) => {
                    const meta = cell.column.columnDef.meta;
                    return (
                      <td
                        key={cell.id}
                        className={`align-middle ${cellPad(i, count)} ${r < rows.length - 1 ? hairline.row : ""} ${
                          meta?.align === "end" ? "text-right tabular-nums" : ""
                        } ${meta?.emphasis ? "font-medium text-text" : "text-text-secondary"} ${meta?.grow ? "w-full max-w-0" : "whitespace-nowrap"} ${meta?.className ?? ""}`}
                      >
                        <table.FlexRender cell={cell} />
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </DensityContext.Provider>
  );
}

/* ---------- Sort button ----------------------------------------------------------------- */

export type SortButtonProps = {
  /** The column's current direction, or false. */
  dir: false | "asc" | "desc";
  /** The direction a click moves to, previewed by the hover arrow. */
  next: "asc" | "desc";
  /** Zero-based position in a multi-sort, shown as a small number; -1 hides it. */
  index?: number;
  /** Right-aligned column: the arrow leads, so the label's right edge stays on the numbers' edge. */
  end?: boolean;
  onClick?: (event: unknown) => void;
  className?: string;
  children: ReactNode;
};

/**
 * A full-cell header button. Unsorted, its arrow is hidden until the header is hovered or
 * focused, and then previews the order a click will apply; the active sort's arrow always
 * shows and rotates between up and down on the smooth spring. The arrow's slot is always
 * reserved, so headers never shift (rule 108).
 */
export function SortButton({ dir, next, index = -1, end = false, onClick, className = "", children }: SortButtonProps) {
  const reduced = useSafeReducedMotion();
  const shown = dir || next;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex h-full w-full cursor-pointer items-center gap-1 rounded-control-xs outline-2 -outline-offset-2 outline-transparent select-none transition-colors duration-150 ease-standard focus-visible:shadow-[inset_0_0_0_2px_var(--eased-ring)] hover-fine:text-text ${
        end ? "flex-row-reverse" : ""
      } ${dir ? "text-text" : ""} ${className}`}
    >
      <span className="min-w-0 truncate">{children}</span>
      <span aria-hidden className="inline-flex size-3.5 shrink-0 items-center justify-center">
        <motion.svg
          viewBox="0 0 14 14"
          initial={false}
          animate={{ rotate: shown === "desc" ? 180 : 0 }}
          transition={reduced ? { duration: 0 } : smooth}
          className={`size-3.5 fill-none stroke-current transition-opacity duration-150 ease-standard ${
            dir ? "opacity-100" : "opacity-0 group-hover-fine:opacity-60 group-focus-visible:opacity-60"
          }`}
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M7 11V3.5M3.75 6.5 7 3.25l3.25 3.25" />
        </motion.svg>
      </span>
      {/* After the arrow, on the side away from the label, so the label never moves. */}
      {index >= 0 && dir && <span className="-mx-0.5 text-ui-2xs leading-none tabular-nums"><span className="sr-only">, sort priority </span>{index + 1}</span>}
    </button>
  );
}

/* ---------- useRowFlip ------------------------------------------------------------------ */

export type RowFlipOptions = {
  /** Default true. */
  enabled?: boolean;
  /** Skip the animation when more rows than this are rendered. Default 60. */
  maxRows?: number;
};

type Track = { el: HTMLElement; y: MotionValue<number>; stop: () => void };

/**
 * FLIP for table rows. Give each row `data-row-key`; pass the container and the current key
 * order. When the order changes, every row that moved starts from where it was on screen and
 * springs to its new place (`smooth`, no overshoot); a row that was not there before fades in.
 * Interrupting mid-flight starts from the row's current visual position, so rapid re-sorts
 * never jump. Positions are `offsetTop`, which ignores transforms and scrolling. Reduced
 * motion and tables above `maxRows` reorder instantly.
 */
export function useRowFlip(ref: RefObject<HTMLElement | null>, order: readonly string[], options: RowFlipOptions = {}) {
  const { enabled = true, maxRows = 60 } = options;
  const reduced = useSafeReducedMotion();
  const tops = useRef(new Map<string, number>());
  const tracks = useRef(new Map<string, Track>());
  const key = order.join("\u0000");

  useLayoutEffect(() => {
    const root = ref.current;
    if (!root) return;
    const rows = root.querySelectorAll<HTMLElement>("[data-row-key]");
    const prev = tops.current;
    const next = new Map<string, number>();
    const run = enabled && !reduced && prev.size > 0 && rows.length <= maxRows;

    rows.forEach((el) => {
      const k = el.dataset.rowKey!;
      const top = el.offsetTop;
      next.set(k, top);
      if (!run) return;
      const was = prev.get(k);
      if (was === undefined) {
        animate(el, { opacity: [0, 1] }, enter);
        return;
      }
      let track = tracks.current.get(k);
      if (!track || track.el !== el) {
        track?.stop();
        const y = motionValue(0);
        const stop = y.on("change", (v) => {
          el.style.transform = Math.abs(v) < 0.01 ? "" : `translateY(${v}px)`;
        });
        track = { el, y, stop };
        tracks.current.set(k, track);
      }
      const delta = was + track.y.get() - top;
      if (Math.abs(delta) < 0.5) return;
      track.y.jump(delta);
      animate(track.y, 0, smooth);
    });
    tops.current = next;
  }, [ref, key, enabled, reduced, maxRows]);

  // Row heights change with density, fonts and width; keep the snapshot current.
  useLayoutEffect(() => {
    const root = ref.current;
    if (!root) return;
    const ro = new ResizeObserver(() => {
      const map = new Map<string, number>();
      root.querySelectorAll<HTMLElement>("[data-row-key]").forEach((el) => map.set(el.dataset.rowKey!, el.offsetTop));
      tops.current = map;
    });
    ro.observe(root);
    const all = tracks.current;
    return () => {
      ro.disconnect();
      all.forEach((t) => {
        t.y.stop();
        t.stop();
      });
      all.clear();
    };
  }, [ref]);
}

/* ---------- useSelectionStagger --------------------------------------------------------- */

export type SelectionStaggerOptions = {
  /** Seconds between rows. Default `stagger.char` (16ms). */
  step?: number;
  /** Cap on any row's delay, seconds (rule 83). Default 0.4. */
  max?: number;
  /** The row the range started from (the Shift-click anchor): rows light up outward from it. */
  anchor?: string;
};

/**
 * When several rows become selected at once (a Shift-click range, select-all), returns each
 * new row's delay so the highlight runs through the range one row at a time instead of
 * flashing at once. Pass the selection map (TanStack's `rowSelection`) and the rendered row
 * order; use the delay as a `transitionDelay` on the row's background. Single selections and
 * deselections are instant, as is everything under reduced motion.
 */
export function useSelectionStagger(
  selected: Readonly<Record<string, boolean>>,
  order: readonly string[],
  { step = stagger.char, max = 0.4, anchor }: SelectionStaggerOptions = {},
): (id: string) => number {
  const reduced = useSafeReducedMotion();
  const [prev, setPrev] = useState(selected);
  const [delays, setDelays] = useState<ReadonlyMap<string, number>>(() => new Map());

  // Adjusting state while rendering when the input changes (React's "previous props" pattern).
  if (prev !== selected) {
    setPrev(selected);
    const added = order.filter((id) => selected[id] && !prev[id]);
    const from = anchor ? Math.max(0, order.indexOf(anchor)) : 0;
    const dist = (id: string) => Math.abs(order.indexOf(id) - from);
    const map = new Map<string, number>();
    if (added.length > 1) added.sort((a, b) => dist(a) - dist(b)).forEach((id, i) => map.set(id, Math.min(i * step, max)));
    setDelays(map);
  }

  return (id) => (reduced ? 0 : (delays.get(id) ?? 0));
}
