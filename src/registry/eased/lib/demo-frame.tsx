import type { ReactNode } from "react";

export type DemoFrameProps = {
  /** Header title. Leave it out for demos that draw their own app chrome. */
  title?: ReactNode;
  /** Muted text on the right of the header, e.g. "5 items". */
  meta?: ReactNode;
  /**
   * Controls on the right of the header. Bordered and filled controls sit on the 16px content
   * line; pass ghost buttons `edge="end"` so their icon or label lands on it instead.
   */
  actions?: ReactNode;
  /** Extra classes for the root, e.g. `select-none`. */
  className?: string;
  children: ReactNode;
};

/**
 * The standard Eased demo shell: 420px tall, 28rem wide unless a parent sets `--demo-width`,
 * shrinks to its container (never forces
 * horizontal scroll), 16px panel radius, and a 48px header with one title style. The root
 * is a size container, so demos adapt to the tile with `@max-sm:` and friends rather than
 * the viewport, and it exposes `--radius-outer`/`--pad` for concentric children. It sets
 * Eased's UI type (`text-ui`) and text colour, so a demo reads the same in any app.
 */
export function DemoFrame({ title, meta, actions, className = "", children }: DemoFrameProps) {
  return (
    <div
      className={`@container relative flex h-[420px] w-full max-w-(--demo-width,28rem) min-w-0 flex-col overflow-hidden rounded-panel border border-line-subtle bg-surface text-ui text-text [--pad:16px] [--radius-outer:var(--eased-radius-panel)] ${className}`}
    >
      {title !== undefined && (
        <div
          className="flex h-12 shrink-0 items-center justify-between gap-3 border-b border-line-subtle px-(--pad)"
        >
          <div className="flex min-w-0 items-center gap-2 text-ui font-medium text-text">
            {typeof title === "string" ? <p className="truncate">{title}</p> : title}
          </div>
          {(meta !== undefined || actions) && (
            <div className="flex shrink-0 items-center gap-2">
              {meta !== undefined && <div className="text-ui-sm text-text-muted tabular-nums">{meta}</div>}
              {actions}
            </div>
          )}
        </div>
      )}
      {children}
    </div>
  );
}
