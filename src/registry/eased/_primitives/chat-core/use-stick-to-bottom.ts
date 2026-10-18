"use client";

import { animate, motionValue, type AnimationPlaybackControls } from "motion/react";
import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { smooth, useSafeReducedMotion } from "../../lib/motion";

export type UseStickToBottomOptions = {
  /** Within this many px of the bottom counts as "at the bottom" and re-locks. Default 48. */
  threshold?: number;
  /** Follow new content on a smooth spring (default) or jump. Reduced motion always jumps. */
  animated?: boolean;
  /** Start at the bottom on mount. Default true. */
  initial?: boolean;
};

export type StickToBottom = {
  /** Put on the scrolling element (`overflow-y: auto`). */
  scrollRef: (el: HTMLElement | null) => void;
  /** Put on the element inside it that grows as messages stream. */
  contentRef: (el: HTMLElement | null) => void;
  /** True while following. False once the user scrolls up: show a "Jump to latest" pill. */
  isAtBottom: boolean;
  /** Scroll to the bottom and follow again (the pill's onClick). */
  scrollToBottom: (opts?: { animated?: boolean }) => void;
  /** Stop following without scrolling, e.g. when the user selects text. */
  stopFollowing: () => void;
  /**
   * Call just before prepending older messages: the next growth keeps what is on screen
   * still instead of pushing it down.
   */
  preserveScroll: () => void;
};

/**
 * Keeps a chat scrolled to the newest message while it streams, and lets go the moment the
 * user scrolls up (wheel, touch, keyboard or scrollbar). Following rides one spring that is
 * retargeted as each chunk lands, so bursty tokens glide instead of stepping; it never fights
 * the user, because any scroll that is not the spring's own stops it. Scrolling back within
 * `threshold` of the bottom locks on again.
 */
export function useStickToBottom({ threshold = 48, animated = true, initial = true }: UseStickToBottomOptions = {}): StickToBottom {
  const reduced = useSafeReducedMotion();
  const [isAtBottom, setIsAtBottom] = useState(initial);
  const scroller = useRef<HTMLElement | null>(null);
  const content = useRef<HTMLElement | null>(null);
  const locked = useRef(initial);
  const top = useRef(motionValue(0));
  const anim = useRef<AnimationPlaybackControls | null>(null);
  /** Where the spring last put scrollTop; scroll events that match it are ours. */
  const expected = useRef<number | null>(null);
  const anchor = useRef<number | null>(null);
  const opts = useRef({ threshold, animated, reduced });
  useLayoutEffect(() => {
    opts.current = { threshold, animated, reduced };
  });

  const setBottom = useCallback((v: boolean) => {
    locked.current = v;
    setIsAtBottom((prev) => (prev === v ? prev : v));
  }, []);

  const stop = useCallback(() => {
    anim.current?.stop();
    anim.current = null;
    expected.current = null;
  }, []);

  const follow = useCallback(
    (animate_ = opts.current.animated) => {
      const el = scroller.current;
      if (!el) return;
      const target = el.scrollHeight - el.clientHeight;
      if (target - el.scrollTop < 1) return;
      if (!animate_ || opts.current.reduced) {
        stop();
        expected.current = target;
        el.scrollTop = target;
        return;
      }
      // Retargeting a running spring keeps its velocity, so a stream of chunks reads as one glide.
      if (!anim.current) top.current.jump(el.scrollTop);
      anim.current = animate(top.current, target, { ...smooth, onComplete: () => (anim.current = null) });
    },
    [stop],
  );

  // The spring writes scrollTop; remember what it wrote so the scroll listener can tell it from the user.
  useLayoutEffect(
    () =>
      top.current.on("change", (v) => {
        const el = scroller.current;
        if (!el) return;
        expected.current = v;
        el.scrollTop = v;
      }),
    [],
  );

  const onResize = useCallback(() => {
    const el = scroller.current;
    if (!el) return;
    if (anchor.current !== null) {
      expected.current = el.scrollHeight - anchor.current;
      el.scrollTop = expected.current;
      anchor.current = null;
      return;
    }
    if (locked.current) follow();
  }, [follow]);

  const onScroll = useCallback(() => {
    const el = scroller.current;
    if (!el) return;
    const max = el.scrollHeight - el.clientHeight;
    if (expected.current !== null && Math.abs(el.scrollTop - Math.min(expected.current, max)) < 2) return;
    // Not the spring: the user (or the browser) moved it.
    stop();
    setBottom(max - el.scrollTop <= opts.current.threshold);
  }, [setBottom, stop]);

  const onWheel = useCallback(
    (e: WheelEvent) => {
      if (e.deltaY < 0 && anim.current) {
        stop();
        setBottom(false);
      }
    },
    [setBottom, stop],
  );
  const onTouch = useCallback(() => {
    if (anim.current) stop();
  }, [stop]);

  const observers = useRef<{ ro: ResizeObserver | null }>({ ro: null });
  const getObserver = () => (observers.current.ro ??= new ResizeObserver(() => onResize()));

  const scrollRef = useCallback(
    (el: HTMLElement | null) => {
      const prev = scroller.current;
      if (prev) {
        prev.removeEventListener("scroll", onScroll);
        prev.removeEventListener("wheel", onWheel);
        prev.removeEventListener("touchmove", onTouch);
        getObserver().unobserve(prev);
      }
      scroller.current = el;
      if (!el) return;
      el.addEventListener("scroll", onScroll, { passive: true });
      el.addEventListener("wheel", onWheel, { passive: true });
      el.addEventListener("touchmove", onTouch, { passive: true });
      // The viewport shrinking (a composer growing below it) must keep the bottom in view too.
      getObserver().observe(el);
      if (locked.current) {
        expected.current = el.scrollHeight;
        el.scrollTop = el.scrollHeight;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [onScroll, onWheel, onTouch],
  );

  const contentRef = useCallback(
    (el: HTMLElement | null) => {
      if (content.current) getObserver().unobserve(content.current);
      content.current = el;
      if (el) getObserver().observe(el);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const scrollToBottom = useCallback(
    ({ animated: a }: { animated?: boolean } = {}) => {
      setBottom(true);
      follow(a ?? opts.current.animated);
    },
    [follow, setBottom],
  );

  const stopFollowing = useCallback(() => {
    stop();
    setBottom(false);
  }, [setBottom, stop]);

  const preserveScroll = useCallback(() => {
    const el = scroller.current;
    if (el) anchor.current = el.scrollHeight - el.scrollTop;
  }, []);

  useLayoutEffect(
    () => () => {
      anim.current?.stop();
      observers.current.ro?.disconnect();
    },
    [],
  );

  return { scrollRef, contentRef, isAtBottom, scrollToBottom, stopFollowing, preserveScroll };
}
