"use client";

import { Select as BaseSelect } from "@base-ui/react/select";
import { motion, type HTMLMotionProps } from "motion/react";
import { Fragment, useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { InputGroup, type ControlSize } from "../_primitives/field/field";
import { FloatingLayer } from "../_primitives/floating/floating";
import {
  groupClass,
  groupLabelClass,
  HighlightGroup,
  itemClass,
  ItemCheck,
  ItemParts,
  OVERLAY_ROLES,
  panelSurface,
  separatorClass,
  withHighlight,
} from "../_primitives/overlay-core/overlay-core";

/**
 * A select on Base UI's Select, in the Eased Input's bordered shell. Like a macOS pop-up
 * button, the list opens with the selected row sitting over the trigger and grows from that
 * row; when there's no room (or on touch) it drops below the trigger like a listbox instead.
 * The highlight glides between rows on the snappy spring.
 */

export type SelectOption<V> = {
  value: V;
  /** The row's text, and what the trigger shows once it is chosen. */
  label: string;
  /** A 16px glyph, flag or colour dot before the label. */
  icon?: ReactNode;
  /** A second, muted line under the label. */
  description?: ReactNode;
  disabled?: boolean;
};

export type SelectOptionGroup<V> = {
  /** The group's heading. */
  label: string;
  items: SelectOption<V>[];
};

type RootProps<V, M extends boolean | undefined> = Omit<
  BaseSelect.Root.Props<V, M>,
  "items" | "children" | "itemToStringLabel" | "isItemEqualToValue"
>;

export type SelectProps<V, M extends boolean | undefined = false> = RootProps<V, M> & {
  /** The options, flat or in groups. Leave out to compose `SelectItem` / `SelectGroup` children instead. */
  items?: SelectOption<V>[] | SelectOptionGroup<V>[];
  /** Rows composed by hand (`SelectItem`, `SelectGroup`, `SelectSeparator`). Ignored when `items` is set. */
  children?: ReactNode;
  /** Muted text in the trigger while nothing is chosen. */
  placeholder?: ReactNode;
  /** sm 32px, md 36px (default), lg 40px. */
  size?: ControlSize;
  /**
   * Mark the select invalid outside a `Field` (inside one, the field's validity drives it):
   * red border and one shake when it turns on.
   */
  invalid?: boolean;
  /**
   * Open with the selected row over the trigger (default true). Base UI falls back to a list
   * below the trigger on touch and when there isn't room; false always drops below.
   */
  alignItemWithTrigger?: boolean;
  /** Format the trigger's value, e.g. to add the chosen option's icon. Default: its label. */
  renderValue?: (value: M extends true ? V[] : V | null) => ReactNode;
  /** The trigger's accessible name when no `Field` label or `aria-labelledby` names it. */
  "aria-label"?: string;
  "aria-labelledby"?: string;
  /** Portal target. Default `document.body`. */
  container?: HTMLElement | null;
  /** Stacking order of the popup. Default 50; raise it inside a higher layer (a dialog). */
  zIndex?: number;
  /** Classes for the bordered shell (set a width here; it fills its container by default). */
  className?: string;
  /** Classes for the popup. */
  popupClassName?: string;
};

// The trigger covers the shell's padding so the whole box is one button.
const TRIGGER_INSET: Record<ControlSize, string> = { sm: "-mx-2.5 px-2.5", md: "-mx-3 px-3", lg: "-mx-3.5 px-3.5" };

/*
 * The popup holds the scroll arrows (absolutely placed by Base UI), so the list inside it is the
 * scroller and carries the menu's three tracks (icon · label · trailing) that rows subgrid into.
 * In align mode the popup is wider than the trigger by the check track, so the trigger's box is
 * covered while the selected label sits on the trigger's value.
 */
const POPUP = `${panelSurface} relative flex flex-col overflow-hidden min-w-(--anchor-width) max-w-(--available-width) max-h-(--available-height) data-[side=none]:min-w-[calc(var(--anchor-width)+1.75rem)]`;
const LIST =
  "grid min-h-0 flex-1 grid-cols-[auto_minmax(0,1fr)_auto] content-start overflow-y-auto overscroll-contain p-1 scroll-py-6 outline-none [--pad:4px]";
const ARROW =
  "absolute inset-x-0 z-10 flex h-6 cursor-default items-center justify-center text-text-muted from-surface-raised from-30% to-transparent transition-opacity duration-(--eased-duration-fast) ease-standard data-starting-style:opacity-0 data-ending-style:opacity-0 reduced:transition-none before:absolute before:inset-x-0 before:h-full";

/**
 * The select. Pass `items` for the common case, or compose rows as children:
 *
 *   <Select items={regions} defaultValue="eu-west" aria-label="Region" />
 */
export function Select<V, M extends boolean | undefined = false>({
  items,
  children,
  placeholder,
  size = "md",
  invalid,
  alignItemWithTrigger = true,
  renderValue,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  container,
  zIndex,
  className = "",
  popupClassName = "",
  disabled,
  ...props
}: SelectProps<V, M>) {
  const anchor = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const fieldInvalid = useDataInvalid(trigger);

  return (
    <BaseSelect.Root<V, M> {...props} disabled={disabled} items={items}>
      <div ref={anchor} className={`flex w-full min-w-0 ${className}`}>
        <InputGroup size={size} invalid={invalid ?? fieldInvalid} className="has-[[data-popup-open]]:not-data-invalid:border-(--eased-neutral-9)">
          <BaseSelect.Trigger
            ref={trigger}
            aria-label={ariaLabel}
            aria-labelledby={ariaLabelledBy}
            {...(invalid !== undefined ? { "aria-invalid": invalid } : null)}
            className={`flex min-w-0 flex-1 cursor-default items-center gap-2 self-stretch rounded-[inherit] text-start outline-none select-none disabled:cursor-not-allowed ${TRIGGER_INSET[size]}`}
          >
            <BaseSelect.Value
              placeholder={placeholder}
              className="min-w-0 flex-1 truncate data-placeholder:text-text-muted"
            >
              {renderValue as ((value: unknown) => ReactNode) | undefined}
            </BaseSelect.Value>
            <BaseSelect.Icon className="-me-0.5 inline-flex shrink-0 text-text-muted in-disabled:text-text-disabled">
              <ChevronUpDownIcon />
            </BaseSelect.Icon>
          </BaseSelect.Trigger>
        </InputGroup>
      </div>

      <FloatingLayer
        parts={BaseSelect}
        motion={OVERLAY_ROLES.listbox}
        side={OVERLAY_ROLES.listbox.side}
        sideOffset={OVERLAY_ROLES.listbox.sideOffset}
        align="start"
        container={container}
        zIndex={zIndex}
        positionerProps={{ alignItemWithTrigger, anchor }}
        className={`${POPUP} ${popupClassName}`}
      >
        <BaseSelect.ScrollUpArrow className={`${ARROW} top-0 bg-linear-to-b data-[side=none]:before:-top-full`}>
          <ChevronIcon up />
        </BaseSelect.ScrollUpArrow>
        {/* The list is a Motion element with `layoutScroll`, so the gliding highlight measures rows through the
            list's scroll offset: it stays correct while the list scrolls under it (wheel, scroll arrows, typeahead
            jumps, align mode's initial scroll). A render callback, not a component, so Base UI calls it as a plain function. */}
        <BaseSelect.List render={(props) => <motion.div {...(props as HTMLMotionProps<"div">)} layoutScroll />} className={LIST}>
          <HighlightGroup>{items ? <OptionRows items={items} /> : children}</HighlightGroup>
        </BaseSelect.List>
        <BaseSelect.ScrollDownArrow className={`${ARROW} bottom-0 bg-linear-to-t data-[side=none]:before:-bottom-full`}>
          <ChevronIcon />
        </BaseSelect.ScrollDownArrow>
      </FloatingLayer>
    </BaseSelect.Root>
  );
}

function OptionRows<V>({ items }: { items: SelectOption<V>[] | SelectOptionGroup<V>[] }) {
  return (
    <>
      {items.map((entry, i) =>
        "items" in entry ? (
          <Fragment key={`group:${entry.label}`}>
            {i > 0 && <SelectSeparator />}
            <SelectGroup label={entry.label}>
              {entry.items.map((option) => (
                <OptionRow key={String(option.value)} option={option} />
              ))}
            </SelectGroup>
          </Fragment>
        ) : (
          <OptionRow key={String(entry.value)} option={entry} />
        ),
      )}
    </>
  );
}

function OptionRow<V>({ option }: { option: SelectOption<V> }) {
  return (
    <SelectItem value={option.value} label={option.label} icon={option.icon} description={option.description} disabled={option.disabled}>
      {option.label}
    </SelectItem>
  );
}

export type SelectItemProps = {
  /** The value this row chooses. */
  value: unknown;
  /** The row's text. */
  children: ReactNode;
  /** The text typeahead matches when `children` isn't plain text. */
  label?: string;
  /** A 16px glyph, flag or colour dot before the label. */
  icon?: ReactNode;
  /** A second, muted line under the label. */
  description?: ReactNode;
  disabled?: boolean;
};

/**
 * One option. The check sits in the icon track and draws in when the row is chosen; labels
 * share one x whether or not a row has an `icon`.
 */
export function SelectItem({ value, children, label, icon, description, disabled }: SelectItemProps) {
  return (
    <BaseSelect.Item value={value} label={label} disabled={disabled} className={itemClass({ glide: true })} render={withHighlight}>
      <ItemParts
        icon={
          <BaseSelect.ItemIndicator keepMounted render={<span />} className="inline-flex">
            <ItemCheck />
          </BaseSelect.ItemIndicator>
        }
        description={description}
      >
        <span className="flex min-w-0 items-center gap-2">
          {icon !== undefined && (
            <span aria-hidden className="inline-flex shrink-0 [&_svg]:size-4">
              {icon}
            </span>
          )}
          {/* The text Base UI lines up with the trigger's value in align mode. */}
          <BaseSelect.ItemText render={<span />} className="truncate">
            {children}
          </BaseSelect.ItemText>
        </span>
      </ItemParts>
    </BaseSelect.Item>
  );
}

/** A labelled group of options that stays on the list's tracks. */
export function SelectGroup({ label, children }: { label: ReactNode; children: ReactNode }) {
  return (
    <BaseSelect.Group className={groupClass}>
      <BaseSelect.GroupLabel className={groupLabelClass}>{label}</BaseSelect.GroupLabel>
      {children}
    </BaseSelect.Group>
  );
}

/** A full-bleed rule between groups. */
export function SelectSeparator() {
  return <BaseSelect.Separator className={separatorClass} />;
}

/**
 * Inside a Base UI Field the trigger carries `data-invalid`; the shell reads it from there so
 * it draws and shakes like an Input in the same form.
 */
function useDataInvalid(ref: RefObject<HTMLElement | null>) {
  const [invalid, setInvalid] = useState(false);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const read = () => setInvalid(el.hasAttribute("data-invalid"));
    read();
    const mo = new MutationObserver(read);
    mo.observe(el, { attributes: true, attributeFilter: ["data-invalid"] });
    return () => mo.disconnect();
  }, [ref]);
  return invalid;
}

function ChevronUpDownIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden className="size-4">
      <path d="m5.25 6.25 2.75-2.75 2.75 2.75M5.25 9.75 8 12.5l2.75-2.75" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronIcon({ up = false }: { up?: boolean }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden className={`relative size-3.5 ${up ? "rotate-180" : ""}`}>
      <path d="m4.5 6.5 3.5 3.5 3.5-3.5" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
