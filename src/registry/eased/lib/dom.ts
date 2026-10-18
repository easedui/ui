import { useEffect, type RefObject } from "react";

/** True when a key event lands in a text field, so global shortcuts leave typing alone. */
export function isEditable(t: EventTarget | null) {
  return t instanceof HTMLElement && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));
}

/**
 * 20px scroll feathers, each only while there is content past that edge (R94). Sets
 * `--fade-top`/`--fade-bottom` (axis "y") or `--fade-start`/`--fade-end` (axis "x", read by
 * the `fade-x` utility) on the scroller; pair them with a mask-image.
 */
export function useScrollFades(ref: RefObject<HTMLElement | null>, axis: "x" | "y" = "y") {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const [start, end] = axis === "x" ? ["--fade-start", "--fade-end"] : ["--fade-top", "--fade-bottom"];
    const update = () => {
      const [pos, size, view] = axis === "x" ? [el.scrollLeft, el.scrollWidth, el.clientWidth] : [el.scrollTop, el.scrollHeight, el.clientHeight];
      el.style.setProperty(start, pos > 1 ? "20px" : "0px");
      el.style.setProperty(end, size - view - pos > 1 ? "20px" : "0px");
    };
    update();
    el.addEventListener("scroll", update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    if (el.firstElementChild) ro.observe(el.firstElementChild);
    return () => {
      el.removeEventListener("scroll", update);
      ro.disconnect();
    };
  }, [ref, axis]);
}
