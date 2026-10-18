"use client";

import { motion, useMotionValue, useTransform, type MotionValue } from "motion/react";
import {
  Children,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { createVelocityTracker, nearest, project, DECELERATION } from "../_primitives/gesture/gesture-math";
import { scrollFadeMask, useScrollEdges } from "../_primitives/scroll-fade/scroll-fade";
import { useSafeReducedMotion } from "../lib/motion";
import { pressIcon } from "../lib/press";

export type CarouselProps = {
  /** One child per slide. */
  children: ReactNode;
  /** Names the carousel, e.g. "Featured plans". */
  "aria-label": string;
  /** Slide width as any CSS length. Default `"80%"`, so the next slide peeks in. */
  slideSize?: string;
  /** Gap between slides, px. Default 12. */
  gap?: number;
  /** Where a slide comes to rest. Default `"start"`. */
  align?: "start" | "center";
  /** The page indicator under the slides: dots, a progress bar, or none. Default `"dots"`. */
  indicator?: "dots" | "bar" | "none";
  /** Show the previous/next buttons. Default true. */
  controls?: boolean;
  /** Next on the last page goes back to the first (and Previous on the first to the last). Default false. */
  loop?: boolean;
  /** Drag with a mouse to scroll, with the flick's momentum carried to a snap point. Touch and trackpads always scroll natively. Default true. */
  draggable?: boolean;
  /** The current page (controlled). */
  index?: number;
  /** The starting page (uncontrolled). Default 0. */
  defaultIndex?: number;
  /** Called when the page nearest the resting point changes, while scrolling too. */
  onIndexChange?: (index: number) => void;
  /** Something before the controls in the footer row, e.g. a caption. Replaces the indicator's slot on the left. */
  footer?: ReactNode;
  /** Classes for the root. */
  className?: string;
  /** Classes for each slide wrapper. */
  slideClassName?: string;
};

/**
 * A scroll-snap carousel: native scrolling with the platform's momentum, prev/next buttons,
 * a page indicator that follows the scroll position continuously (not page by page), arrow
 * keys, mouse drag with flick momentum, and edges that feather only where there is more.
 */
export function Carousel({
  children,
  "aria-label": ariaLabel,
  slideSize = "80%",
  gap = 12,
  align = "start",
  indicator = "dots",
  controls = true,
  loop = false,
  draggable = true,
  index: indexProp,
  defaultIndex = 0,
  onIndexChange,
  footer,
  className = "",
  slideClassName = "",
}: CarouselProps) {
  const slides = Children.toArray(children);
  const reduced = useSafeReducedMotion();
  const scroller = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);
  const stops = useRef<number[]>([0]);
  const [pages, setPages] = useState(1);
  const [index, setIndex] = useState(indexProp ?? defaultIndex);
  const indexRef = useRef(index);
  const pending = useRef<number | null>(null);
  const position = useMotionValue(indexProp ?? defaultIndex);
  const [dragging, setDragging] = useState(false);
  const id = useId();
  const latest = useRef({ onIndexChange, reduced });
  useLayoutEffect(() => {
    latest.current = { onIndexChange, reduced };
  });
  useScrollEdges(scroller, "x");

  /** The fractional page under the scroll position, interpolated between snap stops. */
  const measure = useCallback(() => {
    const el = scroller.current;
    if (!el) return;
    const s = stops.current;
    const x = Math.abs(el.scrollLeft);
    let p = 0;
    if (x >= s[s.length - 1]) p = s.length - 1;
    else
      for (let i = 0; i < s.length - 1; i++) {
        if (x < s[i + 1]) {
          p = i + (x - s[i]) / Math.max(1, s[i + 1] - s[i]);
          break;
        }
      }
    position.set(p);
    const rounded = Math.round(p);
    if (pending.current === rounded) pending.current = null;
    if (rounded !== indexRef.current) {
      indexRef.current = rounded;
      setIndex(rounded);
      latest.current.onIndexChange?.(rounded);
    }
  }, [position]);

  /** Snap stops: each slide's resting scroll position, clamped to the end, duplicates dropped. */
  const computeStops = useCallback(() => {
    const el = scroller.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    const pad = parseFloat(getComputedStyle(el).scrollPaddingInlineStart) || 0;
    const out: number[] = [];
    for (const slide of slideRefs.current) {
      if (!slide) continue;
      const raw = align === "center" ? slide.offsetLeft - (el.clientWidth - slide.offsetWidth) / 2 : slide.offsetLeft - pad;
      const stop = Math.round(Math.min(max, Math.max(0, raw)));
      if (!out.length || stop - out[out.length - 1] > 1) out.push(stop);
    }
    stops.current = out.length ? out : [0];
    setPages(stops.current.length);
    measure();
  }, [align, measure]);

  useLayoutEffect(() => {
    const el = scroller.current;
    if (!el) return;
    computeStops();
    // Land on the starting page without animating.
    const start = stops.current[Math.min(indexRef.current, stops.current.length - 1)] ?? 0;
    el.scrollLeft = start;
    measure();
    const ro = new ResizeObserver(computeStops);
    ro.observe(el);
    for (const slide of slideRefs.current) if (slide) ro.observe(slide);
    el.addEventListener("scroll", measure, { passive: true });
    return () => {
      ro.disconnect();
      el.removeEventListener("scroll", measure);
    };
  }, [computeStops, measure, slides.length]);

  const goTo = useCallback((page: number, smooth = true) => {
    const el = scroller.current;
    if (!el) return;
    const s = stops.current;
    pending.current = Math.min(s.length - 1, Math.max(0, page));
    const target = s[pending.current];
    el.scrollTo({ left: target, behavior: smooth && !latest.current.reduced ? "smooth" : "auto" });
  }, []);

  // Controlled index: scroll to it when it changes from outside.
  useEffect(() => {
    if (indexProp === undefined || indexProp === indexRef.current) return;
    goTo(indexProp);
  }, [indexProp, goTo]);

  const last = pages - 1;
  // Step from the page a scroll is heading to, so a second press before it lands still counts.
  const prev = () => {
    const at = pending.current ?? index;
    goTo(at <= 0 ? (loop ? last : 0) : at - 1);
  };
  const next = () => {
    const at = pending.current ?? index;
    goTo(at >= last ? (loop ? 0 : last) : at + 1);
  };

  const onKeyDown = (e: ReactKeyboardEvent) => {
    if (e.target !== e.currentTarget) return;
    if (e.key === "ArrowRight") next();
    else if (e.key === "ArrowLeft") prev();
    else if (e.key === "Home") goTo(0);
    else if (e.key === "End") goTo(last);
    else return;
    e.preventDefault();
  };

  // Mouse drag: scroll follows the pointer with snapping off, then the flick is projected
  // (UIScrollView friction) onto the snap stop it would coast to and scrolled there.
  const drag = useRef<{ x: number; left: number; moved: boolean; pointer: number } | null>(null);
  const tracker = useRef(createVelocityTracker());
  const suppressClick = useRef(false);
  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!draggable || e.pointerType !== "mouse" || e.button !== 0) return;
    pending.current = null;
    const el = scroller.current!;
    drag.current = { x: e.clientX, left: el.scrollLeft, moved: false, pointer: e.pointerId };
    tracker.current.reset();
    tracker.current.add(el.scrollLeft);
  };
  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    const el = scroller.current;
    if (!d || !el || e.pointerId !== d.pointer) return;
    const dx = e.clientX - d.x;
    if (!d.moved) {
      if (Math.abs(dx) < 4) return;
      d.moved = true;
      el.setPointerCapture(e.pointerId);
      el.style.scrollSnapType = "none";
      el.style.scrollBehavior = "auto";
      setDragging(true);
    }
    el.scrollLeft = d.left - dx;
    tracker.current.add(el.scrollLeft);
  };
  const endDrag = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    const el = scroller.current;
    drag.current = null;
    if (!d || !el || !d.moved) return;
    if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId);
    setDragging(false);
    suppressClick.current = true;
    const velocity = tracker.current.velocity();
    const target = stops.current[nearest(el.scrollLeft + project(velocity, DECELERATION.fast), stops.current)];
    // Snapping comes back once the glide has landed, so it never fights the smooth scroll.
    const restore = () => {
      el.style.scrollSnapType = "";
      el.style.scrollBehavior = "";
    };
    if (Math.abs(target - el.scrollLeft) < 1 || latest.current.reduced) {
      el.scrollLeft = target;
      restore();
      return;
    }
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      el.removeEventListener("scrollend", finish);
      restore();
    };
    el.addEventListener("scrollend", finish);
    window.setTimeout(finish, 900);
    el.scrollTo({ left: target, behavior: "smooth" });
  };

  const snapAlign = align === "center" ? "snap-center" : "snap-start";

  return (
    <div role="region" aria-roledescription="carousel" aria-label={ariaLabel} className={`flex min-w-0 flex-col gap-3 ${className}`}>
      <div className="relative flex min-h-0 min-w-0 flex-1 flex-col">
      <div
        ref={scroller}
        id={id}
        tabIndex={0}
        aria-label={`${ariaLabel}, use arrow keys to move between slides`}
        onKeyDown={onKeyDown}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onClickCapture={(e) => {
          if (!suppressClick.current) return;
          suppressClick.current = false;
          e.preventDefault();
          e.stopPropagation();
        }}
        onDragStart={(e) => draggable && e.preventDefault()}
        style={{ ...scrollFadeMask("x", 20), gap, scrollPaddingInline: "var(--carousel-inset, 0px)", paddingInline: "var(--carousel-inset, 0px)" }}
        className={`peer flex min-h-0 flex-1 snap-x snap-mandatory overflow-x-auto overscroll-x-contain outline-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${
          draggable ? "pointer-fine:cursor-grab" : ""
        } ${dragging ? "cursor-grabbing! select-none" : ""}`}
      >
        {slides.map((slide, i) => (
          <div
            key={i}
            ref={(el) => {
              slideRefs.current[i] = el;
            }}
            role="group"
            aria-roledescription="slide"
            aria-label={`${i + 1} of ${slides.length}`}
            className={`min-w-0 shrink-0 ${snapAlign} ${slideClassName}`}
            style={{ width: slideSize }}
          >
            {slide}
          </div>
        ))}
      </div>
      {/* The scroller's mask would hide a ring drawn on itself, so the focus ring is a sibling. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 inset-x-(--carousel-inset,0px) rounded-control opacity-0 shadow-[0_0_0_2px_var(--eased-bg),0_0_0_4px_var(--eased-ring)] transition-opacity duration-(--eased-duration-focus) ease-standard peer-focus-visible:opacity-100"
      />
      </div>
      {(controls || indicator !== "none" || footer) && (
        <div className="flex min-h-8 items-center justify-between gap-3 px-(--carousel-inset,0px)">
          <div className="flex min-w-0 items-center">
            {footer ??
              (pages > 1 &&
                (indicator === "dots" ? (
                  <Dots pages={pages} position={position} index={index} onSelect={goTo} controls={id} />
                ) : indicator === "bar" ? (
                  <Bar pages={pages} position={position} />
                ) : null))}
          </div>
          {controls && pages > 1 && (
            <div className="flex shrink-0 items-center gap-1">
              <ArrowButton label="Previous slide" dir={-1} disabled={index <= 0 && !loop} onClick={prev} controls={id} />
              <ArrowButton label="Next slide" dir={1} disabled={index >= last && !loop} onClick={next} controls={id} />
            </div>
          )}
        </div>
      )}
      <p aria-live="polite" className="sr-only">
        {`Slide ${index + 1} of ${pages}`}
      </p>
    </div>
  );
}

/* ---------- Indicators ---------------------------------------------------------- */

const DOT = 6;
const PITCH = 16;

/**
 * Dots with one highlight that travels with the scroll: between two pages its leading edge
 * runs ahead and its trailing edge catches up, so it stretches into a short worm and settles
 * back to a dot. Drawn as a clip-path on one bar, so nothing reflows.
 */
function Dots({ pages, position, index, onSelect, controls }: { pages: number; position: MotionValue<number>; index: number; onSelect: (i: number) => void; controls: string }) {
  const width = pages * PITCH;
  const inset = (PITCH - DOT) / 2;
  const clip = useTransform(position, (p) => {
    const clamped = Math.min(pages - 1, Math.max(0, p));
    const i = Math.floor(clamped);
    const t = clamped - i;
    // Leading edge eases out (runs ahead), trailing edge eases in (catches up).
    const lead = 1 - (1 - t) * (1 - t);
    const trail = t * t;
    const left = inset + (i + trail) * PITCH;
    const right = width - (inset + DOT + (i + lead) * PITCH);
    return `inset(${(24 - DOT) / 2}px ${Math.max(0, right)}px ${(24 - DOT) / 2}px ${left}px round ${DOT / 2}px)`;
  });
  return (
    <div className="relative -ml-[5px] flex h-6" style={{ width }}>
      {Array.from({ length: pages }, (_, i) => (
        <button
          key={i}
          type="button"
          aria-label={`Go to slide ${i + 1} of ${pages}`}
          aria-current={i === index ? "true" : undefined}
          aria-controls={controls}
          onClick={() => onSelect(i)}
          className="group flex h-6 shrink-0 cursor-pointer items-center justify-center rounded-pill focus-ring"
          style={{ width: PITCH }}
        >
          <span className="size-1.5 rounded-pill bg-line-strong transition-colors duration-150 ease-standard group-hover-fine:bg-text-muted" />
        </button>
      ))}
      <motion.span aria-hidden className="pointer-events-none absolute inset-0 bg-text" style={{ clipPath: clip }} />
    </div>
  );
}

/** A thin track whose thumb is one page wide and slides with the scroll position. */
function Bar({ pages, position }: { pages: number; position: MotionValue<number> }) {
  const x = useTransform(position, (p) => `${Math.min(pages - 1, Math.max(0, p)) * 100}%`);
  return (
    <div aria-hidden className="relative h-1 w-24 overflow-clip rounded-pill bg-surface-active">
      <motion.span className="absolute inset-y-0 left-0 rounded-pill bg-text" style={{ width: `${100 / pages}%`, x }} />
    </div>
  );
}

function ArrowButton({ label, dir, disabled, onClick, controls }: { label: string; dir: 1 | -1; disabled: boolean; onClick: () => void; controls: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-controls={controls}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex size-8 items-center justify-center rounded-pill border border-line text-text-secondary ${pressIcon} enabled:cursor-pointer enabled:hover-fine:bg-surface-hover enabled:hover-fine:text-text disabled:cursor-not-allowed disabled:text-text-disabled`}
    >
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden className="size-4">
        {/* Chevrons sit 1px toward their direction (R57). */}
        {dir === 1 ? <path d="m6.5 4 4 4-4 4" /> : <path d="m9.5 4-4 4 4 4" />}
      </svg>
    </button>
  );
}
