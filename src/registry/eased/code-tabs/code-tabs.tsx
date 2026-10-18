"use client";

import { useState } from "react";
import { Tab, Tabs, TabsList, TabsPanel, TabsPanels } from "../tabs/tabs";
import { useChoice } from "../_primitives/code-core/choice";
import { CopyButton } from "../_primitives/code-core/copy";
import { CODE_FRAME, LangPill } from "../_primitives/code-core/code-chrome";
import { CodeCollapse, CodeLines, useCodeLines } from "../_primitives/code-core/code-lines";
import { langFromFilename, resolveLang, type CodeLang, type CodeLine } from "../_primitives/code-core/highlighter";
import type { LineDecorations } from "../_primitives/code-core/lines";

export type CodeTabItem = LineDecorations & {
  /** The tab's label: a file name ("button.tsx") or a choice ("pnpm"). */
  label: string;
  /** Identifies the tab, and is what a `groupId` syncs. Default: `label`. */
  value?: string;
  code: string;
  /** Default: from the label's extension (`button.tsx` → tsx). */
  lang?: CodeLang | (string & {});
  /** Pre-highlighted lines from `highlight()`. */
  tokens?: CodeLine[];
};

export type CodeTabsProps = {
  items: CodeTabItem[];
  /**
   * Sync the selection with every Code Tabs (and `useChoice`) sharing this id, across the
   * page, other browser tabs and visits: pick npm once and every install block follows.
   */
  groupId?: string;
  /** Controlled selection (an item's `value`). */
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /** Accessible name for the tab list. Default "Files". */
  label?: string;
  /** Show the language pill. Default: only when the items' languages differ. */
  showLang?: boolean;
  lineNumbers?: boolean;
  /** As Code Block: collapse panels past this many lines. Default 20; 0 never. */
  collapseAfter?: number;
  /** Show the copy button, which copies the active tab. Default true. */
  copy?: boolean;
  onCopy?: (code: string, value: string) => void;
  wrap?: boolean;
  className?: string;
};

// The frame clips, so panels draw Eased's focus ring inside their edge instead of around it.
const INSET_FOCUS =
  "rounded-control-xs focus-visible:inset-ring-2 focus-visible:inset-ring-focus focus-visible:[--tw-ring-offset-shadow:0_0_#0000]! focus-visible:[--tw-ring-shadow:0_0_#0000]!";

const valueOf = (item: CodeTabItem) => item.value ?? item.label;
const langOf = (item: CodeTabItem) => item.lang ?? langFromFilename(item.label) ?? undefined;

/**
 * Code Tabs: several files, or one command for each package manager, in one block. The
 * underline glides between tabs on the snappy spring, the code cross-fades 6px in the
 * direction of travel while the block's height springs, and the language pill swaps in
 * place. With `groupId`, every block on the page switches together and the choice persists.
 * Base UI Tabs: arrow keys, Home/End, roving focus.
 */
export function CodeTabs({
  items,
  groupId,
  value: controlled,
  defaultValue,
  onValueChange,
  label = "Files",
  showLang,
  lineNumbers = false,
  collapseAfter = 20,
  copy = true,
  onCopy,
  wrap,
  className = "",
}: CodeTabsProps) {
  const values = items.map(valueOf);
  const first = defaultValue ?? values[0];
  const [synced, setSynced] = useChoice(groupId, first, values);
  const [local, setLocal] = useState(first);
  const current = controlled ?? (groupId ? synced : local);
  const active = items.find((i) => valueOf(i) === current) ?? items[0];
  const langs = new Set(items.map((i) => resolveLang(langOf(i)) ?? langOf(i)));
  const pill = showLang ?? langs.size > 1;

  const select = (next: string) => {
    if (groupId) setSynced(next);
    else setLocal(next);
    onValueChange?.(next);
  };

  if (!active) return null;

  return (
    <Tabs value={valueOf(active)} onValueChange={(v) => select(String(v))} className={`${CODE_FRAME} ${className}`}>
      {/* 4px above 36px tabs: room for the focus ring inside the clipped frame, and 41px in all, like Code Block's title bar. */}
      <div className="flex min-w-0 items-end gap-2 border-b border-line-subtle bg-surface pt-1 pr-2 pl-4">
        <TabsList aria-label={label} className="min-w-0 flex-1 after:hidden">
          {items.map((item) => (
            <Tab key={valueOf(item)} value={valueOf(item)} className="h-control-md!">
              <span className="font-mono text-ui-sm">{item.label}</span>
            </Tab>
          ))}
        </TabsList>
        <div className="flex h-control-md shrink-0 items-center gap-2">
          {pill && <LangPill lang={langOf(active)} />}
          {copy && (
            <CopyButton
              text={active.code}
              label={`Copy ${active.label}`}
              onCopy={(code) => onCopy?.(code, valueOf(active))}
            />
          )}
        </div>
      </div>
      <TabsPanels>
        {items.map((item) => (
          <TabsPanel
            key={valueOf(item)}
            value={valueOf(item)}
            // The panel sits flush in a clipped frame: an inset ring instead of the outer glow.
            className={INSET_FOCUS}
          >
            <CodePanel item={item} lineNumbers={lineNumbers} collapseAfter={collapseAfter} wrap={wrap} />
          </TabsPanel>
        ))}
      </TabsPanels>
    </Tabs>
  );
}

function CodePanel({ item, lineNumbers, collapseAfter, wrap }: { item: CodeTabItem; lineNumbers: boolean; collapseAfter: number; wrap?: boolean }) {
  const { lines } = useCodeLines(item.code, langOf(item), item.tokens);
  return (
    <CodeCollapse lines={lines.length} collapseAfter={collapseAfter}>
      <CodeLines
        lines={lines}
        lineNumbers={lineNumbers}
        wrap={wrap}
        label={item.label}
        highlight={item.highlight}
        focus={item.focus}
        added={item.added}
        removed={item.removed}
      />
    </CodeCollapse>
  );
}

export type PackageManager = "pnpm" | "npm" | "yarn" | "bun";
export const PACKAGE_MANAGERS: readonly PackageManager[] = ["pnpm", "npm", "yarn", "bun"];

/**
 * One command in each package manager's dialect.
 *   { add: "motion" }                 pnpm add motion · npm install motion · yarn add motion · bun add motion
 *   { add: "-D tsx" }                 dev dependencies: pass the flag through
 *   { dlx: "shadcn@latest add …" }    pnpm dlx · npx · yarn dlx · bunx --bun
 *   { run: "dev" }                    pnpm dev · npm run dev · yarn dev · bun run dev
 */
export function packageCommand(pm: PackageManager, cmd: { add?: string; dlx?: string; run?: string }): string {
  if (cmd.add !== undefined) return `${pm} ${pm === "npm" ? "install" : "add"} ${cmd.add}`;
  if (cmd.dlx !== undefined) return `${{ pnpm: "pnpm dlx", npm: "npx", yarn: "yarn dlx", bun: "bunx --bun" }[pm]} ${cmd.dlx}`;
  if (cmd.run !== undefined) return `${pm === "npm" || pm === "bun" ? `${pm} run` : pm} ${cmd.run}`;
  return pm;
}

/** Code Tabs items for one command across pnpm, npm, yarn and bun. Pair with `groupId="package-manager"`. */
export function packageManagerItems(cmd: { add?: string; dlx?: string; run?: string }): CodeTabItem[] {
  return PACKAGE_MANAGERS.map((pm) => ({ label: pm, value: pm, lang: "bash", code: packageCommand(pm, cmd) }));
}
