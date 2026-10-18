"use client";

import {
  Fragment,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentProps,
  type ReactElement,
  type ReactNode,
} from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLinkItem,
  DropdownMenuTrigger,
} from "../dropdown-menu/dropdown-menu";
import { floatingTrigger } from "../_primitives/floating/floating";

export type BreadcrumbItem = {
  /** The visible label. Keep it short; long labels truncate. */
  label: ReactNode;
  /** Where the crumb goes. The last item is the current page and is never a link. */
  href?: string;
  /** For crumbs that act rather than navigate, e.g. opening a folder in place. */
  onClick?: () => void;
  /** A 16px icon before the label, e.g. a workspace logo on the first crumb. */
  icon?: ReactNode;
  /** The plain-text name used in the overflow menu and `title` when `label` is not a string. */
  textValue?: string;
};

export type BreadcrumbLinkProps = Omit<ComponentProps<"a">, "href"> & { href: string };

export type BreadcrumbProps = Omit<ComponentProps<"nav">, "children"> & {
  /** From the root to the current page. The last item is the current page. */
  items: readonly BreadcrumbItem[];
  /** `chevron` (default), `slash`, or your own glyph. */
  separator?: "chevron" | "slash" | ReactNode;
  /**
   * Fold middle crumbs into a "…" menu when the row would overflow its container: the first
   * crumb and as many trailing ones as fit stay. Default true.
   */
  collapse?: boolean;
  /** `sm` is 13px (toolbars, cards); `md` is 14px (page headers). Default "md". */
  size?: "sm" | "md";
  /**
   * Your router's link, e.g. `(props) => <Link {...props} />`. It receives the href, the classes
   * and the children. Default: a plain `<a>`.
   */
  renderLink?: (props: BreadcrumbLinkProps) => ReactElement;
  /** The landmark's name. Default "Breadcrumb". */
  "aria-label"?: string;
  className?: string;
};

// The "…" trigger is pulled out by its own inset, so its dots sit one gap from each separator.
const SIZES = {
  sm: { text: "text-ui-sm", gap: "gap-1.5", trigger: "-mx-1 size-6 rounded-control-xs" },
  md: { text: "text-ui", gap: "gap-2", trigger: "-mx-1.5 size-7 rounded-control-xs" },
} as const;

const Chevron = () => (
  <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M6.5 4l4 4-4 4" />
  </svg>
);

const Slash = () => (
  <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden>
    <path d="M10 2.5 6 13.5" />
  </svg>
);

const Dots = () => (
  <svg viewBox="0 0 16 16" className="size-4" fill="currentColor" aria-hidden>
    <circle cx="3.5" cy="8" r="1.25" />
    <circle cx="8" cy="8" r="1.25" />
    <circle cx="12.5" cy="8" r="1.25" />
  </svg>
);

// The underline is there at rest in a transparent colour and tweens in with the text colour,
// as Eased's other links do (150ms, standard curve); it never draws on touch.
const LINK =
  "inline-flex min-w-0 items-center gap-1.5 rounded-control-2xs text-text-muted underline decoration-transparent decoration-1 underline-offset-4 [transition:color_150ms_var(--eased-ease-standard),text-decoration-color_150ms_var(--eased-ease-standard),box-shadow_var(--eased-duration-focus)_var(--eased-ease-standard)] focus-ring hover-fine:text-text hover-fine:decoration-line-strong active:text-text";

const textOf = (item: BreadcrumbItem) => item.textValue ?? (typeof item.label === "string" || typeof item.label === "number" ? String(item.label) : undefined);

/**
 * A trail from the root to the current page. When the row runs out of room, the middle
 * crumbs fold into a "…" menu (the Eased Dropdown Menu) so the root and the current page stay
 * readable; the fit is measured, not guessed, so it holds for any label and any container.
 * Links underline on hover in the same 150ms tween as Eased's other links.
 */
export function Breadcrumb({
  items,
  separator = "chevron",
  collapse = true,
  size = "md",
  renderLink,
  "aria-label": ariaLabel = "Breadcrumb",
  className = "",
  ...rest
}: BreadcrumbProps) {
  const s = SIZES[size];
  const rootRef = useRef<HTMLElement>(null);
  const ghostRef = useRef<HTMLOListElement>(null);
  // How many crumbs after the first are folded into the menu (items 1 … hidden).
  const [hidden, setHidden] = useState(0);
  const n = items.length;

  useLayoutEffect(() => {
    const root = rootRef.current;
    const ghost = ghostRef.current;
    if (!root || !ghost || !collapse || n < 3) {
      setHidden(0);
      return;
    }
    const measure = () => {
      const width = root.clientWidth;
      const parts = [...ghost.querySelectorAll<HTMLElement>("[data-crumb]")].map((el) => el.getBoundingClientRect().width);
      const more = ghost.querySelector<HTMLElement>("[data-more]")?.getBoundingClientRect().width ?? 0;
      const gap = parseFloat(getComputedStyle(ghost).columnGap) || 0;
      // Each crumb but the last is followed by a separator; the ghost measures them as pairs.
      const sum = (from: number, to: number) => parts.slice(from, to).reduce((a, b) => a + b + gap, 0);
      if (sum(0, n) - gap <= width + 0.5) return setHidden(0);
      // Keep the first crumb, the "…" and as many trailing crumbs as fit; at least the last.
      for (let tail = n - 2; tail >= 1; tail--) {
        if (sum(0, 1) + more + gap + sum(n - tail, n) - gap <= width + 0.5) return setHidden(n - 1 - tail);
      }
      setHidden(n - 2);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(root);
    ro.observe(ghost);
    // Labels change width when a web font arrives after the first measure.
    let live = true;
    document.fonts?.ready.then(() => live && measure());
    document.fonts?.addEventListener("loadingdone", measure);
    return () => {
      live = false;
      ro.disconnect();
      document.fonts?.removeEventListener("loadingdone", measure);
    };
  }, [collapse, n, items]);

  const sep =
    separator === "chevron" ? <Chevron /> : separator === "slash" ? <Slash /> : separator;

  const Separator = () => (
    <li role="presentation" aria-hidden className="flex shrink-0 items-center text-text-muted">
      {sep}
    </li>
  );

  const crumb = (item: BreadcrumbItem, current: boolean) => {
    const title = textOf(item);
    const inner = (
      <>
        {item.icon && <span className="flex size-4 shrink-0 items-center justify-center [&_svg]:size-4">{item.icon}</span>}
        <span className="truncate">{item.label}</span>
      </>
    );
    if (current) {
      return (
        <span aria-current="page" title={title} className="inline-flex min-w-0 items-center gap-1.5 font-medium text-text">
          {inner}
        </span>
      );
    }
    if (item.href) {
      const props: BreadcrumbLinkProps = { href: item.href, onClick: item.onClick, title, className: LINK, children: inner };
      return renderLink ? renderLink(props) : <a {...props} />;
    }
    return (
      <button type="button" onClick={item.onClick} title={title} className={`cursor-pointer ${LINK}`}>
        {inner}
      </button>
    );
  };

  const folded = items.slice(1, 1 + hidden);
  const more = (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`${folded.length} more`}
        render={
          <button
            type="button"
            className={`inline-flex shrink-0 items-center justify-center text-text-muted hover-fine:bg-surface-hover hover-fine:text-text data-popup-open:bg-surface-active data-popup-open:text-text ${floatingTrigger} ${s.trigger}`}
          />
        }
      >
        <Dots />
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {folded.map((item, i) =>
          item.href ? (
            <DropdownMenuLinkItem key={i} href={item.href} icon={item.icon}>
              {textOf(item) ?? item.label}
            </DropdownMenuLinkItem>
          ) : (
            <DropdownMenuItem key={i} icon={item.icon} onClick={item.onClick}>
              {textOf(item) ?? item.label}
            </DropdownMenuItem>
          ),
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <nav ref={rootRef} aria-label={ariaLabel} {...rest} className={`relative min-w-0 ${s.text} ${className}`}>
      <ol className={`flex min-w-0 items-center ${s.gap}`}>
        {items.map((item, i) => {
          if (i >= 1 && i <= hidden) {
            return i === 1 ? (
              <Fragment key="more">
                <li className="flex shrink-0">{more}</li>
                <Separator />
              </Fragment>
            ) : null;
          }
          const current = i === n - 1;
          return (
            <Fragment key={i}>
              {/* The current page takes what is left and truncates; ancestors cap at 12rem. */}
              <li className={`flex items-center ${current ? "min-w-0" : "min-w-0 max-w-48 shrink-0"}`}>{crumb(item, current)}</li>
              {!current && <Separator />}
            </Fragment>
          );
        })}
      </ol>

      {/* The measuring copy: every crumb with its separator, and the "…" trigger, unconstrained. */}
      {collapse && n >= 3 && (
        <ol ref={ghostRef} aria-hidden inert className={`pointer-events-none invisible absolute top-0 left-0 flex h-0 items-center overflow-hidden whitespace-nowrap ${s.gap}`}>
          {items.map((item, i) => (
            <li key={i} data-crumb className={`flex items-center ${s.gap}`}>
              <span className={`flex items-center gap-1.5 ${i === n - 1 ? "font-medium" : "max-w-48"}`}>
                {item.icon && <span className="size-4 shrink-0" />}
                <span className="truncate">{item.label}</span>
              </span>
              {i < n - 1 && <span className="flex shrink-0">{sep}</span>}
            </li>
          ))}
          <li data-more className={`flex shrink-0 ${s.gap}`}>
            <span className={`shrink-0 ${s.trigger}`} />
            <span className="flex shrink-0">{sep}</span>
          </li>
        </ol>
      )}
    </nav>
  );
}
