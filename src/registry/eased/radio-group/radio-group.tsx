"use client";

import { Radio as BaseRadio } from "@base-ui/react/radio";
import { RadioGroup as BaseRadioGroup } from "@base-ui/react/radio-group";
import { useId, type ReactNode } from "react";
import { Indicator, IndicatorGroup } from "../_primitives/indicator/indicator";

type GroupProps<V extends string> = {
  /** The selected value (controlled). */
  value?: V;
  /** The initially selected value (uncontrolled). */
  defaultValue?: V;
  onValueChange?: (value: V) => void;
  /** Submits the value with a form under this name. */
  name?: string;
  disabled?: boolean;
  required?: boolean;
  /** Accessible name, e.g. "Delivery". Or point `aria-labelledby` at a visible label. */
  "aria-label"?: string;
  "aria-labelledby"?: string;
  className?: string;
  children: ReactNode;
};

export type RadioGroupProps<V extends string> = GroupProps<V>;

/**
 * A list of radios. Base UI's RadioGroup supplies the behaviour: one tab stop, arrow keys
 * move and select, form submission and Field validation.
 */
export function RadioGroup<V extends string>({ className = "", onValueChange, children, ...props }: RadioGroupProps<V>) {
  return (
    <BaseRadioGroup<V>
      {...props}
      onValueChange={(v) => onValueChange?.(v)}
      className={`flex flex-col gap-1 ${className}`}
    >
      {children}
    </BaseRadioGroup>
  );
}

/** The 16px control itself: a ring that fills, and a dot that scales out from the centre. */
function RadioControl({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={`flex size-4 shrink-0 items-center justify-center rounded-pill border border-line-strong bg-surface transition-colors duration-150 ease-standard group-data-checked:border-brand group-data-checked:bg-brand group-data-disabled:border-line group-data-disabled:bg-surface-sunken group-hover-fine:group-data-unchecked:border-text-muted ${className}`}
    >
      <span className="size-1.5 scale-50 rounded-pill bg-text-on-brand opacity-0 transition-[scale,opacity] duration-(--eased-duration-instant) ease-exit group-data-checked:scale-100 group-data-checked:opacity-100 group-data-checked:duration-(--eased-duration-spring-snappy) group-data-checked:ease-spring-snappy group-data-disabled:bg-text-disabled reduced:scale-100 reduced:duration-(--eased-duration-instant)!" />
    </span>
  );
}

export type RadioProps<V extends string> = {
  value: V;
  /** The label. Clicking it selects the radio. */
  children: ReactNode;
  /** Muted text under the label. */
  description?: ReactNode;
  disabled?: boolean;
  className?: string;
};

/** One radio with its label (and optional description), aligned to the label's first line. */
export function Radio<V extends string>({ value, children, description, disabled, className = "" }: RadioProps<V>) {
  const id = useId();
  return (
    <BaseRadio.Root
      value={value}
      disabled={disabled}
      aria-labelledby={`${id}-label`}
      aria-describedby={description ? `${id}-desc` : undefined}
      className={(state) =>
        `group flex min-w-0 items-start gap-2.5 rounded-control-xs py-1.5 text-left select-none focus-ring ${
          state.disabled ? "cursor-not-allowed" : "cursor-pointer"
        } ${className}`
      }
    >
      {/* 16px control centred on the 14px label's 20px first line. */}
      <span className="flex h-5 items-center">
        <RadioControl />
      </span>
      <span className="flex min-w-0 flex-col gap-0.5">
        <span id={`${id}-label`} className="text-ui text-text group-data-disabled:text-text-disabled">
          {children}
        </span>
        {description && (
          <span id={`${id}-desc`} className="text-ui-sm text-text-muted text-pretty">
            {description}
          </span>
        )}
      </span>
    </BaseRadio.Root>
  );
}

export type RadioCardsProps<V extends string> = GroupProps<V> & {
  /** Columns at full width; cards stack to one column under 360px of container. Default 1. */
  columns?: 1 | 2 | 3;
};

const COLUMNS = { 1: "grid-cols-1", 2: "grid-cols-1 @min-[22rem]:grid-cols-2", 3: "grid-cols-1 @min-[30rem]:grid-cols-3" } as const;

/**
 * Radio cards: the selected card's border is one highlight that travels between cards
 * on the snappy spring. Cards in a row share a height (`auto-rows-fr`), so the ring only
 * ever translates and never distorts.
 */
export function RadioCards<V extends string>({ className = "", columns = 1, onValueChange, children, ...props }: RadioCardsProps<V>) {
  return (
    <div className="@container w-full min-w-0">
      <BaseRadioGroup<V>
        {...props}
        onValueChange={(v) => onValueChange?.(v)}
        className={`grid auto-rows-fr gap-2 ${COLUMNS[columns]} ${className}`}
      >
        <IndicatorGroup>{children}</IndicatorGroup>
      </BaseRadioGroup>
    </div>
  );
}

export type RadioCardProps<V extends string> = {
  value: V;
  title: ReactNode;
  description?: ReactNode;
  /** Right-aligned detail on the title row, e.g. a price. */
  meta?: ReactNode;
  /** A 16px icon before the title. */
  icon?: ReactNode;
  disabled?: boolean;
  className?: string;
};

/** One card. The whole card is the hit target; the radio dot sits top-right as the affordance. */
export function RadioCard<V extends string>({ value, title, description, meta, icon, disabled, className = "" }: RadioCardProps<V>) {
  const id = useId();
  return (
    <BaseRadio.Root
      value={value}
      disabled={disabled}
      aria-labelledby={`${id}-title`}
      aria-describedby={description ? `${id}-desc` : undefined}
      render={(htmlProps, state) => (
        <span {...htmlProps}>
          {state.checked && <Indicator className="-inset-px rounded-[calc(var(--eased-radius-control)+1px)] border border-brand-line bg-brand-subtle" />}
          <span className="relative flex min-w-0 items-start gap-2.5">
            {icon && <span className="flex h-5 shrink-0 items-center text-text-secondary [&_svg]:size-4">{icon}</span>}
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="flex min-w-0 items-baseline gap-2">
                <span id={`${id}-title`} className="min-w-0 flex-1 truncate text-ui font-medium text-text group-data-disabled:text-text-disabled">
                  {title}
                </span>
                {meta && <span className="shrink-0 text-ui-sm text-text-secondary tabular-nums">{meta}</span>}
              </span>
              {description && (
                <span id={`${id}-desc`} className="text-ui-sm text-text-muted text-pretty">
                  {description}
                </span>
              )}
            </span>
            <span className="flex h-5 items-center">
              <RadioControl />
            </span>
          </span>
        </span>
      )}
      className={(state) =>
        `group relative flex min-w-0 flex-col justify-center rounded-control border border-line-subtle bg-surface p-3 text-left select-none transition-[color,background-color,border-color,box-shadow] duration-150 ease-standard focus-ring ${
          state.disabled
            ? "cursor-not-allowed bg-surface-sunken"
            : state.checked
              ? "cursor-default"
              : "cursor-pointer hover-fine:border-line hover-fine:bg-surface-hover"
        } ${className}`
      }
    />
  );
}
