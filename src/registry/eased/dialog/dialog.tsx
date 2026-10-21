"use client";

import { AlertDialog as BaseAlertDialog } from "@base-ui/react/alert-dialog";
import { Dialog as BaseDialog } from "@base-ui/react/dialog";
import { useRef, type ComponentProps, type ReactNode } from "react";
import { backdropClass, bump, modalMotion, modalSurface, modalViewportClass } from "../_primitives/overlay-core/overlay-core";
import { Button, type ButtonEdge, type ButtonSize, type ButtonVariant } from "../button/button";

/**
 * A modal dialog on Base UI's Dialog, and an alert-dialog variant on Base UI's AlertDialog.
 * It rises 8px at 0.96 on the smooth spring over a blurred scrim, and leaves 4px in 160ms.
 * A dialog opened from inside another steps the parent back and dims it. The alert variant
 * refuses an outside click with a 1.5% bump instead of closing.
 */

/** Groups a dialog's parts and owns its open state (`open` / `defaultOpen` / `onOpenChange`). Modal by default. */
export const Dialog = BaseDialog.Root;

/** Closes the dialog. `<DialogClose render={<Button />}>Cancel</DialogClose>`. */
export const DialogClose = BaseDialog.Close;

/** Groups an alert dialog's parts. It cannot be dismissed by an outside click, only by its actions or Esc. */
export const AlertDialog = BaseAlertDialog.Root;

/** Closes the alert dialog. */
export const AlertDialogClose = BaseAlertDialog.Close;

export type DialogTriggerProps = Omit<ComponentProps<typeof BaseDialog.Trigger>, "className"> & {
  /** The Eased `Button` variant. Default "secondary". */
  variant?: ButtonVariant;
  /** The Eased `Button` size. Default "sm". */
  size?: ButtonSize;
  /** Pull a ghost trigger out by its own inset so its label lands on the content line (R104). */
  edge?: ButtonEdge;
  className?: string;
};

/**
 * The button that opens the dialog: an Eased `Button`, which never scales as a popup trigger
 * (R64). Focus returns here on close. Pass `render` to bring your own element.
 */
export function DialogTrigger({ variant = "secondary", size = "sm", edge, className = "", render, ...props }: DialogTriggerProps) {
  return <BaseDialog.Trigger {...props} render={render ?? <Button variant={variant} size={size} edge={edge} className={className} />} />;
}

export type AlertDialogTriggerProps = Omit<ComponentProps<typeof BaseAlertDialog.Trigger>, "className"> &
  Pick<DialogTriggerProps, "variant" | "size" | "edge" | "className">;

/** The button that opens an alert dialog. Same as `DialogTrigger`; default variant "danger". */
export function AlertDialogTrigger({ variant = "danger", size = "sm", edge, className = "", render, ...props }: AlertDialogTriggerProps) {
  return <BaseAlertDialog.Trigger {...props} render={render ?? <Button variant={variant} size={size} edge={edge} className={className} />} />;
}

const WIDTHS = { sm: "w-[24rem]", md: "w-[28rem]", lg: "w-[36rem]" } as const;
export type DialogSize = keyof typeof WIDTHS;

type ContentProps<P extends typeof BaseDialog | typeof BaseAlertDialog> = {
  /** Width: sm 384px, md 448px (default), lg 576px. Never wider than the screen less 32px. */
  size?: DialogSize;
  /** Where focus goes on open. Default: the first tabbable element (the popup itself on touch). */
  initialFocus?: ComponentProps<P["Popup"]>["initialFocus"];
  /** Where focus returns on close. Default: the trigger. */
  finalFocus?: ComponentProps<P["Popup"]>["finalFocus"];
  /** Portal target. Default `document.body`. */
  container?: HTMLElement | null;
  /** Skip the enter animation, e.g. when a keyboard shortcut opened it (rule 84). */
  instant?: boolean;
  /** Appended to the popup's classes. */
  className?: string;
  children?: ReactNode;
};

export type DialogContentProps = ContentProps<typeof BaseDialog> & {
  /** Show the close button in the top corner. Default true. */
  closeButton?: boolean;
  /** The close button's accessible name. Default "Close". */
  closeLabel?: string;
};

/**
 * The dialog: backdrop, viewport and popup. A raised 24px-corner surface with 24px padding
 * (20px under 640px); `--pad` and `--radius-outer` are exposed for concentric children. The
 * close button's icon sits on the content's right edge (R104).
 */
export function DialogContent({
  size = "md",
  initialFocus,
  finalFocus,
  container,
  instant,
  closeButton = true,
  closeLabel = "Close",
  className = "",
  children,
}: DialogContentProps) {
  return (
    <BaseDialog.Portal container={container}>
      <BaseDialog.Backdrop className={backdropClass} />
      <BaseDialog.Viewport className={modalViewportClass}>
        <BaseDialog.Popup
          initialFocus={initialFocus}
          finalFocus={finalFocus}
          data-instant={instant || undefined}
          className={`${modalSurface} ${modalMotion()} ${WIDTHS[size]} max-w-full p-(--pad) ${className}`}
        >
          {children}
          {closeButton && (
            // A positioned wrapper: Button is `relative` itself (for its spinner), so it can't be the absolute layer.
            <span className="absolute end-[calc(var(--pad)-8px)] top-[calc(var(--pad)-4px)] flex">
              <BaseDialog.Close render={<Button variant="ghost" size="icon-sm" hitArea={false} aria-label={closeLabel} />}>
                <CloseIcon />
              </BaseDialog.Close>
            </span>
          )}
        </BaseDialog.Popup>
      </BaseDialog.Viewport>
    </BaseDialog.Portal>
  );
}

export type AlertDialogContentProps = ContentProps<typeof BaseAlertDialog>;

/**
 * The alert dialog: the same surface, 384px by default, with no close button: the choice is
 * the footer's. A click outside bumps it 1.5% instead of closing it.
 */
export function AlertDialogContent({ size = "sm", initialFocus, finalFocus, container, instant, className = "", children }: AlertDialogContentProps) {
  const popup = useRef<HTMLDivElement>(null);
  return (
    <BaseAlertDialog.Portal container={container}>
      <BaseAlertDialog.Backdrop className={backdropClass} />
      <BaseAlertDialog.Viewport
        className={modalViewportClass}
        onPointerDown={(e) => {
          if (e.target !== e.currentTarget) return;
          bump(popup.current);
          // Keep focus inside the dialog: the outside click would otherwise drop it to <body>.
          if (!popup.current?.contains(document.activeElement)) popup.current?.focus();
        }}
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) e.preventDefault();
        }}
      >
        <BaseAlertDialog.Popup
          ref={popup}
          initialFocus={initialFocus}
          finalFocus={finalFocus}
          data-instant={instant || undefined}
          className={`${modalSurface} ${modalMotion()} ${WIDTHS[size]} max-w-full p-(--pad) ${className}`}
        >
          {children}
        </BaseAlertDialog.Popup>
      </BaseAlertDialog.Viewport>
    </BaseAlertDialog.Portal>
  );
}

type TextProps = { className?: string; children: ReactNode };

const TITLE = "pe-8 text-ui-md font-medium text-balance text-text";
const DESCRIPTION = "mt-1.5 text-ui text-pretty text-text-secondary";

/** The heading; labels the dialog. Leaves room for the close button. */
export function DialogTitle({ className = "", children }: TextProps) {
  return <BaseDialog.Title className={`${TITLE} ${className}`}>{children}</BaseDialog.Title>;
}

/** Supporting text under the title; describes the dialog. */
export function DialogDescription({ className = "", children }: TextProps) {
  return <BaseDialog.Description className={`${DESCRIPTION} ${className}`}>{children}</BaseDialog.Description>;
}

/** The alert dialog's heading. */
export function AlertDialogTitle({ className = "", children }: TextProps) {
  return <BaseAlertDialog.Title className={`${TITLE} pe-0 ${className}`}>{children}</BaseAlertDialog.Title>;
}

/** What will happen, in a sentence. */
export function AlertDialogDescription({ className = "", children }: TextProps) {
  return <BaseAlertDialog.Description className={`${DESCRIPTION} ${className}`}>{children}</BaseAlertDialog.Description>;
}

/** The dialog's content between the header and the footer: 20px below the description. */
export function DialogBody({ className = "", children }: TextProps) {
  return <div className={`mt-5 flex flex-col gap-4 ${className}`}>{children}</div>;
}

/**
 * The actions, right-aligned on the content's edge (R105), 24px below the body. Under 640px
 * they stack full width with the primary action on top. Put the primary action last.
 */
export function DialogFooter({ className = "", children }: TextProps) {
  return (
    <div className={`mt-6 flex items-center justify-end gap-2 max-sm:flex-col-reverse max-sm:items-stretch ${className}`}>{children}</div>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 16 16" className="size-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" aria-hidden>
      <path d="m4.5 4.5 7 7m0-7-7 7" />
    </svg>
  );
}
