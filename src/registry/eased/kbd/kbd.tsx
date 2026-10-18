"use client";

import { useSyncExternalStore } from "react";

/* ---------- Which keys are down: one shared listener for every keycap on the page ---------- */

// code → the key it produced when pressed, so releasing ⇧ before "?" still clears "?".
const down = new Map<string, string>();
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

const onDown = (e: KeyboardEvent) => {
  const key = e.key.toLowerCase();
  if (down.get(e.code) === key) return; // auto-repeat
  down.set(e.code, key);
  emit();
};
const onUp = (e: KeyboardEvent) => {
  // macOS drops the keyup of any key released while ⌘ is held, so letting go of ⌘ clears them all.
  if (e.key === "Meta") down.clear();
  else down.delete(e.code);
  emit();
};
const reset = () => {
  if (!down.size) return;
  down.clear();
  emit();
};

function subscribe(listener: () => void) {
  if (!listeners.size) {
    window.addEventListener("keydown", onDown, true);
    window.addEventListener("keyup", onUp, true);
    window.addEventListener("blur", reset);
    document.addEventListener("visibilitychange", reset);
  }
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
    if (listeners.size) return;
    window.removeEventListener("keydown", onDown, true);
    window.removeEventListener("keyup", onUp, true);
    window.removeEventListener("blur", reset);
    document.removeEventListener("visibilitychange", reset);
    down.clear();
  };
}

/* ---------- What each printed glyph means ---------- */

type KeySpec = { match: string[]; name: string };

const NAMED: Record<string, KeySpec> = {
  "⌘": { match: ["key:meta"], name: "Command" },
  cmd: { match: ["key:meta"], name: "Command" },
  "⌥": { match: ["key:alt"], name: "Option" },
  alt: { match: ["key:alt"], name: "Alt" },
  opt: { match: ["key:alt"], name: "Option" },
  "⇧": { match: ["key:shift"], name: "Shift" },
  shift: { match: ["key:shift"], name: "Shift" },
  "⌃": { match: ["key:control"], name: "Control" },
  ctrl: { match: ["key:control"], name: "Control" },
  "↵": { match: ["key:enter"], name: "Enter" },
  "⏎": { match: ["key:enter"], name: "Enter" },
  enter: { match: ["key:enter"], name: "Enter" },
  return: { match: ["key:enter"], name: "Return" },
  "⎋": { match: ["key:escape"], name: "Escape" },
  esc: { match: ["key:escape"], name: "Escape" },
  "⌫": { match: ["key:backspace"], name: "Delete" },
  "⌦": { match: ["key:delete"], name: "Forward delete" },
  "⇥": { match: ["key:tab"], name: "Tab" },
  tab: { match: ["key:tab"], name: "Tab" },
  space: { match: ["code:Space"], name: "Space" },
  "␣": { match: ["code:Space"], name: "Space" },
  "↑": { match: ["key:arrowup"], name: "Up arrow" },
  "↓": { match: ["key:arrowdown"], name: "Down arrow" },
  "←": { match: ["key:arrowleft"], name: "Left arrow" },
  "→": { match: ["key:arrowright"], name: "Right arrow" },
};

/** Maps a printed glyph ("⌘", "K", "/", "Esc") to the keyboard events that press it and a spoken name. */
export function keySpec(glyph: string): KeySpec {
  const named = NAMED[glyph] ?? NAMED[glyph.toLowerCase()];
  if (named) return named;
  if (/^[a-z]$/i.test(glyph)) return { match: [`code:Key${glyph.toUpperCase()}`], name: glyph.toUpperCase() };
  if (/^\d$/.test(glyph)) return { match: [`code:Digit${glyph}`, `code:Numpad${glyph}`], name: glyph };
  if (/^f\d{1,2}$/i.test(glyph)) return { match: [`key:${glyph.toLowerCase()}`], name: glyph.toUpperCase() };
  return { match: [`key:${glyph.toLowerCase()}`], name: glyph };
}

const never = () => () => {};

const isDown = (spec: KeySpec) =>
  spec.match.some((m) => (m.startsWith("code:") ? down.has(m.slice(5)) : [...down.values()].includes(m.slice(4))));

/**
 * True while every key in `keys` is held, e.g. `useKeysHeld(["⌘", "K"])`, for lighting up the
 * row a shortcut belongs to. Shares the keycaps' single listener.
 */
export function useKeysHeld(keys: string[], enabled = true) {
  const id = keys.join("\u0000");
  return useSyncExternalStore(
    enabled ? subscribe : never,
    () => id.split("\u0000").every((k) => isDown(keySpec(k))),
    () => false,
  );
}

/* ---------- The keycap ---------- */

export type KbdProps = {
  /** One key, e.g. `"K"`, `"⌘"`, `"Esc"`. Use `keys` for a chord. */
  children?: string;
  /** A chord, e.g. `["⌘", "K"]`; each key is its own cap. */
  keys?: string[];
  /** Press the cap while the real key is held. Default true. */
  listen?: boolean;
  /** Force the pressed look, e.g. to replay a shortcut in a tutorial. Overrides `listen`. */
  pressed?: boolean;
  /** 20px (`sm`, default) or 24px (`md`) caps. */
  size?: "sm" | "md";
  className?: string;
};

const SIZES = {
  sm: "h-5 min-w-5 px-1 text-ui-xs",
  md: "h-6 min-w-6 px-1.5 text-ui-sm",
} as const;

/**
 * A keycap that presses down when the real key does: the face drops 1px onto its base and
 * lightens, in 100ms, and springs back on release. Glyphs are announced by name ("Command K").
 */
export function Kbd({ children, keys, listen = true, pressed, size = "sm", className = "" }: KbdProps) {
  const list = keys ?? (children !== undefined ? [children] : []);
  if (list.length === 1) return <Cap glyph={list[0]} listen={listen} pressed={pressed} size={size} className={className} />;
  return (
    <kbd className={`inline-flex items-center gap-0.5 font-sans ${className}`}>
      {list.map((glyph, i) => (
        <Cap key={`${glyph}${i}`} glyph={glyph} listen={listen} pressed={pressed} size={size} />
      ))}
    </kbd>
  );
}

function Cap({ glyph, listen, pressed, size, className = "" }: { glyph: string; listen: boolean; pressed?: boolean; size: "sm" | "md"; className?: string }) {
  const spec = keySpec(glyph);
  const held = useSyncExternalStore(
    listen && pressed === undefined ? subscribe : never,
    () => isDown(spec),
    () => false,
  );
  const on = pressed ?? held;
  const spoken = spec.name !== glyph;

  return (
    // The base is the cap's lower edge: 1px of it shows below the face at rest, and the face
    // covers it when pressed, so the press reads as travel without moving the layout.
    <kbd
      data-pressed={on || undefined}
      className={`group/cap inline-flex shrink-0 rounded-control-xs bg-line pb-px align-middle font-sans ${className}`}
    >
      <span
        className={`inline-flex items-center justify-center rounded-control-xs border border-line-subtle bg-surface-raised font-medium text-text-secondary [transition:color_150ms_var(--eased-ease-standard),background-color_150ms_var(--eased-ease-standard),translate_var(--eased-duration-spring-snappy)_var(--eased-spring-snappy)] group-data-pressed/cap:translate-y-px group-data-pressed/cap:bg-surface-active group-data-pressed/cap:text-text group-data-pressed/cap:duration-(--eased-duration-instant) group-data-pressed/cap:ease-standard reduced:group-data-pressed/cap:translate-y-0 ${SIZES[size]}`}
      >
        {spoken ? (
          <>
            <span aria-hidden>{glyph}</span>
            <span className="sr-only">{spec.name}</span>
          </>
        ) : (
          glyph
        )}
      </span>
    </kbd>
  );
}
