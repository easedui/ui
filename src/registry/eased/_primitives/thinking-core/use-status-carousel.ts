"use client";

import { useEffect, useState } from "react";

export type UseStatusCarouselOptions = {
  /**
   * A real status. While set it is shown instead of the rotation, at once; when it clears the
   * rotation resumes where it left off. Use it for "Reading stripe.com…" from a tool event.
   */
  status?: string | null;
  /**
   * Milliseconds each line stays. Default: by length, 2.2s plus 45ms a character, capped at
   * 4s, so a long line can be read and a short one does not linger.
   */
  interval?: number | ((line: string) => number);
  /** Stop rotating (keeps the current line). Default false. */
  paused?: boolean;
  /** Start over at the first line when the lines change. Default true. */
  restartOnChange?: boolean;
  /** Cycle back to the first line after the last. Default false: hold on the last line. */
  loop?: boolean;
};

const byLength = (line: string) => Math.min(4000, 2200 + line.length * 45);

/**
 * The line to show from a rotating set of status lines ("Pondering…", "Reading the diff…"),
 * interrupted by a real `status` whenever there is one. By default it holds on the last line
 * instead of looping back, since a status that repeats reads as stuck; set `loop` for
 * ambient lines that may cycle. It does not advance while the tab is hidden. Render the result
 * through Text Swap or Shimmer Text so each change is a swap, not a pop.
 *
 *   const line = useStatusCarousel(["Searching…", "Reading 4 pages…", "Comparing…"], { status });
 *   <ShimmerText>{line}</ShimmerText>
 */
export function useStatusCarousel(lines: readonly string[], { status, interval, paused = false, restartOnChange = true, loop = false }: UseStatusCarouselOptions = {}): string {
  const [index, setIndex] = useState(0);
  // Compared by content, so an inline array literal does not restart the rotation every render.
  const linesKey = lines.join("\u0000");
  const [source, setSource] = useState(linesKey);
  // Adjust state while rendering when the lines change (no effect, no flash of the old line).
  if (source !== linesKey) {
    setSource(linesKey);
    if (restartOnChange) setIndex(0);
  }
  const i = Math.min(index, Math.max(0, lines.length - 1));
  const line = lines[i] ?? "";
  const hold = status ? null : typeof interval === "function" ? interval(line) : (interval ?? byLength(line));
  const atEnd = lines.length < 2 || (!loop && i >= lines.length - 1);

  useEffect(() => {
    if (hold === null || paused || atEnd) return;
    let timer = 0;
    let remaining = hold;
    let since = performance.now();
    const arm = () => {
      since = performance.now();
      timer = window.setTimeout(() => setIndex((n) => (n + 1) % lines.length), remaining);
    };
    const onVisibility = () => {
      if (document.hidden) {
        clearTimeout(timer);
        remaining = Math.max(0, remaining - (performance.now() - since));
      } else arm();
    };
    if (!document.hidden) arm();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [hold, paused, atEnd, i, lines.length]);

  return status || line;
}
