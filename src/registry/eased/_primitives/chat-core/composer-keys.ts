"use client";

import { useCallback, useRef, type KeyboardEvent } from "react";

/** A `/command` or `@mention` being typed: what the Pro Slash and Mention menus open on. */
export type ComposerTrigger = {
  /** The trigger character, e.g. `/` or `@`. */
  char: string;
  /** What follows it so far, e.g. `"summ"` for `/summ`. */
  query: string;
  /** Index of the trigger character in the value. */
  start: number;
  /** Index just past the query (the caret). */
  end: number;
};

/**
 * The trigger under the caret, or null. `/` counts only at the start of a line (so URLs and
 * fractions never open the slash menu); other characters count after whitespace or at the
 * start. The query stops at whitespace.
 */
export function findTrigger(value: string, caret: number, chars: readonly string[] = ["/", "@"]): ComposerTrigger | null {
  let i = caret - 1;
  while (i >= 0 && !/\s/.test(value[i])) {
    if (chars.includes(value[i])) {
      const before = i === 0 ? "\n" : value[i - 1];
      const ok = value[i] === "/" ? before === "\n" : /\s/.test(before);
      return ok ? { char: value[i], query: value.slice(i + 1, caret), start: i, end: caret } : null;
    }
    i--;
  }
  return null;
}

/** Replaces a trigger with the picked item, e.g. `@ma` → `@Maya Chen `. Returns the new value and caret. */
export function replaceTrigger(value: string, trigger: ComposerTrigger, insert: string) {
  const next = value.slice(0, trigger.start) + insert + value.slice(trigger.end);
  return { value: next, caret: trigger.start + insert.length };
}

export type ComposerKeyOptions = {
  /** Called on the submit chord when `canSubmit` is true. */
  onSubmit: () => void;
  /** False when there is nothing to send or a reply is streaming. Default true. */
  canSubmit?: boolean;
  /** `enter` (default): Enter sends, Shift+Enter breaks the line. `mod-enter`: ⌘/Ctrl+Enter sends. */
  submitOn?: "enter" | "mod-enter";
  /** ⌘↑ / Ctrl+↑ anywhere, or ↑ in an empty composer: edit your last message. */
  onEditLast?: () => void;
  /** Escape: e.g. stop the stream, or blur. Return true if handled. */
  onEscape?: () => boolean | void;
  /**
   * Runs first on every keydown. Return true to claim the key: an open Slash or Mention menu
   * uses this for ↑ ↓ Enter Tab Escape, and the composer then ignores it.
   */
  intercept?: (event: KeyboardEvent<HTMLTextAreaElement>) => boolean;
  /** Characters that open a trigger menu. Default `["/", "@"]`. */
  triggerChars?: readonly string[];
  /** The trigger under the caret after each keystroke or caret move, or null. Wire the Pro menus here. */
  onTrigger?: (trigger: ComposerTrigger | null) => void;
};

/**
 * Keyboard handling for a chat composer: the submit chord (IME-safe: Enter that confirms a
 * Japanese or Chinese composition never sends), edit-last, Escape, and trigger detection for
 * slash commands and mentions. Spread the result onto the `<textarea>`.
 */
export function useComposerKeys({
  onSubmit,
  canSubmit = true,
  submitOn = "enter",
  onEditLast,
  onEscape,
  intercept,
  triggerChars = ["/", "@"],
  onTrigger,
}: ComposerKeyOptions) {
  const lastTrigger = useRef<string | null>(null);

  const report = useCallback(
    (el: HTMLTextAreaElement) => {
      if (!onTrigger) return;
      const t = el.selectionStart === el.selectionEnd ? findTrigger(el.value, el.selectionStart, triggerChars) : null;
      const sig = t ? `${t.char}${t.start}:${t.query}` : null;
      if (sig === lastTrigger.current) return;
      lastTrigger.current = sig;
      onTrigger(t);
    },
    [onTrigger, triggerChars],
  );

  const onKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (intercept?.(e)) return;
      // 229 covers Safari, which fires keydown for the composition-confirming Enter without isComposing.
      if (e.nativeEvent.isComposing || e.keyCode === 229) return;
      const mod = e.metaKey || e.ctrlKey;

      if (e.key === "Enter") {
        const chord = submitOn === "enter" ? !e.shiftKey && !e.altKey : mod;
        if (!chord) return;
        e.preventDefault();
        if (canSubmit) onSubmit();
        return;
      }
      if (e.key === "ArrowUp" && onEditLast && (mod || e.currentTarget.value === "")) {
        e.preventDefault();
        onEditLast();
        return;
      }
      if (e.key === "Escape" && onEscape?.()) e.preventDefault();
    },
    [intercept, submitOn, canSubmit, onSubmit, onEditLast, onEscape],
  );

  const onSelect = useCallback((e: { currentTarget: HTMLTextAreaElement }) => report(e.currentTarget), [report]);

  return { onKeyDown, onSelect, onInput: onSelect };
}
