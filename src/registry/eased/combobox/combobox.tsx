"use client";

import { Combobox as BaseCombobox } from "@base-ui/react/combobox";
import { AnimatePresence, motion } from "motion/react";
import { Fragment, useRef, useState, type ReactNode } from "react";
import { InputGroup, controlClass, type ControlSize } from "../_primitives/field/field";
import { FloatingLayer } from "../_primitives/floating/floating";
import {
  groupClass,
  groupLabelClass,
  itemClass,
  ItemCheck,
  ItemParts,
  menuSurface,
  OVERLAY_ROLES,
  separatorClass,
} from "../_primitives/overlay-core/overlay-core";
import { exitFast, fade, reducedFade, snappy, useSafeReducedMotion } from "../lib/motion";
import { pressIcon } from "../lib/press";
import { Spinner } from "../spinner/spinner";

/**
 * A filterable select on Base UI's Combobox, in the Eased Input's shell. Type to narrow the
 * list; the clear button pops in once there is something to clear. With `multiple`, choices
 * become chips inside the field that pop in on the snappy spring and leave fast; Backspace
 * removes the last one. The list fills rows in place (no glide while you type, rule 84).
 */

export type ComboboxOption = {
  /** A stable id: compared for selection and submitted with the form. */
  value: string;
  /** The row's text, what filtering matches and what the input shows once chosen. */
  label: string;
  /** An avatar, colour dot or 16px glyph before the label (and on its chip). */
  icon?: ReactNode;
  /** Muted text in the trailing column: a team, a count, "Private". */
  detail?: ReactNode;
  disabled?: boolean;
};

export type ComboboxOptionGroup<T extends ComboboxOption = ComboboxOption> = {
  /** The group's heading. */
  label: string;
  items: T[];
};

type RootProps<T, M extends boolean | undefined> = Omit<
  BaseCombobox.Root.Props<T, M>,
  "items" | "children" | "itemToStringLabel" | "itemToStringValue" | "isItemEqualToValue"
>;

export type ComboboxProps<T extends ComboboxOption, M extends boolean | undefined = false> = RootProps<T, M> & {
  /** The options, flat or in groups. Base UI filters them as you type. */
  items: T[] | ComboboxOptionGroup<T>[];
  /** Muted text in the empty input. In `multiple` mode it shows only while nothing is chosen. */
  placeholder?: string;
  /** sm 32px, md 36px (default), lg 40px. */
  size?: ControlSize;
  /**
   * Mark the combobox invalid outside a `Field` (inside one, the field's validity drives it):
   * red border and one shake when it turns on.
   */
  invalid?: boolean;
  /** What the list says when nothing matches. Default: No matches for “query”. */
  emptyText?: ReactNode | ((query: string) => ReactNode);
  /** Show a spinner row instead of the empty state, e.g. while results load. */
  loading?: boolean;
  /** The loading row's text. Default "Searching…". */
  loadingText?: string;
  /** How an option reads in the input and to filtering. Default: its `label`. */
  itemToStringLabel?: (item: T) => string;
  /** Keep the list open after a pick in `multiple` mode, so several can be chosen. Default true. */
  keepOpenOnSelect?: boolean;
  /** The input's id, for a `<label htmlFor>` outside a `Field`. */
  id?: string;
  /** The input's accessible name when no label names it. */
  "aria-label"?: string;
  /** Accessible name for the clear button. Default "Clear". */
  clearLabel?: string;
  /** Portal target. Default `document.body`. */
  container?: HTMLElement | null;
  /** Stacking order of the popup. Default 50; raise it inside a higher layer (a dialog). */
  zIndex?: number;
  /** Classes for the bordered shell (set a width here; it fills its container by default). */
  className?: string;
  /** Classes for the popup. */
  popupClassName?: string;
};

// Multiple mode: the chip area's min height is the shell's inner height, so one line of chips
// centres like text; the trailing buttons sit in a box of the same height, on the first line.
const LINE: Record<ControlSize, string> = { sm: "min-h-7.5 py-0.5", md: "min-h-8.5 py-1", lg: "min-h-9.5 py-1" };
const TRAIL: Record<ControlSize, string> = { sm: "h-7.5", md: "h-8.5", lg: "h-9.5" };

const CLEAR = `inline-flex size-5 cursor-pointer items-center justify-center rounded-pill bg-surface-hover text-text-secondary hover-fine:bg-surface-active hover-fine:text-text ${pressIcon} data-starting-style:scale-60 data-starting-style:opacity-0 data-ending-style:scale-60 data-ending-style:opacity-0 data-ending-style:[transition-duration:var(--eased-duration-instant)] reduced:data-starting-style:scale-100 reduced:data-ending-style:scale-100`;

const chipIn = { opacity: 0, scale: 0.9 } as const;
const chipShown = { opacity: 1, scale: 1 } as const;

const isGroup = <T extends ComboboxOption>(entry: T | ComboboxOptionGroup<T>): entry is ComboboxOptionGroup<T> =>
  Array.isArray((entry as ComboboxOptionGroup<T>).items);

/**
 * The combobox. Values are option objects (compared by `value`):
 *
 *   <Combobox items={countries} placeholder="Search countries" aria-label="Country" />
 *   <Combobox multiple items={people} defaultValue={[people[0]]} placeholder="Add reviewers" />
 */
export function Combobox<T extends ComboboxOption, M extends boolean | undefined = false>({
  items,
  multiple,
  placeholder,
  size = "md",
  invalid,
  emptyText,
  loading = false,
  loadingText = "Searching…",
  itemToStringLabel,
  keepOpenOnSelect = true,
  id,
  "aria-label": ariaLabel,
  clearLabel = "Clear",
  container,
  zIndex,
  className = "",
  popupClassName = "",
  onOpenChange,
  onInputValueChange,
  onValueChange,
  ...props
}: ComboboxProps<T, M>) {
  const reduced = useSafeReducedMotion();
  const anchor = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");

  const input = (extra: string, placeholderText?: string) => (
    <BaseCombobox.Input
      id={id}
      aria-label={ariaLabel}
      placeholder={placeholderText}
      {...(invalid !== undefined ? { "aria-invalid": invalid } : null)}
      className={`${controlClass} ${extra}`}
    />
  );

  return (
    <BaseCombobox.Root<T, M>
      // Typing highlights the first match, so Enter picks it. Pass autoHighlight={false} to opt out.
      autoHighlight
      {...props}
      multiple={multiple}
      items={items}
      itemToStringLabel={itemToStringLabel ?? ((item: T) => item.label)}
      itemToStringValue={(item: T) => item.value}
      isItemEqualToValue={(a: T, b: T) => a.value === b.value}
      // In multiple mode the query is controlled, so a pick clears it for the next search.
      inputValue={multiple && props.inputValue === undefined ? query : props.inputValue}
      onInputValueChange={(value, details) => {
        setQuery(value);
        onInputValueChange?.(value, details);
      }}
      onValueChange={(value, details) => {
        if (multiple) setQuery("");
        onValueChange?.(value, details);
      }}
      onOpenChange={(open, details) => {
        if (multiple && keepOpenOnSelect && !open && details.reason === "item-press") details.cancel();
        onOpenChange?.(open, details);
      }}
    >
      <div ref={anchor} className={`flex w-full min-w-0 ${className}`}>
        <InputGroup size={size} invalid={invalid}>
          {multiple ? (
            <BaseCombobox.Value>
              {(value: T[]) => (
                <BaseCombobox.Chips
                  aria-label={value.length > 0 ? "Selected" : undefined}
                  className={`relative flex min-w-0 flex-1 flex-wrap content-center items-center gap-1 ${LINE[size]}`}
                >
                  <AnimatePresence initial={false} mode="popLayout">
                    {value.map((item) => (
                      <BaseCombobox.Chip
                        key={item.value}
                        data-chip=""
                        aria-label={item.label}
                        render={
                          <motion.div
                            initial={reduced ? { opacity: 0 } : chipIn}
                            animate={reduced ? { opacity: 1 } : chipShown}
                            exit={reduced ? { opacity: 0, transition: reducedFade } : { ...chipIn, transition: exitFast }}
                            transition={reduced ? reducedFade : { ...snappy, opacity: fade }}
                          />
                        }
                        className={`inline-flex h-6 max-w-full min-w-0 cursor-default items-center gap-1.5 rounded-control-xs bg-surface-hover pe-0.5 ${item.icon !== undefined ? "ps-1" : "ps-1.5"} text-ui-sm text-text outline-none select-none focus:bg-surface-active [&_svg]:shrink-0`}
                      >
                        {item.icon !== undefined && (
                          <span aria-hidden className="inline-flex shrink-0">
                            {item.icon}
                          </span>
                        )}
                        <span className="truncate">{item.label}</span>
                        <BaseCombobox.ChipRemove
                          aria-label={`Remove ${item.label}`}
                          className={`inline-flex size-4 shrink-0 cursor-pointer items-center justify-center rounded-pill text-text-muted hover-fine:bg-surface-active hover-fine:text-text ${pressIcon}`}
                        >
                          <XIcon className="size-3" />
                        </BaseCombobox.ChipRemove>
                      </BaseCombobox.Chip>
                    ))}
                  </AnimatePresence>
                  {input("h-6 min-w-16", value.length > 0 ? undefined : placeholder)}
                </BaseCombobox.Chips>
              )}
            </BaseCombobox.Value>
          ) : (
            input("", placeholder)
          )}

          <span className={`-me-1 flex shrink-0 items-center gap-0.5 ${multiple ? `self-start ${TRAIL[size]}` : ""}`}>
            {/* The clear button's slot is always held, so the text never shifts when it pops in (R108). */}
            <span className="inline-flex size-5 items-center justify-center">
              <BaseCombobox.Clear aria-label={clearLabel} className={CLEAR}>
                <XIcon className="size-3" />
              </BaseCombobox.Clear>
            </span>
            <BaseCombobox.Trigger
              aria-label="Show options"
              className="inline-flex size-5 cursor-pointer items-center justify-center rounded-control-xs text-text-muted outline-none [transition:color_150ms_var(--eased-ease-standard)] hover-fine:text-text data-popup-open:text-text disabled:cursor-not-allowed disabled:text-text-disabled"
            >
              <ChevronDownIcon />
            </BaseCombobox.Trigger>
          </span>
        </InputGroup>
      </div>

      <FloatingLayer
        parts={BaseCombobox}
        motion={OVERLAY_ROLES.listbox}
        side={OVERLAY_ROLES.listbox.side}
        sideOffset={OVERLAY_ROLES.listbox.sideOffset}
        align="start"
        container={container}
        zIndex={zIndex}
        positionerProps={{ anchor }}
        className={`${menuSurface} w-(--anchor-width) max-h-[min(20rem,var(--available-height))]! ${popupClassName}`}
      >
        {/* Status and Empty stay mounted so screen readers hear their changes; only their content toggles. */}
        <BaseCombobox.Status className="col-span-full">
          {loading && (
            <div className="flex h-8 items-center gap-2 px-2 text-ui-sm text-text-muted">
              <Spinner size="sm" label={false} className="text-current" />
              {loadingText}
            </div>
          )}
        </BaseCombobox.Status>
        <BaseCombobox.Empty className="col-span-full">
          {!loading && (
            <div className="flex min-h-8 items-center px-2 py-1.5 text-ui-sm text-pretty text-text-muted">
              {typeof emptyText === "function" ? emptyText(query) : (emptyText ?? (query ? `No matches for “${query}”` : "No options"))}
            </div>
          )}
        </BaseCombobox.Empty>
        <BaseCombobox.List className="col-span-full grid grid-cols-subgrid outline-none">
          {(entry: T | ComboboxOptionGroup<T>, index: number) =>
            isGroup(entry) ? (
              <Fragment key={`group:${entry.label}`}>
                {index > 0 && <BaseCombobox.Separator className={separatorClass} />}
                <BaseCombobox.Group items={entry.items} className={groupClass}>
                  <BaseCombobox.GroupLabel className={groupLabelClass}>{entry.label}</BaseCombobox.GroupLabel>
                  <BaseCombobox.Collection>{(item: T) => <OptionRow key={item.value} item={item} />}</BaseCombobox.Collection>
                </BaseCombobox.Group>
              </Fragment>
            ) : (
              <OptionRow key={entry.value} item={entry} />
            )
          }
        </BaseCombobox.List>
      </FloatingLayer>
    </BaseCombobox.Root>
  );
}

function OptionRow<T extends ComboboxOption>({ item }: { item: T }) {
  return (
    <BaseCombobox.Item value={item} disabled={item.disabled} className={itemClass()}>
      <ItemParts
        icon={
          <BaseCombobox.ItemIndicator keepMounted render={<span />} className="inline-flex">
            <ItemCheck />
          </BaseCombobox.ItemIndicator>
        }
        trailing={item.detail !== undefined ? <span className="text-ui-xs text-text-muted">{item.detail}</span> : undefined}
      >
        <span className="flex min-w-0 items-center gap-2">
          {item.icon !== undefined && (
            <span aria-hidden className="inline-flex shrink-0 [&_svg]:size-4">
              {item.icon}
            </span>
          )}
          <span className="truncate">{item.label}</span>
        </span>
      </ItemParts>
    </BaseCombobox.Item>
  );
}

function XIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden className={className}>
      <path d="m4.5 4.5 7 7m0-7-7 7" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden className="size-4">
      <path d="m4.5 6.5 3.5 3.5 3.5-3.5" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
