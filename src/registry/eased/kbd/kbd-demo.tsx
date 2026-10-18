"use client";

import { DemoFrame } from "../lib/demo-frame";
import { modKey, useIsMac } from "../lib/platform";
import { Kbd, useKeysHeld } from "./kbd";

type Shortcut = { action: string; keys: string[]; then?: string[] };


const shortcuts = (mac: boolean): { group: string; items: Shortcut[] }[] => [
  {
    group: "General",
    items: [
      { action: "Open command menu", keys: [modKey(mac), "K"] },
      { action: "Search", keys: ["/"] },
      { action: "Show shortcuts", keys: ["⇧", "?"] },
    ],
  },
  {
    group: "Issues",
    items: [
      { action: "New issue", keys: ["C"] },
      { action: "Move up", keys: [mac ? "⌥" : "Alt", "↑"] },
      { action: "Go to inbox", keys: ["G"], then: ["I"] },
      { action: "Close panel", keys: ["Esc"] },
    ],
  },
];

export function KbdDemo() {
  const mac = useIsMac();
  return (
    <DemoFrame title="Keyboard shortcuts" meta="Try the keys">
      <div className="min-h-0 flex-1 overflow-y-auto p-1.5 [scrollbar-width:thin]">
        {shortcuts(mac).map(({ group, items }) => (
          <section key={group} aria-label={group} className="pb-1.5">
            <h3 className="px-2.5 pt-2 pb-1 text-ui-xs font-medium tracking-caps text-text-muted uppercase">{group}</h3>
            <ul>
              {items.map((s) => (
                <Row key={s.action} shortcut={s} />
              ))}
            </ul>
          </section>
        ))}
      </div>
    </DemoFrame>
  );
}

/** The row lights up while its whole chord is held, the way a shortcuts overlay confirms a match. */
function Row({ shortcut }: { shortcut: Shortcut }) {
  const held = useKeysHeld(shortcut.keys);
  return (
    <li
      data-held={held || undefined}
      className="flex h-9 items-center justify-between gap-3 rounded-control px-2.5 text-ui-sm text-text-secondary transition-colors duration-150 ease-standard data-held:bg-surface-hover data-held:text-text"
    >
      <span className="min-w-0 truncate">{shortcut.action}</span>
      <span className="flex shrink-0 items-center gap-1.5">
        <Kbd keys={shortcut.keys} />
        {shortcut.then && (
          <>
            <span className="text-ui-xs text-text-muted">then</span>
            <Kbd keys={shortcut.then} />
          </>
        )}
      </span>
    </li>
  );
}
