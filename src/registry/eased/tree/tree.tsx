"use client";

import { motion } from "motion/react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
  type RefObject,
} from "react";
import { AutoHeight } from "../_primitives/auto-height/auto-height";
import { Indicator, IndicatorGroup } from "../_primitives/indicator/indicator";
import { scrollFadeMask, useScrollEdges } from "../_primitives/scroll-fade/scroll-fade";

export type TreeNode = {
  /** Unique across the whole tree. */
  id: string;
  /** What the row shows. */
  label: ReactNode;
  /** Text for typeahead and announcements when `label` is not a string. */
  textValue?: string;
  /** A per-node icon; wins over `renderIcon`. */
  icon?: ReactNode;
  /** A folder when present, even if empty. */
  children?: TreeNode[];
  /** Muted trailing text, e.g. a size or "M" for modified. */
  meta?: ReactNode;
  disabled?: boolean;
};

export type TreeIconState = { folder: boolean; expanded: boolean; selected: boolean; depth: number };

export type TreeProps = {
  items: TreeNode[];
  /** Names the tree, e.g. "Files". */
  "aria-label"?: string;
  "aria-labelledby"?: string;
  /** Open folders (controlled). */
  expanded?: string[];
  /** Initially open folders (uncontrolled). */
  defaultExpanded?: string[];
  onExpandedChange?: (expanded: string[]) => void;
  /** The selected node (controlled); `null` for none. */
  selected?: string | null;
  /** Initially selected node (uncontrolled). */
  defaultSelected?: string | null;
  onSelectedChange?: (id: string, node: TreeNode) => void;
  /** Called when a leaf is activated by click, Enter or double-click. */
  onAction?: (id: string, node: TreeNode) => void;
  /**
   * The icon slot, for nodes without their own `icon`. Default: a folder that opens when
   * expanded and a document for leaves. Return `null` for no icon.
   */
  renderIcon?: (node: TreeNode, state: TreeIconState) => ReactNode;
  /** Classes for the root. Give it a max height and it scrolls, with 20px edge fades. */
  className?: string;
};

type Flat = { node: TreeNode; depth: number; parent: string | null; folder: boolean };

const TYPEAHEAD_MS = 500;

const textOf = (node: TreeNode) => (node.textValue ?? (typeof node.label === "string" ? node.label : node.id)).toLowerCase();
const isFolder = (node: TreeNode) => node.children !== undefined;

/** Every node visible with these folders open, in reading order. */
function visibleNodes(items: TreeNode[], open: Set<string>) {
  const out: Flat[] = [];
  const walk = (nodes: TreeNode[], depth: number, parent: string | null) => {
    for (const node of nodes) {
      const folder = isFolder(node);
      out.push({ node, depth, parent, folder });
      if (folder && open.has(node.id)) walk(node.children!, depth + 1, node.id);
    }
  };
  walk(items, 0, null);
  return out;
}

/**
 * A file tree on the WAI-ARIA tree pattern. Folders open on a height spring with no
 * overshoot while the chevron turns, both interruptible mid-flight; one selection highlight
 * glides between rows; indent guides sit on one line per level, under the parent's chevron,
 * and the guide of the focused branch darkens. Arrow keys, Home/End, `*` and typeahead.
 */
export function Tree({
  items,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  expanded: expandedProp,
  defaultExpanded = [],
  onExpandedChange,
  selected: selectedProp,
  defaultSelected = null,
  onSelectedChange,
  onAction,
  renderIcon = defaultIcon,
  className = "",
}: TreeProps) {
  const [innerExpanded, setInnerExpanded] = useState(defaultExpanded);
  const [innerSelected, setInnerSelected] = useState(defaultSelected);
  const expanded = expandedProp ?? innerExpanded;
  const selected = selectedProp !== undefined ? selectedProp : innerSelected;
  const open = useMemo(() => new Set(expanded), [expanded]);
  const visible = useMemo(() => visibleNodes(items, open), [items, open]);
  const [focused, setFocused] = useState<string | null>(null);
  const rowRefs = useRef(new Map<string, HTMLLIElement>());
  const typeahead = useRef({ text: "", at: 0 });
  const rootRef = useRef<HTMLUListElement>(null);
  useScrollEdges(rootRef, "y");

  // The roving tab stop: the focused node if it is still visible, else the selection, else the first.
  const tabStop =
    (focused && visible.some((v) => v.node.id === focused) && focused) ||
    (selected && visible.some((v) => v.node.id === selected) && selected) ||
    visible.find((v) => !v.node.disabled)?.node.id ||
    null;

  const setExpanded = useCallback(
    (next: string[]) => {
      if (expandedProp === undefined) setInnerExpanded(next);
      onExpandedChange?.(next);
    },
    [expandedProp, onExpandedChange],
  );

  const toggle = (id: string, to = !open.has(id)) => {
    if (to === open.has(id)) return;
    setExpanded(to ? [...expanded, id] : expanded.filter((e) => e !== id));
  };

  const select = (flat: Flat) => {
    if (flat.node.disabled) return;
    if (selectedProp === undefined) setInnerSelected(flat.node.id);
    if (flat.node.id !== selected) onSelectedChange?.(flat.node.id, flat.node);
  };

  const focusNode = (id: string) => {
    setFocused(id);
    const el = rowRefs.current.get(id);
    el?.focus({ preventScroll: true });
    el?.querySelector<HTMLElement>("[data-row]")?.scrollIntoView({ block: "nearest" });
  };

  const activate = (flat: Flat) => {
    select(flat);
    if (flat.folder) toggle(flat.node.id);
    else if (!flat.node.disabled) onAction?.(flat.node.id, flat.node);
  };

  const onKeyDown = (e: ReactKeyboardEvent<HTMLUListElement>) => {
    const target = (e.target as HTMLElement).closest<HTMLLIElement>("[role=treeitem]");
    const id = target?.dataset.id;
    const at = visible.findIndex((v) => v.node.id === id);
    if (at < 0) return;
    const cur = visible[at];
    const enabled = visible.filter((v) => !v.node.disabled);
    const step = (dir: 1 | -1) => {
      for (let i = at + dir; i >= 0 && i < visible.length; i += dir) if (!visible[i].node.disabled) return visible[i];
      return null;
    };
    let next: Flat | null | undefined = null;
    switch (e.key) {
      case "ArrowDown":
        next = step(1);
        break;
      case "ArrowUp":
        next = step(-1);
        break;
      case "Home":
        next = enabled[0];
        break;
      case "End":
        next = enabled[enabled.length - 1];
        break;
      case "ArrowRight":
        if (!cur.folder) break;
        if (!open.has(cur.node.id)) toggle(cur.node.id, true);
        else next = cur.node.children!.length ? visible[at + 1] : null;
        break;
      case "ArrowLeft":
        if (cur.folder && open.has(cur.node.id)) toggle(cur.node.id, false);
        else if (cur.parent) next = visible.find((v) => v.node.id === cur.parent);
        break;
      case "Enter":
        activate(cur);
        break;
      case " ":
        select(cur);
        break;
      case "*": {
        const siblings = visible.filter((v) => v.parent === cur.parent && v.folder && !open.has(v.node.id)).map((v) => v.node.id);
        if (siblings.length) setExpanded([...expanded, ...siblings]);
        break;
      }
      default: {
        if (e.key.length !== 1 || e.metaKey || e.ctrlKey || e.altKey) return;
        const now = performance.now();
        const t = typeahead.current;
        t.text = now - t.at > TYPEAHEAD_MS ? e.key.toLowerCase() : t.text + e.key.toLowerCase();
        t.at = now;
        // A repeated single letter cycles; otherwise the search starts at the current row.
        const cycling = t.text.length > 1 && [...t.text].every((c) => c === t.text[0]);
        const query = cycling ? t.text[0] : t.text;
        const from = cycling || t.text.length === 1 ? at + 1 : at;
        for (let k = 0; k < visible.length; k++) {
          const v = visible[(from + k) % visible.length];
          if (!v.node.disabled && textOf(v.node).startsWith(query)) {
            next = v;
            break;
          }
        }
        if (!next) return;
      }
    }
    e.preventDefault();
    if (next) focusNode(next.node.id);
  };

  // A folder closing over the focused row hands focus to the folder itself.
  useEffect(() => {
    if (!focused || visible.some((v) => v.node.id === focused)) return;
    const active = document.activeElement;
    if (!rootRef.current?.contains(active) && active !== document.body) return;
    let id: string | null = focused;
    const parentOf = new Map<string, string | null>();
    const walk = (nodes: TreeNode[], parent: string | null) => nodes.forEach((n) => (parentOf.set(n.id, parent), n.children && walk(n.children, n.id)));
    walk(items, null);
    while (id && !visible.some((v) => v.node.id === id)) id = parentOf.get(id) ?? null;
    // Its onFocus records it as the focused row.
    if (id) rowRefs.current.get(id)?.focus({ preventScroll: true });
  }, [visible, focused, items]);

  const ctx: RowContext = {
    open,
    selected,
    tabStop,
    focused,
    rowRefs,
    renderIcon,
    onRowClick: (flat) => {
      setFocused(flat.node.id);
      activate(flat);
    },
    onFocusRow: setFocused,
  };

  return (
    <IndicatorGroup>
      <motion.ul
        ref={rootRef}
        layoutScroll
        role="tree"
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        onKeyDown={onKeyDown}
        style={scrollFadeMask("y", 20)}
        className={`relative min-w-0 overflow-y-auto overscroll-contain text-ui select-none [--tree-indent:16px] ${className}`}
      >
        <Branch nodes={items} depth={0} parent={null} ctx={ctx} />
      </motion.ul>
    </IndicatorGroup>
  );
}

type RowContext = {
  open: Set<string>;
  selected: string | null;
  tabStop: string | null;
  focused: string | null;
  rowRefs: RefObject<Map<string, HTMLLIElement>>;
  renderIcon: NonNullable<TreeProps["renderIcon"]>;
  onRowClick: (flat: Flat) => void;
  onFocusRow: (id: string) => void;
};

function Branch({ nodes, depth, parent, ctx }: { nodes: TreeNode[]; depth: number; parent: string | null; ctx: RowContext }) {
  return nodes.map((node, i) => (
    <Item key={node.id} flat={{ node, depth, parent, folder: isFolder(node) }} pos={i + 1} size={nodes.length} ctx={ctx} />
  ));
}

function Item({ flat, pos, size, ctx }: { flat: Flat; pos: number; size: number; ctx: RowContext }) {
  const { node, depth, folder } = flat;
  const expanded = folder && ctx.open.has(node.id);
  const selected = ctx.selected === node.id;
  // Children mount on first open and stay, so closing animates and reopening is instant.
  const [mounted, setMounted] = useState(expanded);
  if (expanded && !mounted) setMounted(true);
  // The guide of the branch holding the focused row darkens, so you can see where you are.
  const holdsFocus = folder && expanded && ctx.focused !== null && contains(node, ctx.focused);
  const icon = node.icon !== undefined ? node.icon : ctx.renderIcon(node, { folder, expanded, selected, depth });

  return (
    <li
      ref={(el) => {
        if (el) ctx.rowRefs.current.set(node.id, el);
        else ctx.rowRefs.current.delete(node.id);
      }}
      role="treeitem"
      data-id={node.id}
      aria-level={depth + 1}
      aria-setsize={size}
      aria-posinset={pos}
      aria-expanded={folder ? expanded : undefined}
      aria-selected={selected}
      aria-disabled={node.disabled || undefined}
      tabIndex={ctx.tabStop === node.id ? 0 : -1}
      onFocus={(e) => {
        if (e.target === e.currentTarget) ctx.onFocusRow(node.id);
      }}
      className="outline-none"
    >
      <div
        data-row
        onClick={() => ctx.onRowClick(flat)}
        className={`relative flex h-8 min-w-0 items-center gap-1.5 rounded-control-sm pr-1.5 [transition:background-color_150ms_var(--eased-ease-standard),box-shadow_var(--eased-duration-focus)_var(--eased-ease-standard)] [li:focus-visible>&]:shadow-[inset_0_0_0_2px_var(--eased-ring)] ${
          node.disabled
            ? "cursor-not-allowed text-text-disabled"
            : `cursor-pointer ${selected ? "text-text" : "text-text-secondary hover-fine:bg-surface-hover hover-fine:text-text"}`
        }`}
        style={{ paddingLeft: `calc(var(--tree-indent) * ${depth} + 6px)` }}
      >
        {selected && <Indicator name="tree-selection" className="inset-0 rounded-control-sm bg-surface-active" />}
        <span className="relative flex size-4 shrink-0 items-center justify-center text-text-muted">{folder && <Chevron open={expanded} />}</span>
        {icon !== null && icon !== undefined && (
          <span className="relative flex size-4 shrink-0 items-center justify-center text-text-muted">{icon}</span>
        )}
        <span className="relative min-w-0 flex-1 truncate">{node.label}</span>
        {node.meta !== undefined && <span className="relative shrink-0 text-ui-xs text-text-muted tabular-nums">{node.meta}</span>}
      </div>
      {folder && (
        <AutoHeight open={expanded}>
          {mounted && (
            <ul role="group" className="relative">
              <span
                aria-hidden
                className={`pointer-events-none absolute inset-y-0 z-[1] w-px transition-colors duration-150 ease-standard ${
                  holdsFocus ? "bg-line-strong" : "bg-line-subtle"
                }`}
                // One anchor line per level: the centre of this folder's chevron.
                style={{ left: `calc(var(--tree-indent) * ${depth} + 6px + 7.5px)` }}
              />
              <Branch nodes={node.children!} depth={depth + 1} parent={node.id} ctx={ctx} />
            </ul>
          )}
        </AutoHeight>
      )}
    </li>
  );
}

function contains(node: TreeNode, id: string): boolean {
  return node.children?.some((c) => c.id === id || contains(c, id)) ?? false;
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={`size-3.5 [transition:rotate_var(--eased-duration-spring-smooth)_var(--eased-spring-smooth)] reduced:[transition:none] ${open ? "rotate-90" : ""}`}
    >
      <path d="m6.5 4 4 4-4 4" />
    </svg>
  );
}

/** The default icon slot: a folder that opens while expanded, and a page for leaves. */
function defaultIcon(_node: TreeNode, { folder, expanded }: TreeIconState): ReactNode {
  if (!folder) return <TreeFileIcon />;
  return expanded ? <TreeFolderOpenIcon /> : <TreeFolderIcon />;
}

const iconProps = {
  viewBox: "0 0 16 16",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
  className: "size-4",
} as const;

export function TreeFolderIcon() {
  return (
    <svg {...iconProps}>
      <path d="M2 4.5c0-.8.7-1.5 1.5-1.5h2.6l1.5 1.5h4.9c.8 0 1.5.7 1.5 1.5v5.5c0 .8-.7 1.5-1.5 1.5h-9c-.8 0-1.5-.7-1.5-1.5z" />
    </svg>
  );
}

export function TreeFolderOpenIcon() {
  return (
    <svg {...iconProps}>
      <path d="M2 11.5v-7C2 3.7 2.7 3 3.5 3h2.6l1.5 1.5h4.4c.8 0 1.5.7 1.5 1.5v.5" />
      <path d="M2 11.5 3.6 7.6c.2-.4.6-.6 1-.6h9.1c.5 0 .9.5.7 1l-1.2 3.5c-.2.6-.8 1-1.4 1H3.5c-.8 0-1.5-.7-1.5-1z" />
    </svg>
  );
}

export function TreeFileIcon() {
  return (
    <svg {...iconProps}>
      <path d="M4.5 2h4.2L12 5.3v7.2c0 .8-.7 1.5-1.5 1.5h-6c-.8 0-1.5-.7-1.5-1.5v-9C3 2.7 3.7 2 4.5 2z" />
      <path d="M8.5 2v3.5H12" />
    </svg>
  );
}
