"use client";

import { Autocomplete } from "@base-ui/react/autocomplete";
import { Dialog } from "@base-ui/react/dialog";
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ComponentProps,
  type ReactNode,
} from "react";
import {
  backdropClass,
  groupClass,
  groupLabelClass,
  itemClass,
  ItemParts,
  modalMotion,
  modalSurface,
  separatorClass,
} from "../_primitives/overlay-core/overlay-core";
import { scrollFadeMask, useScrollEdges } from "../_primitives/scroll-fade/scroll-fade";
import { Kbd } from "../kbd/kbd";
import { isEditable } from "../lib/dom";
import { modKey, useIsMac } from "../lib/platform";

/**
 * A command palette on Base UI's Dialog and Autocomplete: a filtering list of commands that
 * opens ~15vh from the top over the blurred scrim. Opened from its trigger it rises 8px at
 * 0.96 on the smooth spring; opened from ⌘K it appears at once (rule 84). Either way it leaves
 * 4px in 160ms. Enter runs the first match, Escape closes, focus goes back where it was.
 */

/* ---------------------------------------------------------------- Types ---------- */

export type CommandItem = {
  /** Unique within the palette. */
  id: string;
  /** What the command says. Matched against the query, with matching characters emphasised. */
  label: string;
  /** 16px icon (or a 20px avatar) in the leading track. */
  icon?: ReactNode;
  /** Muted text in the trailing column: what kind of thing this is, or where it goes. Also matched. */
  description?: ReactNode;
  /** Key caps shown in the trailing column, e.g. `["C"]` or `["G", "I"]`. Shown only; bind them yourself. */
  shortcut?: string[];
  /** Extra words that should find this command ("theme", "appearance"). Not shown. */
  keywords?: string[];
  /** Runs when the command is chosen (click, tap or Enter). The palette closes right after. */
  onSelect: () => void;
  /** Shown but cannot be highlighted or run. */
  disabled?: boolean;
};

export type CommandGroup = {
  /** The group's heading. An empty label renders no heading; the group is set off by a rule instead. */
  label: string;
  items: CommandItem[];
};

export type CommandPaletteProps = {
  /** Controlled open state. */
  open?: boolean;
  /** Uncontrolled starting state. Default false. */
  defaultOpen?: boolean;
  /** Called whenever the palette opens or closes, from any source (trigger, hotkey, Esc, a command). */
  onOpenChange?: (open: boolean) => void;
  /** Commands in labelled groups. Groups with no matches hide while filtering. */
  groups?: CommandGroup[];
  /** A flat list of commands, for palettes with no groups. Ignored when `groups` is set. */
  items?: CommandItem[];
  /** The input's placeholder. Default "Search or jump to…". */
  placeholder?: string;
  /** The input's accessible name. Default "Search commands". */
  inputLabel?: string;
  /** The dialog's accessible name. Default "Command palette". */
  label?: string;
  /**
   * The shortcut that toggles the palette, e.g. `"mod+k"` (default), `"mod+shift+p"` or `"/"`.
   * `mod` is ⌘ on Apple platforms and Ctrl elsewhere. Shortcuts with a modifier work from inside
   * any text field; bare keys are ignored while someone is typing. One palette per page owns a
   * given hotkey (the first mounted); pass false to opt out, e.g. while a demo is off screen.
   */
  hotkey?: string | false;
  /** Shown when nothing matches. Default "No results". The query is passed for "No results for “…”". */
  emptyText?: ReactNode | ((query: string) => ReactNode);
  /** The bar under the list. Default: ↑↓ Navigate · ↵ Open · Esc Close. False hides it. */
  footer?: ReactNode | false;
  /** Arrow keys wrap from the last command back through the input to the first. Default true. */
  loop?: boolean;
  /** Portal target. Default `document.body`. */
  container?: HTMLElement | null;
  /** Appended to the popup's classes. */
  className?: string;
  /** Triggers, usually a `CommandPaletteTrigger`. They open the palette and get focus back on close. */
  children?: ReactNode;
};

/* --------------------------------------------------------------- Hotkey ---------- */

type Hotkey = { key: string; mod: boolean; ctrl: boolean; meta: boolean; shift: boolean; alt: boolean };

/** "mod+shift+p" → its parts. The last segment is the key; "+" itself is spelled "plus". */
export function parseHotkey(hotkey: string): Hotkey {
  const parts = hotkey.toLowerCase().split("+").map((p) => p.trim());
  const key = parts.pop() ?? "";
  const has = (...names: string[]) => parts.some((p) => names.includes(p));
  return {
    key: key === "plus" ? "+" : key === "space" ? " " : key,
    mod: has("mod"),
    ctrl: has("ctrl", "control"),
    meta: has("meta", "cmd", "command"),
    shift: has("shift"),
    alt: has("alt", "option", "opt"),
  };
}

function matchesHotkey(e: KeyboardEvent, h: Hotkey, mac: boolean) {
  const meta = h.meta || (h.mod && mac);
  const ctrl = h.ctrl || (h.mod && !mac);
  if (e.metaKey !== meta || e.ctrlKey !== ctrl || e.altKey !== h.alt) return false;
  // Shift is only checked for letters and named keys: "?" already implies it.
  if (h.key.length > 1 || /[a-z]/.test(h.key)) {
    if (e.shiftKey !== h.shift) return false;
  }
  // `code` keeps letter shortcuts working on other layouts and with ⌥, which changes `key`.
  return e.key.toLowerCase() === h.key || (/^[a-z]$/.test(h.key) && e.code === `Key${h.key.toUpperCase()}`);
}

/** "mod+k" → "Meta+K" for `aria-keyshortcuts`. */
function ariaHotkey(h: Hotkey, mac: boolean) {
  const mods = [h.ctrl || (h.mod && !mac) ? "Control" : "", h.meta || (h.mod && mac) ? "Meta" : "", h.alt ? "Alt" : "", h.shift ? "Shift" : ""];
  return [...mods.filter(Boolean), h.key === " " ? "Space" : h.key.toUpperCase()].join("+");
}

/** "mod+k" → ["⌘", "K"] (or ["Ctrl", "K"]) for key caps. */
export function hotkeyCaps(hotkey: string, mac: boolean) {
  const h = parseHotkey(hotkey);
  const caps: string[] = [];
  if (h.ctrl || (h.mod && !mac)) caps.push(mac ? "⌃" : "Ctrl");
  if (h.alt) caps.push(mac ? "⌥" : "Alt");
  if (h.shift) caps.push("⇧");
  if (h.meta || (h.mod && mac)) caps.push(modKey(true));
  caps.push(h.key === " " ? "Space" : h.key.toUpperCase());
  return caps;
}

// One owner per hotkey on the page: the first palette to mount keeps it; later ones stay quiet.
const owners = new Map<string, string[]>();
const ownerListeners = new Set<() => void>();
const subscribeOwners = (l: () => void) => {
  ownerListeners.add(l);
  return () => ownerListeners.delete(l);
};

function useHotkeyOwner(hotkey: string | false) {
  const id = useId();
  const key = hotkey ? hotkey.toLowerCase().replace(/\s+/g, "") : "";
  useEffect(() => {
    if (!key) return;
    owners.set(key, [...(owners.get(key) ?? []), id]);
    ownerListeners.forEach((l) => l());
    return () => {
      const rest = (owners.get(key) ?? []).filter((x) => x !== id);
      if (rest.length) owners.set(key, rest);
      else owners.delete(key);
      ownerListeners.forEach((l) => l());
    };
  }, [key, id]);
  return useSyncExternalStore(
    subscribeOwners,
    () => !!key && (owners.get(key)?.[0] ?? id) === id,
    () => false,
  );
}

/* ---------------------------------------------------------------- State ---------- */

/**
 * Open state for a palette you want to open from elsewhere (a menu item, a button far from the
 * trigger): spread `props` onto `CommandPalette` and call `show()`, `hide()` or `toggle()`.
 */
export function useCommandPalette(defaultOpen = false) {
  const [open, setOpen] = useState(defaultOpen);
  const show = useCallback(() => setOpen(true), []);
  const hide = useCallback(() => setOpen(false), []);
  const toggle = useCallback(() => setOpen((o) => !o), []);
  return { open, setOpen, show, hide, toggle, props: { open, onOpenChange: setOpen } };
}

/* ------------------------------------------------------------- Palette ---------- */

/**
 * The palette: trigger(s) as children, commands as `groups` or `items`. Opens 15vh from the
 * top (8px from it under 640px), 576px wide, never wider than the screen less 32px. The list
 * scrolls within min(60dvh, 22rem) with feathered edges; the first match is always
 * highlighted, so Enter runs it.
 */
export function CommandPalette({
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  groups: groupsProp,
  items,
  placeholder = "Search or jump to…",
  inputLabel = "Search commands",
  label = "Command palette",
  hotkey = "mod+k",
  emptyText = "No results",
  footer,
  loop = true,
  container,
  className = "",
  children,
}: CommandPaletteProps) {
  const mac = useIsMac();
  const [inner, setInner] = useState(defaultOpen);
  const open = openProp ?? inner;
  // Opened from the hotkey: no enter animation (rule 84). Any other opening animates.
  const [instant, setInstant] = useState(false);
  // Where focus was when the hotkey opened it, so it goes back there rather than to a trigger.
  const returnTo = useRef<HTMLElement | null>(null);

  const setOpen = useCallback(
    (next: boolean) => {
      // A later opening from anywhere but the hotkey (a controlled `open`, `show()`) animates.
      if (!next) setInstant(false);
      if (openProp === undefined) setInner(next);
      onOpenChange?.(next);
    },
    [openProp, onOpenChange],
  );

  const ownsHotkey = useHotkeyOwner(hotkey);
  const parsed = useMemo(() => (hotkey ? parseHotkey(hotkey) : null), [hotkey]);

  useEffect(() => {
    if (!parsed || !ownsHotkey) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat || e.isComposing || !matchesHotkey(e, parsed, mac)) return;
      // Bare keys ("/") leave typing alone; chords (⌘K) work from any field.
      if (!parsed.mod && !parsed.ctrl && !parsed.meta && isEditable(e.target)) return;
      e.preventDefault();
      if (open) {
        setOpen(false);
        return;
      }
      returnTo.current = document.activeElement instanceof HTMLElement && document.activeElement !== document.body ? document.activeElement : null;
      setInstant(true);
      setOpen(true);
    };
    // Capture, so a host's own ⌘K handler that stops propagation can't swallow it.
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [parsed, ownsHotkey, mac, open, setOpen]);

  const groups = useMemo(() => groupsProp ?? [{ label: "", items: items ?? [] }], [groupsProp, items]);

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        if (next) {
          setInstant(false);
          returnTo.current = null;
        }
        setOpen(next);
      }}
    >
      {children}
      <Dialog.Portal container={container}>
        <Dialog.Backdrop className={backdropClass} />
        <Dialog.Viewport className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[15vh] max-sm:px-2 max-sm:pt-2">
          <Dialog.Popup
            aria-label={label}
            data-instant={instant || undefined}
            finalFocus={() => (returnTo.current?.isConnected ? returnTo.current : true)}
            className={`${modalSurface} ${modalMotion()} w-[36rem] max-w-full overflow-hidden ${className}`}
          >
            <PaletteBody
              groups={groups}
              placeholder={placeholder}
              inputLabel={inputLabel}
              ariaKeys={parsed && ownsHotkey ? ariaHotkey(parsed, mac) : undefined}
              emptyText={emptyText}
              footer={footer}
              loop={loop}
              onRun={(item) => {
                item.onSelect();
                setOpen(false);
              }}
            />
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

type BodyProps = {
  groups: CommandGroup[];
  placeholder: string;
  inputLabel: string;
  ariaKeys?: string;
  emptyText: CommandPaletteProps["emptyText"];
  footer: CommandPaletteProps["footer"];
  loop: boolean;
  onRun: (item: CommandItem) => void;
};

/** Mounted with the popup, so the query resets on every open and the scroll edges track the live list. */
function PaletteBody({ groups, placeholder, inputLabel, ariaKeys, emptyText, footer, loop, onRun }: BodyProps) {
  const [query, setQuery] = useState("");
  const scroller = useRef<HTMLDivElement>(null);
  const hintId = useId();
  useScrollEdges(scroller);

  const { contains } = Autocomplete.useFilter();
  // Every word of the query must appear in the label, keywords, description or group name.
  const searchText = useMemo(() => {
    const map = new Map<CommandItem, string>();
    for (const g of groups) {
      for (const item of g.items) {
        const description = typeof item.description === "string" ? item.description : "";
        map.set(item, [item.label, ...(item.keywords ?? []), description, g.label].join(" "));
      }
    }
    return map;
  }, [groups]);
  const filter = useCallback(
    (item: CommandItem, q: string) => {
      const words = q.trim().split(/\s+/).filter(Boolean);
      const text = searchText.get(item) ?? item.label;
      return words.every((w) => contains(text, w));
    },
    [contains, searchText],
  );

  const empty = typeof emptyText === "function" ? emptyText(query.trim()) : emptyText;

  return (
    <Autocomplete.Root
      open
      inline
      items={groups}
      value={query}
      onValueChange={setQuery}
      filter={filter}
      itemToStringValue={(item: CommandItem) => item.label}
      autoHighlight="always"
      keepHighlight
      loopFocus={loop}
    >
      {/* The 16px icon sits on the rows' icon line, 16px in (R104). */}
      <Autocomplete.InputGroup className="flex h-12 shrink-0 cursor-text items-center gap-3 border-b border-line-subtle px-4">
        <SearchIcon />
        <Autocomplete.Input
          aria-label={inputLabel}
          aria-describedby={hintId}
          aria-keyshortcuts={ariaKeys}
          placeholder={placeholder}
          className="h-full min-w-0 flex-1 bg-transparent text-ui-md text-text outline-none placeholder:text-text-muted [&::-webkit-search-cancel-button]:appearance-none"
        />
      </Autocomplete.InputGroup>
      <span id={hintId} className="sr-only">
        Use the up and down arrows to move, Enter to run the highlighted command, Escape to close.
      </span>
      <Dialog.Close className="sr-only">Close</Dialog.Close>

      <div
        ref={scroller}
        style={scrollFadeMask("y", 16)}
        className="max-h-[min(60dvh,22rem)] min-h-0 overflow-y-auto overscroll-contain scroll-py-3 max-sm:max-h-[min(calc(55dvh-6rem),22rem)]"
      >
        <Autocomplete.Empty className="px-2 [--pad:8px]">
          <p className="flex h-24 items-center justify-center text-center text-ui-sm text-text-muted">{empty}</p>
        </Autocomplete.Empty>
        <Autocomplete.List className="grid grid-cols-[auto_minmax(0,1fr)_auto] content-start p-2 [--pad:8px] empty:hidden">
          {(group: CommandGroup, index: number) => (
            <Autocomplete.Group key={group.label || index} items={group.items} className={`${groupClass} not-first:mt-2`}>
              {group.label ? (
                <Autocomplete.GroupLabel className={groupLabelClass}>{group.label}</Autocomplete.GroupLabel>
              ) : (
                index > 0 && <div role="separator" className={separatorClass} />
              )}
              <Autocomplete.Collection>
                {(item: CommandItem) => (
                  <Autocomplete.Item
                    key={item.id}
                    value={item}
                    disabled={item.disabled}
                    onClick={() => onRun(item)}
                    className={`${itemClass()} min-h-10! max-sm:min-h-11!`}
                  >
                    <ItemParts
                      icon={item.icon}
                      trailing={
                        item.description !== undefined || item.shortcut ? (
                          <>
                            {item.description !== undefined && <span className="truncate text-ui-xs text-text-muted">{item.description}</span>}
                            {item.shortcut && <Kbd keys={item.shortcut} listen={false} />}
                          </>
                        ) : undefined
                      }
                    >
                      <Highlighted text={item.label} query={query} />
                    </ItemParts>
                  </Autocomplete.Item>
                )}
              </Autocomplete.Collection>
            </Autocomplete.Group>
          )}
        </Autocomplete.List>
      </div>

      {footer !== false && (
        <div className="flex h-10 shrink-0 items-center gap-4 border-t border-line-subtle px-4 text-ui-xs text-text-muted">
          {footer ?? <DefaultFooter />}
        </div>
      )}
    </Autocomplete.Root>
  );
}

/** The label with the query's first match in full text colour and the rest secondary. No match: all full colour. */
function Highlighted({ text, query }: { text: string; query: string }) {
  const q = query.trim().toLocaleLowerCase();
  const at = q ? text.toLocaleLowerCase().indexOf(q) : -1;
  if (at < 0) return <>{text}</>;
  return (
    <span className="text-text-secondary">
      {text.slice(0, at)}
      <span className="text-text">{text.slice(at, at + q.length)}</span>
      {text.slice(at + q.length)}
    </span>
  );
}

/** ↑↓ Navigate · ↵ Open · Esc Close. The caps press as the real keys do. Hidden from screen readers, who get the input's description. */
function DefaultFooter() {
  return (
    <div aria-hidden className="flex items-center gap-4">
      <span className="flex items-center gap-1.5">
        <Kbd keys={["↑", "↓"]} />
        Navigate
      </span>
      <span className="flex items-center gap-1.5">
        <Kbd>↵</Kbd>
        Open
      </span>
      <span className="flex items-center gap-1.5">
        <Kbd>Esc</Kbd>
        Close
      </span>
    </div>
  );
}

/* ------------------------------------------------------------- Trigger ---------- */

export type CommandPaletteTriggerProps = Omit<ComponentProps<typeof Dialog.Trigger>, "className" | "children"> & {
  /** The placeholder-style label. Default "Search…". */
  children?: ReactNode;
  /** The hotkey to show as caps, matching the palette's. Default "mod+k"; false hides the hint. */
  hotkey?: string | false;
  className?: string;
};

/**
 * A button dressed as a search field: magnifier, muted "Search…", and the ⌘K caps (Ctrl K off
 * Apple). It presses by colour and never scales (R64). Put it inside `CommandPalette`.
 */
export function CommandPaletteTrigger({ children = "Search…", hotkey = "mod+k", className = "", ...props }: CommandPaletteTriggerProps) {
  const mac = useIsMac();
  return (
    <Dialog.Trigger
      {...props}
      className={`focus-ring flex h-control-sm min-w-0 cursor-pointer items-center gap-2 rounded-control-sm border border-line bg-surface ps-2.5 pe-1.5 text-ui-sm text-text-muted select-none [transition:color_150ms_var(--eased-ease-standard),background-color_150ms_var(--eased-ease-standard),border-color_150ms_var(--eased-ease-standard),box-shadow_var(--eased-duration-focus)_var(--eased-ease-standard)] hover-fine:border-line-strong hover-fine:text-text-secondary active:bg-surface-hover data-popup-open:bg-surface-hover ${className}`}
    >
      <SearchIcon />
      <span className="min-w-0 flex-1 truncate text-start">{children}</span>
      {hotkey && <Kbd keys={hotkeyCaps(hotkey, mac)} listen={false} className="ms-2" />}
    </Dialog.Trigger>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden className="size-4 shrink-0 text-text-muted">
      <circle cx="7.25" cy="7.25" r="4.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="m10.75 10.75 2.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
