import { useSyncExternalStore } from "react";

const subscribe = () => () => {};
const isMac = () => /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);

/**
 * True on Apple platforms, read after hydration: the server (and the hydrating render) says
 * Mac, so shortcut hints render ⌘ first and correct to Ctrl on other systems.
 */
export function useIsMac() {
  return useSyncExternalStore(subscribe, isMac, () => true);
}

/** The printed modifier for shortcuts: "⌘" on Apple platforms, "Ctrl" elsewhere. */
export function modKey(mac: boolean) {
  return mac ? "⌘" : "Ctrl";
}
