"use client";

import { animate, useMotionValue, type AnimationPlaybackControls } from "motion/react";
import { useCallback, useLayoutEffect, useRef, type RefObject } from "react";
import { smooth, useSafeReducedMotion } from "../../lib/motion";

/**
 * The composer's height spring, for a bare `<textarea>` with no shell of its own (Textarea
 * draws a bordered field; the composer draws the border around more than the text). The
 * textarea is sized at once, so the caret never leaves view, and the returned motion value
 * springs a clip around it. Put `height` on the clip's `style`.
 */
export function useAutosize(ref: RefObject<HTMLTextAreaElement | null>, { minRows = 1, maxRows = 6, value }: { minRows?: number; maxRows?: number; value?: string }) {
  const reduced = useSafeReducedMotion();
  const height = useMotionValue<number | "auto">("auto");
  const spring = useRef<AnimationPlaybackControls | null>(null);

  const resize = useCallback(
    (animated: boolean) => {
      const el = ref.current;
      if (!el) return;
      const cs = getComputedStyle(el);
      const line = parseFloat(cs.lineHeight) || 20;
      const chrome = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
      const max = maxRows * line + chrome;
      el.style.height = "0px";
      const content = el.scrollHeight;
      const target = Math.round(Math.min(max, Math.max(minRows * line + chrome, content)));
      el.style.height = `${target}px`;
      el.style.overflowY = content > max + 1 ? "auto" : "hidden";
      const from = height.get();
      if (from === target) return;
      spring.current?.stop();
      if (!animated || reduced || from === "auto") height.jump(target);
      else spring.current = animate(height, target, smooth);
    },
    [ref, minRows, maxRows, reduced, height],
  );

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    resize(false);
    let width = el.offsetWidth;
    const ro = new ResizeObserver(() => {
      if (el.offsetWidth === width) return;
      width = el.offsetWidth;
      resize(false);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref, resize]);

  useLayoutEffect(() => {
    if (value !== undefined) resize(true);
  }, [value, resize]);

  return { height, resize };
}
