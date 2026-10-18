"use client";

import { Avatar as BaseAvatar } from "@base-ui/react/avatar";
import { Children, isValidElement, useState, type CSSProperties, type ReactNode } from "react";
import { NumberRoll } from "../_primitives/number-roll/number-roll";
import { duration } from "../lib/motion";

export type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl";

export type AvatarProps = {
  /** The person's name: the accessible name and the source of the fallback initials. */
  name: string;
  /** Image URL. While it loads the avatar shows a quiet tile; initials appear only if it fails or is missing. */
  src?: string;
  /** Override the initials, e.g. for a team or a bot. Defaults to the first and last name's initials. */
  initials?: string;
  /** 20, 24, 32 (default), 40 or 48px. */
  size?: AvatarSize;
  /** `circle` (default) or `square`, which takes the control radius for its size; 48px squares get a superellipse. */
  shape?: "circle" | "square";
  className?: string;
};

const SIZES: Record<AvatarSize, { box: string; text: string; square: string; overlap: string }> = {
  xs: { box: "size-5", text: "text-ui-2xs", square: "rounded-control-2xs", overlap: "-ml-1" },
  sm: { box: "size-6", text: "text-ui-2xs", square: "rounded-control-xs", overlap: "-ml-1.5" },
  md: { box: "size-8", text: "text-ui-xs", square: "rounded-control-sm", overlap: "-ml-2" },
  lg: { box: "size-10", text: "text-ui", square: "rounded-control", overlap: "-ml-2.5" },
  xl: { box: "size-12", text: "text-ui-md", square: "rounded-panel squircle", overlap: "-ml-3" },
};

/** "Maya Okafor" → "MO"; "maya" → "M". 20px avatars keep one letter. */
export function initialsOf(name: string, max = 2) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const picked = words.length > 1 ? [words[0], words[words.length - 1]] : words;
  return picked
    .slice(0, max)
    .map((w) => [...w][0]?.toLocaleUpperCase() ?? "")
    .join("");
}

/** How long a loading image may keep the tile blank before the initials show anyway, ms. */
const FALLBACK_DELAY = duration.fallback * 1000;

/**
 * A profile picture on Base UI's Avatar. The image fades in from a 4px blur once it has
 * loaded, so a fast image never flashes the initials first; a slow, failed or missing image
 * falls back to initials. Every avatar wears a 1px alpha ring so photos keep an edge on any
 * background.
 */
export function Avatar({ name, src, initials, size = "md", shape = "circle", className = "" }: AvatarProps) {
  const s = SIZES[size];
  const [status, setStatus] = useState<"idle" | "loading" | "loaded" | "error">("idle");
  // No image or a failed one: initials at once. Loading: wait, so a quick image arrives first.
  const delay = src && status !== "error" ? FALLBACK_DELAY : 0;
  const letters = initials ?? initialsOf(name, size === "xs" ? 1 : 2);

  return (
    <BaseAvatar.Root
      role="img"
      aria-label={name}
      className={`image-ring inline-flex shrink-0 items-center justify-center overflow-hidden bg-surface-active align-middle font-medium text-text-secondary select-none ${s.box} ${
        shape === "circle" ? "rounded-pill" : s.square
      } ${className}`}
    >
      {src && (
        <BaseAvatar.Image
          src={src}
          alt=""
          onLoadingStatusChange={setStatus}
          className="size-full object-cover transition-[opacity,filter] duration-(--eased-duration-standard) ease-enter data-starting-style:opacity-0 data-starting-style:blur-[4px] reduced:duration-(--eased-duration-instant) reduced:data-starting-style:blur-none"
        />
      )}
      <BaseAvatar.Fallback
        delay={delay}
        aria-hidden
        className={`leading-none transition-opacity duration-(--eased-duration-fast) ease-standard starting:opacity-0 ${s.text}`}
      >
        {letters}
      </BaseAvatar.Fallback>
    </BaseAvatar.Root>
  );
}

export type AvatarGroupProps = {
  /** `Avatar` elements. Their `size` is set by the group. */
  children: ReactNode;
  /** Show at most this many; the rest collapse into a rolling "+N" tile. */
  max?: number;
  size?: AvatarSize;
  shape?: "circle" | "square";
  /** The group's accessible name, e.g. "Design team". */
  "aria-label"?: string;
  /**
   * The colour of the cut-out ring that separates overlapping avatars; match the surface the
   * group sits on. Default `var(--eased-surface)`.
   */
  cutout?: string;
  className?: string;
};

/**
 * Overlapping avatars with a cut-out ring between them. On a fine pointer (or when focus is
 * inside) the stack spreads apart on a spring so each face can be seen; the overflow count rolls.
 */
export function AvatarGroup({
  children,
  max,
  size = "md",
  shape = "circle",
  "aria-label": ariaLabel,
  cutout = "var(--eased-surface)",
  className = "",
}: AvatarGroupProps) {
  const s = SIZES[size];
  const items = Children.toArray(children).filter(isValidElement<AvatarProps>);
  const shown = max !== undefined && items.length > max ? items.slice(0, Math.max(0, max - 1)) : items;
  const rest = items.length - shown.length;
  const radius = shape === "circle" ? "rounded-pill" : s.square;
  const spread =
    "transition-[translate] duration-(--eased-duration-spring-snappy) ease-spring-snappy reduced:transition-none";

  return (
    <div
      role="group"
      aria-label={ariaLabel}
      style={{ "--avatar-cutout": cutout } as CSSProperties}
      className={`isolate flex items-center hover-fine:[&>*]:translate-x-[calc(var(--i)*0.25rem)] focus-within:[&>*]:translate-x-[calc(var(--i)*0.25rem)] reduced:[&>*]:translate-x-0! ${className}`}
    >
      {shown.map((item, i) => (
        <span
          key={item.key ?? i}
          style={{ "--i": i, zIndex: shown.length - i } as CSSProperties}
          className={`${i > 0 ? s.overlap : ""} inline-flex ${radius} ring-2 ring-(--avatar-cutout) ${spread}`}
        >
          <Avatar {...item.props} size={size} shape={shape} />
        </span>
      ))}
      {rest > 0 && (
        <span
          role="img"
          aria-label={`and ${rest} more`}
          style={{ "--i": shown.length } as CSSProperties}
          className={`${shown.length > 0 ? s.overlap : ""} inline-flex ${s.box} ${radius} items-center justify-center bg-surface-hover font-medium text-text-secondary ring-2 ring-(--avatar-cutout) ${s.text} ${spread}`}
        >
          <span aria-hidden className="inline-flex leading-none">
            +<NumberRoll value={rest} aria-hidden />
          </span>
        </span>
      )}
    </div>
  );
}
