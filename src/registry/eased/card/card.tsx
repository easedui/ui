"use client";

import { useRender } from "@base-ui/react/use-render";
import type { ComponentProps } from "react";
import { AutoHeight } from "../_primitives/auto-height/auto-height";

export type CardSize = "default" | "sm";

export type CardProps = ComponentProps<"div"> & {
  /** default: comfortable, 24px padding and a 16px title. sm: dense, 16px padding and a 14px title, for grids of tiles. */
  size?: CardSize;
  /**
   * Spring the card's height when its content changes (a list expanding, a form turning into
   * a confirmation), so what sits below glides instead of jumping. Default false.
   */
  autoHeight?: boolean;
};

// Padding is `--pad` on the root, so the parts and any `radius-nested` child read it (rule 100).
// The gap between parts is ⅔ of it (rule 111). Gap and radius go through variables because
// Tailwind sorts `gap-(--x)` before `gap-0` and `rounded-(--x)` before `rounded-none`: a
// `className="gap-0"` or `rounded-none` from shadcn markup wins without tailwind-merge.
const SIZE: Record<CardSize, string> = {
  default: "[--pad:--spacing(6)] [--card-gap:--spacing(4)]",
  sm: "[--pad:--spacing(4)] [--card-gap:--spacing(3)]",
};

// All of it waits on a CardLink inside; a card without one never moves. Written out in full
// so Tailwind sees every class.
const LINKED = [
  // Hover lift (rule 13): shadow-raised on a layer behind the content, cross-faded rather than
  // animating box-shadow (rule 14). Only while the pointer is over the link's area, not an action.
  "before:pointer-events-none before:absolute before:-inset-px before:-z-1 before:rounded-[inherit] before:opacity-0 before:shadow-raised before:[transition:opacity_var(--eased-duration-standard)_var(--eased-ease-standard)]",
  "hover-fine:has-[[data-slot=card-link]:hover]:border-line-strong hover-fine:has-[[data-slot=card-link]:hover]:before:opacity-100",
  // Press like any control wider than 220px (rule 63): down in 100ms, back on the snappy spring.
  "[transition:border-color_150ms_var(--eased-ease-standard),scale_var(--eased-duration-spring-snappy)_var(--eased-spring-snappy),box-shadow_var(--eased-duration-focus)_var(--eased-ease-standard)]",
  "has-[[data-slot=card-link]:active]:scale-(--eased-press-scale-wide) has-[[data-slot=card-link]:active]:duration-(--eased-duration-instant) has-[[data-slot=card-link]:active]:ease-standard reduced:has-[[data-slot=card-link]:active]:scale-none",
  // Keyboard focus rings the whole card with focus-ring's ring; the outline shows in forced colours.
  "outline-offset-2 outline-transparent has-[[data-slot=card-link]:focus-visible]:outline-2 has-[[data-slot=card-link]:focus-visible]:shadow-[0_0_0_2px_var(--eased-bg),0_0_0_4px_var(--eased-ring)]",
].join(" ");

/**
 * A surface that groups one subject: a title, what it is about and what to do with it. The
 * parts and their `data-slot`s match shadcn/ui's Card, so it swaps in. A static card holds
 * still. Put a CardLink in it and the whole card becomes the link: it lifts on hover, presses
 * to 0.985 and rings on keyboard focus. `autoHeight` springs the height when content changes.
 */
export function Card({ size = "default", autoHeight = false, className = "", children, ...props }: CardProps) {
  const body = "flex flex-col gap-(--card-gap) py-(--pad)";
  return (
    <div
      {...props}
      data-slot="card"
      data-size={size}
      className={`group/card relative isolate rounded-(--radius-outer) border border-line-subtle bg-surface text-ui text-text [--radius-outer:var(--eased-radius-panel)] ${SIZE[size]} ${LINKED} ${autoHeight ? "" : body} ${className}`}
    >
      {autoHeight ? (
        <AutoHeight>
          <div className={body}>{children}</div>
        </AutoHeight>
      ) : (
        children
      )}
    </div>
  );
}

/** Title and description, with a CardAction beside them when there is one. */
export function CardHeader({ className = "", ...props }: ComponentProps<"div">) {
  return (
    <div
      {...props}
      data-slot="card-header"
      className={`@container/card-header grid auto-rows-min items-start gap-(--card-header-gap) px-(--pad) [--card-header-gap:--spacing(1)_--spacing(4)] has-data-[slot=card-action]:grid-cols-[minmax(0,1fr)_auto] [.border-b]:pb-(--pad) ${className}`}
    />
  );
}

export type CardTitleProps = useRender.ComponentProps<"div">;

/** One line in sentence case. A div, as in shadcn; pass `render={<h3 />}` to put it in the outline. */
export function CardTitle({ render, className = "", ...props }: CardTitleProps) {
  return useRender({
    defaultTagName: "div",
    render,
    props: {
      ...props,
      "data-slot": "card-title",
      className: `min-w-0 text-ui-md font-medium text-text text-balance break-words group-data-[size=sm]/card:text-ui ${className}`,
    },
  });
}

/** What the card is about, under the title. */
export function CardDescription({ className = "", ...props }: ComponentProps<"div">) {
  return (
    <div
      {...props}
      data-slot="card-description"
      className={`text-ui text-text-secondary text-pretty group-data-[size=sm]/card:text-ui-sm ${className}`}
    />
  );
}

/**
 * A control or badge at the header's trailing edge, centred on the title's first line (rule
 * 107). It sits above a CardLink's hit area, so it stays clickable in a linked card.
 */
export function CardAction({ className = "", ...props }: ComponentProps<"div">) {
  return (
    <div
      {...props}
      data-slot="card-action"
      className={`relative z-1 col-start-2 row-span-2 row-start-1 flex h-[1lh] items-center self-start justify-self-end text-ui-md group-data-[size=sm]/card:text-ui ${className}`}
    />
  );
}

export function CardContent({ className = "", ...props }: ComponentProps<"div">) {
  return <div {...props} data-slot="card-content" className={`px-(--pad) ${className}`} />;
}

export function CardFooter({ className = "", ...props }: ComponentProps<"div">) {
  return <div {...props} data-slot="card-footer" className={`flex items-center px-(--pad) [.border-t]:pt-(--pad) ${className}`} />;
}

export type CardLinkProps = useRender.ComponentProps<"a">;

/**
 * Makes the whole card the link (rule 59): its hit area stretches over the card, and the card
 * lifts, presses and rings for it. Wrap the title text in it so the link's name is the title.
 * An `<a>`; pass `render={<Link href="…" />}` for a router link or `render={<button type="button" />}`
 * for a card that acts in place. Controls elsewhere in a linked card need `relative z-1`.
 */
export function CardLink({ render, className = "", ...props }: CardLinkProps) {
  return useRender({
    defaultTagName: "a",
    render,
    props: {
      ...props,
      "data-slot": "card-link",
      className: `cursor-pointer text-start outline-none after:absolute after:inset-0 after:rounded-(--radius-outer) ${className}`,
    },
  });
}
