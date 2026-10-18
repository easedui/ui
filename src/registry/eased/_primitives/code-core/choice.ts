"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * A page-wide, persisted choice keyed by group: pick "npm" in one Code Tabs and every block
 * with the same `groupId` switches with it, in this tab, in other tabs (the `storage` event)
 * and on the next visit (localStorage, best effort). The server and the hydrating render see
 * no stored value, so the first paint is always the default and nothing mismatches.
 */

const values = new Map<string, string>();
const listeners = new Map<string, Set<() => void>>();
const PREFIX = "eased-code:";

function read(group: string): string | undefined {
  if (values.has(group)) return values.get(group);
  try {
    const stored = window.localStorage.getItem(PREFIX + group);
    if (stored !== null) values.set(group, stored);
    return stored ?? undefined;
  } catch {
    return undefined;
  }
}

function emit(group: string) {
  listeners.get(group)?.forEach((fn) => fn());
}

/** Set a group's choice everywhere on the page and remember it. */
export function setChoice(group: string, value: string) {
  values.set(group, value);
  try {
    window.localStorage.setItem(PREFIX + group, value);
  } catch {
    // Storage blocked: the choice still syncs on this page.
  }
  emit(group);
}

let storageBound = false;
function bindStorage() {
  if (storageBound || typeof window === "undefined") return;
  storageBound = true;
  window.addEventListener("storage", (e) => {
    if (!e.key?.startsWith(PREFIX) || e.newValue === null) return;
    const group = e.key.slice(PREFIX.length);
    values.set(group, e.newValue);
    emit(group);
  });
}

/**
 * `[value, setValue]` for a group. Without a `group` it is plain local state. `options`
 * guards against a stored value this block does not offer: it falls back to `fallback`.
 */
export function useChoice(group: string | undefined, fallback: string, options?: readonly string[]) {
  const subscribe = useCallback(
    (fn: () => void) => {
      if (!group) return () => {};
      bindStorage();
      let set = listeners.get(group);
      if (!set) listeners.set(group, (set = new Set()));
      set.add(fn);
      return () => set.delete(fn);
    },
    [group],
  );
  const stored = useSyncExternalStore(
    subscribe,
    () => (group ? read(group) : undefined),
    () => undefined,
  );
  const value = stored !== undefined && (!options || options.includes(stored)) ? stored : fallback;
  const setValue = useCallback((next: string) => group && setChoice(group, next), [group]);
  return [value, setValue] as const;
}
