"use client";

import { Radio } from "@base-ui/react/radio";
import { RadioGroup } from "@base-ui/react/radio-group";
import { useAnimate } from "motion/react";
import { useRef, useState, type CSSProperties, type PointerEvent, type ReactNode } from "react";
import { bouncy, ease, snappy, stagger, useSafeReducedMotion } from "../lib/motion";

export type RatingProps = {
  /** The rating, 0 for none (controlled). */
  value?: number;
  /** The starting rating (uncontrolled). Default 0. */
  defaultValue?: number;
  /** Called when someone picks a rating (or clears it, with `clearable`). */
  onValueChange?: (value: number) => void;
  /** Called with the rating under the pointer while previewing, and `null` when it leaves. */
  onHoverChange?: (value: number | null) => void;
  /** How many icons. Default 5. */
  max?: number;
  /** Allow half steps: each icon has a left and a right half. Default false. */
  allowHalf?: boolean;
  /** Choosing the current rating again clears it to 0. Default false. */
  clearable?: boolean;
  /**
   * Display only: any fraction (4.3 fills 30% of the fifth star), no focus stops, read as
   * one image ("Rated 4.3 out of 5"). Default false.
   */
  readOnly?: boolean;
  disabled?: boolean;
  /** 16px (`sm`, review rows), 20px (`md`, default) or 28px (`lg`, a rating prompt). */
  size?: "sm" | "md" | "lg";
  /**
   * Your own icon: an SVG that paints with `currentColor` (a heart, a flame). It is drawn twice,
   * an empty layer and a filled one clipped to the rating. Default: a rounded star.
   */
  icon?: ReactNode;
  /** Each step's accessible name. Default `4 stars`, `4.5 stars`. */
  getLabel?: (value: number) => string;
  /** Submits the value with a form under this name. */
  name?: string;
  /** Accessible name for the group, e.g. "Rate this recipe". Or point `aria-labelledby` at a visible label. */
  "aria-label"?: string;
  "aria-labelledby"?: string;
  /** Appended to the root's classes. Set `--rating` (fill) and `--rating-empty` here to recolour. */
  className?: string;
  style?: CSSProperties;
};

const SIZES = {
  sm: { icon: "size-4", pad: "px-px", ring: "rounded-control-2xs" },
  md: { icon: "size-5", pad: "px-0.5", ring: "rounded-control-2xs" },
  lg: { icon: "size-7", pad: "px-2", ring: "rounded-control-xs" },
} as const;

const Star = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" aria-hidden>
    <path d="M12 2.9l2.73 5.53 6.1.89-4.41 4.3 1.04 6.07L12 16.82l-5.46 2.87 1.04-6.07-4.41-4.3 6.1-.89L12 2.9z" />
  </svg>
);

const defaultLabel = (v: number) => `${v} ${v === 1 ? "star" : "stars"}`;

// Eased's focus ring, drawn on the icon around whichever of its halves has focus.
const RING =
  "[transition:box-shadow_var(--eased-duration-focus)_var(--eased-ease-standard)] group-has-[:focus-visible]:shadow-[0_0_0_2px_var(--eased-bg),0_0_0_4px_var(--eased-ring)]";

/**
 * A rating on Base UI's RadioGroup: one tab stop, arrow keys step through the values (halves
 * too, with `allowHalf`), and it submits with a form. Pointing previews the rating without
 * committing it; choosing one fills the icons from the left, each popping on the bouncy spring
 * 35ms after the one before. `readOnly` turns it into a display of any fraction.
 */
export function Rating({
  value: controlled,
  defaultValue = 0,
  onValueChange,
  onHoverChange,
  max = 5,
  allowHalf = false,
  clearable = false,
  readOnly = false,
  disabled = false,
  size = "md",
  icon,
  getLabel = defaultLabel,
  name,
  className = "",
  style,
  ...aria
}: RatingProps) {
  const [own, setOwn] = useState(defaultValue);
  const value = controlled ?? own;
  const [hover, setHover] = useState<number | null>(null);
  const reduced = useSafeReducedMotion();
  const [scope, animate] = useAnimate<HTMLDivElement>();
  const icons = useRef<(HTMLSpanElement | null)[]>([]);
  const s = SIZES[size];
  const glyph = icon ?? <Star />;
  const shown = hover ?? value;

  const preview = (next: number | null) => {
    setHover(next);
    onHoverChange?.(next);
  };

  // The pop: icons that gain fill rise to 1.2 and settle on the bouncy spring, left to right.
  // A lower rating only nudges its new last icon. Interruptible; skipped under reduced motion.
  const pop = (from: number, to: number) => {
    if (reduced) return;
    const els = icons.current;
    const run = (i: number, peak: number, delay: number) => {
      const el = els[i];
      if (!el) return;
      animate(el, { scale: peak }, { duration: 0.1, ease: ease.enter, delay }).then(() => animate(el, { scale: 1 }, bouncy));
    };
    if (to > from) {
      const first = Math.floor(from);
      for (let i = first; i < Math.ceil(to); i++) run(i, 1.2, (i - first) * stagger.item);
    } else if (to > 0) {
      const el = els[Math.ceil(to) - 1];
      if (el) animate(el, { scale: [0.9, 1] }, snappy);
    }
  };

  const commit = (next: number) => {
    if (next === value) return;
    pop(value, next);
    if (controlled === undefined) setOwn(next);
    onValueChange?.(next);
  };

  const fillOf = (i: number) => Math.min(1, Math.max(0, shown - i));

  const visual = (i: number) => {
    const fill = fillOf(i);
    return (
      <span className={`relative flex ${s.icon} [&_svg]:size-full`}>
        <span className="flex size-full text-(--rating-empty,var(--eased-line))">{glyph}</span>
        <span
          className="absolute inset-0 flex text-(--rating,var(--eased-warning)) [transition:clip-path_150ms_var(--eased-ease-standard)] reduced:transition-none"
          style={{ clipPath: `inset(0 ${(1 - fill) * 100}% 0 0)` }}
        >
          {glyph}
        </span>
      </span>
    );
  };

  if (readOnly) {
    const label = aria["aria-label"] ?? `Rated ${Math.round(value * 10) / 10} out of ${max}`;
    return (
      <span role="img" aria-label={label} className={`inline-flex shrink-0 items-center ${className}`} style={style}>
        {Array.from({ length: max }, (_, i) => (
          <span key={i} className={`flex ${s.pad} first:ps-0 last:pe-0`}>
            {visual(i)}
          </span>
        ))}
      </span>
    );
  }

  const onPointerMove = (v: number) => (e: PointerEvent) => {
    if (e.pointerType === "mouse" && !disabled && hover !== v) preview(v);
  };

  return (
    <RadioGroup<number>
      {...aria}
      ref={scope}
      value={value}
      onValueChange={(next) => commit(next)}
      name={name}
      disabled={disabled}
      onPointerLeave={() => hover !== null && preview(null)}
      // Keys show the real value, not whatever the resting pointer last previewed.
      onKeyDown={() => hover !== null && preview(null)}
      className={`inline-flex shrink-0 items-center select-none ${disabled ? "cursor-not-allowed opacity-50" : ""} ${className}`}
      style={style}
    >
      {Array.from({ length: max }, (_, i) => {
        const steps = allowHalf ? [i + 0.5, i + 1] : [i + 1];
        return (
          // The padding (not a gap) spaces the icons, so the pointer never falls between them.
          <span key={i} className={`group relative flex ${s.pad} ${size === "lg" ? "py-2" : "py-1"} first:ps-0 last:pe-0`}>
            <span
              ref={(el) => {
                icons.current[i] = el;
              }}
              className={`flex ${s.ring} ${RING}`}
            >
              {visual(i)}
            </span>
            {steps.map((v, k) => (
                <Radio.Root
                  key={v}
                  value={v}
                  aria-label={getLabel(v)}
                  onPointerMove={onPointerMove(v)}
                  onClick={() => {
                    if (clearable && v === value) commit(0);
                  }}
                  className={`absolute inset-y-0 outline-none ${
                    steps.length === 1 ? "inset-x-0" : k === 0 ? "start-0 w-1/2" : "end-0 w-1/2"
                  } ${disabled ? "cursor-not-allowed" : "cursor-pointer"}`}
                />
              ))}
          </span>
        );
      })}
    </RadioGroup>
  );
}
