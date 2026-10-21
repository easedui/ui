"use client";

import { Toast as BaseToast } from "@base-ui/react/toast";
import type { ToastManager, ToastManagerAddOptions, ToastManagerUpdateOptions, ToastObject } from "@base-ui/react/toast";
import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState, useSyncExternalStore, type CSSProperties, type ReactNode } from "react";
import { panelSurface, TOAST } from "../_primitives/overlay-core/overlay-core";
import { Button } from "../button/button";
import { exitFast, fade, reducedFade, snappy, useSafeReducedMotion } from "../lib/motion";
import { pressIcon } from "../lib/press";
import { Spinner } from "../spinner/spinner";
import { TextSwap } from "../text-swap/text-swap";

/**
 * A stacked toast manager on Base UI Toast. Toasts rise 12px at 0.97 on the smooth spring and
 * stack behind the newest, each peeking 10px and 5% smaller; hovering or focusing the stack
 * fans it out 8px apart and pauses every timer. Promise toasts morph in place: the spinner
 * becomes a check that draws in, and the title swaps with TextSwap.
 */

export type ToastType = "default" | "success" | "error" | "loading";
export type ToastPosition = "bottom-right" | "bottom-center" | "top-center" | "top-right";
export type ToastSwipeDirection = "up" | "down" | "left" | "right";

/** Custom data Eased reads from a toast. */
export type ToastData = {
  /** Replaces the status icon (16px). Default: none for "default", a glyph for the other types. */
  icon?: ReactNode;
};

export type ToastAction = {
  /** The button's label, e.g. "Undo". */
  label: string;
  /** Runs on click. The toast closes afterwards unless you return `false`. */
  onClick: () => void | false;
};

export type ToastOptions = Omit<ToastManagerAddOptions<ToastData>, "type"> & {
  /** "default" (no icon), "success", "error" or "loading" (a spinner; never times out). */
  type?: ToastType;
  /** One action button, e.g. `{ label: "Undo", onClick: restore }`. Shorthand for `actionProps`. */
  action?: ToastAction;
};

export type ToastUpdate = Omit<ToastManagerUpdateOptions<ToastData>, "type"> & { type?: ToastType; action?: ToastAction };

export type ToastPromiseOptions<Value> = {
  /** Shown while the promise is pending: a title, or options. */
  loading: string | ToastUpdate;
  /** Shown when it resolves: a title, options, or a function of the result. */
  success: string | ToastUpdate | ((result: Value) => string | ToastUpdate);
  /** Shown when it rejects: a title, options, or a function of the error. */
  error: string | ToastUpdate | ((error: unknown) => string | ToastUpdate);
};

/** What `useToast()` and `createToastApi()` return. Every method returns or takes a toast id. */
export type ToastApi = {
  /** Shows a toast and returns its id. Passing an existing `id` updates that toast in place. */
  add: (options: ToastOptions) => string;
  /** A success toast: a check icon. */
  success: (title: ReactNode, options?: Omit<ToastOptions, "title" | "type">) => string;
  /** An error toast: an alert icon, announced urgently (`priority: "high"`) unless you say otherwise. */
  error: (title: ReactNode, options?: Omit<ToastOptions, "title" | "type">) => string;
  /** One toast that follows a promise: loading, then success or error, morphing in place. Returns the promise. */
  promise: <Value>(promise: Promise<Value>, options: ToastPromiseOptions<Value>) => Promise<Value>;
  /** Changes a toast in place (title, type, description …); its timer restarts. */
  update: (id: string, options: ToastUpdate) => void;
  /** Closes one toast, or every toast when `id` is left out. */
  close: (id?: string) => void;
};

type Methods = Pick<ToastManager<ToastData>, "add" | "update" | "close">;

let seq = 0;

const asOptions = (o: string | ToastUpdate): ToastUpdate => (typeof o === "string" ? { title: o } : o);

function bind(manager: Methods): ToastApi {
  // `action` needs the id before the toast exists, so it can close the toast after running.
  const resolve = <T extends ToastOptions | ToastUpdate>(id: string, { action, ...options }: T) =>
    action
      ? {
          ...options,
          actionProps: {
            children: action.label,
            onClick: () => {
              if (action.onClick() !== false) manager.close(id);
            },
          },
        }
      : options;
  const add = (options: ToastOptions) => {
    const id = options.id ?? `eased-toast-${++seq}`;
    return manager.add({ ...resolve(id, options), id });
  };
  return {
    add,
    success: (title, options) => add({ ...options, title, type: "success" }),
    error: (title, options) => add({ priority: "high", ...options, title, type: "error" }),
    update: (id, options) => manager.update(id, resolve(id, options)),
    close: (id) => manager.close(id),
    // Built on add + update rather than Base UI's `promise`, so `action` works in every state.
    promise: (promise, { loading, success, error }) => {
      const id = add({ ...asOptions(loading), type: "loading" });
      promise.then(
        (result) => manager.update(id, resolve(id, { ...asOptions(typeof success === "function" ? success(result) : success), type: "success" })),
        (reason: unknown) =>
          manager.update(id, resolve(id, { priority: "high", ...asOptions(typeof error === "function" ? error(reason) : error), type: "error" })),
      );
      return promise;
    },
  };
}

/** Creates a manager to pass to `Toaster`'s `toastManager`, for toasts queued outside React. */
export const createToastManager = BaseToast.createToastManager<ToastData>;

/**
 * The same methods as `useToast()`, bound to a global manager, so any module can toast:
 * `export const toastManager = createToastManager(); export const toast = createToastApi(toastManager);`
 * then `<Toaster toastManager={toastManager} />` and `toast.success("Saved")` anywhere.
 */
export function createToastApi(manager: ToastManager<ToastData>): ToastApi {
  return bind(manager);
}

/** Toast methods for components inside a `Toaster`: `{ add, success, error, promise, update, close }`. */
export function useToast(): ToastApi {
  const { add, update, close } = BaseToast.useToastManager<ToastData>();
  return useMemo(() => bind({ add, update, close }), [add, update, close]);
}

const MOBILE = "(max-width: 639.98px)";
const subscribeMobile = (onChange: () => void) => {
  const mq = window.matchMedia(MOBILE);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
};

// Where the viewport sits. Under 640px every position becomes full-width at the bottom, above the
// home indicator (the bottom offset clears `safe-area-inset-bottom`).
const PLACEMENT: Record<ToastPosition, string> = {
  "bottom-right": "bottom-4 right-4",
  "bottom-center": "bottom-4 inset-x-0 mx-auto",
  "top-center": "top-4 inset-x-0 mx-auto",
  "top-right": "top-4 right-4",
};
const MOBILE_PLACEMENT =
  "max-sm:inset-x-4 max-sm:top-auto max-sm:bottom-[max(16px,env(safe-area-inset-bottom))] max-sm:mx-0 max-sm:w-auto max-sm:max-w-none";

/*
 * Which edge the stack grows from. Each toast reads these from the viewport: the stack's
 * direction (`--dir`, −1 grows upward), the edge toasts anchor to and scale from, and which side
 * of a collapsed toast is cut (see TOAST_ROOT).
 */
const SIDE = {
  bottom: "[--dir:-1] [--toast-top:auto] [--toast-bottom:0px] [--toast-origin:bottom] [--toast-far-top:0] [--toast-near:12px]",
  top: "[--dir:1] [--toast-top:0px] [--toast-bottom:auto] [--toast-origin:top] [--toast-far-top:1] [--toast-near:36px]",
} as const;

// TOAST's numbers as the variables the classes below read (an inline style is safe here:
// nothing overrides these; the reduced branch overrides the per-toast copies).
const TOAST_VARS = {
  "--toast-rise": `${TOAST.y}px`,
  "--toast-from": TOAST.scale,
  "--toast-fade": `${TOAST.fade}ms`,
  "--toast-exit": `${TOAST.exit}ms`,
  "--toast-peek": `${TOAST.peek}px`,
  "--toast-shrink": TOAST.shrink,
  "--toast-gap": `${TOAST.gap}px`,
} as CSSProperties;

/*
 * The stack, without animating height (rule 75).
 *
 * Base UI's demo clamps every toast to the frontmost toast's height and transitions `height`.
 * Here each toast keeps its natural height (Base UI still measures it for `--toast-offset-y`).
 * The card's material is a separate layer (`TOAST_CARD`); while collapsed, a back toast taller
 * than the front slides that layer down by the difference (`--c`), so its top edge, border and
 * rounded corners sit exactly where a front-height card would, and the toast itself moves so
 * that edge peeks 10px past the one in front. The part of the layer that now overhangs the
 * toast's anchored edge is cut with `clip-path: inset()`, at a line that lies behind the front
 * toast; the other three sides get negative insets so the shadow is never clipped, and the
 * near side's inset also trims the toast's invisible upper part out of hit-testing. Expanding
 * slides the layer back on the same spring as the position; the clip itself switches at once,
 * since a clip that interpolates would show the cut mid-flight. Everything that moves is
 * `transform`, so a 3-toast stack costs nothing per frame.
 *
 * Swipe: Base UI writes `--toast-swipe-movement-x/y` (and an inline transform while dragging);
 * the transform below always adds them, so the release carries on from where the finger left.
 */
const TOAST_ROOT = [
  "group absolute inset-x-0 top-(--toast-top) bottom-(--toast-bottom) origin-(--toast-origin) z-[calc(1000_-_var(--toast-index))] select-none outline-none",
  // Geometry: index, scale, natural and front heights, the visible height, the cut.
  "[--i:var(--toast-index)] [--s:max(0,_1_-_var(--i)_*_var(--toast-shrink))]",
  "[--h:var(--toast-height,0px)] [--front:var(--toast-frontmost-height,var(--h))] [--v:min(var(--h),var(--front))] [--c:calc(var(--h)_-_var(--v))]",
  "[--y:calc(var(--dir)_*_(var(--front)_-_var(--v)_*_var(--s)_+_var(--i)_*_var(--toast-peek)))]",
  "data-expanded:[--s:1] data-expanded:[--c:0px] data-expanded:[--y:calc(var(--dir)_*_(var(--toast-offset-y)_+_var(--i)_*_var(--toast-gap)))]",
  // Enter / exit offsets; the reduced branch zeroes them so only opacity moves.
  "[--rise:var(--toast-rise)] [--from:var(--toast-from)] [--fling:100%] [--ex:0px] [--ey:0px] [--es:1]",
  "reduced:[--rise:0px] reduced:[--from:1] reduced:[--fling:0%]",
  "[transform:translateX(calc(var(--toast-swipe-movement-x)_+_var(--ex)))_translateY(calc(var(--y)_+_var(--toast-swipe-movement-y)_+_var(--ey)))_scale(calc(var(--s)_*_var(--es)))]",
  // Clip: the far side cuts at the anchored edge only while the card layer overhangs it.
  "[--far:min(0px,calc(var(--c)_*_100_-_48px))] [--near:calc(var(--c)_-_var(--toast-near))]",
  "[clip-path:inset(calc(var(--toast-far-top)_*_var(--far)_+_(1_-_var(--toast-far-top))_*_var(--near))_-48px_calc((1_-_var(--toast-far-top))_*_var(--far)_+_var(--toast-far-top)_*_var(--near))_-48px)]",
  // Position on the smooth spring, opacity on a 200ms tween.
  "[transition-property:transform,opacity] [transition-duration:var(--eased-duration-spring-smooth),var(--toast-fade)] [transition-timing-function:var(--eased-spring-smooth),var(--eased-ease-enter)]",
  "data-starting-style:opacity-0 data-starting-style:[--ey:calc(var(--dir)_*_-1_*_var(--rise))] data-starting-style:[--es:var(--from)]",
  // Exit: half the distance and half the scale, 150ms, no overshoot. A swipe carries on its way.
  "data-ending-style:opacity-0 data-ending-style:[--ey:calc(var(--dir)_*_-0.5_*_var(--rise))] data-ending-style:[--es:calc(0.5_+_var(--from)_*_0.5)] data-ending-style:[transition-duration:var(--toast-exit)] data-ending-style:[transition-timing-function:var(--eased-ease-standard)]",
  "data-ending-style:data-swipe-direction:[--es:1] data-ending-style:data-swipe-direction:[transition-duration:var(--eased-duration-standard)]",
  "data-ending-style:data-[swipe-direction=down]:[--ey:var(--fling)] data-ending-style:data-[swipe-direction=up]:[--ey:calc(var(--fling)_*_-1)]",
  "data-ending-style:data-[swipe-direction=right]:[--ey:0px] data-ending-style:data-[swipe-direction=right]:[--ex:var(--fling)] data-ending-style:data-[swipe-direction=left]:[--ey:0px] data-ending-style:data-[swipe-direction=left]:[--ex:calc(var(--fling)_*_-1)]",
  // Past the limit: Base UI keeps it mounted and inert; it fades out.
  "data-limited:opacity-0",
  "reduced:[transition-duration:0ms,var(--eased-duration-instant)] reduced:data-ending-style:[transition-duration:0ms,var(--eased-duration-instant)]",
  // While expanded, fill the gaps between toasts so the pointer never falls through and collapses the stack.
  "after:pointer-events-auto after:absolute after:inset-x-0 after:-inset-y-(--toast-gap) after:-z-1 after:hidden after:content-[''] data-expanded:after:block",
].join(" ");

// The focus ring lives on the card, not the root: the root's transition list is the motion's.
const TOAST_CARD = `${panelSurface} absolute inset-0 outline-(--eased-ring) group-focus-visible:outline-2 group-focus-visible:outline-solid group-focus-visible:outline-offset-2 [transform:translateY(calc(var(--dir)_*_-1_*_var(--c)))] [transition:transform_var(--eased-duration-spring-smooth)_var(--eased-spring-smooth)] reduced:[transition:none]`;

// Behind the front, content fades out; it fades back when the stack expands.
const TOAST_CONTENT =
  "relative grid grid-cols-[auto_minmax(0,1fr)_auto] items-start px-4 py-3 text-ui-sm [transition:opacity_var(--eased-duration-standard)_var(--eased-ease-standard)] data-behind:not-data-expanded:opacity-0 data-behind:not-data-expanded:pointer-events-none";

// Shown on hover (fine pointers) and keyboard focus; always shown where there is no hover.
// `opacity`, not `invisible`, so it holds its place (R108) and stays in the tab order.
const CLOSE = `inline-flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-control-xs text-text-muted opacity-0 hover-fine:bg-surface-hover hover-fine:text-text group-hover-fine:opacity-100 focus-visible:opacity-100 [@media(hover:none)]:opacity-100 [&_svg]:size-4 ${pressIcon}`;

export type ToasterProps = {
  /** Where the stack sits. Under 640px it is always full-width at the bottom. Default "bottom-right". */
  position?: ToastPosition;
  /** How many toasts show at once; older ones fade out (`data-limited`) until a slot frees. Default 3. */
  limit?: number;
  /** Default auto-dismiss time in ms; 0 keeps toasts until closed. Loading toasts never time out. Default 5000. */
  timeout?: number;
  /** A global manager from `createToastManager()`, to toast from outside React. */
  toastManager?: ToastManager<ToastData>;
  /**
   * Portal target. Default `document.body`, with the stack fixed to the window. When set, the
   * stack is `absolute` inside it instead (the container needs `position: relative`).
   */
  container?: HTMLElement | null;
  /** Swipe directions that dismiss. Default down + right at the bottom, up + right at the top right, up at the top centre. */
  swipeDirection?: ToastSwipeDirection | ToastSwipeDirection[];
  /** Accessible name of each toast's close button. Default "Dismiss". */
  closeLabel?: string;
  /** Appended to the viewport's classes. */
  className?: string;
  /** Your app. Components inside can call `useToast()`. */
  children?: ReactNode;
};

const SWIPE: Record<ToastPosition, ToastSwipeDirection[]> = {
  "bottom-right": ["down", "right"],
  "bottom-center": ["down", "right"],
  "top-center": ["up"],
  "top-right": ["up", "right"],
};

/**
 * Mounts the toast stack: Base UI's Provider (wrap your app, or pass a global `toastManager`),
 * a portal and the viewport landmark. F6 moves focus into the toasts.
 */
export function Toaster({
  position = "bottom-right",
  limit = 3,
  timeout = 5000,
  toastManager,
  container,
  swipeDirection,
  closeLabel = "Dismiss",
  className = "",
  children,
}: ToasterProps) {
  const mobile = useSyncExternalStore(subscribeMobile, () => window.matchMedia(MOBILE).matches, () => false);
  const top = position.startsWith("top") && !mobile;
  const swipe = swipeDirection ?? (mobile ? SWIPE["bottom-right"] : SWIPE[position]);
  return (
    <BaseToast.Provider limit={limit} timeout={timeout} toastManager={toastManager}>
      {children}
      <BaseToast.Portal container={container}>
        <BaseToast.Viewport
          data-side={top ? "top" : "bottom"}
          style={TOAST_VARS}
          className={`${container ? "absolute z-10" : "fixed z-50"} w-[22rem] max-w-[calc(100%_-_32px)] outline-none ${PLACEMENT[position]} ${MOBILE_PLACEMENT} ${top ? SIDE.top : SIDE.bottom} ${className}`}
        >
          <ToastList swipe={swipe} closeLabel={closeLabel} />
        </BaseToast.Viewport>
      </BaseToast.Portal>
    </BaseToast.Provider>
  );
}

function ToastList({ swipe, closeLabel }: { swipe: ToastSwipeDirection | ToastSwipeDirection[]; closeLabel: string }) {
  const { toasts } = BaseToast.useToastManager<ToastData>();
  return toasts.map((t) => <ToastItem key={t.id} toast={t} swipe={swipe} closeLabel={closeLabel} />);
}

function ToastItem({ toast, swipe, closeLabel }: { toast: ToastObject<ToastData>; swipe: ToastSwipeDirection | ToastSwipeDirection[]; closeLabel: string }) {
  // A toast that started as loading will change its title, so it swaps (one line, TextSwap);
  // any other toast lays its title out normally and may wrap.
  const [morphs] = useState(toast.type === "loading");
  const type = (toast.type ?? "default") as ToastType;
  const icon = toast.data?.icon ?? (type === "default" ? null : <StatusIcon type={type} />);
  return (
    <BaseToast.Root toast={toast} swipeDirection={swipe} className={TOAST_ROOT}>
      <span aria-hidden className={TOAST_CARD} />
      <BaseToast.Content className={TOAST_CONTENT}>
        {icon && (
          // Centred on the title's first line (R107).
          <span aria-hidden className="col-start-1 me-3 flex h-[1lh] items-center [&_svg]:size-4 [&_svg]:shrink-0">
            {icon}
          </span>
        )}
        <span className="col-start-2 flex min-w-0 flex-col gap-0.5">
          <BaseToast.Title className={`font-medium text-text ${morphs ? "overflow-hidden" : "text-pretty break-words"}`}>
            {morphs && typeof toast.title === "string" ? <TextSwap animateWidth={false}>{toast.title}</TextSwap> : toast.title}
          </BaseToast.Title>
          {toast.description !== undefined && (
            <BaseToast.Description className="text-pretty text-text-secondary">
              {morphs ? <Fade swapKey={typeof toast.description === "string" ? toast.description : toast.updateKey}>{toast.description}</Fade> : toast.description}
            </BaseToast.Description>
          )}
        </span>
        <span className="col-start-3 ms-3 flex h-[1lh] items-center gap-1">
          <BaseToast.Action render={<Button size="sm" variant="secondary" />} />
          <BaseToast.Close aria-label={closeLabel} className={`${CLOSE} -me-1`}>
            <CloseIcon />
          </BaseToast.Close>
        </span>
      </BaseToast.Content>
    </BaseToast.Root>
  );
}

/** A description that changes fades in (opacity only, so its line count never jumps). */
function Fade({ swapKey, children }: { swapKey: string | number | undefined; children: ReactNode }) {
  const reduced = useSafeReducedMotion();
  return (
    <motion.span key={swapKey} className="block" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={reduced ? reducedFade : fade}>
      {children}
    </motion.span>
  );
}

/**
 * The status glyph. A change of type cross-fades the glyphs with a 0.6 → 1 scale on the snappy
 * spring; the success check then draws its stroke in. The first render does not animate (the
 * toast's own entrance carries it). Reduced motion: a 100ms cross-fade.
 */
function StatusIcon({ type }: { type: Exclude<ToastType, "default"> }) {
  const reduced = useSafeReducedMotion();
  return (
    <span className="relative size-4">
      <AnimatePresence initial={false}>
        <motion.span
          key={type}
          className="absolute inset-0 flex items-center justify-center"
          initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.6 }}
          animate={reduced ? { opacity: 1 } : { opacity: 1, scale: 1 }}
          exit={reduced ? { opacity: 0, transition: reducedFade } : { opacity: 0, scale: 0.6, transition: exitFast }}
          transition={reduced ? reducedFade : { ...snappy, opacity: fade }}
        >
          {type === "loading" ? (
            <Spinner size="md" label={false} />
          ) : type === "success" ? (
            <CheckIcon draw={!reduced} />
          ) : (
            <AlertIcon />
          )}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

function CheckIcon({ draw }: { draw: boolean }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="text-success-text">
      <circle cx="8" cy="8" r="6.25" />
      <motion.path
        d="M5.5 8.25 7.25 10l3.25-3.75"
        initial={draw ? { pathLength: 0 } : false}
        animate={{ pathLength: 1 }}
        transition={{ ...snappy, delay: 0.06 }}
      />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" className="text-danger-text">
      <circle cx="8" cy="8" r="6.25" />
      <path d="M8 4.75v3.75" />
      <circle cx="8" cy="11" r="0.25" fill="currentColor" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" aria-hidden>
      <path d="m4.5 4.5 7 7m0-7-7 7" />
    </svg>
  );
}
